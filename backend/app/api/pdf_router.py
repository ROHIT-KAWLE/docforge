import os
import zipfile
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from ..security.auth import require_auth
from ..models.schemas import (
    MergeRequest, SplitRequest, ExtractRequest, OddEvenRequest,
    RotateRequest, CompressionRequest, WatermarkRequest, PageNumberRequest,
    MetadataUpdateRequest, PasswordProtectRequest, ConvertImagesRequest
)
from ..utils.file_manager import (
    get_file_info, get_processed_file_path, get_temp_file_path,
    save_uploaded_file, PROCESSED_DIR
)
from ..services.pdf_service import (
    merge_pages, split_pdf_pages, extract_pages, separate_odd_even,
    reverse_pages, rotate_pdf_pages, detect_blank_pages, detect_duplicate_pages,
    compress_pdf, add_watermark, add_page_numbers, update_metadata,
    protect_pdf, images_to_pdf, pdf_to_images, get_pdf_metadata
)

router = APIRouter(prefix="/api/pdf", tags=["PDF Operations"], dependencies=[Depends(require_auth)])

def resolve_file_path(file_id: str) -> str:
    info = get_file_info(file_id)
    if not info:
        raise HTTPException(status_code=404, detail=f"File {file_id} not found.")
    
    # If DOCX, check if derived PDF exists
    if info["extension"] == ".docx":
        derived = os.path.join(PROCESSED_DIR, f"{file_id}_derived.pdf")
        if os.path.exists(derived):
            return derived
    return info["stored_path"]

