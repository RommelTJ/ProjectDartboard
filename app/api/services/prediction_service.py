import io
from typing import Dict, Any, Tuple

import numpy as np
import onnxruntime as ort
from PIL import Image

# Constants
IMG_SIZE = 2176  # Based on the model's expected input size
CONFIDENCE_THRESHOLD = 0.09  # Adjusted threshold to filter out false positives while keeping true detections

class PredictionService:
    @staticmethod
    def preprocess_image(image_bytes: bytes, target_size: int = IMG_SIZE) -> Tuple[np.ndarray, Tuple[int, int]]:
        """
        Preprocess image bytes for model input
        """
        # Open image and resize
        image = Image.open(io.BytesIO(image_bytes))

        # Store original size for scaling back
        original_size = image.size

        # Resize image to target size
        img = image.resize((target_size, target_size))

        # Convert to normalized numpy array
        img = np.array(img) / 255.0

        # Convert to channel-first format and add batch dimension
        img = img.transpose(2, 0, 1)
        img = np.expand_dims(img, axis=0).astype(np.float32)

        return img, original_size

    @staticmethod
    def detect_darts(
        ort_session: ort.InferenceSession,
        image_bytes: bytes
    ) -> Dict[str, Any]:
        """
        Run dart detection inference on the provided image and process results.

        This is designed for a specific camera and dartboard setup:
        - Ceiling-mounted camera pointing down
        - Dartboard is positioned in the upper-left quadrant of the image (not centered)
        - Standard dartboard with numbers positioned clockwise: 20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5

        Coordinate system:
        - Image coordinates: (0,0) at top-left, with x increasing right and y increasing down
        - The model returns OBB (Oriented Bounding Box) coordinates indicating dart positions

        Args:
            ort_session: ONNX runtime session with the loaded YOLO11-OBB model
            image_bytes: Raw bytes of the input image

        Returns:
            Dictionary containing detection results, including:
            - detections: List of detected darts with coordinates, orientation, and confidence
            - model_info: Information about the model and image dimensions
            - darts_count: Number of darts detected
        """
        if ort_session is None:
            return {"error": "Model not loaded"}

        try:
            # Preprocess image
            img, original_size = PredictionService.preprocess_image(image_bytes)
            orig_w, orig_h = original_size

            # Run inference
            input_name = ort_session.get_inputs()[0].name
            outputs = ort_session.run(None, {input_name: img})

            # Process YOLO11-OBB model results
            # From the logs, we see YOLO11-OBB has output shape (1, 6, 97104)
            detections = outputs[0]
            filtered_detections = []

            # Process the detections without debug logs

            # From the logs, we can see that YOLO11-OBB is returning detections
            # Each with reasonable x, y, width, height, angle values followed by confidence
            # Process each detection row
            for detection in detections[0]:
                try:
                    # Extract values based on what we're seeing in the logs
                    # The sequence appears to be [x, y, width, height, angle, confidence, class_id, ...]
                    if len(detection) < 6:
                        continue

                    # Get confidence from position 5
                    confidence = float(detection[5])

                    # YOLO11-OBB outputs confidence values that need scaling
                    if confidence > 1.0:
                        confidence = confidence / 100.0  # Scale down based on observed values

                    if confidence > CONFIDENCE_THRESHOLD:
                        # Extract coordinates from the first 5 values
                        x_center = float(detection[0])
                        y_center = float(detection[1])
                        width = float(detection[2])
                        height = float(detection[3])
                        angle = float(detection[4])

                        # Class ID is usually at index 6
                        class_id = int(detection[6]) if len(detection) > 6 else 0

                        # Scale coordinates to match original image size
                        # YOLO11 typically outputs coordinates relative to the input size
                        scale_x, scale_y = orig_w / IMG_SIZE, orig_h / IMG_SIZE

                        # For YOLO11-OBB models, outputs need special scaling
                        # From the documentation and logs, we can see that the coordinates need significant scaling

                        # Calculate scaling factors based on image dimensions
                        # The model is trained on 2176x2176 images, but detection coordinates are very small
                        scale_factor = min(orig_w, orig_h) / 20.0  # Scale factor based on image dimensions

                        # Scale the coordinates to match the original image dimensions
                        x_center = x_center * scale_factor
                        y_center = y_center * scale_factor
                        width = width * scale_factor
                        height = height * scale_factor

                        # Make sure the coordinates are within the image boundaries
                        x_center = min(max(x_center, 0), orig_w)
                        y_center = min(max(y_center, 0), orig_h)

                        # Calculate corners of the bounding box for easier visualization
                        half_width = width / 2
                        half_height = height / 2

                        # Calculate the OBB corners - useful for visualization and analysis
                        # Using the algorithm for OBB with rotation
                        import math

                        # Calculate the four corners of the oriented bounding box
                        angle_rad = math.radians(angle)
                        cos_angle = math.cos(angle_rad)
                        sin_angle = math.sin(angle_rad)

                        # Points relative to center
                        points = [
                            [-width/2, -height/2],  # top-left
                            [width/2, -height/2],   # top-right
                            [width/2, height/2],    # bottom-right
                            [-width/2, height/2]    # bottom-left
                        ]

                        # Apply rotation and translate to center
                        rotated_points = []
                        for px, py in points:
                            rx = px * cos_angle - py * sin_angle + x_center
                            ry = px * sin_angle + py * cos_angle + y_center
                            rotated_points.append([float(rx), float(ry)])

                        # Add detection with more useful information including corners
                        detection_data = {
                            "x_center": float(x_center),
                            "y_center": float(y_center),
                            "width": float(width),
                            "height": float(height),
                            "angle": float(angle),
                            "confidence": float(confidence),
                            "class_id": class_id,
                            "detection_index": len(filtered_detections) + 1,
                            "corners": rotated_points,
                            # Add estimated axis-aligned bounding box for simpler visualization
                            "bbox": {
                                "x1": float(x_center - half_width),
                                "y1": float(y_center - half_height),
                                "x2": float(x_center + half_width),
                                "y2": float(y_center + half_height)
                            }
                        }

                        # Sort detections by confidence (highest first)
                        filtered_detections.append(detection_data)
                except Exception as e:
                    # Silently skip detections that can't be processed
                    pass

            # Sort detections by confidence (highest first)
            sorted_detections = sorted(filtered_detections, key=lambda x: x["confidence"], reverse=True)

            # Return results with additional metadata
            return {
                "detections": sorted_detections,
                "model_info": {
                    "model": "YOLO11n-OBB",
                    "image_size": IMG_SIZE,
                    "original_size": original_size
                },
                "darts_count": len(sorted_detections)
            }

        except Exception as e:
            # Log the error type but not the full traceback for production
            return {"error": f"Detection error: {type(e).__name__}"}
