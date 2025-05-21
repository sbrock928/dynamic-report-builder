from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.schema import SchemaModel

class ReportLayout(Base):
    __tablename__ = "report_layouts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str] = mapped_column(String, nullable=True)
    schema_id: Mapped[int] = mapped_column(ForeignKey("schemas.id"))
    layout_json: Mapped[dict] = mapped_column(JSON)

    schema = relationship("SchemaModel", backref="report_layouts")