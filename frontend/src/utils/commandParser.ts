import { CommandParseResult } from '../types';

export function parseSmartCommand(input: string, totalPages: number): CommandParseResult | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;

  // 1. Odd and Even
  if (text.includes('odd') && text.includes('even')) {
    return {
      action: 'ODD_EVEN',
      confidence: 1.0,
      description: 'Separate document into odd and even pages',
      params: { mode: 'both' },
    };
  }

  // 2. Reverse order
  if (text.includes('reverse')) {
    return {
      action: 'REVERSE',
      confidence: 1.0,
      description: 'Reverse the order of all pages',
      params: {},
    };
  }

  // 3. Blank pages
  if (text.includes('blank')) {
    return {
      action: 'DETECT_BLANK',
      confidence: 0.95,
      description: 'Scan and review potentially blank pages',
      params: {},
    };
  }

  // 4. Duplicate pages
  if (text.includes('duplicate')) {
    return {
      action: 'DETECT_DUPLICATES',
      confidence: 0.95,
      description: 'Find identical or duplicate pages',
      params: {},
    };
  }

  // 5. Compress
  if (text.includes('compress') || text.includes('reduce size') || text.includes('shrink')) {
    let level = 'balanced';
    if (text.includes('high')) level = 'high';
    if (text.includes('max')) level = 'maximum';
    if (text.includes('low')) level = 'low';
    return {
      action: 'COMPRESS',
      confidence: 0.95,
      description: `Compress document using ${level} compression`,
      params: { level },
    };
  }

  // 6. Delete / Remove pages
  const deleteMatch = text.match(/(?:delete|remove|drop)\s+(?:pages?|p\.)?\s*([0-9,\s\-andto]+)/i);
  if (deleteMatch) {
    const pages = parsePageNumbers(deleteMatch[1], totalPages);
    if (pages.length > 0) {
      return {
        action: 'DELETE_PAGES',
        confidence: 0.95,
        description: `Delete page(s) ${pages.join(', ')}`,
        params: { pages },
      };
    }
  }

  // 7. Extract / Keep pages
  const extractMatch = text.match(/(?:keep|extract|only)\s+(?:pages?|p\.)?\s*([0-9,\s\-andto]+)/i);
  if (extractMatch) {
    const pages = parsePageNumbers(extractMatch[1], totalPages);
    if (pages.length > 0) {
      return {
        action: 'EXTRACT_PAGES',
        confidence: 0.95,
        description: `Extract page(s) ${pages.join(', ')}`,
        params: { pages },
      };
    }
  }

  // 8. Rotate pages
  if (text.includes('rotate')) {
    const angle = text.includes('180') ? 180 : text.includes('counter') || text.includes('ccw') ? 270 : 90;
    const direction = angle === 180 ? '180°' : angle === 270 ? '90° CCW' : '90° CW';

    const rangeMatch = text.match(/(?:pages?|p\.)?\s*([0-9,\s\-andto]+)/i);
    const pages = rangeMatch ? parsePageNumbers(rangeMatch[1], totalPages) : [];

    return {
      action: 'ROTATE',
      confidence: 0.9,
      description: pages.length > 0 ? `Rotate page(s) ${pages.join(', ')} by ${direction}` : `Rotate selected pages by ${direction}`,
      params: { angle, pages },
    };
  }

  // 9. Split every N pages
  const splitMatch = text.match(/split\s+(?:every\s+)?([0-9]+)?\s*pages?/i);
  if (splitMatch) {
    const n = splitMatch[1] ? parseInt(splitMatch[1], 10) : 1;
    return {
      action: 'SPLIT',
      confidence: 0.9,
      description: n === 1 ? 'Split document at every page' : `Split document every ${n} pages`,
      params: { mode: n === 1 ? 'every_page' : 'every_n', n_pages: n },
    };
  }

  // 10. Selection helpers
  if (text.includes('select odd')) {
    return {
      action: 'SELECT_ODD',
      confidence: 1.0,
      description: 'Select all odd-numbered pages',
      params: {},
    };
  }
  if (text.includes('select even')) {
    return {
      action: 'SELECT_EVEN',
      confidence: 1.0,
      description: 'Select all even-numbered pages',
      params: {},
    };
  }
  if (text.includes('select all')) {
    return {
      action: 'SELECT_ALL',
      confidence: 1.0,
      description: 'Select all pages in workspace',
      params: {},
    };
  }

  // 11. Watermark
  if (text.includes('watermark')) {
    const quoteMatch = text.match(/['"]([^'"]+)['"]/);
    const wmText = quoteMatch ? quoteMatch[1] : 'CONFIDENTIAL';
    return {
      action: 'WATERMARK',
      confidence: 0.9,
      description: `Apply watermark "${wmText}" across pages`,
      params: { text: wmText },
    };
  }

  // 12. Page numbers
  if (text.includes('number') || text.includes('page count')) {
    return {
      action: 'PAGE_NUMBERS',
      confidence: 0.9,
      description: 'Add page numbers to bottom-center of document',
      params: { format: 'Page {n} of {total}', position: 'bottom-center' },
    };
  }

  // 13. Text extraction / OCR
  if (text.includes('ocr') || text.includes('extract text') || text.includes('search')) {
    return {
      action: 'OCR',
      confidence: 0.9,
      description: 'Extract text or perform OCR on document',
      params: {},
    };
  }

  // 14. Convert to DOCX
  if (text.includes('docx') || text.includes('word')) {
    return {
      action: 'CONVERT_DOCX',
      confidence: 0.9,
      description: 'Convert PDF to Word DOCX (best-effort)',
      params: {},
    };
  }

  return null;
}

function parsePageNumbers(expr: string, maxPages: number): number[] {
  const result: Set<number> = new Set();
  const normalized = expr.replace(/\band\b/g, ',').replace(/\bto\b/g, '-');
  const tokens = normalized.split(',').map(t => t.trim()).filter(Boolean);

  for (const token of tokens) {
    if (token.includes('-')) {
      const [startStr, endStr] = token.split('-');
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);
      if (!isNaN(start) && !isNaN(end)) {
        const lo = Math.max(1, Math.min(start, end));
        const hi = Math.min(maxPages || 9999, Math.max(start, end));
        for (let i = lo; i <= hi; i++) {
          result.add(i);
        }
      }
    } else {
      const p = parseInt(token, 10);
      if (!isNaN(p) && p >= 1 && (!maxPages || p <= maxPages)) {
        result.add(p);
      }
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}
