import io
from typing import Dict, List, Union, TypedDict

from PIL import Image

from models.detection import DetectionResponse, ModelInfo, DartDetection, BoundingBox

# Constants
IMG_SIZE = 2176  # Based on the model's expected input size
CONFIDENCE_THRESHOLD = 0.2  # Production-level confidence threshold

# Define types for internal use
class DetectionError(TypedDict):
    """Error response from detection service"""
    error: str

class DartDetectionData(TypedDict):
    """Internal representation of a dart detection"""
    x_center: float
    y_center: float
    width: float
    height: float
    angle: float
    confidence: float
    class_id: int
    detection_index: int
    corners: List[List[float]]
    bbox: Dict[str, float]

class PredictionService:
    @staticmethod
    def detect_darts_pt(model_path: str, image_bytes: bytes) -> Union[DetectionResponse, DetectionError]:
        """
        Run dart detection using the PyTorch model
        """
        try:
            # Import necessary libraries here to avoid dependency issues
            from ultralytics import YOLO

            # Load the PT model
            model = YOLO(model_path)

            # Preprocess image
            img = Image.open(io.BytesIO(image_bytes))
            original_size = img.size

            # Run inference with the PT model
            results = model.predict(
                source=img,
                conf=CONFIDENCE_THRESHOLD,
                verbose=False,
                augment=False,      # No augmentation for inference
                imgsz=IMG_SIZE,     # Use the same image size as training
                iou=0.1,            # Lower IoU threshold to detect more objects
                max_det=100         # Increase max detections
            )

            # If no results, try a more lenient approach
            if not results or (len(results) > 0 and not hasattr(results[0], 'obb') and
                              (not hasattr(results[0], 'boxes') or results[0].boxes is None)):
                results = model.predict(
                    source=img,
                    conf=0.001,     # Much lower confidence threshold
                    verbose=False,
                    augment=True,   # Try with augmentation
                    imgsz=IMG_SIZE
                )

            # Process the results
            filtered_detections = []
            detection_index = 1

            # Extract detection results
            if len(results) > 0:
                result = results[0]  # Get the first (and only) result

                # Process results

                # For oriented bounding boxes, get the data
                if hasattr(result, 'obb') and result.obb is not None:
                    boxes = result.obb.data
                    # Make sure we have boxes to process
                    if boxes is not None and len(boxes) > 0:
                        for i, box in enumerate(boxes):
                            # Extract values from box tensor
                            if len(box) >= 6:  # x, y, w, h, angle, conf
                                x_center = float(box[0])
                                y_center = float(box[1])
                                width = float(box[2])
                                height = float(box[3])
                                angle = float(box[4])
                                confidence = float(box[5])
                                # Safely get class_id
                                class_id = 0
                                if hasattr(result, 'boxes') and result.boxes is not None and hasattr(result.boxes, 'cls'):
                                    class_id = int(result.boxes.cls[i]) if i < len(result.boxes.cls) else 0


                            # Calculate corners
                            import math
                            corners = []
                            cos_angle = math.cos(math.radians(angle))
                            sin_angle = math.sin(math.radians(angle))

                            points = [
                                [-width/2, -height/2],  # top-left
                                [width/2, -height/2],   # top-right
                                [width/2, height/2],    # bottom-right
                                [-width/2, height/2]    # bottom-left
                            ]

                            for px, py in points:
                                rx = px * cos_angle - py * sin_angle + x_center
                                ry = px * sin_angle + py * cos_angle + y_center
                                corners.append([float(rx), float(ry)])

                            # Add to filtered detections
                            detection_data = {
                                "x_center": float(x_center),
                                "y_center": float(y_center),
                                "width": float(width),
                                "height": float(height),
                                "angle": float(angle),
                                "confidence": float(confidence),
                                "class_id": class_id,
                                "detection_index": detection_index,
                                "corners": corners,
                                "bbox": {
                                    "x1": float(x_center - width/2),
                                    "y1": float(y_center - height/2),
                                    "x2": float(x_center + width/2),
                                    "y2": float(y_center + height/2)
                                }
                            }
                            filtered_detections.append(detection_data)
                            detection_index += 1
                elif hasattr(result, 'boxes') and result.boxes is not None and hasattr(result.boxes, 'data'):
                    # For standard bounding boxes
                    boxes = result.boxes.data
                    # Make sure we have boxes to process
                    if boxes is not None and len(boxes) > 0:
                        for i, box in enumerate(boxes):
                            if len(box) >= 6:  # xyxy, conf, cls
                                x1, y1, x2, y2 = float(box[0]), float(box[1]), float(box[2]), float(box[3])
                                confidence = float(box[4])
                                class_id = int(box[5])

                                # Convert from xyxy to xywh format
                                x_center = (x1 + x2) / 2
                                y_center = (y1 + y2) / 2
                                width = x2 - x1
                                height = y2 - y1
                                angle = 0  # no angle for standard boxes


                                # Add to filtered detections with simpler corners (no rotation)
                                corners = [
                                    [x1, y1],  # top-left
                                    [x2, y1],  # top-right
                                    [x2, y2],  # bottom-right
                                    [x1, y2]   # bottom-left
                                ]

                                detection_data = {
                                    "x_center": float(x_center),
                                    "y_center": float(y_center),
                                    "width": float(width),
                                    "height": float(height),
                                    "angle": float(angle),
                                    "confidence": float(confidence),
                                    "class_id": class_id,
                                    "detection_index": detection_index,
                                    "corners": corners,
                                    "bbox": {
                                        "x1": float(x1),
                                        "y1": float(y1),
                                        "x2": float(x2),
                                        "y2": float(y2)
                                    }
                                }
                                filtered_detections.append(detection_data)
                                detection_index += 1


            # Sort detections by confidence (highest first)
            sorted_detections = sorted(filtered_detections, key=lambda x: x["confidence"], reverse=True)

            # Create the same response format
            bbox_objects = []
            dart_detections = []

            for det in sorted_detections:
                bbox = BoundingBox(
                    x1=det["bbox"]["x1"],
                    y1=det["bbox"]["y1"],
                    x2=det["bbox"]["x2"],
                    y2=det["bbox"]["y2"]
                )

                dart = DartDetection(
                    x_center=det["x_center"],
                    y_center=det["y_center"],
                    width=det["width"],
                    height=det["height"],
                    angle=det["angle"],
                    confidence=det["confidence"],
                    class_id=det["class_id"],
                    detection_index=det["detection_index"],
                    corners=det["corners"],
                    bbox=bbox
                )
                dart_detections.append(dart)

            model_info = ModelInfo(
                model="YOLO11n-OBB (PyTorch)",
                image_size=IMG_SIZE,
                original_size=list(original_size)
            )

            # Even if no darts are detected, return a valid response
            return DetectionResponse(
                detections=dart_detections,
                model_info=model_info,
                darts_count=len(dart_detections)
            )

        except Exception as e:
            return DetectionError(error=f"PyTorch model detection error: {type(e).__name__} - {str(e)}")
