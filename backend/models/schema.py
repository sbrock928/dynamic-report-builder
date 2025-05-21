# backend/models/schema.py (updated)
from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from database import Base

class SchemaModel(Base):
    __tablename__ = "schemas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str] = mapped_column(String, nullable=True)
    base_model: Mapped[str] = mapped_column(String, index=True)
    aggregation_level: Mapped[str] = mapped_column(String, index=True)  # Add this field
    schema_json: Mapped[dict] = mapped_column(JSON)