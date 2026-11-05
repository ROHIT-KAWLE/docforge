import os
import math
import hashlib
from typing import List, Dict, Any, Optional, Tuple
import fitz  # PyMuPDF
from PIL import Image

def get_pdf_metadata(filepath: str, password: Optional[str] = None) -> Dict[str, Any]:
    doc = fitz.open(filepath)
    if doc.is_encrypted:
        if password:
            doc.authenticate(password)
        else:
            return {
                "is_encrypted": True,
                "page_count": 0,
                "metadata": {}
            }
    
    meta = doc.metadata or {}
    pages_info = []
    for i in range(len(doc)):
        page = doc[i]
        rect = page.rect
        pages_info.append({
            "page_number": i + 1,
            "width": rect.width,
            "height": rect.height,
            "rotation": page.rotation
        })

    result = {
        "is_encrypted": False,
        "page_count": len(doc),
        "title": meta.get("title", ""),
        "author": meta.get("author", ""),
        "subject": meta.get("subject", ""),
        "keywords": meta.get("keywords", ""),
        "creator": meta.get("creator", ""),
        "producer": meta.get("producer", ""),
        "creation_date": meta.get("creationDate", ""),
        "mod_date": meta.get("modDate", ""),
        "pages": pages_info
    }
    doc.close()
    return result

def render_page_thumbnail(filepath: str, page_number: int = 1, width: int = 300, password: Optional[str] = None) -> bytes:
    doc = fitz.open(filepath)
    if doc.is_encrypted and password:
        doc.authenticate(password)
    
    idx = max(0, min(page_number - 1, len(doc) - 1))
    page = doc[idx]
    
    rect = page.rect
    scale = width / max(rect.width, 1)
    matrix = fitz.Matrix(scale, scale)
    pix = page.get_pixmap(matrix=matrix, alpha=False)
    img_bytes = pix.tobytes("jpeg")
    doc.close()
    return img_bytes

def merge_pages(pages_spec: List[Dict[str, Any]], file_resolver, output_path: str):
    """
    pages_spec: list of dicts with:
    - file_id: str
    - page_number: int (1-indexed)
    - rotation: int (0, 90, 180, 270)
    - crop: optional dict {x0, y0, x1, y1} normalized 0..1
    """
    output_doc = fitz.open()
    opened_docs: Dict[str, fitz.Document] = {}

    try:
        for spec in pages_spec:
            fid = spec["file_id"]
            page_num = spec["page_number"] - 1
            rotation = spec.get("rotation", 0)
            crop = spec.get("crop")

            if fid not in opened_docs:
                src_path = file_resolver(fid)
                opened_docs[fid] = fitz.open(src_path)
            
            src_doc = opened_docs[fid]
            if 0 <= page_num < len(src_doc):
                # Insert page
                output_doc.insert_pdf(src_doc, from_page=page_num, to_page=page_num)
                new_page = output_doc[-1]
                
                # Apply extra rotation
                if rotation:
                    new_page.set_rotation((new_page.rotation + rotation) % 360)
                
                # Apply crop if provided
                if crop:
                    r = new_page.rect
                    new_crop = fitz.Rect(
                        r.x0 + crop.get("x0", 0) * r.width,
                        r.y0 + crop.get("y0", 0) * r.height,
                        r.x0 + crop.get("x1", 1) * r.width,
                        r.y0 + crop.get("y1", 1) * r.height
                    )
                    new_page.set_cropbox(new_crop)
        
        output_doc.save(output_path, garbage=3, deflate=True)
    finally:
        output_doc.close()
        for doc in opened_docs.values():
            doc.close()

def extract_pages(filepath: str, pages: List[int], output_path: str):
    """pages is 1-indexed"""
    doc = fitz.open(filepath)
    out_doc = fitz.open()
    try:
        for p in pages:
            idx = p - 1
            if 0 <= idx < len(doc):
                out_doc.insert_pdf(doc, from_page=idx, to_page=idx)
        out_doc.save(output_path, garbage=3, deflate=True)
    finally:
        out_doc.close()
        doc.close()

