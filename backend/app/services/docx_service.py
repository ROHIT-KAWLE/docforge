import os
import subprocess
import shutil
import docx
from typing import Dict, Any, Optional

LIBREOFFICE_PATHS = [
    r"C:\Program Files\LibreOffice\program\soffice.com",
    r"C:\Program Files\LibreOffice\program\soffice.exe",
    r"C:\Program Files (x86)\LibreOffice\program\soffice.com",
    r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    "soffice",
    "libreoffice"
]

def find_libreoffice_executable() -> Optional[str]:
    for p in LIBREOFFICE_PATHS:
        if os.path.isabs(p) and os.path.exists(p):
            return p
        if not os.path.isabs(p) and shutil.which(p):
            return shutil.which(p)
    return None

def docx_to_pdf(input_docx: str, output_pdf: str) -> bool:
    exe = find_libreoffice_executable()
    if not exe:
        raise RuntimeError("LibreOffice headless is not available on this server.")

    out_dir = os.path.dirname(output_pdf)
    cmd = [
        exe,
        "--headless",
        "--convert-to", "pdf:writer_pdf_Export",
        input_docx,
        "--outdir", out_dir
    ]
    
    # Clean env to avoid platform independent libraries python collision
    env = os.environ.copy()
    env.pop("PYTHONHOME", None)
    env.pop("PYTHONPATH", None)

    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60, env=env)
    
    base_name = os.path.splitext(os.path.basename(input_docx))[0]
    expected_out = os.path.join(out_dir, f"{base_name}.pdf")
    
    if os.path.exists(expected_out):
        if expected_out != output_pdf:
            shutil.move(expected_out, output_pdf)
        return True
    
    raise RuntimeError(f"LibreOffice conversion failed: {proc.stderr.decode('utf-8', errors='ignore')}")

def pdf_to_docx(input_pdf: str, output_docx: str) -> Dict[str, Any]:
    """
    Best-effort conversion from PDF to DOCX using LibreOffice headless.
    Preserves text and layout where possible.
    """
    exe = find_libreoffice_executable()
    out_dir = os.path.dirname(output_docx)
    
    if exe:
        cmd = [
            exe,
            "--headless",
            "--infilter=writer_pdf_import",
            "--convert-to", "docx:MS Word 2007 XML",
            input_pdf,
            "--outdir", out_dir
        ]
        env = os.environ.copy()
        env.pop("PYTHONHOME", None)
        env.pop("PYTHONPATH", None)
        
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60, env=env)
        base_name = os.path.splitext(os.path.basename(input_pdf))[0]
        expected_out = os.path.join(out_dir, f"{base_name}.docx")
        
        if os.path.exists(expected_out):
            if expected_out != output_docx:
                shutil.move(expected_out, output_docx)
            return {
                "success": True,
                "engine": "LibreOffice Writer PDF Import",
                "notice": "Best-effort conversion. Complex layouts and graphics may differ from original PDF."
            }
    
    # Fallback to python-docx text dump if LibreOffice PDF import isn't optimal
    import fitz
    doc = fitz.open(input_pdf)
    docx_file = docx.Document()
    docx_file.add_heading(f"Converted: {os.path.basename(input_pdf)}", level=1)
    
    for i, page in enumerate(doc):
        docx_file.add_heading(f"Page {i+1}", level=2)
        text = page.get_text()
        for para in text.split("\n\n"):
            if para.strip():
                docx_file.add_paragraph(para.strip())
    
    docx_file.save(output_docx)
    doc.close()
    
    return {
        "success": True,
        "engine": "PyMuPDF Text Reconstruction",
        "notice": "Best-effort text extraction conversion. Layout formatting is simplified."
    }

def get_docx_preview_data(input_docx: str) -> Dict[str, Any]:
    try:
        doc = docx.Document(input_docx)
        paras = [p.text for p in doc.paragraphs if p.text.strip()]
        total_words = sum(len(p.split()) for p in paras)
        total_chars = sum(len(p) for p in paras)
        tables_count = len(doc.tables)
        
        preview_snippets = paras[:10]  # First 10 paragraphs
        
        return {
            "paragraph_count": len(paras),
            "table_count": tables_count,
            "word_count": total_words,
            "char_count": total_chars,
            "preview_text": "\n\n".join(preview_snippets),
            "is_valid": True
        }
    except Exception as e:
        return {
            "error": str(e),
            "is_valid": False
        }
