from sqlalchemy import Column, Integer, String, JSON
from sqlalchemy.orm import Mapped, mapped_column

from database import Base

class SchemaModel(Base):
    __tablename__ = "schemas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str] = mapped_column(String, nullable=True)
    schema_json: Mapped[dict] = mapped_column(JSON)