@router.post("/merge")
def api_merge_pages(req: MergeRequest):
    pages_dicts = []
    if req.file_ids:
        for fid in req.file_ids:
            filepath = resolve_file_path(fid)
            doc = fitz.open(filepath)
            for p in range(1, len(doc) + 1):
                pages_dicts.append({
                    "file_id": fid,
                    "page_number": p,
                    "rotation": 0,
                    "crop": None
                })
            doc.close()
    elif req.pages:
        pages_dicts = [p.dict() for p in req.pages]

    if not pages_dicts:
        raise HTTPException(status_code=400, detail="No pages or file_ids specified for merge.")
    
    out_name = req.output_filename or "merged_document.pdf"
    if not out_name.lower().endswith(".pdf"):
        out_name += ".pdf"
    
    out_path = get_processed_file_path(out_name)
    try:
        merge_pages(pages_dicts, resolve_file_path, out_path)
        with open(out_path, "rb") as f:
            content = f.read()
        saved_meta = save_uploaded_file(out_name, content)
        meta = get_pdf_metadata(out_path)
        saved_meta["page_count"] = meta["page_count"]
        return {
            "success": True,
            "message": "Documents merged successfully.",
            "file": saved_meta,
            "processing_location": "server"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Merge failed: {str(e)}")

@router.post("/split")
def api_split_pages(req: SplitRequest):
    filepath = resolve_file_path(req.file_id)
    info = get_file_info(req.file_id)
    base_name = os.path.splitext(info["original_name"])[0]
    out_prefix = os.path.join(PROCESSED_DIR, f"{base_name}")

    try:
        created_paths = split_pdf_pages(
            filepath,
            mode=req.mode,
            n_pages=req.n_pages or 1,
            ranges_str=req.ranges,
            selected_pages=req.selected_pages,
            output_prefix=out_prefix
        )

        results = []
        for p in created_paths:
            with open(p, "rb") as f:
                c = f.read()
            m = save_uploaded_file(os.path.basename(p), c)
            results.append(m)

        # If multiple files created, create a ZIP file for convenient one-click download
        zip_meta = None
        if len(results) > 1:
            zip_filename = f"{base_name}_split.zip"
            zip_path = get_processed_file_path(zip_filename)
            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                for r in results:
                    zf.write(r["stored_path"], arcname=r["original_name"])
            with open(zip_path, "rb") as f:
                zc = f.read()
            zip_meta = save_uploaded_file(zip_filename, zc)

        return {
            "success": True,
            "files": results,
            "zip_file": zip_meta,
            "count": len(results),
            "processing_location": "server"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Split failed: {str(e)}")

@router.post("/extract")
def api_extract_pages(req: ExtractRequest):
    filepath = resolve_file_path(req.file_id)
    if not req.pages:
        raise HTTPException(status_code=400, detail="No pages specified for extraction.")
    
    out_name = req.output_filename or "extracted_pages.pdf"
    if not out_name.lower().endswith(".pdf"):
        out_name += ".pdf"
    
    out_path = get_processed_file_path(out_name)
    try:
        extract_pages(filepath, req.pages, out_path)
        with open(out_path, "rb") as f:
            content = f.read()
        saved = save_uploaded_file(out_name, content)
        meta = get_pdf_metadata(out_path)
        saved["page_count"] = meta["page_count"]
        return {
            "success": True,
            "file": saved,
            "processing_location": "server"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

@router.post("/odd-even")
def api_odd_even(req: OddEvenRequest):
    filepath = resolve_file_path(req.file_id)
    info = get_file_info(req.file_id)
    base = os.path.splitext(info["original_name"])[0]

    out_odd = get_processed_file_path(f"{base}_odd.pdf")
    out_even = get_processed_file_path(f"{base}_even.pdf")

    try:
        created = separate_odd_even(filepath, req.mode, out_odd, out_even)
        res_files = {}
        for k, p in created.items():
            with open(p, "rb") as f:
                c = f.read()
            m = save_uploaded_file(os.path.basename(p), c)
            res_files[k] = m

        zip_meta = None
        if len(res_files) > 1:
            zip_filename = f"{base}_odd_even.zip"
            zip_path = get_processed_file_path(zip_filename)
            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                for r in res_files.values():
                    zf.write(r["stored_path"], arcname=r["original_name"])
            with open(zip_path, "rb") as f:
                zc = f.read()
            zip_meta = save_uploaded_file(zip_filename, zc)

        return {
            "success": True,
            "files": res_files,
            "zip_file": zip_meta,
            "processing_location": "server"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Odd/Even separation failed: {str(e)}")

@router.post("/reverse")
def api_reverse_pages(data: dict):
    fid = data.get("file_id")
    if not fid:
        raise HTTPException(status_code=400, detail="file_id required.")
    filepath = resolve_file_path(fid)
    info = get_file_info(fid)
    out_name = f"reversed_{info['original_name']}"
    out_path = get_processed_file_path(out_name)

    try:
        reverse_pages(filepath, out_path)
        with open(out_path, "rb") as f:
            c = f.read()
        saved = save_uploaded_file(out_name, c)
        return {"success": True, "file": saved, "processing_location": "server"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reverse failed: {str(e)}")

@router.post("/rotate")
def api_rotate_pages(req: RotateRequest):
    filepath = resolve_file_path(req.file_id)
    info = get_file_info(req.file_id)
    out_name = f"rotated_{info['original_name']}"
    out_path = get_processed_file_path(out_name)

    try:
        rotate_pdf_pages(filepath, req.angle, req.target, req.pages, out_path)
        with open(out_path, "rb") as f:
            c = f.read()
        saved = save_uploaded_file(out_name, c)
        return {"success": True, "file": saved, "processing_location": "server"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rotation failed: {str(e)}")

@router.post("/blank-detection")
def api_detect_blank(data: dict):
    fid = data.get("file_id")
    if not fid:
        raise HTTPException(status_code=400, detail="file_id required.")
    filepath = resolve_file_path(fid)
    try:
        blank_pages = detect_blank_pages(filepath)
        return {
            "file_id": fid,
            "blank_pages": blank_pages,
            "count": len(blank_pages),
            "message": f"{len(blank_pages)} potentially blank pages detected."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Blank detection failed: {str(e)}")

@router.post("/duplicate-detection")
def api_detect_duplicates(data: dict):
    fid = data.get("file_id")
    if not fid:
        raise HTTPException(status_code=400, detail="file_id required.")
    filepath = resolve_file_path(fid)
    try:
        dups = detect_duplicate_pages(filepath)
        formatted = [{"page_a": a, "page_b": b} for a, b in dups]
        return {
            "file_id": fid,
            "duplicates": formatted,
            "count": len(dups),
            "message": f"{len(dups)} possible duplicate page pairs detected."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Duplicate detection failed: {str(e)}")

@router.post("/compress")
def api_compress(req: CompressionRequest):
    filepath = resolve_file_path(req.file_id)
    info = get_file_info(req.file_id)
    out_name = f"compressed_{info['original_name']}"
    out_path = get_processed_file_path(out_name)

    try:
        stats = compress_pdf(filepath, req.level, out_path)
        with open(out_path, "rb") as f:
            c = f.read()
        saved = save_uploaded_file(out_name, c)
        return {
            "success": True,
            "file": saved,
            "compression_stats": stats,
            "processing_location": "server"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compression failed: {str(e)}")

@router.post("/watermark")
def api_watermark(req: WatermarkRequest):
    filepath = resolve_file_path(req.file_id)
    info = get_file_info(req.file_id)
    out_name = f"watermarked_{info['original_name']}"
    out_path = get_processed_file_path(out_name)

    try:
        add_watermark(
            filepath,
            text=req.text or "CONFIDENTIAL",
            opacity=req.opacity,
            rotation=req.rotation,
            color_hex=req.color,
            position=req.position,
            font_size=req.font_size,
            pages=req.pages,
            output_path=out_path
        )
        with open(out_path, "rb") as f:
            c = f.read()
        saved = save_uploaded_file(out_name, c)
        return {"success": True, "file": saved, "processing_location": "server"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Watermark failed: {str(e)}")

@router.post("/page-numbers")
def api_page_numbers(req: PageNumberRequest):
    filepath = resolve_file_path(req.file_id)
    info = get_file_info(req.file_id)
    out_name = f"numbered_{info['original_name']}"
    out_path = get_processed_file_path(out_name)

    try:
        add_page_numbers(
            filepath,
            format_str=req.format,
            position=req.position,
            start_number=req.start_number,
            skip_first=req.skip_first,
            font_size=req.font_size,
            color_hex=req.color,
            output_path=out_path
        )
        with open(out_path, "rb") as f:
            c = f.read()
        saved = save_uploaded_file(out_name, c)
        return {"success": True, "file": saved, "processing_location": "server"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Page numbering failed: {str(e)}")

@router.post("/metadata")
def api_update_metadata(req: MetadataUpdateRequest):
    filepath = resolve_file_path(req.file_id)
    info = get_file_info(req.file_id)
    out_name = f"updated_{info['original_name']}"
    out_path = get_processed_file_path(out_name)

    try:
        meta_dict = req.dict(exclude_unset=True)
        update_metadata(filepath, meta_dict, out_path)
        with open(out_path, "rb") as f:
            c = f.read()
        saved = save_uploaded_file(out_name, c)
        return {"success": True, "file": saved, "processing_location": "server"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metadata update failed: {str(e)}")

@router.post("/protect")
def api_protect(req: PasswordProtectRequest):
    filepath = resolve_file_path(req.file_id)
    info = get_file_info(req.file_id)
    out_name = f"protected_{info['original_name']}"
    out_path = get_processed_file_path(out_name)

    try:
        protect_pdf(
            filepath,
            user_pw=req.user_password,
            owner_pw=req.owner_password,
            allow_print=req.allow_printing,
            allow_copy=req.allow_copying,
            output_path=out_path
        )
        with open(out_path, "rb") as f:
            c = f.read()
        saved = save_uploaded_file(out_name, c)
        return {"success": True, "file": saved, "processing_location": "server"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF protection failed: {str(e)}")

@router.post("/images-to-pdf")
def api_images_to_pdf(req: ConvertImagesRequest):
    if not req.file_ids:
        raise HTTPException(status_code=400, detail="At least one image file_id required.")
    
    img_paths = []
    for fid in req.file_ids:
        info = get_file_info(fid)
        if not info:
            raise HTTPException(status_code=404, detail=f"Image {fid} not found.")
        img_paths.append(info["stored_path"])

    out_name = req.output_filename or "images.pdf"
    if not out_name.lower().endswith(".pdf"):
        out_name += ".pdf"
    out_path = get_processed_file_path(out_name)

    try:
        images_to_pdf(img_paths, req.page_size, req.fit, out_path)
        with open(out_path, "rb") as f:
            c = f.read()
        saved = save_uploaded_file(out_name, c)
        return {"success": True, "file": saved, "processing_location": "server"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image conversion failed: {str(e)}")

@router.post("/pdf-to-images")
def api_pdf_to_images(data: dict):
    fid = data.get("file_id")
    fmt = data.get("format", "png")
    dpi = int(data.get("dpi", 150))
    pages = data.get("pages")
    
    filepath = resolve_file_path(fid)
    info = get_file_info(fid)
    base = os.path.splitext(info["original_name"])[0]

    out_dir = os.path.join(PROCESSED_DIR, f"{base}_images")
    os.makedirs(out_dir, exist_ok=True)

    try:
        img_paths = pdf_to_images(filepath, pages, fmt, dpi, out_dir)
        if not img_paths:
            raise HTTPException(status_code=400, detail="No images generated from PDF.")
        
        # Create ZIP archive
        zip_path = get_processed_file_path(f"{base}_images.zip")
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for p in img_paths:
                zf.write(p, arcname=os.path.basename(p))
        
        with open(zip_path, "rb") as f:
            zc = f.read()
        zip_meta = save_uploaded_file(f"{base}_images.zip", zc)

        single_file_meta = None
        if len(img_paths) == 1:
            with open(img_paths[0], "rb") as f:
                c = f.read()
            single_file_meta = save_uploaded_file(os.path.basename(img_paths[0]), c)

        return {
            "success": True,
            "zip_file": zip_meta,
            "file": single_file_meta,
            "image_count": len(img_paths),
            "processing_location": "server"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export to images failed: {str(e)}")
