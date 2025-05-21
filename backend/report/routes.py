from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import random
from sqlalchemy import text

from common.database import get_db
from report.schemas import (
    ReportLayout,
    ReportLayoutCreate,
    ReportLayoutUpdate,
    ReportDataRequest,
    ReportDataResponse,
)
from report.models import ReportLayout as ReportLayoutModel
from udf.models import UDFModel
from common.model_registry import get_model_class, get_model_fields

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/cycles", response_model=List[str])
def get_cycle_codes():
    """Get available cycle codes for reports"""
    # For this example, we'll return predefined cycle codes
    # In a real system, these would typically come from a database
    return ["12023", "12022", "12201"]


@router.get("/", response_model=List[ReportLayout])
def get_report_layouts(db: Session = Depends(get_db)):
    """Get all report layouts"""
    layouts = db.query(ReportLayoutModel).all()

    result = []
    for layout in layouts:
        # Convert to Pydantic model with udf_ids
        udf_ids = [udf.id for udf in layout.udfs]  # Updated from schemas to udfs

        result.append(
            ReportLayout(
                id=layout.id,
                name=layout.name,
                description=layout.description,
                primary_model=layout.primary_model,
                aggregation_level=layout.aggregation_level,
                udf_ids=udf_ids,  # Updated from schema_ids to udf_ids
                layout_json=layout.layout_json,
            )
        )

    return result


@router.get("/{report_id}", response_model=ReportLayout)
def get_report_layout(report_id: int, db: Session = Depends(get_db)):
    """Get a specific report layout by ID"""
    layout = (
        db.query(ReportLayoutModel).filter(ReportLayoutModel.id == report_id).first()
    )
    if layout is None:
        raise HTTPException(status_code=404, detail="Report layout not found")

    # Convert to Pydantic model with udf_ids
    udf_ids = [udf.id for udf in layout.udfs]  # Updated from schemas to udfs

    return ReportLayout(
        id=layout.id,
        name=layout.name,
        description=layout.description,
        primary_model=layout.primary_model,
        aggregation_level=layout.aggregation_level,
        udf_ids=udf_ids,  # Updated from schema_ids to udf_ids
        layout_json=layout.layout_json,
    )


@router.post("/", response_model=ReportLayout)
def create_report_layout(
    layout_create: ReportLayoutCreate, db: Session = Depends(get_db)
):
    """Create a new report layout"""
    # Validate primary model exists
    primary_model_class = get_model_class(layout_create.primary_model)
    if primary_model_class is None:
        raise HTTPException(
            status_code=400,
            detail=f"Primary model '{layout_create.primary_model}' not found",
        )

    # Require aggregation level
    if not layout_create.aggregation_level:
        raise HTTPException(status_code=400, detail="Aggregation level is required")

    # Check if UDFs exist and are compatible with the aggregation level
    udfs = []  # Updated from schemas to udfs
    for udf_id in layout_create.udf_ids:  # Updated from schema_ids to udf_ids
        udf = (
            db.query(UDFModel).filter(UDFModel.id == udf_id).first()
        )  # Updated from SchemaModel to UDFModel
        if udf is None:
            raise HTTPException(
                status_code=404, detail=f"UDF with ID {udf_id} not found"
            )

        # Ensure UDF aggregation level matches report aggregation level
        if udf.aggregation_level != layout_create.aggregation_level:
            raise HTTPException(
                status_code=400,
                detail=f"UDF with ID {udf_id} has aggregation level '{udf.aggregation_level}' which is incompatible with report aggregation level '{layout_create.aggregation_level}'",
            )

        udfs.append(udf)

    # Create the report layout
    db_layout = ReportLayoutModel(
        name=layout_create.name,
        description=layout_create.description,
        primary_model=layout_create.primary_model,
        aggregation_level=layout_create.aggregation_level,
        layout_json=layout_create.layout_json,
    )

    # Add UDFs to the report
    for udf in udfs:  # Updated from schemas to udfs
        db_layout.udfs.append(udf)  # Updated from schemas to udfs

    db.add(db_layout)
    db.commit()
    db.refresh(db_layout)

    # Convert to Pydantic model with udf_ids
    udf_ids = [udf.id for udf in db_layout.udfs]  # Updated from schemas to udfs

    return ReportLayout(
        id=db_layout.id,
        name=db_layout.name,
        description=db_layout.description,
        primary_model=db_layout.primary_model,
        aggregation_level=db_layout.aggregation_level,
        udf_ids=udf_ids,  # Updated from schema_ids to udf_ids
        layout_json=db_layout.layout_json,
    )


