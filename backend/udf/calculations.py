from typing import Dict, Any, Callable, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text, func
import logging

logger = logging.getLogger(__name__)

# Type definitions
CalculationFunction = Callable[[Session, Any, str, str, Dict[str, Any], str], Any]

# Registry of calculation functions by type and aggregation level
CALCULATIONS = {}

# Registry to store calculation metadata (for frontend display)
CALCULATION_METADATA = {}

def register_calculation(calculation_type: str, display_name: str, 
                         description: str, aggregation_level: str = None,
                         param_definitions: List[Dict[str, Any]] = None):
    """
    Decorator to register a calculation function with metadata
    
    Args:
        calculation_type: Internal name of the calculation
        display_name: User-friendly name for the calculation
        description: Description of what the calculation does
        aggregation_level: Which level this calculation applies to (deal, group, tranche, or None for all)
        param_definitions: List of parameter definitions for the frontend
    """
    def decorator(func: CalculationFunction):
        key = (calculation_type, aggregation_level)
        CALCULATIONS[key] = func
        
        # Store metadata for frontend display
        CALCULATION_METADATA[key] = {
            "type": calculation_type,
            "level": aggregation_level,
            "display_name": display_name,
            "description": description,
            "params": param_definitions or []
        }
        return func
    return decorator

def get_calculation_function(calculation_type: str, aggregation_level: str = None):
    """Get calculation function by type and level"""
    # Try to get a specific function for this level
    key = (calculation_type, aggregation_level)
    func = CALCULATIONS.get(key)
    
    if func:
        return func
    
    # Try to get a general function (works for any level)
    key = (calculation_type, None)
    return CALCULATIONS.get(key)

def get_available_calculations(aggregation_level: str = None) -> List[Dict[str, Any]]:
    """
    Get available calculations for a specific aggregation level
    
    Returns a list of calculation metadata objects for the frontend
    """
    calculations = []
    
    # Get calculations specific to this level
    for (calc_type, level), metadata in CALCULATION_METADATA.items():
        if level == aggregation_level or level is None:
            calculations.append(metadata)
            
    return calculations

# -- Define standard calculations --

@register_calculation(
    calculation_type="sum",
    display_name="Sum",
    description="Calculates the sum of related values",
    aggregation_level="deal",
    param_definitions=[
        {
            "name": "related_model",
            "display_name": "Related Model",
            "type": "select",
            "options": ["tranche", "cashflow"],
            "default": "tranche",
            "required": True
        },
        {
            "name": "field_to_sum",
            "display_name": "Field to Sum",
            "type": "string",
            "default": "amount",
            "required": True
        }
    ]
)
def sum_calculation(db: Session, base_record: Any, base_model: str, source_field: str, 
                   params: Dict[str, Any], cycle_code: str) -> float:
    """Sum calculation for deal level"""
    import logging
    logger = logging.getLogger(__name__)
    
    related_model = params.get("related_model", "tranche")
    field_to_sum = params.get("field_to_sum", "amount")
    
    # Get the model class dynamically
    from common.model_registry import get_model_class
    related_class = get_model_class(related_model)
    
    if not related_class:
        logger.error(f"Related model {related_model} not found")
        return 0
        
    try:
        # Build the query based on the relationship
        relationship_field = f"{base_model}_id"
        logger.info(f"Looking for relationship field: {relationship_field}")
        
        if not hasattr(related_class, relationship_field):
            # Try alternative field naming patterns
            possible_fields = [
                f"{base_model}_id",
                f"{base_model.lower()}_id",
                "id_" + base_model,
                "id_" + base_model.lower()
            ]
            
            for field in possible_fields:
                if hasattr(related_class, field):
                    relationship_field = field
                    logger.info(f"Found relationship field: {field}")
                    break
            else:
                logger.error(f"No relationship field found between {base_model} and {related_model}")
                return 0
            
        base_id = getattr(base_record, "id", None)
        if not base_id:
            logger.error(f"Base record has no 'id' field")
            return 0
            
        # Check if the field exists
        logger.info(f"Looking for field to sum: {field_to_sum}")
        if not hasattr(related_class, field_to_sum):
            logger.error(f"Field {field_to_sum} not found on {related_model}")
            # Try to find similar field names
            similar_fields = [attr for attr in dir(related_class) 
                             if not attr.startswith('_') and 
                             (field_to_sum.lower() in attr.lower() or 
                              attr.lower().endswith(field_to_sum.lower()))]
            
            if similar_fields:
                field_to_sum = similar_fields[0]
                logger.info(f"Using similar field instead: {field_to_sum}")
            else:
                return 0
            
        # Build query to sum values
        filter_attr = getattr(related_class, relationship_field)
        sum_attr = getattr(related_class, field_to_sum)
        
        # Add cycle filtering if needed
        query = db.query(func.sum(sum_attr)).filter(filter_attr == base_id)
        if hasattr(related_class, "cycle_code") and cycle_code:
            query = query.filter(related_class.cycle_code == cycle_code)
            
        logger.info(f"Executing query: {str(query)}")
        result = query.scalar()
        logger.info(f"Sum calculation result: {result}")
        return result or 0
        
    except Exception as e:
        logger.exception(f"Error in sum calculation: {str(e)}")
        return 0

