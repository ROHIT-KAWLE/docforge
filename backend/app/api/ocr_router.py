import os
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from ..security.auth import require_auth
from ..models.schemas import OCRRequest
from ..utils.file_manager import get_file_info, get_processed_file_path, save_uploaded_file
from ..services.ocr_service import extract_document_text, search_in_document, perform_ocr
from ..services.pdf_service import get_pdf_metadata

router = APIRouter(prefix="/api/ocr", tags=["OCR & Text"], dependencies=[Depends(require_auth)])

@router.post("/extract-text")
def api_extract_text(data: dict):
    file_id = data.get("file_id")
    pages = data.get("pages")
    info = get_file_info(file_id)
    if not info:
        raise HTTPException(status_code=404, detail="File not found.")
    
    try:
        res = extract_document_text(info["stored_path"], pages=pages)
        return {
            "success": True,
            "file_id": file_id,
            "filename": info["original_name"],
            "data": res,
            "processing_location": "server"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")

@router.post("/search")
def api_search_text(data: dict):
    file_id = data.get("file_id")
    query = data.get("query", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Search query required.")
    
    info = get_file_info(file_id)
    if not info:
        raise HTTPException(status_code=404, detail="File not found.")
    
    try:
        matches = search_in_document(info["stored_path"], query)
        return {
            "success": True,
            "query": query,
            "total_matches": sum(m["occurrences"] for m in matches),
            "pages_with_matches": matches
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.post("/process")
def api_run_ocr(req: OCRRequest):
    info = get_file_info(req.file_id)
    if not info:
        raise HTTPException(status_code=404, detail="File not found.")
    
    base_name = os.path.splitext(info["original_name"])[0]
    out_name = f"{base_name}_searchable.pdf"
    out_path = get_processed_file_path(out_name) if req.output_format in ("searchable_pdf", "both") else None

    try:
        result = perform_ocr(
            info["stored_path"],
            language=req.language or "eng",
            pages=req.pages,
            output_pdf_path=out_path
        )

        saved_file = None
        if out_path and os.path.exists(out_path):
            with open(out_path, "rb") as f:
                c = f.read()
            saved_file = save_uploaded_file(out_name, c)
            m = get_pdf_metadata(out_path)
            saved_file["page_count"] = m["page_count"]

        return {
            "success": True,
            "engine": result["engine"],
            "pages": result["pages"],
            "file": saved_file,
            "processing_location": "server (Local PyMuPDF OCR)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")
