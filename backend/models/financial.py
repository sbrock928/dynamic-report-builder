# backend/models/financial.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime

from database import Base

class Deal(Base):
    __tablename__ = "deals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    deal_name: Mapped[str] = mapped_column(String, index=True)
    issuer: Mapped[str] = mapped_column(String, index=True)
    deal_date: Mapped[datetime] = mapped_column(DateTime)
    total_amount: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String)

    # Relationship to tranches
    tranches = relationship("Tranche", back_populates="deal")

class Tranche(Base):
    __tablename__ = "tranches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    deal_id: Mapped[int] = mapped_column(ForeignKey("deals.id"))
    tranche_name: Mapped[str] = mapped_column(String)
    amount: Mapped[float] = mapped_column(Float)
    interest_rate: Mapped[float] = mapped_column(Float)
    maturity_date: Mapped[datetime] = mapped_column(DateTime)
    seniority: Mapped[str] = mapped_column(String)

    # Relationship to deal
    deal = relationship("Deal", back_populates="tranches")
    
    # Relationship to cashflows
    cashflows = relationship("CashFlow", back_populates="tranche")

class CashFlow(Base):
    __tablename__ = "cashflows"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    tranche_id: Mapped[int] = mapped_column(ForeignKey("tranches.id"))
    payment_date: Mapped[datetime] = mapped_column(DateTime)
    principal: Mapped[float] = mapped_column(Float)
    interest: Mapped[float] = mapped_column(Float)
    fees: Mapped[float] = mapped_column(Float)
    
    # Relationship to tranche
    tranche = relationship("Tranche", back_populates="cashflows")