def split_pdf_pages(filepath: str, mode: str, n_pages: int = 1, ranges_str: Optional[str] = None, selected_pages: Optional[List[int]] = None, output_prefix: str = "") -> List[str]:
    doc = fitz.open(filepath)
    total_pages = len(doc)
    results = []

    try:
        groups: List[Tuple[str, List[int]]] = []  # [(filename_suffix, [0-indexed pages])]
        
        if mode == "every_page":
            for i in range(total_pages):
                groups.append((f"_page_{i+1}.pdf", [i]))
        elif mode == "every_n":
            step = max(1, n_pages)
            for i in range(0, total_pages, step):
                chunk = list(range(i, min(i + step, total_pages)))
                start_p = i + 1
                end_p = min(i + step, total_pages)
                groups.append((f"_pages_{start_p}-{end_p}.pdf", chunk))
        elif mode == "ranges" and ranges_str:
            parts = [p.strip() for p in ranges_str.split(",") if p.strip()]
            for p in parts:
                if "-" in p:
                    s, e = p.split("-")
                    start_i = max(1, int(s.strip())) - 1
                    end_i = min(total_pages, int(e.strip()))
                    chunk = list(range(start_i, end_i))
                    groups.append((f"_range_{p}.pdf", chunk))
                else:
                    pg = int(p.strip()) - 1
                    if 0 <= pg < total_pages:
                        groups.append((f"_page_{p}.pdf", [pg]))
        elif mode == "selected" and selected_pages:
            chunk = [p - 1 for p in selected_pages if 0 <= p - 1 < total_pages]
            groups.append(("_selected.pdf", chunk))
        
        for suffix, page_indices in groups:
            if not page_indices:
                continue
            out_doc = fitz.open()
            for idx in page_indices:
                out_doc.insert_pdf(doc, from_page=idx, to_page=idx)
            out_path = f"{output_prefix}{suffix}"
            out_doc.save(out_path, garbage=3, deflate=True)
            out_doc.close()
            results.append(out_path)
    finally:
        doc.close()
    return results

def separate_odd_even(filepath: str, mode: str, output_odd: str, output_even: str) -> Dict[str, str]:
    doc = fitz.open(filepath)
    total_pages = len(doc)
    res = {}

    try:
        odd_indices = [i for i in range(total_pages) if (i + 1) % 2 != 0]
        even_indices = [i for i in range(total_pages) if (i + 1) % 2 == 0]

        if mode in ("odd", "both") and odd_indices:
            odd_doc = fitz.open()
            for idx in odd_indices:
                odd_doc.insert_pdf(doc, from_page=idx, to_page=idx)
            odd_doc.save(output_odd, garbage=3, deflate=True)
            odd_doc.close()
            res["odd"] = output_odd

        if mode in ("even", "both") and even_indices:
            even_doc = fitz.open()
            for idx in even_indices:
                even_doc.insert_pdf(doc, from_page=idx, to_page=idx)
            even_doc.save(output_even, garbage=3, deflate=True)
            even_doc.close()
            res["even"] = output_even
    finally:
        doc.close()
    return res

def reverse_pages(filepath: str, output_path: str):
    doc = fitz.open(filepath)
    out_doc = fitz.open()
    try:
        for idx in range(len(doc) - 1, -1, -1):
            out_doc.insert_pdf(doc, from_page=idx, to_page=idx)
        out_doc.save(output_path, garbage=3, deflate=True)
    finally:
        out_doc.close()
        doc.close()

def rotate_pdf_pages(filepath: str, angle: int, target: str, selected_pages: Optional[List[int]], output_path: str):
    doc = fitz.open(filepath)
    try:
        total = len(doc)
        for i in range(total):
            page_num = i + 1
            apply_rot = False
            if target == "all":
                apply_rot = True
            elif target == "odd" and page_num % 2 != 0:
                apply_rot = True
            elif target == "even" and page_num % 2 == 0:
                apply_rot = True
            elif target == "selected" and selected_pages and page_num in selected_pages:
                apply_rot = True
            
            if apply_rot:
                page = doc[i]
                page.set_rotation((page.rotation + angle) % 360)
        
        doc.save(output_path, garbage=3, deflate=True)
    finally:
        doc.close()

