from pydantic import BaseModel
from typing import Dict, List, Optional, Any, Union, Literal

# Define aggregation levels
AggregationLevel = Literal["deal", "group", "tranche"]

class ReportLayoutBase(BaseModel):
    name: str
    description: Optional[str] = None
    primary_model: str
    aggregation_level: AggregationLevel
    udf_ids: List[int]  # Renamed from schema_ids
    layout_json: Dict[str, Any]

class ReportLayoutCreate(ReportLayoutBase):
    pass

class ReportLayoutUpdate(ReportLayoutBase):
    pass

class ReportLayout(ReportLayoutBase):
    id: int
    
    class Config:
        from_attributes = True

class ReportDataRequest(BaseModel):
    report_id: int
    cycle_code: str
    filters: Optional[Dict[str, Any]] = None

class ReportDataResponse(BaseModel):
    report_name: str
    cycle_code: str
    data: List[Dict[str, Any]]

class ReportFilter(BaseModel):
    field: str
    operator: str  # eq, ne, gt, gte, lt, lte, in, contains
    value: Any

class ReportDataRequestWithFilters(ReportDataRequest):
    filters: Optional[List[ReportFilter]] = None