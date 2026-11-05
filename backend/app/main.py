import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .api import auth_router, files_router, pdf_router, docx_router, ocr_router, projects_router, system_router

app = FastAPI(
    title="DocForge Backend API",
    description="Personal Universal Document Toolbox Engine",
    version="1.0.0"
)

# CORS configuration for cross-device & local web client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API Routers
app.include_router(auth_router.router)
app.include_router(files_router.router)
app.include_router(pdf_router.router)
app.include_router(docx_router.router)
app.include_router(ocr_router.router)
app.include_router(projects_router.router)
app.include_router(system_router.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "DocForge Personal Document Toolbox",
        "version": "1.0.0"
    }

# Optionally serve frontend dist if built
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