def detect_blank_pages(filepath: str) -> List[int]:
    """Returns 1-indexed list of pages detected as potentially blank."""
    doc = fitz.open(filepath)
    blank_pages = []
    try:
        for i in range(len(doc)):
            page = doc[i]
            # If page contains any text, it is not blank
            text = page.get_text().strip()
            if len(text) > 0:
                continue
            
            # Check drawings/vector paths
            drawings = page.get_drawings()
            if len(drawings) > 0:
                continue

            # Check page images
            images = page.get_images()
            if len(images) > 0:
                continue

            # Render low-res pixmap to test pixel variance
            pix = page.get_pixmap(matrix=fitz.Matrix(0.2, 0.2), alpha=False)
            samples = pix.samples
            is_blank = True
            non_white_count = 0
            total_pixels = pix.width * pix.height
            for j in range(0, len(samples), 3):
                r, g, b = samples[j], samples[j+1], samples[j+2]
                if r < 240 or g < 240 or b < 240:
                    non_white_count += 1
                    if non_white_count > total_pixels * 0.005:
                        is_blank = False
                        break
            if is_blank:
                blank_pages.append(i + 1)
    finally:
        doc.close()
    return blank_pages

def detect_duplicate_pages(filepath: str) -> List[Tuple[int, int]]:
    """Returns list of pairs (page_a, page_b) 1-indexed that are duplicates."""
    doc = fitz.open(filepath)
    duplicates = []
    page_hashes: Dict[str, int] = {}
    try:
        for i in range(len(doc)):
            page = doc[i]
            # Create low-res grayscale thumbnail hash
            pix = page.get_pixmap(matrix=fitz.Matrix(0.15, 0.15), colorspace=fitz.csGRAY, alpha=False)
            h = hashlib.md5(pix.samples).hexdigest()
            if h in page_hashes:
                duplicates.append((page_hashes[h], i + 1))
            else:
                page_hashes[h] = i + 1
    finally:
        doc.close()
    return duplicates

def compress_pdf(filepath: str, level: str, output_path: str) -> Dict[str, Any]:
    doc = fitz.open(filepath)
    initial_size = os.path.getsize(filepath)
    try:
        # Determine downsample DPI based on compression level
        max_dim = 2000
        quality = 85
        if level == "low":
            max_dim = 1800
            quality = 80
        elif level == "balanced":
            max_dim = 1400
            quality = 70
        elif level == "high":
            max_dim = 1000
            quality = 55
        elif level == "maximum":
            max_dim = 800
            quality = 40

        # Downsample and re-compress embedded images where appropriate
        for i in range(len(doc)):
            image_list = doc.get_page_images(i)
            for img in image_list:
                xref = img[0]
                base_img = doc.extract_image(xref)
                if base_img and "image" in base_img:
                    img_bytes = base_img["image"]
                    try:
                        from io import BytesIO
                        pil_img = Image.open(BytesIO(img_bytes))
                        w, h = pil_img.size
                        if w > max_dim or h > max_dim:
                            pil_img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                        
                        out_io = BytesIO()
                        if pil_img.mode in ("RGBA", "P"):
                            pil_img = pil_img.convert("RGB")
                        pil_img.save(out_io, format="JPEG", quality=quality, optimize=True)
                        new_bytes = out_io.getvalue()
                        if len(new_bytes) < len(img_bytes):
                            doc.update_stream(xref, new_bytes)
                    except Exception:
                        pass

        # Subset fonts and scrub unused metadata if possible
        try:
            doc.subset_fonts()
        except Exception:
            pass

        try:
            doc.scrub(attached_files=True, clean_pages=True, embedded_files=True, metadata=True, thumbnails=True)
        except Exception:
            pass
        
        # Save with maximal garbage collection and stream deflating
        doc.save(
            output_path,
            garbage=4,
            deflate=True,
            deflate_images=True,
            deflate_fonts=True,
            clean=True
        )
    finally:
        doc.close()
    
    final_size = os.path.getsize(output_path)
    savings = max(0, initial_size - final_size)
    percent = round((savings / initial_size) * 100, 1) if initial_size > 0 else 0
    return {
        "original_size": initial_size,
        "final_size": final_size,
        "saved_bytes": savings,
        "savings_percent": percent
    }

