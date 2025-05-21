from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas.schema import Schema, SchemaCreate, SchemaUpdate, PydanticSchemaGenerator
from models.schema import SchemaModel
from model_registry import get_model_class, get_model_fields

router = APIRouter(prefix="/schemas", tags=["schemas"])

@router.get("/", response_model=List[Schema])
def get_schemas(db: Session = Depends(get_db)):
    """Get all schema definitions"""
    schemas = db.query(SchemaModel).all()
    result = []
    for schema in schemas:
        # Convert database model to Pydantic model
        fields = []
        for field_dict in schema.schema_json.get("fields", []):
            fields.append(field_dict)
        
        result.append(Schema(
            id=schema.id,
            name=schema.name,
            description=schema.description,
            base_model=schema.base_model,
            aggregation_level=schema.aggregation_level,
            fields=fields,
            schema_json=schema.schema_json
        ))
    
    return result

@router.get("/{schema_id}", response_model=Schema)
def get_schema(schema_id: int, db: Session = Depends(get_db)):
    """Get a specific schema by ID"""
    schema = db.query(SchemaModel).filter(SchemaModel.id == schema_id).first()
    if schema is None:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    # Convert database model to Pydantic model
    fields = []
    for field_dict in schema.schema_json.get("fields", []):
        fields.append(field_dict)
    
    return Schema(
        id=schema.id,
        name=schema.name,
        description=schema.description,
        base_model=schema.base_model,
        aggregation_level=schema.aggregation_level,
        fields=fields,
        schema_json=schema.schema_json
    )

@router.post("/", response_model=Schema)
def create_schema(schema_create: SchemaCreate, db: Session = Depends(get_db)):
    """Create a new schema definition"""
    # Validate the base model exists
    model_class = get_model_class(schema_create.base_model)
    if model_class is None:
        raise HTTPException(status_code=400, detail=f"Base model '{schema_create.base_model}' not found")
    
    # Require aggregation level to be set
    if not schema_create.aggregation_level:
        raise HTTPException(status_code=400, detail="Aggregation level is required")
    
    # Validate source fields exist in the base model if specified
    model_fields = get_model_fields(schema_create.base_model)
    model_field_names = [f["name"] for f in model_fields]
    
    for field in schema_create.fields:
        if field.source_field and field.source_field not in model_field_names:
            raise HTTPException(
                status_code=400, 
                detail=f"Source field '{field.source_field}' not found in model '{schema_create.base_model}'"
            )
    
    # Convert the SchemaCreate to a JSON schema
    schema_json = {
        "name": schema_create.name,
        "description": schema_create.description,
        "base_model": schema_create.base_model,
        "aggregation_level": schema_create.aggregation_level,
        "fields": [field.dict() for field in schema_create.fields]
    }
    
    db_schema = SchemaModel(
        name=schema_create.name,
        description=schema_create.description,
        base_model=schema_create.base_model,
        aggregation_level=schema_create.aggregation_level,
        schema_json=schema_json
    )
    db.add(db_schema)
    db.commit()
    db.refresh(db_schema)
    
    # Create a valid Schema response object
    return Schema(
        id=db_schema.id,
        name=db_schema.name,
        description=db_schema.description,
        base_model=db_schema.base_model,
        aggregation_level=db_schema.aggregation_level,
fields=schema_create.fields,
        schema_json=db_schema.schema_json
    )

@router.put("/{schema_id}", response_model=Schema)
def update_schema(schema_id: int, schema_update: SchemaUpdate, db: Session = Depends(get_db)):
    """Update an existing schema"""
    db_schema = db.query(SchemaModel).filter(SchemaModel.id == schema_id).first()
    if db_schema is None:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    # Validate the base model exists
    model_class = get_model_class(schema_update.base_model)
    if model_class is None:
        raise HTTPException(status_code=400, detail=f"Base model '{schema_update.base_model}' not found")
    
    # Require aggregation level to be set
    if not schema_update.aggregation_level:
        raise HTTPException(status_code=400, detail="Aggregation level is required")
    
    # Validate source fields exist in the base model if specified
    model_fields = get_model_fields(schema_update.base_model)
    model_field_names = [f["name"] for f in model_fields]
    
    for field in schema_update.fields:
        if field.source_field and field.source_field not in model_field_names:
            raise HTTPException(
                status_code=400, 
                detail=f"Source field '{field.source_field}' not found in model '{schema_update.base_model}'"
            )
    
    # Convert the SchemaUpdate to a JSON schema
    schema_json = {
        "name": schema_update.name,
        "description": schema_update.description,
        "base_model": schema_update.base_model,
        "aggregation_level": schema_update.aggregation_level,
        "fields": [field.dict() for field in schema_update.fields]
    }
    
    db_schema.name = schema_update.name
    db_schema.description = schema_update.description
    db_schema.base_model = schema_update.base_model
    db_schema.aggregation_level = schema_update.aggregation_level
    db_schema.schema_json = schema_json
    
    db.commit()
    db.refresh(db_schema)
    
    # Create a valid Schema response object
    return Schema(
        id=db_schema.id,
        name=db_schema.name,
        description=db_schema.description,
        base_model=db_schema.base_model,
        aggregation_level=db_schema.aggregation_level,
        fields=schema_update.fields,
        schema_json=db_schema.schema_json
    )

@router.delete("/{schema_id}", response_model=bool)
def delete_schema(schema_id: int, db: Session = Depends(get_db)):
    """Delete a schema"""
    db_schema = db.query(SchemaModel).filter(SchemaModel.id == schema_id).first()
    if db_schema is None:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    # Check if any reports use this schema
    if hasattr(db_schema, "report_layouts") and len(db_schema.report_layouts) > 0:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete schema that is used by reports. Remove from reports first."
        )
    
    db.delete(db_schema)
    db.commit()
    return True

@router.get("/{schema_id}/pydantic-code", response_model=str)
def get_pydantic_code(schema_id: int, db: Session = Depends(get_db)):
    """Generate Pydantic model code for a schema"""
    db_schema = db.query(SchemaModel).filter(SchemaModel.id == schema_id).first()
    if db_schema is None:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    generator = PydanticSchemaGenerator(schema_json=db_schema.schema_json)
    return generator.generate_pydantic_code()

@router.get("/models/{model_id}/fields", response_model=List[dict])
def get_model_available_fields(model_id: str):
    """Get available fields for a specific model"""
    fields = get_model_fields(model_id)
    if not fields:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found")
    return fields