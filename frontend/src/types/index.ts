export interface PageModel {
  id: string;                 // unique uuid
  fileId: string;             // source file id
  fileName: string;           // source file name
  sourcePageNum: number;      // 1-indexed in source file
  rotation: number;           // 0, 90, 180, 270 degrees
  crop?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  selected: boolean;
  thumbnailUrl?: string;
  isDerived?: boolean;        // e.g. from DOCX conversion
}

export interface DocumentFile {
  id: string;
  name: string;
  sizeBytes: number;
  extension: string;
  pageCount: number;
  uploadedAt: number;
  isEncrypted?: boolean;
  pages?: PageModel[];
  localBuffer?: ArrayBuffer;
  docxPreview?: any;
}

export interface WorkspaceState {
  pages: PageModel[];
  files: DocumentFile[];
}

export interface HistoryEntry {
  pages: PageModel[];
  actionDescription: string;
}

export type ProcessingLocation = 'local' | 'server';

export interface OperationNotice {
  message: string;
  location: ProcessingLocation;
  timestamp: number;
}

export interface CommandParseResult {
  action: string;
  confidence: number;
  description: string;
  params: Record<string, any>;
}
