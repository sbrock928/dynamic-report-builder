# backend/models/udf.py
from sqlalchemy import Column, Integer, String, JSON
from sqlalchemy.orm import Mapped, mapped_column

from database import Base

class UDFModel(Base):  # Renamed from SchemaModel
    __tablename__ = "udfs"  # Renamed from "schemas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str] = mapped_column(String, nullable=True)
    base_model: Mapped[str] = mapped_column(String, index=True)
    aggregation_level: Mapped[str] = mapped_column(String, index=True)
    udf_json: Mapped[dict] = mapped_column(JSON) 