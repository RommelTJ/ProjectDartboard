import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routes.predict import router as predict_router
from routes.camera import router as camera_router

# Use PyTorch model
MODEL_PATH = "model/best.pt"  # Model included in source code
yolo_model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the ML model
    global yolo_model
    try:
        # Get absolute path for more reliable loading
        abs_model_path = os.path.abspath(MODEL_PATH)

        if os.path.exists(abs_model_path):
                # We'll import and load the model on-demand in the prediction service
            # This avoids dependency issues at startup
            pass
        else:
            # Model not found
            pass
    except Exception:
        # Failed to configure model
        pass

    yield

    # Shutdown: Clean up resources
    # No specific cleanup needed

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
app.include_router(camera_router)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
