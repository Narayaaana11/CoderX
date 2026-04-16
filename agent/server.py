from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from api.routes import build_project


class BuildProjectRequest(BaseModel):
    user_prompt: str
    workspace: str = "workspace"


app = FastAPI(title="CoderX Agent Service", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/build-project")
def build_project_endpoint(request: BuildProjectRequest) -> dict[str, Any]:
    prompt = request.user_prompt.strip()

    if not prompt:
        raise HTTPException(status_code=400, detail="user_prompt is required")

    return build_project(user_prompt=prompt, workspace=request.workspace)
