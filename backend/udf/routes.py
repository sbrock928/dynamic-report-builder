from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from common.database import get_db
from udf.schemas import UDF, UDFCreate, UDFUpdate, PydanticUDFGenerator
from udf.models import UDFModel
from common.model_registry import get_model_class, get_model_fields

router = APIRouter(prefix="/udfs", tags=["udfs"])


@router.get("/", response_model=List[UDF])
def get_udfs(db: Session = Depends(get_db)):
    """Get all UDF definitions"""
    udfs = db.query(UDFModel).all()
    result = []
    for udf in udfs:
        # Convert database model to Pydantic model
        fields = []
        for field_dict in udf.udf_json.get("fields", []):
            fields.append(field_dict)

        result.append(
            UDF(
                id=udf.id,
                name=udf.name,
                description=udf.description,
                base_model=udf.base_model,
                aggregation_level=udf.aggregation_level,
                fields=fields,
                schema_json=udf.udf_json,
            )
        )

    return result


@router.get("/{udf_id}", response_model=UDF)
def get_udf(udf_id: int, db: Session = Depends(get_db)):
    """Get a specific UDF by ID"""
    udf = db.query(UDFModel).filter(UDFModel.id == udf_id).first()
    if udf is None:
        raise HTTPException(status_code=404, detail="UDF not found")

    # Convert database model to Pydantic model
    fields = []
    for field_dict in udf.udf_json.get("fields", []):
        fields.append(field_dict)

    return UDF(
        id=udf.id,
        name=udf.name,
        description=udf.description,
        base_model=udf.base_model,
        aggregation_level=udf.aggregation_level,
        fields=fields,
        schema_json=udf.udf_json,
    )


@router.post("/", response_model=UDF)
def create_udf(udf_create: UDFCreate, db: Session = Depends(get_db)):
    """Create a new UDF definition"""
    # Validate the base model exists
    model_class = get_model_class(udf_create.base_model)
    if model_class is None:
        raise HTTPException(
            status_code=400, detail=f"Base model '{udf_create.base_model}' not found"
        )

    # Require aggregation level to be set
    if not udf_create.aggregation_level:
        raise HTTPException(status_code=400, detail="Aggregation level is required")

    # Validate source fields exist in the base model if specified
    model_fields = get_model_fields(udf_create.base_model)
    model_field_names = [f["name"] for f in model_fields]

    for field in udf_create.fields:
        if field.source_field and field.source_field not in model_field_names:
            raise HTTPException(
                status_code=400,
                detail=f"Source field '{field.source_field}' not found in model '{udf_create.base_model}'",
            )

    # Convert the UDFCreate to a JSON schema
    schema_json = {
        "name": udf_create.name,
        "description": udf_create.description,
        "base_model": udf_create.base_model,
        "aggregation_level": udf_create.aggregation_level,
        "fields": [field.dict() for field in udf_create.fields],
    }

    db_udf = UDFModel(
        name=udf_create.name,
        description=udf_create.description,
        base_model=udf_create.base_model,
        aggregation_level=udf_create.aggregation_level,
        udf_json=schema_json,
    )
    db.add(db_udf)
    db.commit()
    db.refresh(db_udf)

    # Create a valid UDF response object
    return UDF(
        id=db_udf.id,
        name=db_udf.name,
        description=db_udf.description,
        base_model=db_udf.base_model,
        aggregation_level=db_udf.aggregation_level,
        fields=udf_create.fields,
        schema_json=db_udf.udf_json,
    )


@router.put("/{udf_id}", response_model=UDF)
def update_udf(udf_id: int, udf_update: UDFUpdate, db: Session = Depends(get_db)):
    """Update an existing UDF"""
    db_udf = db.query(UDFModel).filter(UDFModel.id == udf_id).first()
    if db_udf is None:
        raise HTTPException(status_code=404, detail="UDF not found")

    # Validate the base model exists
    model_class = get_model_class(udf_update.base_model)
    if model_class is None:
        raise HTTPException(
            status_code=400, detail=f"Base model '{udf_update.base_model}' not found"
        )

    # Require aggregation level to be set
    if not udf_update.aggregation_level:
        raise HTTPException(status_code=400, detail="Aggregation level is required")

    # Validate source fields exist in the base model if specified
    model_fields = get_model_fields(udf_update.base_model)
    model_field_names = [f["name"] for f in model_fields]

    for field in udf_update.fields:
        if field.source_field and field.source_field not in model_field_names:
            raise HTTPException(
                status_code=400,
                detail=f"Source field '{field.source_field}' not found in model '{udf_update.base_model}'",
            )

    # Convert the UDFUpdate to a JSON schema
    schema_json = {
        "name": udf_update.name,
        "description": udf_update.description,
        "base_model": udf_update.base_model,
        "aggregation_level": udf_update.aggregation_level,
        "fields": [field.dict() for field in udf_update.fields],
    }

    db_udf.name = udf_update.name
    db_udf.description = udf_update.description
    db_udf.base_model = udf_update.base_model
    db_udf.aggregation_level = udf_update.aggregation_level
    db_udf.udf_json = schema_json

    db.commit()
    db.refresh(db_udf)

    # Create a valid UDF response object
    return UDF(
        id=db_udf.id,
        name=db_udf.name,
        description=db_udf.description,
        base_model=db_udf.base_model,
        aggregation_level=db_udf.aggregation_level,
        fields=udf_update.fields,
        schema_json=db_udf.udf_json,
    )


@router.delete("/{udf_id}", response_model=bool)
def delete_udf(udf_id: int, db: Session = Depends(get_db)):
    """Delete a UDF"""
    db_udf = db.query(UDFModel).filter(UDFModel.id == udf_id).first()
    if db_udf is None:
        raise HTTPException(status_code=404, detail="UDF not found")

    # Check if any reports use this UDF
    if hasattr(db_udf, "report_layouts") and len(db_udf.report_layouts) > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete UDF that is used by reports. Remove from reports first.",
        )

    db.delete(db_udf)
    db.commit()
    return True


@router.get("/{udf_id}/pydantic-code", response_model=str)
def get_pydantic_code(udf_id: int, db: Session = Depends(get_db)):
    """Generate Pydantic model code for a UDF"""
    db_udf = db.query(UDFModel).filter(UDFModel.id == udf_id).first()
    if db_udf is None:
        raise HTTPException(status_code=404, detail="UDF not found")

    generator = PydanticUDFGenerator(schema_json=db_udf.udf_json)
    return generator.generate_pydantic_code()


@router.get("/models/{model_id}/fields", response_model=List[dict])
def get_model_available_fields(model_id: str):
    """Get available fields for a specific model"""
    fields = get_model_fields(model_id)
    if not fields:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found")
    return fields