@register_calculation(
    calculation_type="average",
    display_name="Average",
    description="Calculates the average of related values",
    aggregation_level="deal",
    param_definitions=[
        {
            "name": "related_model",
            "display_name": "Related Model",
            "type": "select",
            "options": ["tranche", "cashflow"],
            "default": "tranche",
            "required": True
        },
        {
            "name": "field_to_average",
            "display_name": "Field to Average",
            "type": "string",
            "default": "amount",
            "required": True
        }
    ]
)
def average_calculation(db: Session, base_record: Any, base_model: str, source_field: str, 
                      params: Dict[str, Any], cycle_code: str) -> float:
    """Average calculation for deal level"""
    import logging
    logger = logging.getLogger(__name__)
    
    related_model = params.get("related_model", "tranche")
    field_to_average = params.get("field_to_average", "amount")
    
    # Get the model class dynamically
    from common.model_registry import get_model_class
    related_class = get_model_class(related_model)
    
    if not related_class:
        logger.error(f"Related model {related_model} not found")
        return 0
        
    try:
        # Build the query based on the relationship
        relationship_field = f"{base_model}_id"
        logger.info(f"Looking for relationship field: {relationship_field}")
        
        if not hasattr(related_class, relationship_field):
            # Try alternative field naming patterns
            possible_fields = [
                f"{base_model}_id",
                f"{base_model.lower()}_id",
                "id_" + base_model,
                "id_" + base_model.lower()
            ]
            
            for field in possible_fields:
                if hasattr(related_class, field):
                    relationship_field = field
                    logger.info(f"Found relationship field: {field}")
                    break
            else:
                logger.error(f"No relationship field found between {base_model} and {related_model}")
                return 0
            
        base_id = getattr(base_record, "id", None)
        if not base_id:
            logger.error(f"Base record has no 'id' field")
            return 0
            
        # Check if the field exists
        logger.info(f"Looking for field to average: {field_to_average}")
        if not hasattr(related_class, field_to_average):
            logger.error(f"Field {field_to_average} not found on {related_model}")
            # Try to find similar field names
            similar_fields = [attr for attr in dir(related_class) 
                             if not attr.startswith('_') and 
                             (field_to_average.lower() in attr.lower() or 
                              attr.lower().endswith(field_to_average.lower()))]
            
            if similar_fields:
                field_to_average = similar_fields[0]
                logger.info(f"Using similar field instead: {field_to_average}")
            else:
                return 0
            
        # Build query to average values
        filter_attr = getattr(related_class, relationship_field)
        avg_attr = getattr(related_class, field_to_average)
        
        # Add cycle filtering if needed
        query = db.query(func.avg(avg_attr)).filter(filter_attr == base_id)
        if hasattr(related_class, "cycle_code") and cycle_code:
            query = query.filter(related_class.cycle_code == cycle_code)
            
        logger.info(f"Executing query: {str(query)}")
        result = query.scalar()
        logger.info(f"Average calculation result: {result}")
        return result or 0
        
    except Exception as e:
        logger.exception(f"Error in average calculation: {str(e)}")
        return 0

