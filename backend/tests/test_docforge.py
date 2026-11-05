import os
import sys
import pytest
import fitz

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app.services.pdf_service import (
    get_pdf_metadata, merge_pages, split_pdf_pages, extract_pages,
    separate_odd_even, reverse_pages, rotate_pdf_pages, detect_blank_pages,
    detect_duplicate_pages, compress_pdf, add_watermark, add_page_numbers,
    update_metadata, protect_pdf, images_to_pdf
)
from backend.app.services.docx_service import docx_to_pdf, get_docx_preview_data
from backend.app.services.ocr_service import extract_document_text, search_in_document
from backend.app.security.auth import hash_password, verify_password, create_session, verify_token

SAMPLES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "storage", "test_samples"))
TEMP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "storage", "temp"))
os.makedirs(TEMP_DIR, exist_ok=True)

@pytest.fixture
def sample_pdf():
    return os.path.join(SAMPLES_DIR, "sample_document.pdf")

@pytest.fixture
def blank_pdf():
    return os.path.join(SAMPLES_DIR, "blank_pages_test.pdf")

@pytest.fixture
def dups_pdf():
    return os.path.join(SAMPLES_DIR, "duplicates_test.pdf")

@pytest.fixture
def sample_docx():
    return os.path.join(SAMPLES_DIR, "sample_contract.docx")

@pytest.fixture
def sample_images():
    return [
        os.path.join(SAMPLES_DIR, "scan_sample.jpg"),
        os.path.join(SAMPLES_DIR, "diagram_sample.png")
    ]

# 1. Security & Authentication Tests
def test_password_hashing():
    pw = "SuperSecret123!"
    h, salt = hash_password(pw)
    assert verify_password(pw, h, salt) is True
    assert verify_password("WrongPassword", h, salt) is False

def test_session_lifecycle():
    token, duration = create_session(remember=False)
    assert len(token) > 20
    assert duration == 86400
    assert verify_token(token) is True
    assert verify_token("non-existent-token") is False

# 2. Metadata & Inspection
def test_get_pdf_metadata(sample_pdf):
    meta = get_pdf_metadata(sample_pdf)
    assert meta["is_encrypted"] is False
    assert meta["page_count"] == 4
    assert len(meta["pages"]) == 4

# 3. Extraction & Split
def test_extract_pages(sample_pdf):
    out = os.path.join(TEMP_DIR, "test_extracted.pdf")
    extract_pages(sample_pdf, [1, 3], out)
    assert os.path.exists(out)
    doc = fitz.open(out)
    assert len(doc) == 2
    doc.close()

def test_split_every_page(sample_pdf):
    res = split_pdf_pages(sample_pdf, mode="every_page", output_prefix=os.path.join(TEMP_DIR, "split_ev"))
    assert len(res) == 4
    for p in res:
        doc = fitz.open(p)
        assert len(doc) == 1
        doc.close()

def test_split_ranges(sample_pdf):
    res = split_pdf_pages(sample_pdf, mode="ranges", ranges_str="1-2, 3-4", output_prefix=os.path.join(TEMP_DIR, "split_rng"))
    assert len(res) == 2
    doc = fitz.open(res[0])
    assert len(doc) == 2
    doc.close()

# 4. Odd / Even & Reverse
def test_odd_even_separation(sample_pdf):
    out_odd = os.path.join(TEMP_DIR, "test_odd.pdf")
    out_even = os.path.join(TEMP_DIR, "test_even.pdf")
    res = separate_odd_even(sample_pdf, "both", out_odd, out_even)
    assert "odd" in res and "even" in res
    doc_odd = fitz.open(out_odd)
    doc_even = fitz.open(out_even)
    assert len(doc_odd) == 2  # pages 1, 3
    assert len(doc_even) == 2 # pages 2, 4
    doc_odd.close()
    doc_even.close()

def test_reverse_pages(sample_pdf):
    out = os.path.join(TEMP_DIR, "test_rev.pdf")
    reverse_pages(sample_pdf, out)
    assert os.path.exists(out)
    doc = fitz.open(out)
    assert len(doc) == 4
    # Page 1 of reversed should contain summary text
    assert "Section 3" in doc[0].get_text()
    doc.close()

# 5. Rotation
def test_rotate_pages(sample_pdf):
    out = os.path.join(TEMP_DIR, "test_rotated.pdf")
    rotate_pdf_pages(sample_pdf, 90, "selected", [2], out)
    doc = fitz.open(out)
    assert doc[0].rotation == 0
    assert doc[1].rotation == 90
    doc.close()

# 6. Detection: Blank & Duplicates
def test_blank_page_detection(blank_pdf):
    blanks = detect_blank_pages(blank_pdf)
    assert blanks == [2, 4]

