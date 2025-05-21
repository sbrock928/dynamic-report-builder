from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from common.model_registry import get_available_models, get_model_fields

router = APIRouter(prefix="/models", tags=["models"])


@router.get("/", response_model=List[Dict[str, Any]])
def get_models():
    """Get all available data models"""
    return get_available_models()


@router.get("/{model_id}/fields", response_model=List[Dict[str, Any]])
def get_fields(model_id: str):
    """Get fields for a specific model"""
    fields = get_model_fields(model_id)
    if not fields:
        raise HTTPException(status_code=404, detail="Model not found")
    return fields
