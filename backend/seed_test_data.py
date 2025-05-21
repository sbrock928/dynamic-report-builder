"""
Script to seed the database with example data for testing the UDF calculation feature.
"""
import sys
import os
import random
from datetime import datetime, timedelta

# Add the current directory to the path so we can import our modules
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from common.database import engine, SessionLocal, Base
from common.financial_models import Deal, Tranche, CashFlow
from udf.models import UDFModel
from report.models import ReportLayout

def create_tables():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")

def seed_database():
    """Seed the database with test data."""
    # First, create all tables
    create_tables()
    
    db = SessionLocal()
    try:
        print("Seeding database with test data...")
        
        # Create some deals
        deals = []
        for i in range(1, 6):
            deal = Deal(
                deal_name=f"Deal {i}",
                issuer=f"Issuer {i}",
                deal_date=datetime.now() - timedelta(days=random.randint(30, 365)),
                total_amount=random.randint(1000000, 10000000),
                currency="USD",
                status="active",
            )
            db.add(deal)
            deals.append(deal)
        
        db.commit()
        
        # Refresh deals to get their IDs
        for deal in deals:
            db.refresh(deal)
        
        # Create tranches for each deal
        tranches = []
        for deal in deals:
            num_tranches = random.randint(2, 5)
            for j in range(1, num_tranches + 1):
                tranche_amount = round(deal.total_amount / num_tranches * random.uniform(0.8, 1.2), 2)
                tranche = Tranche(
                    deal_id=deal.id,
                    tranche_name=f"Tranche {j} of Deal {deal.id}",
                    amount=tranche_amount,
                    interest_rate=random.uniform(2.0, 8.0),
                    maturity_date=datetime.now() + timedelta(days=365 * random.randint(1, 10)),
                    seniority=random.choice(["senior", "mezzanine", "junior"]),
                )
                db.add(tranche)
                tranches.append(tranche)
        
        db.commit()
        
        # Refresh tranches to get their IDs
        for tranche in tranches:
            db.refresh(tranche)
        
        # Create cashflows for each tranche
        for tranche in tranches:
            num_cashflows = random.randint(3, 8)
            for k in range(1, num_cashflows + 1):
                payment_date = datetime.now() + timedelta(days=90 * k)
                principal = tranche.amount / num_cashflows
                interest = principal * (tranche.interest_rate / 100 / 4)  # Quarterly payment
                cashflow = CashFlow(
                    tranche_id=tranche.id,
                    payment_date=payment_date,
                    principal=principal,
                    interest=interest,
                    fees=interest * 0.05,  # 5% of interest as fees
                )
                db.add(cashflow)
        
        db.commit()
        print("Created basic financial data.")
        
        # Create a deal-level UDF that uses the sum calculation
        deal_udf_json = {
            "name": "Deal Metrics",
            "description": "Key metrics for deals",
            "base_model": "deal",
            "aggregation_level": "deal",
            "fields": [
                {
                    "name": "total_tranche_amount",
                    "type": "number",
                    "description": "Sum of all tranche amounts for this deal",
                    "required": False,
                    "source_field": "total_amount",
                    "calculation_type": "sum",
                    "calculation_params": {
                        "related_model": "tranche",
                        "field_to_sum": "amount"
                    }
                },
                {
                    "name": "average_tranche_amount",
                    "type": "number",
                    "description": "Average of all tranche amounts for this deal",
                    "required": False,
                    "source_field": "total_amount",
                    "calculation_type": "average",
                    "calculation_params": {
                        "related_model": "tranche",
                        "field_to_average": "amount"
                    }
                }
            ]
        }
        
        deal_udf = UDFModel(
            name="Deal Metrics",
            description="Key metrics for deals",
            base_model="deal",
            aggregation_level="deal",
            udf_json=deal_udf_json
        )
        db.add(deal_udf)
        db.commit()
        db.refresh(deal_udf)
        print(f"Created Deal-level UDF with ID: {deal_udf.id}")
        
        # Create a tranche-level UDF
        tranche_udf_json = {
            "name": "Tranche Metrics",
            "description": "Key metrics for tranches",
            "base_model": "tranche",
            "aggregation_level": "tranche",
            "fields": [
                {
                    "name": "max_amount",
                    "type": "number",
                    "description": "Maximum tranche amount",
                    "required": False,
                    "source_field": "amount",
                    "calculation_type": "max",
                    "calculation_params": {
                        "field_to_max": "amount"
                    }
                }
            ]
        }
        
        tranche_udf = UDFModel(
            name="Tranche Metrics",
            description="Key metrics for tranches",
            base_model="tranche",
            aggregation_level="tranche",
            udf_json=tranche_udf_json
        )
        db.add(tranche_udf)
        db.commit()
        db.refresh(tranche_udf)
        print(f"Created Tranche-level UDF with ID: {tranche_udf.id}")
        
        # Create a cashflow-level UDF
        cashflow_udf_json = {
            "name": "CashFlow Metrics",
            "description": "Key metrics for cashflows",
            "base_model": "cashflow",
            "aggregation_level": "tranche",
            "fields": [
                {
                    "name": "total_payment",
                    "type": "number",
                    "description": "Total payment (principal + interest + fees)",
                    "required": False,
                    "calculation_type": "custom",
                    "calculation_params": {
                        "formula": "principal + interest + fees"
                    }
                }
            ]
        }
        
        cashflow_udf = UDFModel(
            name="CashFlow Metrics",
            description="Key metrics for cashflows",
            base_model="cashflow",
            aggregation_level="tranche",
            udf_json=cashflow_udf_json
        )
        db.add(cashflow_udf)
        db.commit()
        db.refresh(cashflow_udf)
        print(f"Created CashFlow-level UDF with ID: {cashflow_udf.id}")
        
        # Create a deal report that uses the deal UDF
        deal_report_layout_json = {
            "fields": [
                "id",
                "deal_name",
                "issuer",
                "total_amount",
                "status",
                "Deal Metrics.total_tranche_amount",
                "Deal Metrics.average_tranche_amount"
            ],
            "filters": [
                {"field": "status", "operator": "eq", "value": "active"}
            ],
            "sorting": [
                {"field": "total_amount", "direction": "desc"}
            ]
        }
        
        deal_report = ReportLayout(
            name="Deal Overview with Calculated Fields",
            description="Shows deals with calculated tranche sum and average",
            primary_model="deal",
            aggregation_level="deal",
            layout_json=deal_report_layout_json,
        )
        
        # Add the deal UDF to the report
        deal_report.udfs.append(deal_udf)
        
        db.add(deal_report)
        db.commit()
        db.refresh(deal_report)
        print(f"Created Deal Report with ID: {deal_report.id}")
        
        # Create a tranche report that uses the tranche UDF
        tranche_report_layout_json = {
            "fields": [
                "id",
                "tranche_name",
                "deal_id",
                "amount",
                "interest_rate",
                "seniority",
                "Tranche Metrics.max_amount"
            ],
            "filters": [],
            "sorting": [
                {"field": "amount", "direction": "desc"}
            ]
        }
        
        tranche_report = ReportLayout(
            name="Tranche Overview with Max Amount",
            description="Shows tranches with calculated maximum amount",
            primary_model="tranche",
            aggregation_level="tranche",
            layout_json=tranche_report_layout_json,
        )
        
        # Add the tranche UDF to the report
        tranche_report.udfs.append(tranche_udf)
        
        db.add(tranche_report)
        db.commit()
        db.refresh(tranche_report)
        print(f"Created Tranche Report with ID: {tranche_report.id}")
        
        # Create a cashflow report that uses the cashflow UDF
        cashflow_report_layout_json = {
            "fields": [
                "id",
                "tranche_id",
                "payment_date",
                "principal",
                "interest",
                "fees",
                "CashFlow Metrics.total_payment"
            ],
            "filters": [],
            "sorting": [
                {"field": "payment_date", "direction": "asc"}
            ]
        }
        
        cashflow_report = ReportLayout(
            name="CashFlow Overview with Total Payment",
            description="Shows cashflows with calculated total payment",
            primary_model="cashflow",
            aggregation_level="tranche",
            layout_json=cashflow_report_layout_json,
        )
        
        # Add the cashflow UDF to the report
        cashflow_report.udfs.append(cashflow_udf)
        
        db.add(cashflow_report)
        db.commit()
        db.refresh(cashflow_report)
        print(f"Created CashFlow Report with ID: {cashflow_report.id}")
        
        print("Database seeding completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()