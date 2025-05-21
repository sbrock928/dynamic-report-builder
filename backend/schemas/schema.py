from pydantic import BaseModel
from typing import Dict, List, Optional, Any, Union, Literal
from enum import Enum

class CalculationType(str, Enum):
    SUM = "sum"
    AVERAGE = "average"
    COUNT = "count"
    MIN = "min"
    MAX = "max"
    CUSTOM = "custom"

class SchemaField(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    required: bool = False
    source_field: Optional[str] = None
    calculation_type: Optional[CalculationType] = None
    calculation_params: Optional[Dict[str, Any]] = None
    format: Optional[str] = None
    default: Optional[Any] = None
    enum_values: Optional[List[Any]] = None

class SchemaBase(BaseModel):
    name: str
    description: Optional[str] = None
    base_model: str
    aggregation_level: str
    fields: List[SchemaField]

class SchemaCreate(SchemaBase):
    pass

class SchemaUpdate(SchemaBase):
    pass

class Schema(SchemaBase):
    id: int
    schema_json: Dict[str, Any]

    class Config:
        from_attributes = True

class PydanticSchemaGenerator(BaseModel):
    schema_json: Dict[str, Any]
    
    def generate_pydantic_code(self) -> str:
        """Generate Pydantic model code from schema JSON"""
        code = "from pydantic import BaseModel\n"
        code += "from typing import Optional, List, Dict, Any\n\n"
        
        class_name = self.schema_json.get("name", "DynamicModel").replace(" ", "")
        
        code += f"class {class_name}(BaseModel):\n"
        
        for field in self.schema_json.get("fields", []):
            field_name = field["name"]
            field_type = field["type"]
            required = field.get("required", False)
            default = field.get("default")
            
            type_map = {
                "string": "str",
                "integer": "int",
                "number": "float",
                "boolean": "bool",
                "array": "List[Any]",
                "object": "Dict[str, Any]",
            }
            
            py_type = type_map.get(field_type, "Any")
            
            if not required:
                py_type = f"Optional[{py_type}]"
                if default is None:
                    code += f"    {field_name}: {py_type} = None\n"
                else:
                    code += f"    {field_name}: {py_type} = {repr(default)}\n"
            else:
                code += f"    {field_name}: {py_type}\n"
        
        return code