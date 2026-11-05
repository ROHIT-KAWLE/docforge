/**
 * Safely triggers direct browser download without opening blank tabs
 * or triggering browser popup blockers.
 */
export function triggerDirectDownload(url: string, filename?: string) {
  const link = document.createElement('a');
  link.href = url;
  if (filename) {
    link.download = filename;
  }
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
  }, 200);
}

export function downloadBlobFile(data: Uint8Array | Blob, filename: string) {
  const blob = data instanceof Blob ? data : new Blob([data as any], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  triggerDirectDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
