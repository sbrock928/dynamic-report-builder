# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from common.database import Base, engine, seed_sample_data
from udf.routes import router as udf_router
from report.routes import router as report_router
from common.models import router as models_router
from common.financial_models import Deal, Tranche, CashFlow

# Create the database tables
Base.metadata.create_all(bind=engine)

# Seed sample data
seed_sample_data()

app = FastAPI(title="UDF and Report Builder")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(udf_router)
app.include_router(report_router)
app.include_router(models_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the UDF and Report Builder API"}
