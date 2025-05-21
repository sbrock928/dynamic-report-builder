from pydantic import BaseModel
from typing import Dict, List, Optional, Any, Union

class ReportLayoutBase(BaseModel):
    name: str
    description: Optional[str] = None
    schema_id: int
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

class ReportDataResponse(BaseModel):
    report_name: str
    cycle_code: str
    data: List[Dict[str, Any]]