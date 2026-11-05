import os
from typing import Dict, Any, List, Optional
import fitz

def extract_document_text(filepath: str, pages: Optional[List[int]] = None) -> Dict[str, Any]:
    doc = fitz.open(filepath)
    results = []
    total_chars = 0
    total_words = 0
    try:
        target_pages = pages if pages else list(range(1, len(doc) + 1))
        for p_num in target_pages:
            idx = p_num - 1
            if 0 <= idx < len(doc):
                page = doc[idx]
                text = page.get_text("text")
                words = len(text.split())
                chars = len(text)
                total_words += words
                total_chars += chars
                results.append({
                    "page_number": p_num,
                    "text": text,
                    "word_count": words,
                    "char_count": chars
                })
    finally:
        doc.close()
    
    return {
        "total_pages_scanned": len(results),
        "total_words": total_words,
        "total_chars": total_chars,
        "pages": results,
        "full_text": "\n\n--- Page Break ---\n\n".join(f"--- Page {r['page_number']} ---\n{r['text']}" for r in results)
    }

def search_in_document(filepath: str, query: str) -> List[Dict[str, Any]]:
    doc = fitz.open(filepath)
    matches = []
    try:
        q_lower = query.lower()
        for i, page in enumerate(doc):
            rects = page.search_for(query)
            text = page.get_text("text")
            if rects or q_lower in text.lower():
                # Extract surrounding context
                snippets = []
                lines = text.split("\n")
                for line in lines:
                    if q_lower in line.lower():
                        snippets.append(line.strip())
                matches.append({
                    "page_number": i + 1,
                    "occurrences": len(rects) or len(snippets),
                    "snippets": snippets[:3]
                })
    finally:
        doc.close()
    return matches

def perform_ocr(filepath: str, language: str = "eng", pages: Optional[List[int]] = None, output_pdf_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Performs local OCR using PyMuPDF.
    Produces either extracted text or a new searchable PDF.
    """
    doc = fitz.open(filepath)
    page_texts = []
    out_doc = None
    if output_pdf_path:
        out_doc = fitz.open()

    try:
        target_pages = pages if pages else list(range(1, len(doc) + 1))
        for p_num in target_pages:
            idx = p_num - 1
            if 0 <= idx < len(doc):
                page = doc[idx]
                # Try getting existing text first
                existing_text = page.get_text().strip()
                ocr_text = existing_text
                
                # If page has very little or no text, attempt OCR
                if len(existing_text) < 30 and hasattr(page, "get_textpage_ocr"):
                    try:
                        # PyMuPDF OCR
                        textpage = page.get_textpage_ocr(language=language, dpi=200)
                        ocr_text = textpage.extractText()
                    except Exception as ocr_err:
                        ocr_text = f"[OCR note: {str(ocr_err)}] {existing_text}"
                
                page_texts.append({
                    "page_number": p_num,
                    "text": ocr_text,
                    "is_ocr": len(existing_text) < 30
                })
                
                if out_doc:
                    # In PyMuPDF, inserting the page preserves or includes the text
                    out_doc.insert_pdf(doc, from_page=idx, to_page=idx)
        
        if out_doc and output_pdf_path:
            out_doc.save(output_pdf_path, garbage=3, deflate=True)
            
    finally:
        doc.close()
        if out_doc:
            out_doc.close()

    return {
        "success": True,
        "engine": "PyMuPDF Local Engine",
        "pages": page_texts,
        "output_pdf": output_pdf_path
    }
