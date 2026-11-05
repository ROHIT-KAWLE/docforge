# DocForge — Personal Universal Document Toolbox

> **"One place for everything I need to do with documents."**
> A fast, private, zero-cost, responsive document-management and processing web application and installable PWA designed for PC, Laptop, Tablet, and Mobile.

---

## 1. Architectural Philosophy

DocForge uses a **hybrid privacy-first processing architecture**:

```
                    ┌───────────────────────────────┐
                    │           DOCFORGE            │
                    │   Password / Session Auth     │
                    └───────────────┬───────────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              │                                           │
      LOCAL IN-BROWSER                            PRIVATE BACKEND
              │                                           │
    • pdf-lib WASM / Pure JS                     • FastAPI (Python 3.11/3.12)
    • Zero server uploads                        • PyMuPDF (C-based MuPDF engine)
    • Page reordering & deletion                 • Headless LibreOffice Writer
    • Page rotation & extraction                 • Local OCR (Tesseract / embedded)
    • Blank page inspection                      • Advanced Deflate stream compression
    • Client-side PDF export                     • DOCX ↔ PDF conversion
              │                                           │
              └─────────────────────┬─────────────────────┘
                                    │
                         DOCUMENT OPERATION ENGINE
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ↓                         ↓                         ↓
      PDF Tools                 DOCX Tools               Image Tools
  • Merge / Split           • High-fidelity DOCX → PDF   • JPG / PNG / WEBP
  • Odd / Even              • Best-effort PDF → DOCX     • Fit: Contain/Cover
  • Reverse order           • Word / Table metadata      • Zero distortion
  • Blank detection         • Searchable text            • PDF → Image ZIP
  • Duplicate detection
  • Watermark & Numbers
  • Crop & Compress
```

### Privacy Indicators
Every operation clearly displays where processing occurred:
- **`Processed locally — your file never left this device.`**
- **`Processed on your private DocForge server.`**

---

## 2. Supported File Formats

| Format | Read / Preview | Manipulate / Rearrange | Export / Convert | Engine |
| :--- | :---: | :---: | :---: | :--- |
| **PDF** | Yes (PDF.js / PyMuPDF) | Full page pipeline | PDF, Images (PNG/JPG) | PyMuPDF + pdf-lib |
| **DOCX** | Yes (Metadata & Text preview) | Full (via derived PDF) | PDF, DOCX (best-effort) | LibreOffice Headless |
| **JPG / JPEG** | Yes | Yes (Page object) | PDF (A4, Letter, etc.) | Pillow + PyMuPDF |
| **PNG** | Yes | Yes (Page object) | PDF (contain / cover) | Pillow + PyMuPDF |
| **WEBP** | Yes | Yes (Page object) | PDF | Pillow + PyMuPDF |

---

## 3. Implemented Features

### Phase 1: Core Foundation
- [x] **Salted PBKDF2 Password Authentication** (100,000 iterations, brute-force rate-limiting, session tokens, optional "Remember this device").
- [x] **Document Workspace**: multi-document canvas, thumbnail rendering, shift-click selection, drag-and-drop reordering.
- [x] **Page Operations**: Delete, Rotate (90°, 180°, 270°), Duplicate, Extract, Merge, Insert blank page.
- [x] **Undo / Redo History Stack** (Ctrl+Z, Ctrl+Shift+Z) across all operations.
- [x] **Non-destructive editing**: Original files remain untouched; operations execute against working pipelines.

### Phase 2: Document Operations
- [x] **Split PDF**: Every page, every N pages, custom ranges (`1-5, 6-10`), or selected pages with **interactive live file preview before processing** and single-click ZIP download.
- [x] **Odd / Even Page Separation**: Dedicated `_odd.pdf` and `_even.pdf` split with batch download.
- [x] **Reverse Page Order**: Instant one-click page inversion.
- [x] **Blank Page Detection**: Smart pixel variance and text layer scanning that flags blank scans with manual confirmation checkboxes.
- [x] **Duplicate Page Detection**: Perceptual MD5 page hash detection that identifies duplicated invoice/certificate pages with side-by-side comparison.

### Phase 3: PDF Tools
- [x] **PDF Compression**: Low, Balanced, High, Maximum presets with image downsampling and maximum deflate garbage collection, displaying original vs final size and savings percentage.
- [x] **Visual Watermarking**: Text, font size (16-72px), opacity (5-100%), rotation (0°, 45°, 90°), color picker, position (center, top-left, bottom-right).
- [x] **Page Numbering**: Formats (`Page {n} of {total}`, `{n}`, `Page {n}`, `0{n}`), 6 layout positions, custom starting number, skip-first-page option.
- [x] **Visual Crop**: Interactive margin trimmer with percentage inset applicable to selected pages or all pages.
- [x] **AES-256 PDF Password Protection**: Set user open password, owner password, and print/copy permission flags.
- [x] **Image Conversion**: Multiple images to PDF with Contain / Cover / Stretch fit and standard sizes (A4, Letter, etc.).
- [x] **PDF to Image Export**: Export pages as high-resolution PNG or JPG inside a clean ZIP archive.

### Phase 4: DOCX & OCR
- [x] **DOCX Preview**: Word count, table count, paragraph preview.
- [x] **High-Fidelity DOCX → PDF**: Headless conversion via self-hosted LibreOffice Writer.
- [x] **Best-Effort PDF → DOCX**: Conversion with explicit user advisory notice regarding layout reflow.
- [x] **Local OCR Engine**: PyMuPDF embedded OCR converting scans to searchable PDFs.
- [x] **Text Extraction & In-Document Search**: Download full text as TXT, copy to clipboard, and search with page occurrence highlights.

