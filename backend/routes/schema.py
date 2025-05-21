from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas.schema import Schema, SchemaCreate, SchemaUpdate, PydanticSchemaGenerator
from models.schema import SchemaModel

router = APIRouter(prefix="/schemas", tags=["schemas"])

@router.get("/", response_model=List[Schema])
def get_schemas(db: Session = Depends(get_db)):
    schemas = db.query(SchemaModel).all()
    return [Schema.from_db_model(schema) for schema in schemas]

@router.get("/{schema_id}", response_model=Schema)
def get_schema(schema_id: int, db: Session = Depends(get_db)):
    schema = db.query(SchemaModel).filter(SchemaModel.id == schema_id).first()
    if schema is None:
        raise HTTPException(status_code=404, detail="Schema not found")
    return Schema.from_db_model(schema)

@router.post("/", response_model=Schema)
def create_schema(schema_create: SchemaCreate, db: Session = Depends(get_db)):
    # Convert the SchemaCreate to a JSON schema
    schema_json = {
        "name": schema_create.name,
        "description": schema_create.description,
        "fields": [field.dict() for field in schema_create.fields]
    }
    
    db_schema = SchemaModel(
        name=schema_create.name,
        description=schema_create.description,
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
        fields=schema_create.fields,  # Use the fields from the request
        schema_json=db_schema.schema_json
    )

@router.put("/{schema_id}", response_model=Schema)
def update_schema(schema_id: int, schema_update: SchemaUpdate, db: Session = Depends(get_db)):
    db_schema = db.query(SchemaModel).filter(SchemaModel.id == schema_id).first()
    if db_schema is None:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    # Convert the SchemaUpdate to a JSON schema
    schema_json = {
        "name": schema_update.name,
        "description": schema_update.description,
        "fields": [field.dict() for field in schema_update.fields]
    }
    
    db_schema.name = schema_update.name
    db_schema.description = schema_update.description
    db_schema.schema_json = schema_json
    
    db.commit()
    db.refresh(db_schema)
    
    # Create a valid Schema response object
    return Schema(
        id=db_schema.id,
        name=db_schema.name,
        description=db_schema.description,
        fields=schema_update.fields,  # Use the fields from the request
        schema_json=db_schema.schema_json
    )

@router.delete("/{schema_id}", response_model=bool)
def delete_schema(schema_id: int, db: Session = Depends(get_db)):
    db_schema = db.query(SchemaModel).filter(SchemaModel.id == schema_id).first()
    if db_schema is None:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    db.delete(db_schema)
    db.commit()
    return True

@router.get("/{schema_id}/pydantic-code", response_model=str)
def get_pydantic_code(schema_id: int, db: Session = Depends(get_db)):
    db_schema = db.query(SchemaModel).filter(SchemaModel.id == schema_id).first()
    if db_schema is None:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    generator = PydanticSchemaGenerator(schema_json=db_schema.schema_json)
    return generator.generate_pydantic_code()