import fitz
from PIL import Image
import io
import os
import tempfile
from backend.app.services.pdf_service import images_to_pdf, pdf_to_images, merge_pages

def test_workflow():
    with tempfile.TemporaryDirectory() as tmpdir:
        # 1. Create a sample portrait image and a sample landscape image
        img1_path = os.path.join(tmpdir, "img_portrait.png")
        img2_path = os.path.join(tmpdir, "img_landscape.jpg")

        # Portrait: 600 x 800
        im1 = Image.new("RGB", (600, 800), color="blue")
        im1.save(img1_path)

        # Landscape: 1200 x 800
        im2 = Image.new("RGB", (1200, 800), color="green")
        im2.save(img2_path, format="JPEG")

        # 2. Convert to A4 PDF
        pdf_out = os.path.join(tmpdir, "output_A4.pdf")
        images_to_pdf([img1_path, img2_path], "A4", "contain", pdf_out)

        doc = fitz.open(pdf_out)
        assert len(doc) == 2, f"Expected 2 pages, got {len(doc)}"

        # Page 1 should be portrait A4 (approx 595 x 842)
        p1 = doc[0]
        assert abs(p1.rect.width - 595) < 2 and abs(p1.rect.height - 842) < 2, f"P1 size unexpected: {p1.rect}"

        # Page 2 should be landscape A4 (approx 842 x 595)
        p2 = doc[1]
        assert abs(p2.rect.width - 842) < 2 and abs(p2.rect.height - 595) < 2, f"P2 size unexpected: {p2.rect}"
        doc.close()
        print("✓ images_to_pdf correctly generated proportional A4 pages with auto-orientation!")

        # 3. Export PDF back to images
        export_dir = os.path.join(tmpdir, "exported_imgs")
        os.makedirs(export_dir, exist_ok=True)
        img_results = pdf_to_images(pdf_out, pages=None, format_ext="png", dpi=150, output_dir=export_dir)
        assert len(img_results) == 2, f"Expected 2 exported images, got {len(img_results)}"
        assert os.path.exists(img_results[0]) and os.path.exists(img_results[1])
        print("✓ pdf_to_images cleanly exported all pages as downloadable images!")

        # 4. Merge multiple PDFs
        # Create a second PDF
        pdf2_out = os.path.join(tmpdir, "second.pdf")
        doc2 = fitz.open()
        doc2.new_page(width=595, height=842)
        doc2.save(pdf2_out)
        doc2.close()

        merged_out = os.path.join(tmpdir, "merged.pdf")
        files_map = {"fid1": pdf_out, "fid2": pdf2_out}
        pages_spec = [
            {"file_id": "fid1", "page_number": 1, "rotation": 0},
            {"file_id": "fid1", "page_number": 2, "rotation": 0},
            {"file_id": "fid2", "page_number": 1, "rotation": 0},
        ]
        merge_pages(pages_spec, lambda fid: files_map[fid], merged_out)
        doc_merged = fitz.open(merged_out)
        assert len(doc_merged) == 3, f"Expected 3 pages in merged doc, got {len(doc_merged)}"
        doc_merged.close()
        print("✓ merge_pages successfully merged multiple PDFs!")

if __name__ == "__main__":
    test_workflow()
    print("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")