def test_duplicate_page_detection(dups_pdf):
    dups = detect_duplicate_pages(dups_pdf)
    assert len(dups) >= 1
    assert (1, 2) in dups

# 7. Merge with Rotation and Cropping
def test_merge_pipeline(sample_pdf):
    out = os.path.join(TEMP_DIR, "test_merged.pdf")
    pages_spec = [
        {"file_id": "f1", "page_number": 1, "rotation": 0},
        {"file_id": "f1", "page_number": 3, "rotation": 90},
        {"file_id": "f1", "page_number": 2, "rotation": 0}
    ]
    merge_pages(pages_spec, lambda fid: sample_pdf, out)
    doc = fitz.open(out)
    assert len(doc) == 3
    assert doc[1].rotation == 90
    doc.close()

# 8. Watermark & Page Numbers
def test_watermark(sample_pdf):
    out = os.path.join(TEMP_DIR, "test_wm.pdf")
    add_watermark(sample_pdf, "DOCFORGE TEST", 0.4, 45, "#FF0000", "center", 36, None, out)
    assert os.path.exists(out)
    doc = fitz.open(out)
    assert "DOCFORGE TEST" in doc[0].get_text()
    doc.close()

def test_page_numbering(sample_pdf):
    out = os.path.join(TEMP_DIR, "test_numbered.pdf")
    add_page_numbers(sample_pdf, "Page {n} of {total}", "bottom-center", 1, False, 10, "#000000", out)
    doc = fitz.open(out)
    assert "Page 1 of 4" in doc[0].get_text()
    assert "Page 2 of 4" in doc[1].get_text()
    doc.close()

# 9. Password Protection
def test_protect_pdf(sample_pdf):
    out = os.path.join(TEMP_DIR, "test_protected.pdf")
    protect_pdf(sample_pdf, user_pw="open123", owner_pw="admin123", allow_print=True, allow_copy=False, output_path=out)
    doc = fitz.open(out)
    assert doc.is_encrypted is True
    # Verify auth works
    auth_ok = doc.authenticate("open123")
    assert auth_ok > 0
    doc.close()

# 10. Images to PDF
def test_images_to_pdf(sample_images):
    out = os.path.join(TEMP_DIR, "test_img_to_pdf.pdf")
    images_to_pdf(sample_images, "A4", "contain", out)
    doc = fitz.open(out)
    assert len(doc) == 2
    doc.close()

# 11. DOCX Conversion & Preview
def test_docx_preview(sample_docx):
    data = get_docx_preview_data(sample_docx)
    assert data["is_valid"] is True
    assert data["table_count"] == 1
    assert "Agreement" in data["preview_text"]

def test_docx_to_pdf_conversion(sample_docx):
    out = os.path.join(TEMP_DIR, "test_docx_converted.pdf")
    success = docx_to_pdf(sample_docx, out)
    assert success is True
    assert os.path.exists(out)
    doc = fitz.open(out)
    assert len(doc) >= 1
    doc.close()

# 12. Text Extraction & Search
def test_text_extraction(sample_pdf):
    res = extract_document_text(sample_pdf)
    assert res["total_pages_scanned"] == 4
    assert res["total_words"] > 50
    assert "DOCFORGE" in res["full_text"]

def test_search_in_document(sample_pdf):
    matches = search_in_document(sample_pdf, "PyMuPDF")
    assert len(matches) >= 1
    assert matches[0]["page_number"] == 3

# 13. End-to-End Pipeline Combination Test
def test_chained_pipeline(sample_pdf):
    # Step 1: Extract pages 1 and 2
    step1_out = os.path.join(TEMP_DIR, "chain_step1.pdf")
    extract_pages(sample_pdf, [1, 2], step1_out)
    
    # Step 2: Rotate page 1 by 90 degrees
    step2_out = os.path.join(TEMP_DIR, "chain_step2.pdf")
    rotate_pdf_pages(step1_out, 90, "selected", [1], step2_out)

    # Step 3: Add watermark
    step3_out = os.path.join(TEMP_DIR, "chain_step3.pdf")
    add_watermark(step2_out, "OFFICIAL", 0.3, 45, "#0000FF", "center", 30, None, step3_out)

    # Step 4: Add page numbering
    step4_out = os.path.join(TEMP_DIR, "chain_step4.pdf")
    add_page_numbers(step3_out, "{n}", "bottom-right", 10, False, 10, "#333333", step4_out)

    # Step 5: Compress
    step5_out = os.path.join(TEMP_DIR, "chain_final.pdf")
    compress_pdf(step4_out, "balanced", step5_out)

    # Verify final document
    final_doc = fitz.open(step5_out)
    assert len(final_doc) == 2
    assert final_doc[0].rotation == 90
    text_p1 = final_doc[0].get_text()
    assert "OFFICIAL" in text_p1
    assert "10" in text_p1
    final_doc.close()
