from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from datetime import datetime, timedelta
import random

SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def seed_sample_data():
    """Add sample data to the database for testing"""
    from models.financial import Deal, Tranche, CashFlow
    
    # Check if we already have data
    db = SessionLocal()
    existing_deals = db.query(Deal).count()
    if existing_deals > 0:
        db.close()
        return
    
    # Create sample deals
    deals = []
    currencies = ["USD", "EUR", "GBP"]
    statuses = ["Active", "Closed", "In Review"]
    
    for i in range(5):
        deal = Deal(
            deal_name=f"Deal {i+1}",
            issuer=f"Issuer {i+1}",
            deal_date=datetime.now() - timedelta(days=random.randint(30, 365)),
            total_amount=random.uniform(1000000, 10000000),
            currency=random.choice(currencies),
            status=random.choice(statuses)
        )
        db.add(deal)
        deals.append(deal)
    
    db.commit()
    
    # Create tranches for each deal
    tranches = []
    seniorities = ["Senior", "Mezzanine", "Junior"]
    
    for deal in deals:
        num_tranches = random.randint(1, 3)
        for i in range(num_tranches):
            tranche = Tranche(
                deal_id=deal.id,
                tranche_name=f"Tranche {chr(65+i)}",  # A, B, C, etc.
                amount=deal.total_amount / num_tranches,
                interest_rate=random.uniform(0.01, 0.08),
                maturity_date=datetime.now() + timedelta(days=random.randint(365, 3650)),
                seniority=random.choice(seniorities)
            )
            db.add(tranche)
            tranches.append(tranche)
    
    db.commit()
    
    # Create cash flows for each tranche
    for tranche in tranches:
        num_cashflows = random.randint(3, 10)
        for i in range(num_cashflows):
            cashflow = CashFlow(
                tranche_id=tranche.id,
                payment_date=datetime.now() + timedelta(days=180 * (i+1)),
                principal=tranche.amount / num_cashflows if i == num_cashflows - 1 else 0,
                interest=tranche.amount * tranche.interest_rate / num_cashflows,
                fees=tranche.amount * 0.001
            )
            db.add(cashflow)
    
    db.commit()
    db.close()