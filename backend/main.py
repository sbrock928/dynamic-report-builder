# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine, seed_sample_data
from routes import udf, report, models  # Updated import

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
app.include_router(udf.router)  # Updated router
app.include_router(report.router)
app.include_router(models.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the UDF and Report Builder API"}