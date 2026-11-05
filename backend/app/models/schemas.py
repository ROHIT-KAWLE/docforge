from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class UnlockRequest(BaseModel):
    password: str
    remember: bool = False

class AuthResponse(BaseModel):
    token: str
    message: str
    expires_in: int

class AuthStatus(BaseModel):
    is_authenticated: bool
    setup_required: bool

class SetupPasswordRequest(BaseModel):
    password: str

class PageSpec(BaseModel):
    file_id: str
    page_number: int  # 1-indexed
    rotation: int = 0  # 0, 90, 180, 270
    crop: Optional[Dict[str, float]] = None  # {x0, y0, x1, y1} normalized 0..1

class MergeRequest(BaseModel):
    pages: Optional[List[PageSpec]] = None
    file_ids: Optional[List[str]] = None
    output_filename: Optional[str] = "merged_document.pdf"

class SplitRequest(BaseModel):
    file_id: str
    mode: str  # 'every_page', 'every_n', 'ranges', 'selected'
    n_pages: Optional[int] = 1
    ranges: Optional[str] = None  # e.g. "1-5, 6-10"
    selected_pages: Optional[List[int]] = None  # 1-indexed

class ExtractRequest(BaseModel):
    file_id: str
    pages: List[int]  # 1-indexed
    output_filename: Optional[str] = "extracted_pages.pdf"

class OddEvenRequest(BaseModel):
    file_id: str
    mode: str = "both"  # 'odd', 'even', 'both'

class RotateRequest(BaseModel):
    file_id: str
    angle: int  # 90, 180, 270
    target: str = "selected"  # 'selected', 'all', 'odd', 'even'
    pages: Optional[List[int]] = None

class CompressionRequest(BaseModel):
    file_id: str
    level: str = "balanced"  # 'low', 'balanced', 'high', 'maximum'

class WatermarkRequest(BaseModel):
    file_id: str
    type: str = "text"  # 'text' or 'image'
    text: Optional[str] = "CONFIDENTIAL"
    font_size: int = 48
    opacity: float = 0.3
    rotation: int = 45
    color: str = "#888888"
    position: str = "center"  # 'center', 'top-left', 'bottom-right'
    pages: Optional[List[int]] = None  # None means all

class PageNumberRequest(BaseModel):
    file_id: str
    format: str = "Page {n} of {total}"  # '{n}', 'Page {n}', 'Page {n} of {total}', '0{n}'
    position: str = "bottom-center"  # 'bottom-left', 'bottom-center', 'bottom-right', 'top-left', 'top-center', 'top-right'
    start_number: int = 1
    skip_first: bool = False
    font_size: int = 11
    color: str = "#333333"

class MetadataUpdateRequest(BaseModel):
    file_id: str
    title: Optional[str] = None
    author: Optional[str] = None
    subject: Optional[str] = None
    keywords: Optional[str] = None
    creator: Optional[str] = None

class PasswordProtectRequest(BaseModel):
    file_id: str
    user_password: str
    owner_password: Optional[str] = None
    allow_printing: bool = True
    allow_copying: bool = True

class ConvertImagesRequest(BaseModel):
    file_ids: List[str]
    page_size: str = "A4"  # 'A4', 'A3', 'A5', 'Letter', 'Legal', 'Original'
    fit: str = "contain"  # 'contain', 'cover', 'stretch'
    output_filename: Optional[str] = "images_to_pdf.pdf"

class SaveProjectRequest(BaseModel):
    project_id: Optional[str] = None
    name: str
    pages: List[Dict[str, Any]]
    files: List[Dict[str, Any]]

class OCRRequest(BaseModel):
    file_id: str
    language: str = "eng"
    pages: Optional[List[int]] = None
    output_format: str = "searchable_pdf"  # 'searchable_pdf', 'text', 'both'
