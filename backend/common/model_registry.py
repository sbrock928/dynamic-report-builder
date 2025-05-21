from typing import Dict, List, Any, Type
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import DeclarativeBase

from common.financial_models import Deal, Tranche, CashFlow


class ModelInfo:
    def __init__(self, model_class, display_name, description=None):
        self.model_class = model_class
        self.display_name = display_name
        self.description = description
        self.fields = self._get_fields()

    def _get_fields(self):
        """Extract field information from the model"""
        fields = []
        for column in inspect(self.model_class).columns:
            field_info = {
                "name": column.name,
                "type": str(column.type),
                "primary_key": column.primary_key,
                "nullable": column.nullable,
                "foreign_key": column.foreign_keys is not None
                and len(column.foreign_keys) > 0,
            }
            fields.append(field_info)
        return fields


# Registry of available models
MODEL_REGISTRY = {
    "deal": ModelInfo(Deal, "Deal", "Financial deals information"),
    "tranche": ModelInfo(Tranche, "Tranche", "Tranches within deals"),
    "cashflow": ModelInfo(CashFlow, "Cash Flow", "Cash flow data for tranches"),
}


def get_available_models():
    """Return list of available models for frontend"""
    result = []
    for key, model_info in MODEL_REGISTRY.items():
        result.append(
            {
                "id": key,
                "name": model_info.display_name,
                "description": model_info.description,
            }
        )
    return result


def get_model_fields(model_id):
    """Return fields for a specific model"""
    if model_id not in MODEL_REGISTRY:
        return []
    return MODEL_REGISTRY[model_id].fields


def get_model_class(model_id):
    """Return the actual model class for a model ID"""
    if model_id not in MODEL_REGISTRY:
        return None
    return MODEL_REGISTRY[model_id].model_class
