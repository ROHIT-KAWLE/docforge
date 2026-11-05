import os
from fastapi import APIRouter, HTTPException, Depends
from ..security.auth import require_auth
from ..utils.file_manager import get_file_info, get_processed_file_path, save_uploaded_file
from ..services.docx_service import docx_to_pdf, pdf_to_docx, get_docx_preview_data
from ..services.pdf_service import get_pdf_metadata

router = APIRouter(prefix="/api/docx", tags=["DOCX Operations"], dependencies=[Depends(require_auth)])

@router.get("/preview/{file_id}")
def api_docx_preview(file_id: str):
    info = get_file_info(file_id)
    if not info:
        raise HTTPException(status_code=404, detail="File not found.")
    
    if info["extension"] != ".docx":
        raise HTTPException(status_code=400, detail="File is not a DOCX document.")
    
    data = get_docx_preview_data(info["stored_path"])
    return {"file_id": file_id, "filename": info["original_name"], "preview": data}

@router.post("/convert-to-pdf")
def api_docx_to_pdf(data: dict):
    file_id = data.get("file_id")
    info = get_file_info(file_id)
    if not info or info["extension"] != ".docx":
        raise HTTPException(status_code=400, detail="Valid DOCX file_id required.")
    
    base_name = os.path.splitext(info["original_name"])[0]
    out_name = f"{base_name}.pdf"
    out_path = get_processed_file_path(out_name)

    try:
        docx_to_pdf(info["stored_path"], out_path)
        with open(out_path, "rb") as f:
            content = f.read()
        saved = save_uploaded_file(out_name, content)
        meta = get_pdf_metadata(out_path)
        saved["page_count"] = meta["page_count"]
        return {
            "success": True,
            "message": "DOCX converted to PDF successfully.",
            "file": saved,
            "processing_location": "server (LibreOffice)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DOCX to PDF conversion failed: {str(e)}")

@router.post("/convert-pdf-to-docx")
def api_pdf_to_docx(data: dict):
    file_id = data.get("file_id")
    info = get_file_info(file_id)
    if not info or info["extension"] != ".pdf":
        raise HTTPException(status_code=400, detail="Valid PDF file_id required.")
    
    base_name = os.path.splitext(info["original_name"])[0]
    out_name = f"{base_name}.docx"
    out_path = get_processed_file_path(out_name)

    try:
        result = pdf_to_docx(info["stored_path"], out_path)
        with open(out_path, "rb") as f:
            content = f.read()
        saved = save_uploaded_file(out_name, content)
        return {
            "success": True,
            "notice": result.get("notice"),
            "engine": result.get("engine"),
            "file": saved,
            "processing_location": "server"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF to DOCX conversion failed: {str(e)}")
