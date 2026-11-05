import { PDFDocument, degrees } from 'pdf-lib';
import { PageModel } from '../types';

export async function localMergePdfs(
  pages: PageModel[],
  fileBuffers: Map<string, ArrayBuffer>
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  const loadedDocs = new Map<string, PDFDocument>();

  for (const pageSpec of pages) {
    let srcDoc = loadedDocs.get(pageSpec.fileId);
    if (!srcDoc) {
      const buf = fileBuffers.get(pageSpec.fileId);
      if (!buf) {
        throw new Error(`Buffer for file ${pageSpec.fileName} (${pageSpec.fileId}) not found locally.`);
      }
      srcDoc = await PDFDocument.load(buf);
      loadedDocs.set(pageSpec.fileId, srcDoc);
    }

    const srcPageIndex = pageSpec.sourcePageNum - 1;
    if (srcPageIndex >= 0 && srcPageIndex < srcDoc.getPageCount()) {
      const [copiedPage] = await mergedPdf.copyPages(srcDoc, [srcPageIndex]);
      if (pageSpec.rotation) {
        const currentRot = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees((currentRot + pageSpec.rotation) % 360));
      }
      mergedPdf.addPage(copiedPage);
    }
  }

  return mergedPdf.save();
}

export async function localExtractPages(
  pdfBuffer: ArrayBuffer,
  pageNumbers: number[] // 1-indexed
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBuffer);
  const outDoc = await PDFDocument.create();

  const zeroIndexed = pageNumbers
    .map(p => p - 1)
    .filter(idx => idx >= 0 && idx < srcDoc.getPageCount());

  const copiedPages = await outDoc.copyPages(srcDoc, zeroIndexed);
  for (const page of copiedPages) {
    outDoc.addPage(page);
  }

  return outDoc.save();
}

export async function localRotatePages(
  pdfBuffer: ArrayBuffer,
  pageNumbers: number[], // 1-indexed (empty means all)
  rotationDelta: number // 90, 180, 270
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBuffer);
  const count = doc.getPageCount();
  const targets = new Set(pageNumbers.length > 0 ? pageNumbers.map(p => p - 1) : Array.from({ length: count }, (_, i) => i));

  for (let i = 0; i < count; i++) {
    if (targets.has(i)) {
      const page = doc.getPage(i);
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + rotationDelta) % 360));
    }
  }

  return doc.save();
}

export async function localImagesToPdf(
  images: { data: ArrayBuffer; type: string }[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const img of images) {
    let embedded;
    if (img.type.includes('png')) {
      embedded = await pdfDoc.embedPng(img.data);
    } else {
      embedded = await pdfDoc.embedJpg(img.data);
    }

    const { width, height } = embedded.scale(1.0);
    // Standard A4 aspect ratio fit
    const a4W = 595.28;
    const a4H = 841.89;

    const scale = Math.min(a4W / width, a4H / height);
    const scaledW = width * scale;
    const scaledH = height * scale;

    const page = pdfDoc.addPage([a4W, a4H]);
    page.drawImage(embedded, {
      x: (a4W - scaledW) / 2,
      y: (a4H - scaledH) / 2,
      width: scaledW,
      height: scaledH,
    });
  }

  return pdfDoc.save();
}

export function downloadBlob(data: Uint8Array | Blob, filename: string) {
  const blob = data instanceof Blob ? data : new Blob([data as any], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
