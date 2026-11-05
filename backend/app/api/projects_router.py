from fastapi import APIRouter, HTTPException, Depends
from ..security.auth import require_auth
from ..models.schemas import SaveProjectRequest
from ..services.project_service import list_projects, save_project, get_project, delete_project

router = APIRouter(prefix="/api/projects", tags=["Projects"], dependencies=[Depends(require_auth)])

@router.get("")
def api_list_projects():
    return {"projects": list_projects()}

@router.post("")
def api_save_project(req: SaveProjectRequest):
    try:
        project = save_project(req.name, req.pages, req.files, req.project_id)
        return {"success": True, "project": project}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save project: {str(e)}")

@router.get("/{project_id}")
def api_get_project(project_id: str):
    p = get_project(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found.")
    return {"project": p}

@router.delete("/{project_id}")
def api_delete_project(project_id: str):
    success = delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found.")
    return {"success": True, "message": "Project deleted."}
