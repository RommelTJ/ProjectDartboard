import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from starlette.status import HTTP_404_NOT_FOUND

from models.camera import CameraImageResponse, DeleteImagesResponse
from services.camera_service import CameraService

router = APIRouter()

@router.post("/camera/images", response_model=CameraImageResponse)
async def take_picture() -> CameraImageResponse:
    """
    Takes a photo from the Reolink camera and saves it to the feed directory.
    Uses the configured camera IP and password from environment variables.

    Returns:
        JSON with the status and file path if successful
    """
    try:
        file_path = CameraService.take_picture()

        if file_path:
            # Extract just the filename for the response
            filename = os.path.basename(file_path)
            return CameraImageResponse(
                success=True,
                message="Image captured successfully",
                file_path=file_path,
                filename=filename
            )
        else:
            return CameraImageResponse(
                success=False,
                message="Failed to capture image. Check camera connection and configuration.",
                file_path=None,
                filename=None
            )
    except ValueError as e:
        # Configuration error
        return CameraImageResponse(
            success=False,
            message=str(e),
            file_path=None,
            filename=None
        )
    except Exception as e:
        # Unexpected error
        return CameraImageResponse(
            success=False,
            message=f"Unexpected error: {str(e)}",
            file_path=None,
            filename=None
        )

@router.delete("/camera/images", response_model=DeleteImagesResponse)
async def delete_pictures() -> DeleteImagesResponse:
    """
    Deletes all pictures in the feed directory.

    Returns:
        JSON with status and count of deleted files
    """
    try:
        count = CameraService.delete_all_pictures()
        return DeleteImagesResponse(
            success=True,
            message=f"Deleted {count} images",
            count=count
        )
    except Exception as e:
        return DeleteImagesResponse(
            success=False,
            message=f"Error deleting images: {str(e)}",
            count=None
        )

@router.get("/camera/images/latest")
async def get_latest_picture():
    """
    Returns the latest picture from the feed directory.

    Returns:
        The image file if available, or a 404 error if no images exist
    """
    try:
        file_path = CameraService.get_latest_picture()

        if file_path and os.path.exists(file_path):
            return FileResponse(
                file_path,
                media_type="image/jpeg",
                filename=os.path.basename(file_path)
            )
        else:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="No images available"
            )
    except Exception as e:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail=f"Error retrieving image: {str(e)}"
        )
