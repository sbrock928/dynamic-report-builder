from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Change relative imports to absolute imports
from database import Base, engine
from routes import schema, report

# Create the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Dynamic Schema and Report Builder")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(schema.router)
app.include_router(report.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Dynamic Schema and Report Builder API"}

# Add this to make the script runnable directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)