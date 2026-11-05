import os
import fitz
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Response
from fastapi.responses import FileResponse
from ..security.auth import require_auth
from ..utils.file_manager import (
    save_uploaded_file, get_file_info, sanitize_filename, UPLOADS_DIR, PROCESSED_DIR
)
from ..services.pdf_service import get_pdf_metadata, render_page_thumbnail
from ..services.docx_service import docx_to_pdf, get_docx_preview_data

router = APIRouter(prefix="/api/files", tags=["Files"], dependencies=[Depends(require_auth)])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".jpg", ".jpeg", ".png", ".webp"}

@router.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    results = []
    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )
        
        content = await file.read()
        meta = save_uploaded_file(file.filename, content)
        fid = meta["file_id"]
        filepath = meta["stored_path"]

        # If it's a PDF, inspect pages and metadata
        if ext == ".pdf":
            try:
                pdf_info = get_pdf_metadata(filepath)
                meta["page_count"] = pdf_info["page_count"]
                meta["is_encrypted"] = pdf_info["is_encrypted"]
                meta["pages"] = pdf_info.get("pages", [])
                meta["metadata"] = {
                    "title": pdf_info.get("title", ""),
                    "author": pdf_info.get("author", ""),
                    "creator": pdf_info.get("creator", ""),
                    "creation_date": pdf_info.get("creation_date", "")
                }
            except Exception as e:
                meta["error"] = f"Unable to parse PDF: {str(e)}"
        
        # If it's a DOCX, check preview info and optionally convert to PDF for page thumbnails
        elif ext == ".docx":
            docx_info = get_docx_preview_data(filepath)
            meta["docx_info"] = docx_info
            # Convert to PDF in processed dir to allow preview & page workspace integration
            derived_pdf = os.path.join(PROCESSED_DIR, f"{fid}_derived.pdf")
            try:
                if docx_to_pdf(filepath, derived_pdf):
                    meta["derived_pdf_path"] = derived_pdf
                    pdf_info = get_pdf_metadata(derived_pdf)
                    meta["page_count"] = pdf_info["page_count"]
                    meta["pages"] = pdf_info.get("pages", [])
            except Exception:
                meta["page_count"] = 1

        # If it's an image
        elif ext in {".jpg", ".jpeg", ".png", ".webp"}:
            meta["page_count"] = 1
            meta["pages"] = [{"page_number": 1, "width": 800, "height": 600, "rotation": 0}]

        results.append(meta)
    
    return {"uploaded": results}

@router.get("/{file_id}")
def get_file(file_id: str):
    info = get_file_info(file_id)
    if not info:
        raise HTTPException(status_code=404, detail="File not found.")
    return info

@router.get("/{file_id}/thumbnail/{page_num}")
def get_thumbnail(file_id: str, page_num: int = 1, width: int = 300):
    info = get_file_info(file_id)
    if not info:
        raise HTTPException(status_code=404, detail="File not found.")
    
    path = info["stored_path"]
    ext = info["extension"]

    # If DOCX and derived PDF exists, use derived PDF
    if ext == ".docx":
        derived_pdf = os.path.join(PROCESSED_DIR, f"{file_id}_derived.pdf")
        if os.path.exists(derived_pdf):
            path = derived_pdf
            ext = ".pdf"

    if ext == ".pdf":
        try:
            img_bytes = render_page_thumbnail(path, page_number=page_num, width=width)
            return Response(content=img_bytes, media_type="image/jpeg")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to render thumbnail: {str(e)}")
    
    elif ext in {".jpg", ".jpeg", ".png", ".webp"}:
        try:
            with open(path, "rb") as f:
                content = f.read()
            media = "image/png" if ext == ".png" else "image/webp" if ext == ".webp" else "image/jpeg"
            return Response(content=content, media_type=media)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    raise HTTPException(status_code=400, detail="Thumbnail preview not supported for this file type.")

@router.get("/{file_id}/download")
def download_file(file_id: str):
    info = get_file_info(file_id)
    if not info:
        raise HTTPException(status_code=404, detail="File not found.")
    
    path = info["stored_path"]
    return FileResponse(
        path,
        filename=info["original_name"],
        media_type="application/octet-stream"
    )

@router.delete("/{file_id}")
def delete_file(file_id: str):
    info = get_file_info(file_id)
    if not info:
        raise HTTPException(status_code=404, detail="File not found.")
    
    path = info["stored_path"]
    if os.path.exists(path):
        os.remove(path)
    
    # Also remove derived files
    derived = os.path.join(PROCESSED_DIR, f"{file_id}_derived.pdf")
    if os.path.exists(derived):
        os.remove(derived)
        
    return {"success": True, "message": "File deleted."}