@router.put("/{report_id}", response_model=ReportLayout)
def update_report_layout(
    report_id: int, layout_update: ReportLayoutUpdate, db: Session = Depends(get_db)
):
    """Update an existing report layout"""
    # Check if report exists
    db_layout = (
        db.query(ReportLayoutModel).filter(ReportLayoutModel.id == report_id).first()
    )
    if db_layout is None:
        raise HTTPException(status_code=404, detail="Report layout not found")

    # Validate primary model exists
    primary_model_class = get_model_class(layout_update.primary_model)
    if primary_model_class is None:
        raise HTTPException(
            status_code=400,
            detail=f"Primary model '{layout_update.primary_model}' not found",
        )

    # Require aggregation level
    if not layout_update.aggregation_level:
        raise HTTPException(status_code=400, detail="Aggregation level is required")

    # Check if UDFs exist and are compatible with the aggregation level
    udfs = []  # Updated from schemas to udfs
    for udf_id in layout_update.udf_ids:  # Updated from schema_ids to udf_ids
        udf = (
            db.query(UDFModel).filter(UDFModel.id == udf_id).first()
        )  # Updated from SchemaModel to UDFModel
        if udf is None:
            raise HTTPException(
                status_code=404, detail=f"UDF with ID {udf_id} not found"
            )

        # Ensure UDF aggregation level matches report aggregation level
        if udf.aggregation_level != layout_update.aggregation_level:
            raise HTTPException(
                status_code=400,
                detail=f"UDF with ID {udf_id} has aggregation level '{udf.aggregation_level}' which is incompatible with report aggregation level '{layout_update.aggregation_level}'",
            )

        udfs.append(udf)

    # Update the report layout
    db_layout.name = layout_update.name
    db_layout.description = layout_update.description
    db_layout.primary_model = layout_update.primary_model
    db_layout.aggregation_level = layout_update.aggregation_level
    db_layout.layout_json = layout_update.layout_json

    # Clear existing UDFs and add updated ones
    db_layout.udfs = []  # Updated from schemas to udfs
    for udf in udfs:  # Updated from schemas to udfs
        db_layout.udfs.append(udf)  # Updated from schemas to udfs

    db.commit()
    db.refresh(db_layout)

    # Convert to Pydantic model with udf_ids
    udf_ids = [udf.id for udf in db_layout.udfs]  # Updated from schemas to udfs

    return ReportLayout(
        id=db_layout.id,
        name=db_layout.name,
        description=db_layout.description,
        primary_model=db_layout.primary_model,
        aggregation_level=db_layout.aggregation_level,
        udf_ids=udf_ids,  # Updated from schema_ids to udf_ids
        layout_json=db_layout.layout_json,
    )


@router.delete("/{report_id}", response_model=bool)
def delete_report_layout(report_id: int, db: Session = Depends(get_db)):
    """Delete a report layout"""
    db_layout = (
        db.query(ReportLayoutModel).filter(ReportLayoutModel.id == report_id).first()
    )
    if db_layout is None:
        raise HTTPException(status_code=404, detail="Report layout not found")

    db.delete(db_layout)
    db.commit()
    return True


@router.post("/run", response_model=ReportDataResponse)
def run_report(request: ReportDataRequest, db: Session = Depends(get_db)):
    """Run a report and return the calculated data"""
    import logging
    logger = logging.getLogger(__name__)
    
    # Get the report layout
    report_layout = (
        db.query(ReportLayoutModel)
        .filter(ReportLayoutModel.id == request.report_id)
        .first()
    )
    if report_layout is None:
        raise HTTPException(status_code=404, detail="Report layout not found")

    # Get the primary model class
    logger.info(f"Running report with primary model: {report_layout.primary_model}")
    primary_model_class = get_model_class(report_layout.primary_model)
    if primary_model_class is None:
        raise HTTPException(
            status_code=400,
            detail=f"Primary model '{report_layout.primary_model}' not found",
        )

    # Build the query for the primary model
    base_query = db.query(primary_model_class)

    # Apply filters if any
    if request.filters:
        # Implementation of filter logic
        for field, value in request.filters.items():
            if hasattr(primary_model_class, field):
                base_query = base_query.filter(
                    getattr(primary_model_class, field) == value
                )

    # Execute the base query
    base_results = base_query.all()
    logger.info(f"Found {len(base_results)} records for report")

    # Process results with UDFs from each UDF
    result_data = []
    for base_record in base_results:
        # Start with base record data
        record_data = {}

        # Add primary model fields to the record
        for column in primary_model_class.__table__.columns:
            record_data[column.name] = getattr(base_record, column.name)

        # Apply UDFs from each UDF
        for udf in report_layout.udfs:  # Updated from schemas to udfs
            logger.info(f"Processing UDF: {udf.name} (model: {udf.base_model}, level: {udf.aggregation_level})")
            fields = udf.udf_json.get("fields", [])
            
            for field in fields:
                field_name = field.get("name")
                # Check if this field should be included in the report
                layout_fields = report_layout.layout_json.get("fields", [])
                full_field_name = f"{udf.name}.{field_name}"
                
                if field_name in layout_fields or full_field_name in layout_fields:
                    logger.info(f"Calculating field: {field_name} (type: {field.get('calculation_type')})")
                    
                    # Calculate UDF value
                    udf_value = calculate_udf(
                        db,
                        base_record,
                        udf.base_model,
                        field.get("source_field"),
                        field.get("calculation_type"),
                        field.get("calculation_params", {}),
                        request.cycle_code,
                        udf.aggregation_level,
                    )
                    
                    logger.info(f"Calculated value for {field_name}: {udf_value}")

                    # Add to the record with UDF prefix to avoid field name conflicts
                    record_data[f"{udf.name}.{field_name}"] = udf_value

        result_data.append(record_data)

    return ReportDataResponse(
        report_name=report_layout.name, cycle_code=request.cycle_code, data=result_data
    )


