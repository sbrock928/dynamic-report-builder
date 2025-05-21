# backend/models/report.py
from sqlalchemy import Column, Integer, String, JSON, ForeignKey, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from common.database import Base
from udf.models import UDFModel  # Updated import

# Junction table for many-to-many relationship between reports and UDFs
report_udfs = Table(  # Renamed from report_schemas
    "report_udfs",  # Renamed from report_schemas
    Base.metadata,
    Column("report_id", Integer, ForeignKey("report_layouts.id")),
    Column("udf_id", Integer, ForeignKey("udfs.id")),  # Updated foreign key
)


class ReportLayout(Base):
    __tablename__ = "report_layouts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str] = mapped_column(String, nullable=True)
    primary_model: Mapped[str] = mapped_column(String, index=True)
    aggregation_level: Mapped[str] = mapped_column(String, index=True)
    layout_json: Mapped[dict] = mapped_column(JSON)

    # Many-to-many relationship with UDFs
    udfs = relationship(
        "UDFModel", secondary=report_udfs, backref="report_layouts"
    )  # Renamed
