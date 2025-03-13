from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR
import os

from services.prediction_service import PredictionService
from models.detection import DetectionResponse, DetectionError

router = APIRouter()

def get_model_path():
    # This function will be called by FastAPI to get the model path
    from app import MODEL_PATH
    return os.path.abspath(MODEL_PATH)

@router.post("/predict", response_model=DetectionResponse, responses={500: {"model": DetectionError}})
async def predict(
    file: UploadFile = File(...),
    model_path: str = Depends(get_model_path)
) -> DetectionResponse:
    """
    Process an uploaded image and return dart detections
    
    Takes a JPEG image as input, runs the dart detection model,
    and returns the detected darts with their positions and orientations.
    """
    try:
        # Read image
        contents = await file.read()
        
        # Call prediction service
        result = PredictionService.detect_darts_pt(model_path, contents)
        
        # Check if there's an error in the result
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(
                status_code=HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["error"]
            )
        
        return result
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Return error without exposing implementation details
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process image: {type(e).__name__} - {str(e)}"
        )