@register_calculation(
    calculation_type="count",
    display_name="Count",
    description="Counts the number of related records",
    aggregation_level="group",
    param_definitions=[
        {
            "name": "related_model",
            "display_name": "Related Model",
            "type": "select",
            "options": ["deal", "tranche", "cashflow"],
            "default": "deal",
            "required": True
        }
    ]
)
def count_calculation(db: Session, base_record: Any, base_model: str, source_field: str, 
                    params: Dict[str, Any], cycle_code: str) -> int:
    """Count calculation for group level"""
    import logging
    logger = logging.getLogger(__name__)
    
    related_model = params.get("related_model", "deal")
    
    # Get the model class dynamically
    from common.model_registry import get_model_class
    related_class = get_model_class(related_model)
    
    if not related_class:
        logger.error(f"Related model {related_model} not found")
        return 0
        
    try:
        # Build the query based on the relationship
        relationship_field = f"{base_model}_id"
        logger.info(f"Looking for relationship field: {relationship_field}")
        
        if not hasattr(related_class, relationship_field):
            # Try alternative field naming patterns
            possible_fields = [
                f"{base_model}_id",
                f"{base_model.lower()}_id",
                "id_" + base_model,
                "id_" + base_model.lower()
            ]
            
            for field in possible_fields:
                if hasattr(related_class, field):
                    relationship_field = field
                    logger.info(f"Found relationship field: {field}")
                    break
            else:
                logger.error(f"No relationship field found between {base_model} and {related_model}")
                return 0
            
        base_id = getattr(base_record, "id", None)
        if not base_id:
            logger.error(f"Base record has no 'id' field")
            return 0
            
        # Build query to count records
        filter_attr = getattr(related_class, relationship_field)
        
        # Add cycle filtering if needed
        query = db.query(func.count()).filter(filter_attr == base_id)
        if hasattr(related_class, "cycle_code") and cycle_code:
            query = query.filter(related_class.cycle_code == cycle_code)
            
        logger.info(f"Executing query: {str(query)}")
        result = query.scalar()
        logger.info(f"Count calculation result: {result}")
        return result or 0
        
    except Exception as e:
        logger.exception(f"Error in count calculation: {str(e)}")
        return 0

@register_calculation(
    calculation_type="min",
    display_name="Minimum",
    description="Calculates the minimum value of related fields",
    aggregation_level="tranche",
    param_definitions=[
        {
            "name": "field_to_min",
            "display_name": "Field to Find Minimum",
            "type": "string",
            "default": "amount",
            "required": True
        }
    ]
)
def min_calculation(db: Session, base_record: Any, base_model: str, source_field: str, 
                  params: Dict[str, Any], cycle_code: str) -> float:
    """Minimum calculation for tranche level"""
    import logging
    logger = logging.getLogger(__name__)
    
    field_to_min = params.get("field_to_min", source_field) or source_field
    
    logger.info(f"Min calculation on field: {field_to_min}")
    
    if not field_to_min or not hasattr(base_record, field_to_min):
        logger.error(f"Field {field_to_min} not found on {base_model}")
        
        # Try to find similar field names
        similar_fields = [attr for attr in dir(base_record) 
                         if not attr.startswith('_') and 
                         (field_to_min.lower() in attr.lower() or 
                          attr.lower().endswith(field_to_min.lower()))]
        
        if similar_fields:
            field_to_min = similar_fields[0]
            logger.info(f"Using similar field instead: {field_to_min}")
        else:
            return 0
    
    result = getattr(base_record, field_to_min, 0)
    logger.info(f"Min calculation result: {result}")
    return result

@register_calculation(
    calculation_type="max",
    display_name="Maximum",
    description="Calculates the maximum value of related fields",
    aggregation_level="tranche",
    param_definitions=[
        {
            "name": "field_to_max",
            "display_name": "Field to Find Maximum",
            "type": "string",
            "default": "amount",
            "required": True
        }
    ]
)
def max_calculation(db: Session, base_record: Any, base_model: str, source_field: str, 
                  params: Dict[str, Any], cycle_code: str) -> float:
    """Maximum calculation for tranche level"""
    import logging
    logger = logging.getLogger(__name__)
    
    field_to_max = params.get("field_to_max", source_field) or source_field
    
    logger.info(f"Max calculation on field: {field_to_max}")
    
    if not field_to_max or not hasattr(base_record, field_to_max):
        logger.error(f"Field {field_to_max} not found on {base_model}")
        
        # Try to find similar field names
        similar_fields = [attr for attr in dir(base_record) 
                         if not attr.startswith('_') and 
                         (field_to_max.lower() in attr.lower() or 
                          attr.lower().endswith(field_to_max.lower()))]
        
        if similar_fields:
            field_to_max = similar_fields[0]
            logger.info(f"Using similar field instead: {field_to_max}")
        else:
            return 0
    
    result = getattr(base_record, field_to_max, 0)
    logger.info(f"Max calculation result: {result}")
    return result

