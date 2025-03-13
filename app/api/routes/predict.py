import onnxruntime as ort
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR

from services.prediction_service import PredictionService
from models.detection import DetectionResponse, DetectionError

router = APIRouter()

# Use dependency injection to avoid circular import
def get_ort_session():
    # This function will be called by FastAPI to get the ort_session
    from app import ort_session
    return ort_session

@router.post("/predict", response_model=DetectionResponse, responses={500: {"model": DetectionError}})
async def predict(
    file: UploadFile = File(...),
    ort_session: ort.InferenceSession = Depends(get_ort_session)
) -> DetectionResponse:
    """
    Process an uploaded image and return dart detections
    
    Takes a JPEG image as input, runs the dart detection model,
    and returns the detected darts with their positions and orientations.
    """
    try:
        # Check if model is loaded
        if ort_session is None:
            raise HTTPException(
                status_code=HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Model not loaded"
            )
        
        # Read image
        contents = await file.read()
        
        # Call prediction service
        result = PredictionService.detect_darts(ort_session, contents)
        
        # Check if there's an error in the result
        if "error" in result:
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
            detail=f"Failed to process image: {type(e).__name__}"
        )
