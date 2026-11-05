import os
import uuid
import re
import time
import shutil
import hashlib
from typing import Optional, Dict, Any

STORAGE_BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "storage"))
UPLOADS_DIR = os.path.join(STORAGE_BASE, "uploads")
PROCESSED_DIR = os.path.join(STORAGE_BASE, "processed")
TEMP_DIR = os.path.join(STORAGE_BASE, "temp")
PROJECTS_DIR = os.path.join(STORAGE_BASE, "projects")

for d in [UPLOADS_DIR, PROCESSED_DIR, TEMP_DIR, PROJECTS_DIR]:
    os.makedirs(d, exist_ok=True)

# In-memory registry of uploaded files: file_id -> metadata
FILE_REGISTRY: Dict[str, Dict[str, Any]] = {}

def sanitize_filename(filename: str) -> str:
    # Strip directory components
    clean = os.path.basename(filename)
    # Remove potentially dangerous characters, keep alphanumeric, dots, dashes, underscores
    clean = re.sub(r'[^a-zA-Z0-9._\- ]', '_', clean)
    clean = clean.strip()
    if not clean:
        clean = f"document_{uuid.uuid4().hex[:8]}"
    return clean

def save_uploaded_file(original_filename: str, content: bytes) -> Dict[str, Any]:
    file_id = uuid.uuid4().hex
    safe_name = sanitize_filename(original_filename)
    ext = os.path.splitext(safe_name)[1].lower()
    stored_filename = f"{file_id}_{safe_name}"
    target_path = os.path.join(UPLOADS_DIR, stored_filename)

    with open(target_path, "wb") as f:
        f.write(content)

    file_size = len(content)
    sha256 = hashlib.sha256(content).hexdigest()

    meta = {
        "file_id": file_id,
        "original_name": safe_name,
        "stored_path": target_path,
        "extension": ext,
        "size_bytes": file_size,
        "sha256": sha256,
        "created_at": time.time(),
        "page_count": 0,
        "metadata": {}
    }
    FILE_REGISTRY[file_id] = meta
    return meta

def get_file_info(file_id: str) -> Optional[Dict[str, Any]]:
    if file_id in FILE_REGISTRY:
        meta = FILE_REGISTRY[file_id]
        if os.path.exists(meta["stored_path"]):
            return meta
    
    # Try finding in uploads dir by file_id prefix
    for fname in os.listdir(UPLOADS_DIR):
        if fname.startswith(f"{file_id}_"):
            p = os.path.join(UPLOADS_DIR, fname)
            original_name = fname[len(file_id) + 1:]
            meta = {
                "file_id": file_id,
                "original_name": original_name,
                "stored_path": p,
                "extension": os.path.splitext(original_name)[1].lower(),
                "size_bytes": os.path.getsize(p),
                "created_at": os.path.getctime(p),
                "page_count": 0,
                "metadata": {}
            }
            FILE_REGISTRY[file_id] = meta
            return meta
    return None

def get_processed_file_path(filename: str) -> str:
    safe = sanitize_filename(filename)
    unique_name = f"{uuid.uuid4().hex[:8]}_{safe}"
    return os.path.join(PROCESSED_DIR, unique_name)

def get_temp_file_path(suffix: str = ".tmp") -> str:
    return os.path.join(TEMP_DIR, f"tmp_{uuid.uuid4().hex}{suffix}")

def cleanup_temp_files(max_age_hours: int = 12) -> int:
    now = time.time()
    cutoff = now - (max_age_hours * 3600)
    removed_count = 0

    for directory in [TEMP_DIR, PROCESSED_DIR]:
        if not os.path.exists(directory):
            continue
        for fname in os.listdir(directory):
            fpath = os.path.join(directory, fname)
            try:
                if os.path.isfile(fpath) and os.path.getmtime(fpath) < cutoff:
                    os.remove(fpath)
                    removed_count += 1
            except Exception:
                pass
    return removed_count

def get_storage_stats() -> Dict[str, Any]:
    def get_dir_size(d):
        total = 0
        count = 0
        if os.path.exists(d):
            for dirpath, _, filenames in os.walk(d):
                for f in filenames:
                    fp = os.path.join(dirpath, f)
                    try:
                        total += os.path.getsize(fp)
                        count += 1
                    except Exception:
                        pass
        return total, count

    up_size, up_count = get_dir_size(UPLOADS_DIR)
    proc_size, proc_count = get_dir_size(PROCESSED_DIR)
    tmp_size, tmp_count = get_dir_size(TEMP_DIR)

    return {
        "uploads": {"bytes": up_size, "files": up_count},
        "processed": {"bytes": proc_size, "files": proc_count},
        "temp": {"bytes": tmp_size, "files": tmp_count},
        "total_bytes": up_size + proc_size + tmp_size,
        "total_files": up_count + proc_count + tmp_count
    }
