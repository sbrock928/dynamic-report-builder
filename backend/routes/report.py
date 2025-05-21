from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import random

from database import get_db
from schemas.report import ReportLayout, ReportLayoutCreate, ReportLayoutUpdate, ReportDataRequest, ReportDataResponse
from models.report import ReportLayout as ReportLayoutModel
from models.schema import SchemaModel

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/cycles", response_model=List[str])
def get_cycle_codes():
    # For this example, we'll return predefined cycle codes
    return ["12023", "12022", "12201"]

@router.get("/", response_model=List[ReportLayout])
def get_report_layouts(db: Session = Depends(get_db)):
    layouts = db.query(ReportLayoutModel).all()
    return layouts

@router.get("/{report_id}", response_model=ReportLayout)
def get_report_layout(report_id: int, db: Session = Depends(get_db)):
    layout = db.query(ReportLayoutModel).filter(ReportLayoutModel.id == report_id).first()
    if layout is None:
        raise HTTPException(status_code=404, detail="Report layout not found")
    return layout

@router.post("/", response_model=ReportLayout)
def create_report_layout(layout_create: ReportLayoutCreate, db: Session = Depends(get_db)):
    # Check if schema exists
    schema = db.query(SchemaModel).filter(SchemaModel.id == layout_create.schema_id).first()
    if schema is None:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    db_layout = ReportLayoutModel(
        name=layout_create.name,
        description=layout_create.description,
        schema_id=layout_create.schema_id,
        layout_json=layout_create.layout_json
    )
    db.add(db_layout)
    db.commit()
    db.refresh(db_layout)
    return db_layout

@router.put("/{report_id}", response_model=ReportLayout)
def update_report_layout(report_id: int, layout_update: ReportLayoutUpdate, db: Session = Depends(get_db)):
    # Check if schema exists
    schema = db.query(SchemaModel).filter(SchemaModel.id == layout_update.schema_id).first()
    if schema is None:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    db_layout = db.query(ReportLayoutModel).filter(ReportLayoutModel.id == report_id).first()
    if db_layout is None:
        raise HTTPException(status_code=404, detail="Report layout not found")
    
    db_layout.name = layout_update.name
    db_layout.description = layout_update.description
    db_layout.schema_id = layout_update.schema_id
    db_layout.layout_json = layout_update.layout_json
    
    db.commit()
    db.refresh(db_layout)
    return db_layout

@router.delete("/{report_id}", response_model=bool)
def delete_report_layout(report_id: int, db: Session = Depends(get_db)):
    db_layout = db.query(ReportLayoutModel).filter(ReportLayoutModel.id == report_id).first()
    if db_layout is None:
        raise HTTPException(status_code=404, detail="Report layout not found")
    
    db.delete(db_layout)
    db.commit()
    return True

@router.post("/run", response_model=ReportDataResponse)
def run_report(request: ReportDataRequest, db: Session = Depends(get_db)):
    # Get the report layout
    report_layout = db.query(ReportLayoutModel).filter(ReportLayoutModel.id == request.report_id).first()
    if report_layout is None:
        raise HTTPException(status_code=404, detail="Report layout not found")
    
    # Get the schema
    schema = db.query(SchemaModel).filter(SchemaModel.id == report_layout.schema_id).first()
    if schema is None:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    # In a real application, you would fetch actual data based on the schema and cycle code
    # For this example, we'll generate some random data based on the schema fields
    fields = schema.schema_json.get("fields", [])
    
    # Generate 10 random data rows for demonstration
    data = []
    for _ in range(10):
        row = {}
        for field in fields:
            field_name = field["name"]
            field_type = field["type"]
            
            if field_type == "string":
                row[field_name] = f"Sample {field_name} for {request.cycle_code}"
            elif field_type == "integer":
                row[field_name] = random.randint(1, 1000)
            elif field_type == "number":
                row[field_name] = round(random.uniform(1.0, 1000.0), 2)
            elif field_type == "boolean":
                row[field_name] = random.choice([True, False])
            else:
                row[field_name] = None
        
        data.append(row)
    
    return ReportDataResponse(
        report_name=report_layout.name,
        cycle_code=request.cycle_code,
        data=data
    )

