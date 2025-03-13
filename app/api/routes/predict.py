import onnxruntime as ort
from fastapi import APIRouter, UploadFile, File, Depends

from services.prediction_service import PredictionService

router = APIRouter()

# Use dependency injection to avoid circular import
def get_ort_session():
    # This function will be called by FastAPI to get the ort_session
    from app import ort_session
    return ort_session

@router.post("/predict")
async def predict(
    file: UploadFile = File(...),
    ort_session: ort.InferenceSession = Depends(get_ort_session)
):
    """
    Process an uploaded image and return dart detections
    
    Takes a JPEG image as input, runs the dart detection model,
    and returns the detected darts with their positions and orientations.
    """
    try:
        # Check if model is loaded
        if ort_session is None:
            return {"error": "Model not loaded"}
        
        # Read image
        contents = await file.read()
        
        # Call prediction service
        result = PredictionService.detect_darts(ort_session, contents)
        
        return result
        
    except Exception as e:
        # Return error without exposing implementation details
        return {"error": f"Failed to process image: {type(e).__name__}"}