@register_calculation(
    calculation_type="custom",
    display_name="Custom Formula",
    description="Executes a custom SQL formula for advanced calculations",
    aggregation_level=None,  # Works for any level
    param_definitions=[
        {
            "name": "formula",
            "display_name": "SQL Formula",
            "type": "text",
            "required": True,
            "description": "SQL formula to calculate the value. Can reference field names directly."
        }
    ]
)
def custom_calculation(db: Session, base_record: Any, base_model: str, source_field: str, 
                      params: Dict[str, Any], cycle_code: str) -> Any:
    """Execute a custom calculation using the provided formula"""
    formula = params.get("formula")
    if not formula:
        return 0
        
    # Extract variables from base_record to use in formula
    variables = {}
    if hasattr(base_record, "__table__"):
        for column in base_record.__table__.columns:
            variables[column.name] = getattr(base_record, column.name, None)
    
    try:
        # Using SQLAlchemy parameterized queries for security
        sql = text(f"SELECT ({formula}) as result")
        # Bind variables to the query
        for name, value in variables.items():
            sql = sql.bindparams(**{name: value})
            
        result = db.execute(sql).fetchone()
        if result:
            return result[0]
    except Exception as e:
        logger.exception(f"Error executing custom calculation: {str(e)}")
        
    return 0

@register_calculation(
    calculation_type="mapping",
    display_name="Static Mapping",
    description="Maps values from any model/field or uses a static value",
    aggregation_level=None,  # Works for any level
    param_definitions=[
        {
            "name": "mapping_type",
            "display_name": "Mapping Type",
            "type": "select",
            "options": ["static", "model_field"],
            "default": "static",
            "description": "Choose static for a fixed value or model_field to map from another database table",
            "required": True
        },
        {
            "name": "mapping_value",
            "display_name": "Static Value",
            "type": "string",
            "description": "The static value to store when using static mapping type",
            "required": False
        },
        {
            "name": "source_model",
            "display_name": "Source Model",
            "type": "string",
            "description": "Model to fetch the mapped value from when using model_field mapping type",
            "required": False
        },
        {
            "name": "source_field",
            "display_name": "Source Field",
            "type": "string",
            "description": "Field to fetch the mapped value from when using model_field mapping type",
            "required": False
        },
        {
            "name": "relation_field",
            "display_name": "Relation Field",
            "type": "string",
            "description": "Field in the source model that links to the current record (e.g., 'tranche_id')",
            "required": False
        }
    ]
)
def mapping_calculation(db: Session, base_record: Any, base_model: str, source_field: str, 
                      params: Dict[str, Any], cycle_code: str) -> Any:
    """Returns a static mapped value or a value from another model/field"""
    import logging
    logger = logging.getLogger(__name__)
    
    mapping_type = params.get("mapping_type", "static")
    
    # Static mapping - simply return the provided value
    if mapping_type == "static":
        mapping_value = params.get("mapping_value", "")
        logger.info(f"Static mapping returning value: {mapping_value}")
        return mapping_value
    
    # Model field mapping - fetch value from another model
    elif mapping_type == "model_field":
        source_model = params.get("source_model")
        source_field = params.get("source_field")
        relation_field = params.get("relation_field")
        
        if not source_model or not source_field or not relation_field:
            logger.error("Missing required parameters for model field mapping")
            return None
        
        # Get the model class dynamically
        from common.model_registry import get_model_class
        source_class = get_model_class(source_model)
        
        if not source_class:
            logger.error(f"Source model {source_model} not found")
            return None
        
        try:
            # Check if relation field exists in source model
            if not hasattr(source_class, relation_field):
                logger.error(f"Relation field {relation_field} not found on {source_model}")
                return None
            
            # Get base record ID
            base_id = getattr(base_record, "id", None)
            if not base_id:
                logger.error(f"Base record has no 'id' field")
                return None
            
            # Check if source field exists
            if not hasattr(source_class, source_field):
                logger.error(f"Source field {source_field} not found on {source_model}")
                return None
            
            # Query the related record
            relation_attr = getattr(source_class, relation_field)
            query = db.query(source_class).filter(relation_attr == base_id)
            
            # Add cycle code filtering if relevant
            if hasattr(source_class, "cycle_code") and cycle_code:
                query = query.filter(source_class.cycle_code == cycle_code)
            
            # Get the first matching record
            source_record = query.first()
            
            if not source_record:
                logger.warning(f"No related {source_model} record found for {base_model} id {base_id}")
                return None
            
            # Get the value from the source field
            result = getattr(source_record, source_field, None)
            logger.info(f"Model field mapping result: {result} from {source_model}.{source_field}")
            return result
            
        except Exception as e:
            logger.exception(f"Error in model field mapping: {str(e)}")
            return None
    
    # Fallback
    logger.warning(f"Unknown mapping type: {mapping_type}")
    return None