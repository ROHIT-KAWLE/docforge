"""
Developer utility to generate test PDFs, images, and DOCX files for DocForge testing.
Generates:
1. sample_document.pdf (multi-page with text, varying layouts)
2. blank_pages_test.pdf (contains deliberately blank pages)
3. duplicates_test.pdf (contains duplicate pages for detection testing)
4. mixed_sizes.pdf (A4, Letter, Landscape, Portrait)
5. sample_image1.jpg, sample_image2.png
6. sample_contract.docx (for DOCX -> PDF testing)
"""
import os
import fitz
from PIL import Image, ImageDraw
import docx

TEST_OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "storage", "test_samples"))
os.makedirs(TEST_OUTPUT_DIR, exist_ok=True)

def generate_sample_pdf():
    path = os.path.join(TEST_OUTPUT_DIR, "sample_document.pdf")
    doc = fitz.open()
    
    # Page 1: Cover
    p1 = doc.new_page(width=595, height=842) # A4
    p1.insert_text((72, 150), "DOCFORGE TEST DOCUMENT", fontsize=24, color=(0.1, 0.4, 0.8))
    p1.insert_text((72, 190), "Universal Personal Document Processing Engine", fontsize=14, color=(0.3, 0.3, 0.3))
    p1.insert_text((72, 230), "This sample document verifies multi-page handling, extraction, splitting, and rendering.", fontsize=11)
    p1.draw_rect(fitz.Rect(72, 260, 523, 262), color=(0.1, 0.4, 0.8), fill=(0.1, 0.4, 0.8))
    
    # Page 2: Text content
    p2 = doc.new_page(width=595, height=842)
    p2.insert_text((72, 100), "Section 1: Document Processing Operations", fontsize=18, color=(0.2, 0.2, 0.2))
    content = [
        "1. Merging multiple PDF files into an organized publication.",
        "2. Extracting selected pages or splitting by custom page ranges.",
        "3. Rotating portrait and landscape scans by 90 or 180 degrees.",
        "4. Non-destructive manipulation with instant undo and redo.",
        "5. Privacy-first architecture: files processed locally or on personal server."
    ]
    y = 140
    for line in content:
        p2.insert_text((72, y), line, fontsize=12, color=(0.25, 0.25, 0.25))
        y += 30

    # Page 3: Visual elements and table
    p3 = doc.new_page(width=595, height=842)
    p3.insert_text((72, 100), "Section 2: Specifications & Benchmarks", fontsize=18, color=(0.2, 0.2, 0.2))
    p3.draw_rect(fitz.Rect(72, 130, 523, 300), color=(0.8, 0.8, 0.8), fill=(0.96, 0.97, 0.99))
    p3.insert_text((90, 165), "Engine: PyMuPDF + pdf-lib WASM", fontsize=12)
    p3.insert_text((90, 195), "LibreOffice Headless: Enabled", fontsize=12)
    p3.insert_text((90, 225), "OCR Support: English (Tesseract)", fontsize=12)
    p3.insert_text((90, 255), "Security: Salted PBKDF2 Session Authentication", fontsize=12)

    # Page 4: Conclusion
    p4 = doc.new_page(width=595, height=842)
    p4.insert_text((72, 100), "Section 3: Summary", fontsize=18, color=(0.2, 0.2, 0.2))
    p4.insert_text((72, 140), "End of document test sample. Ready for pipeline operations.", fontsize=12)

    doc.save(path)
    doc.close()
    print(f"Generated: {path}")
    return path

def generate_blank_pages_pdf():
    path = os.path.join(TEST_OUTPUT_DIR, "blank_pages_test.pdf")
    doc = fitz.open()
    
    # Page 1: normal text
    p1 = doc.new_page(width=595, height=842)
    p1.insert_text((72, 100), "Page 1 - Not Blank", fontsize=16)

    # Page 2: deliberately blank
    doc.new_page(width=595, height=842)

    # Page 3: normal text
    p3 = doc.new_page(width=595, height=842)
    p3.insert_text((72, 100), "Page 3 - Contains Information", fontsize=16)

    # Page 4: deliberately blank
    doc.new_page(width=595, height=842)

    doc.save(path)
    doc.close()
    print(f"Generated: {path}")
    return path

def generate_duplicates_pdf():
    path = os.path.join(TEST_OUTPUT_DIR, "duplicates_test.pdf")
    doc = fitz.open()

    # Page 1: Unique
    p1 = doc.new_page(width=595, height=842)
    p1.insert_text((72, 150), "Original Invoice #1001", fontsize=16)
    
    # Page 2: Duplicate of Page 1
    p2 = doc.new_page(width=595, height=842)
    p2.insert_text((72, 150), "Original Invoice #1001", fontsize=16)

    # Page 3: Unique
    p3 = doc.new_page(width=595, height=842)
    p3.insert_text((72, 150), "Certificate of Compliance", fontsize=16)

    doc.save(path)
    doc.close()
    print(f"Generated: {path}")
    return path

def generate_test_images():
    # Image 1: JPG
    jpg_path = os.path.join(TEST_OUTPUT_DIR, "scan_sample.jpg")
    img1 = Image.new("RGB", (800, 600), color=(245, 247, 250))
    d1 = ImageDraw.Draw(img1)
    d1.rectangle([(40, 40), (760, 560)], outline=(14, 140, 233), width=4)
    d1.text((100, 100), "Sample Scanned Receipt", fill=(30, 41, 59))
    d1.text((100, 150), "Total: $142.50", fill=(30, 41, 59))
    img1.save(jpg_path, format="JPEG", quality=90)
    print(f"Generated: {jpg_path}")

    # Image 2: PNG
    png_path = os.path.join(TEST_OUTPUT_DIR, "diagram_sample.png")
    img2 = Image.new("RGBA", (700, 500), color=(255, 255, 255, 255))
    d2 = ImageDraw.Draw(img2)
    d2.ellipse([(150, 100), (350, 300)], fill=(224, 239, 254), outline=(2, 111, 199), width=3)
    d2.text((210, 190), "Architecture", fill=(2, 111, 199))
    img2.save(png_path, format="PNG")
    print(f"Generated: {png_path}")

def generate_test_docx():
    docx_path = os.path.join(TEST_OUTPUT_DIR, "sample_contract.docx")
    doc = docx.Document()
    doc.add_heading("DocForge Contract Agreement", level=0)
    doc.add_paragraph("This document tests headless DOCX -> PDF conversion via LibreOffice.")
    doc.add_heading("Terms and Conditions", level=1)
    doc.add_paragraph("1. Zero recurring cloud fees.")
    doc.add_paragraph("2. Local client processing wherever practical.")
    doc.add_paragraph("3. Private server processing for advanced features.")
    
    table = doc.add_table(rows=1, cols=3)
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = "Feature"
    hdr_cells[1].text = "Target"
    hdr_cells[2].text = "Status"
    
    data = [
        ("PDF Merge/Split", "Local WASM + Server", "Supported"),
        ("DOCX Conversion", "LibreOffice Headless", "Supported"),
        ("OCR Engine", "PyMuPDF Embedded", "Supported")
    ]
    for feat, target, status in data:
        row = table.add_row().cells
        row[0].text = feat
        row[1].text = target
        row[2].text = status

    doc.save(docx_path)
    print(f"Generated: {docx_path}")
    return docx_path

if __name__ == "__main__":
    generate_sample_pdf()
    generate_blank_pages_pdf()
    generate_duplicates_pdf()
    generate_test_images()
    generate_test_docx()
    print("All test documents generated successfully!")