def calculate_udf(
    db,
    base_record,
    base_model,
    source_field,
    calculation_type,
    params,
    cycle_code,
    aggregation_level,
):
    """
    Calculate a UDF value based on the calculation type and parameters.
    """
    # Import the calculation registry
    from udf.calculations import get_calculation_function
    import logging
    import traceback
    import random
    from sqlalchemy import text

    logger = logging.getLogger(__name__)
    
    # Log input parameters for debugging
    logger.info(f"UDF Calculation request - model: {base_model}, type: {calculation_type}, level: {aggregation_level}")
    logger.info(f"Params: {params}, source_field: {source_field}")
    
    # Get the appropriate calculation function from the registry
    calc_func = get_calculation_function(calculation_type, aggregation_level)
    
    if calc_func:
        try:
            # Execute the registered calculation
            logger.info(f"Using registered calculation function: {calc_func.__name__}")
            result = calc_func(db, base_record, base_model, source_field, params, cycle_code)
            logger.info(f"Calculation result: {result}")
            return result
        except Exception as e:
            # Log the error and stack trace
            logger.error(f"Error in calculation {calculation_type}: {str(e)}")
            logger.error(traceback.format_exc())
            return 0
    
    # If no registered calculation found, fall back to current approach for backward compatibility
    logger.warning(f"No registered calculation found for {calculation_type} at {aggregation_level} level, using fallback")
    
    # Different calculation logic based on aggregation level
    if aggregation_level == "deal":
        # Deal level calculations - one calculation per deal
        if calculation_type == "sum":
            # Example: Sum related values
            if base_model == "deal" and source_field == "total_amount":
                # Simulating sum of tranche amounts for a deal
                result = base_record.total_amount * random.uniform(0.9, 1.1)
                logger.info(f"Fallback sum calculation result: {result}")
                return result

        elif calculation_type == "average":
            # Example: Average related values
            if source_field:
                base_value = getattr(base_record, source_field, 0)
                result = base_value * random.uniform(0.4, 0.6)
                logger.info(f"Fallback average calculation result: {result}")
                return result

    elif aggregation_level == "group":
        # Group level calculations
        if calculation_type == "count":
            # Example: Count related records
            result = random.randint(3, 8)
            logger.info(f"Fallback count calculation result: {result}")
            return result

    elif aggregation_level == "tranche":
        # Tranche level calculations - multiple calculations per deal
        if calculation_type == "min":
            # Example: Minimum value
            if source_field:
                base_value = getattr(base_record, source_field, 0)
                result = base_value * random.uniform(0.7, 0.9)
                logger.info(f"Fallback min calculation result: {result}")
                return result

        elif calculation_type == "max":
            # Example: Maximum value
            if source_field:
                base_value = getattr(base_record, source_field, 0)
                result = base_value * random.uniform(1.1, 1.3)
                logger.info(f"Fallback max calculation result: {result}")
                return result

    # Custom calculations (for any level)
    if calculation_type == "custom":
        # Custom SQL calculation using the formula provided in params
        formula = params.get("formula")
        if formula:
            try:
                # In a real system, you'd parameterize this SQL to prevent injection
                sql = f"SELECT ({formula}) as result"
                logger.info(f"Executing custom SQL: {sql}")
                result = db.execute(text(sql)).fetchone()
                if result:
                    logger.info(f"Custom SQL result: {result[0]}")
                    return result[0]
            except Exception as e:
                # Log the error and return a default value
                logger.error(f"Error executing custom calculation: {str(e)}")
                logger.error(traceback.format_exc())

        # Default for custom calculation
        result = random.uniform(100, 1000)
        logger.info(f"Fallback custom calculation result: {result}")
        return result

    # Default fallback
    logger.warning("No calculation performed, returning 0")
    return 0


@router.get("/primary-models", response_model=List[Dict[str, Any]])
def get_primary_models():
    """Get available primary models for reports"""
    from common.model_registry import get_available_models

    return get_available_models()
