from typing import Optional

from pydantic import BaseModel, Field


class CameraImageResponse(BaseModel):
    """Response model for camera image operations"""
    success: bool = Field(description="Whether the operation was successful")
    message: str = Field(description="Message describing the result of the operation")
    file_path: Optional[str] = Field(None, description="Path to the saved image file")
    filename: Optional[str] = Field(None, description="Name of the saved image file")

class DeleteImagesResponse(BaseModel):
    """Response model for delete images operation"""
    success: bool = Field(description="Whether the operation was successful")
    message: str = Field(description="Message describing the result of the operation")
    count: Optional[int] = Field(None, description="Number of images deleted")
