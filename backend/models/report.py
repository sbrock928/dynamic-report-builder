# backend/models/report.py (updated)
from sqlalchemy import Column, Integer, String, JSON, ForeignKey, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

# Junction table for many-to-many relationship between reports and schemas
report_schemas = Table(
    "report_schemas",
    Base.metadata,
    Column("report_id", Integer, ForeignKey("report_layouts.id")),
    Column("schema_id", Integer, ForeignKey("schemas.id"))
)

class ReportLayout(Base):
    __tablename__ = "report_layouts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str] = mapped_column(String, nullable=True)
    primary_model: Mapped[str] = mapped_column(String, index=True)
    aggregation_level: Mapped[str] = mapped_column(String, index=True)  # Add this field
    layout_json: Mapped[dict] = mapped_column(JSON)

    # Many-to-many relationship with schemas
    schemas = relationship("SchemaModel", secondary=report_schemas, backref="report_layouts")