### Phase 5: Smart Features
- [x] **Deterministic Smart Command Box**: Natural language command parser (e.g., *"Separate odd and even pages"*, *"Delete pages 1, 3 and 5"*, *"Rotate clockwise"*, *"Split every 3 pages"*, *"Remove blank pages"*). Works completely offline without paid AI APIs.

### Phase 6: Cross-Device UX & PWA
- [x] **Installable PWA**: `manifest.json`, standalone display, touch icons, theme color.
- [x] **Responsive Mobile Layout**: Bottom navigation dock, large touch targets, mobile bottom sheets.
- [x] **Storage Auto-Cleanup**: Clear temporary files and check storage footprint from Settings.

---

## 4. Quick Start

### Prerequisites
- **Python**: 3.11 or 3.12 (with `fastapi`, `uvicorn`, `pymupdf`, `python-docx`, `pillow`)
- **Node.js**: v20+ / v22+
- **LibreOffice**: Installed (for headless DOCX conversion)

### One-Command Production Run
To start the personal server (FastAPI serving the production frontend bundle):
```bash
scripts\run_production.bat
```
Open **`http://localhost:8000`** in your browser.

### Development Run (Vite + FastAPI Hot Reload)
```bash
scripts\run_dev.bat
```
- Frontend: `http://localhost:5173`
- Backend API Docs: `http://localhost:8000/docs`

### Run Automated Tests
```bash
scripts\run_tests.bat
```
Runs 21 comprehensive test suites verifying merge, split, rotation, odd/even, reverse, blank detection, duplicate detection, compression, watermark, page numbers, encryption, image conversion, DOCX conversion, and chained pipelines.

---

## 5. Security Notes

1. **No Cloud Dependencies**: Zero external API calls to OpenAI, Adobe, CloudConvert, or AWS.
2. **Password Security**: Passwords are never stored in plain text or client-side JavaScript. Hashing uses PBKDF2 HMAC SHA-256 with 100,000 iterations and unique cryptographic salts.
3. **Rate Limiting**: Protects against brute-force unlock attempts (lockout after 5 failed attempts).
4. **Non-Destructive File Isolation**: Uploaded files are assigned random UUIDs, sanitized against directory traversal attacks, and isolated from executable code.
5. **Auto-Cleanup**: Temporary conversion artifacts and working files are purged on demand or after expiry.

---

## 6. Personal Deployment & Mobile PWA Setup

DocForge is designed to run seamlessly as your **personal private document toolbox** across your PC, laptop, phone, and tablet with **zero monthly subscription fees**:

- **Local Wi-Fi Deployment**: Run on your PC (`scripts\run_production.bat` or `scripts\start_silent.vbs`), connect from phone/tablet at `http://<YOUR_PC_IP>:8000`, and tap **"Add to Home Screen"** to install as a full-screen PWA.
- **Auto-Start on Windows**: Run `scripts\setup_windows_startup.bat` to have DocForge launch silently in the background on system boot.
- **Everywhere Access (5G / Outside Home)**: Use free [Tailscale](https://tailscale.com) mesh VPN to access DocForge securely anywhere in the world at `http://<tailscale-ip>:8000` or with free HTTPS (`tailscale serve --bg 8000`).
- **Docker / Homelab**: Multi-stage `Dockerfile` and `docker-compose.yml` included for 24/7 home servers or VPS deployment.

👉 For complete step-by-step instructions with firewall setup and screenshots, see [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md).

---

## 7. How to Add a New Document Operation

To add a new document operation:
1. **Backend Service** (`backend/app/services/pdf_service.py`):
   Create a dedicated function (e.g. `def redact_document(filepath, ...)`).
2. **API Endpoint** (`backend/app/api/pdf_router.py`):
   Expose a clean REST endpoint (e.g. `@router.post("/redact")`).
3. **Frontend API Client** (`frontend/src/services/api.ts`):
   Add the helper method to `api`.
4. **Command Parser** (`frontend/src/utils/commandParser.ts`):
   Add matching keywords so users can invoke it from the Smart Command Box.
5. **UI Trigger** (`frontend/src/components/workspace/ActionBar.tsx` or `ToolsPage.tsx`):
   Wire the action trigger and modal.
6. **Automated Test** (`backend/tests/test_docforge.py`):
   Add a pytest case verifying functionality with sample documents.

---

## 7. Developer Report

- **IMPLEMENTED**:
  - Full FastAPI modular backend with PyMuPDF, python-docx, Pillow, and LibreOffice.
  - Salted PBKDF2 authentication with session token validation and brute force lockout.
  - Complete React + TypeScript + Tailwind CSS PWA frontend.
  - In-browser local processing engine via `pdf-lib` + private backend processing via PyMuPDF.
  - Real-time privacy badges on every action.
  - Smart Command Box with deterministic rule-based natural language execution.
  - Modals for Split (with live file previews), Watermark, Page Numbering, Compress, OCR & Search, DOCX Conversion, Blank Detection, Duplicate Review, and Storage Settings.
  - Test document generator and startup batch scripts.
- **TESTED**:
  - 21 automated backend tests in `backend/tests/test_docforge.py` passing 100%.
  - Full TypeScript build (`tsc && vite build`) passing with zero errors.
  - Live server startup, password initialization, incorrect password rejection (HTTP 401), correct password unlock, capabilities verification, and static root frontend delivery verified via HTTP requests.
- **KNOWN ISSUES**:
  - Complex multi-column PDF-to-DOCX conversion may experience layout reflow (clearly documented and labeled as "Best-effort conversion").
- **NEXT STEPS / ROADMAP**:
  - Visual PDF freehand annotation & signature drawing canvas.
  - Multi-language OCR model pack download manager (e.g., German, Spanish, French).
  - PWA offline service worker caching for complete offline flight mode.
