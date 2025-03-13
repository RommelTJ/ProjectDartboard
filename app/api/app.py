import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import onnxruntime as ort

from routes.predict import router as predict_router

# Load ONNX model
MODEL_PATH = "model/best.onnx"  # Model included in source code
ort_session = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the ML model
    global ort_session
    try:
        if os.path.exists(MODEL_PATH):
            ort_session = ort.InferenceSession(MODEL_PATH)
            print(f"Model loaded successfully from {MODEL_PATH}")
        else:
            print(f"Model not found at {MODEL_PATH}")
    except Exception as e:
        print(f"Error loading model: {e}")
    
    yield
    
    # Shutdown: Clean up resources
    # No specific cleanup needed for ort_session

app = FastAPI(lifespan=lifespan)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
def hello_world():
    return {"message": "hello world"}

# Include routers from other files
app.include_router(predict_router)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)