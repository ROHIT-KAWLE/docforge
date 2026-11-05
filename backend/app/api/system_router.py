import fitz
from fastapi import APIRouter, Depends
from ..security.auth import require_auth
from ..utils.file_manager import get_storage_stats, cleanup_temp_files
from ..services.docx_service import find_libreoffice_executable

router = APIRouter(prefix="/api/system", tags=["System"], dependencies=[Depends(require_auth)])

@router.get("/stats")
def api_storage_stats():
    return {"storage": get_storage_stats()}

@router.post("/cleanup")
def api_trigger_cleanup(data: dict = None):
    hours = 0 if (data and data.get("all")) else 12
    deleted = cleanup_temp_files(max_age_hours=hours)
    return {
        "success": True,
        "files_removed": deleted,
        "new_storage_stats": get_storage_stats()
    }

@router.get("/capabilities")
def api_capabilities():
    libreoffice_path = find_libreoffice_executable()
    has_ocr = hasattr(fitz.Page, "get_textpage_ocr")
    
    return {
        "engine": "DocForge Personal Processing Backend",
        "pymupdf_version": fitz.__version__,
        "libreoffice_available": libreoffice_path is not None,
        "libreoffice_path": libreoffice_path,
        "ocr_available": has_ocr,
        "ocr_engine": "PyMuPDF Embedded OCR" if has_ocr else "Standard Text Extraction",
        "supported_inputs": ["PDF", "DOCX", "JPG", "JPEG", "PNG", "WEBP"],
        "max_upload_size_mb": 150
    }
