import os
import json
import uuid
import time
from typing import Dict, Any, List, Optional
from ..utils.file_manager import PROJECTS_DIR

def list_projects() -> List[Dict[str, Any]]:
    projects = []
    if not os.path.exists(PROJECTS_DIR):
        return projects
    
    for fname in os.listdir(PROJECTS_DIR):
        if fname.endswith(".json"):
            fp = os.path.join(PROJECTS_DIR, fname)
            try:
                with open(fp, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    projects.append({
                        "id": data.get("id"),
                        "name": data.get("name"),
                        "page_count": len(data.get("pages", [])),
                        "file_count": len(data.get("files", [])),
                        "created_at": data.get("created_at"),
                        "updated_at": data.get("updated_at")
                    })
            except Exception:
                pass
    # Sort newest first
    projects.sort(key=lambda x: x.get("updated_at", 0), reverse=True)
    return projects

def save_project(name: str, pages: List[Dict[str, Any]], files: List[Dict[str, Any]], project_id: Optional[str] = None) -> Dict[str, Any]:
    now = time.time()
    pid = project_id or uuid.uuid4().hex[:12]
    fp = os.path.join(PROJECTS_DIR, f"{pid}.json")
    
    existing = {}
    if os.path.exists(fp):
        try:
            with open(fp, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:
            pass

    project_data = {
        "id": pid,
        "name": name,
        "pages": pages,
        "files": files,
        "created_at": existing.get("created_at", now),
        "updated_at": now
    }

    with open(fp, "w", encoding="utf-8") as f:
        json.dump(project_data, f, indent=2)

    return project_data

def get_project(project_id: str) -> Optional[Dict[str, Any]]:
    fp = os.path.join(PROJECTS_DIR, f"{project_id}.json")
    if os.path.exists(fp):
        try:
            with open(fp, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None
    return None

def delete_project(project_id: str) -> bool:
    fp = os.path.join(PROJECTS_DIR, f"{project_id}.json")
    if os.path.exists(fp):
        os.remove(fp)
        return True
    return False
