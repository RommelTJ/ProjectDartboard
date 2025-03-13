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
        # Get absolute path for more reliable loading
        abs_model_path = os.path.abspath(MODEL_PATH)
        
        if os.path.exists(abs_model_path):
            # Log model loading
            print(f"Loading YOLO11-OBB model from {abs_model_path}")
            
            # Load the model
            ort_session = ort.InferenceSession(abs_model_path)
            
            # Log success
            print("Model loaded successfully")
        else:
            print(f"ERROR: Model not found at {abs_model_path}")
    except Exception as e:
        print(f"ERROR: Failed to load model: {type(e).__name__}")
    
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