def add_watermark(filepath: str, text: str, opacity: float, rotation: int, color_hex: str, position: str, font_size: int, pages: Optional[List[int]], output_path: str):
    doc = fitz.open(filepath)
    try:
        # Parse hex color
        c = color_hex.lstrip("#")
        if len(c) == 6:
            r = int(c[0:2], 16) / 255.0
            g = int(c[2:4], 16) / 255.0
            b = int(c[4:6], 16) / 255.0
        else:
            r, g, b = 0.5, 0.5, 0.5

        target_pages = pages if pages else list(range(1, len(doc) + 1))
        for p_num in target_pages:
            idx = p_num - 1
            if 0 <= idx < len(doc):
                page = doc[idx]
                rect = page.mediabox
                
                # Determine insertion point
                if position == "center":
                    p = fitz.Point(rect.width / 2, rect.height / 2)
                elif position == "top-left":
                    p = fitz.Point(rect.width * 0.25, rect.height * 0.25)
                elif position == "bottom-right":
                    p = fitz.Point(rect.width * 0.75, rect.height * 0.75)
                else:
                    p = fitz.Point(rect.width / 2, rect.height / 2)

                # Insert watermark text with arbitrary rotation support via morph
                morph = (p, fitz.Matrix(rotation)) if rotation % 90 != 0 else None
                rot = rotation if rotation % 90 == 0 else 0
                page.insert_text(
                    p,
                    text,
                    fontsize=font_size,
                    rotate=rot,
                    morph=morph,
                    color=(r, g, b),
                    fill_opacity=opacity,
                    stroke_opacity=opacity
                )
        doc.save(output_path, garbage=3, deflate=True)
    finally:
        doc.close()

def add_page_numbers(filepath: str, format_str: str, position: str, start_number: int, skip_first: bool, font_size: int, color_hex: str, output_path: str):
    doc = fitz.open(filepath)
    try:
        total = len(doc)
        c = color_hex.lstrip("#")
        if len(c) == 6:
            color = (int(c[0:2], 16) / 255.0, int(c[2:4], 16) / 255.0, int(c[4:6], 16) / 255.0)
        else:
            color = (0.2, 0.2, 0.2)

        for i in range(total):
            if i == 0 and skip_first:
                continue
            
            page = doc[i]
            rect = page.mediabox
            curr_num = start_number + (i - (1 if skip_first else 0))
            
            label = format_str.replace("{n}", str(curr_num)).replace("{total}", str(total - (1 if skip_first else 0)))
            if "{n}" not in format_str and "{total}" not in format_str:
                label = f"{curr_num}"

            # Calculate position coordinates
            margin_x = 40
            margin_y = 35
            box_w = 200
            box_h = 24
            align = fitz.TEXT_ALIGN_CENTER

            if position == "bottom-center":
                rect_box = fitz.Rect((rect.width - box_w) / 2, rect.height - margin_y - box_h, (rect.width + box_w) / 2, rect.height - margin_y)
                align = fitz.TEXT_ALIGN_CENTER
            elif position == "bottom-right":
                rect_box = fitz.Rect(rect.width - margin_x - box_w, rect.height - margin_y - box_h, rect.width - margin_x, rect.height - margin_y)
                align = fitz.TEXT_ALIGN_RIGHT
            elif position == "bottom-left":
                rect_box = fitz.Rect(margin_x, rect.height - margin_y - box_h, margin_x + box_w, rect.height - margin_y)
                align = fitz.TEXT_ALIGN_LEFT
            elif position == "top-center":
                rect_box = fitz.Rect((rect.width - box_w) / 2, margin_y, (rect.width + box_w) / 2, margin_y + box_h)
                align = fitz.TEXT_ALIGN_CENTER
            elif position == "top-right":
                rect_box = fitz.Rect(rect.width - margin_x - box_w, margin_y, rect.width - margin_x, margin_y + box_h)
                align = fitz.TEXT_ALIGN_RIGHT
            elif position == "top-left":
                rect_box = fitz.Rect(margin_x, margin_y, margin_x + box_w, margin_y + box_h)
                align = fitz.TEXT_ALIGN_LEFT
            else:
                rect_box = fitz.Rect((rect.width - box_w) / 2, rect.height - margin_y - box_h, (rect.width + box_w) / 2, rect.height - margin_y)

            page.insert_textbox(rect_box, label, fontsize=font_size, color=color, align=align, rotate=page.rotation)

        doc.save(output_path, garbage=3, deflate=True)
    finally:
        doc.close()

