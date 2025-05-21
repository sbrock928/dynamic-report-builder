from sqlalchemy import Column, Integer, String, JSON
from sqlalchemy.orm import Mapped, mapped_column

from common.database import Base


class UDFModel(Base):
    __tablename__ = "udfs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str] = mapped_column(String, nullable=True)
    base_model: Mapped[str] = mapped_column(String, index=True)
    aggregation_level: Mapped[str] = mapped_column(String, index=True)
    # Changed from schema_json to udf_json to match existing database schema
    udf_json: Mapped[dict] = mapped_column(JSON)
