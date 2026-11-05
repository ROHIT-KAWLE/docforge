const API_BASE = '/api';

export function getAuthToken(): string | null {
  return sessionStorage.getItem('docforge_token') || localStorage.getItem('docforge_token');
}

export function setAuthToken(token: string, remember: boolean = false) {
  sessionStorage.setItem('docforge_token', token);
  if (remember) {
    localStorage.setItem('docforge_token', token);
  }
}

export function clearAuthToken() {
  sessionStorage.removeItem('docforge_token');
  localStorage.removeItem('docforge_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAuthToken();
    window.dispatchEvent(new Event('docforge-unauthorized'));
    throw new Error('Authentication required.');
  }

  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Auth
  getAuthStatus: () => request<{ is_authenticated: boolean; setup_required: boolean }>('/auth/status'),
  setupPassword: (password: string) => request<{ success: boolean; token: string }>('/auth/setup', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
  unlock: (password: string, remember: boolean) => request<{ token: string; message: string }>('/auth/unlock', {
    method: 'POST',
    body: JSON.stringify({ password, remember }),
  }),
  changePassword: (current_password: string, new_password: string) => request<{ success: boolean }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password, new_password }),
  }),

  // Files
  uploadFiles: async (files: File[]) => {
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }
    return request<{ uploaded: any[] }>('/files/upload', {
      method: 'POST',
      body: formData,
    });
  },
  getFileInfo: (fileId: string) => request<any>(`/files/${fileId}`),
  deleteFile: (fileId: string) => request<any>(`/files/${fileId}`, { method: 'DELETE' }),
  getDownloadUrl: (fileId: string) => {
    const token = getAuthToken();
    return `${API_BASE}/files/${fileId}/download?token=${encodeURIComponent(token || '')}`;
  },
  getThumbnailUrl: (fileId: string, pageNum: number = 1, width: number = 300) => {
    const token = getAuthToken();
    return `${API_BASE}/files/${fileId}/thumbnail/${pageNum}?width=${width}&token=${encodeURIComponent(token || '')}`;
  },

  // PDF Operations
  mergePages: (pages: any[], output_filename?: string) => request<any>('/pdf/merge', {
    method: 'POST',
    body: JSON.stringify({ pages, output_filename }),
  }),
  mergePdfs: (file_ids: string[], output_filename?: string) => request<any>('/pdf/merge', {
    method: 'POST',
    body: JSON.stringify({ file_ids, output_filename }),
  }),
  splitPdf: (data: { file_id: string; mode: string; n_pages?: number; ranges?: string; selected_pages?: number[] }) => request<any>('/pdf/split', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  extractPages: (file_id: string, pages: number[], output_filename?: string) => request<any>('/pdf/extract', {
    method: 'POST',
    body: JSON.stringify({ file_id, pages, output_filename }),
  }),
  oddEvenSplit: (file_id: string, mode: string = 'both') => request<any>('/pdf/odd-even', {
    method: 'POST',
    body: JSON.stringify({ file_id, mode }),
  }),
  reversePages: (file_id: string) => request<any>('/pdf/reverse', {
    method: 'POST',
    body: JSON.stringify({ file_id }),
  }),
  rotatePages: (data: { file_id: string; angle: number; target: string; pages?: number[] }) => request<any>('/pdf/rotate', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  compressPdf: (file_id: string, level: string = 'balanced') => request<any>('/pdf/compress', {
    method: 'POST',
    body: JSON.stringify({ file_id, level }),
  }),
  watermarkPdf: (data: any) => request<any>('/pdf/watermark', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  pageNumbersPdf: (data: any) => request<any>('/pdf/page-numbers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  detectBlankPages: (file_id: string) => request<any>('/pdf/blank-detection', {
    method: 'POST',
    body: JSON.stringify({ file_id }),
  }),
  detectDuplicates: (file_id: string) => request<any>('/pdf/duplicate-detection', {
    method: 'POST',
    body: JSON.stringify({ file_id }),
  }),
  protectPdf: (data: any) => request<any>('/pdf/protect', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  imagesToPdf: (file_ids: string[], page_size: string = 'A4', fit: string = 'contain') => request<any>('/pdf/images-to-pdf', {
    method: 'POST',
    body: JSON.stringify({ file_ids, page_size, fit }),
  }),
  pdfToImages: (file_id: string, format: string = 'png', dpi: number = 150, pages?: number[]) => request<any>('/pdf/pdf-to-images', {
    method: 'POST',
    body: JSON.stringify({ file_id, format, dpi, pages }),
  }),

  // DOCX
  previewDocx: (file_id: string) => request<any>(`/docx/preview/${file_id}`),
  docxToPdf: (file_id: string) => request<any>('/docx/convert-to-pdf', {
    method: 'POST',
    body: JSON.stringify({ file_id }),
  }),
  pdfToDocx: (file_id: string) => request<any>('/docx/convert-pdf-to-docx', {
    method: 'POST',
    body: JSON.stringify({ file_id }),
  }),

  // OCR & Text
  extractText: (file_id: string, pages?: number[]) => request<any>('/ocr/extract-text', {
    method: 'POST',
    body: JSON.stringify({ file_id, pages }),
  }),
  searchDocument: (file_id: string, query: string) => request<any>('/ocr/search', {
    method: 'POST',
    body: JSON.stringify({ file_id, query }),
  }),
  runOcr: (data: { file_id: string; language?: string; pages?: number[]; output_format?: string }) => request<any>('/ocr/process', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Projects
  listProjects: () => request<{ projects: any[] }>('/projects'),
  saveProject: (data: { name: string; pages: any[]; files: any[]; project_id?: string }) => request<any>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getProject: (id: string) => request<{ project: any }>(`/projects/${id}`),
  deleteProject: (id: string) => request<any>(`/projects/${id}`, { method: 'DELETE' }),

  // System
  getCapabilities: () => request<any>('/system/capabilities'),
  getStorageStats: () => request<any>('/system/stats'),
  cleanupStorage: (all: boolean = false) => request<any>('/system/cleanup', {
    method: 'POST',
    body: JSON.stringify({ all }),
  }),
};