def update_metadata(filepath: str, meta_dict: Dict[str, Any], output_path: str):
    doc = fitz.open(filepath)
    try:
        new_meta = doc.metadata or {}
        for k in ["title", "author", "subject", "keywords", "creator"]:
            if k in meta_dict and meta_dict[k] is not None:
                new_meta[k] = meta_dict[k]
        doc.set_metadata(new_meta)
        doc.save(output_path, garbage=3, deflate=True)
    finally:
        doc.close()

def protect_pdf(filepath: str, user_pw: str, owner_pw: Optional[str], allow_print: bool, allow_copy: bool, output_path: str):
    doc = fitz.open(filepath)
    try:
        perm = fitz.PDF_PERM_ACCESSIBILITY
        if allow_print:
            perm |= fitz.PDF_PERM_PRINT
        if allow_copy:
            perm |= fitz.PDF_PERM_COPY

        doc.save(
            output_path,
            encryption=fitz.PDF_ENCRYPT_AES_256,
            user_pw=user_pw,
            owner_pw=owner_pw or user_pw,
            permissions=perm
        )
    finally:
        doc.close()

def images_to_pdf(image_paths: List[str], page_size: str, fit_mode: str, output_path: str):
    out_doc = fitz.open()
    try:
        # Standard page sizes in points (72 points/inch)
        sizes = {
            "A4": (595, 842),
            "A3": (842, 1191),
            "A5": (420, 595),
            "Letter": (612, 792),
            "Legal": (612, 1008),
        }

        for img_path in image_paths:
            with Image.open(img_path) as pil_img:
                img_w, img_h = pil_img.size

            if page_size in sizes:
                base_w, base_h = sizes[page_size]
                # Auto-orient page to match image aspect ratio for optimal fit
                if img_w > img_h:
                    target_w, target_h = max(base_w, base_h), min(base_w, base_h)
                else:
                    target_w, target_h = min(base_w, base_h), max(base_w, base_h)
            else:
                target_w, target_h = img_w, img_h

            page = out_doc.new_page(width=target_w, height=target_h)
            
            # 18 pt (0.25 in) clean margin for contain mode so image isn't clipped
            margin = 18.0 if fit_mode == "contain" else 0.0
            avail_w = max(10.0, target_w - (margin * 2))
            avail_h = max(10.0, target_h - (margin * 2))

            if fit_mode == "stretch":
                rect = fitz.Rect(0, 0, target_w, target_h)
            elif fit_mode == "cover":
                scale = max(target_w / img_w, target_h / img_h)
                w = img_w * scale
                h = img_h * scale
                x0 = (target_w - w) / 2
                y0 = (target_h - h) / 2
                rect = fitz.Rect(x0, y0, x0 + w, y0 + h)
            else:  # contain (proportional auto-fit centered on A4 page)
                scale = min(avail_w / img_w, avail_h / img_h)
                w = img_w * scale
                h = img_h * scale
                x0 = (target_w - w) / 2
                y0 = (target_h - h) / 2
                rect = fitz.Rect(x0, y0, x0 + w, y0 + h)

            page.insert_image(rect, filename=img_path)

        out_doc.save(output_path, garbage=3, deflate=True)
    finally:
        out_doc.close()

def pdf_to_images(filepath: str, pages: Optional[List[int]], format_ext: str, dpi: int, output_dir: str) -> List[str]:
    doc = fitz.open(filepath)
    results = []
    try:
        scale = dpi / 72.0
        matrix = fitz.Matrix(scale, scale)
        target_pages = pages if pages else list(range(1, len(doc) + 1))
        
        for p_num in target_pages:
            idx = p_num - 1
            if 0 <= idx < len(doc):
                page = doc[idx]
                pix = page.get_pixmap(matrix=matrix, alpha=False)
                out_path = os.path.join(output_dir, f"page_{p_num}.{format_ext.lower()}")
                pix.save(out_path)
                results.append(out_path)
    finally:
        doc.close()
    return results
