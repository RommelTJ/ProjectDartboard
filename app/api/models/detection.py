from typing import List

from pydantic import BaseModel, Field


class Point(BaseModel):
    """A 2D point"""
    x: float = Field(description="X coordinate")
    y: float = Field(description="Y coordinate")

class BoundingBox(BaseModel):
    """A simple rectangular bounding box"""
    x1: float = Field(description="Left coordinate")
    y1: float = Field(description="Top coordinate")
    x2: float = Field(description="Right coordinate")
    y2: float = Field(description="Bottom coordinate")

class DartDetection(BaseModel):
    """A detected dart with location and confidence score"""
    x_center: float = Field(description="X coordinate of center")
    y_center: float = Field(description="Y coordinate of center")
    width: float = Field(description="Width of the bounding box")
    height: float = Field(description="Height of the bounding box")
    angle: float = Field(description="Rotation angle in degrees")
    confidence: float = Field(description="Detection confidence score (0-1)")
    class_id: int = Field(description="Class ID of the detected object")
    detection_index: int = Field(description="Index of the detection")
    corners: List[List[float]] = Field(description="Coordinates of the rotated bounding box corners")
    bbox: BoundingBox = Field(description="Axis-aligned bounding box")

class ModelInfo(BaseModel):
    """Information about the model used for detection"""
    model: str = Field(description="Model name")
    image_size: int = Field(description="Input image size for the model")
    original_size: List[int] = Field(description="Original image dimensions [width, height]")

class DetectionResponse(BaseModel):
    """Response from the detection endpoint"""
    detections: List[DartDetection] = Field(description="List of detected darts")
    model_info: ModelInfo = Field(description="Information about the model used")
    darts_count: int = Field(description="Number of darts detected")

class DetectionError(BaseModel):
    """Error response from the detection endpoint"""
    error: str = Field(description="Error message")
