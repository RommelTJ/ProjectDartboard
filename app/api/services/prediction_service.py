import io
from typing import Dict, Any, Tuple

import numpy as np
import onnxruntime as ort
from PIL import Image

# Constants
IMG_SIZE = 2176  # Updated based on model's expected input size
CONFIDENCE_THRESHOLD = 0.05  # Threshold for filtering detections

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
        Run inference and process results
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

            # Process results
            detections = outputs[0]
            filtered_detections = []

            # Debug info
            print(f"Detection shape: {detections.shape}")
            if len(detections) > 0 and len(detections[0]) > 0:
                print(f"Sample detection: {detections[0][0]}")

            # Process each detection
            for detection in detections[0]:
                # Adjust by dividing by 10 to normalize confidence score (if needed)
                confidence = float(detection[5])
                if confidence > 1.0:  # If confidence is unusually high
                    confidence = confidence / 100.0  # Adjust scale

                if confidence > CONFIDENCE_THRESHOLD:
                    # Extract detection details
                    x_center, y_center, width, height, angle = detection[0:5]
                    class_id = int(detection[6]) if len(detection) > 6 else 0

                    # Simple scaling - YOLO outputs are typically normalized (0-1)
                    # But if values are large, assume they're already in pixel coordinates
                    if x_center <= 1.0:  # Normalized coordinates
                        x_center = float(x_center) * orig_w
                        y_center = float(y_center) * orig_h
                        width = float(width) * orig_w
                        height = float(height) * orig_h
                    else:  # Already in pixel coordinates but may need adjustment
                        # Fix for the unusually large values seen in the example
                        scale_factor = 10
                        if x_center > orig_w * scale_factor:
                            x_center = float(x_center) / scale_factor
                            y_center = float(y_center) / scale_factor
                            width = float(width) / scale_factor
                            height = float(height) / scale_factor

                    filtered_detections.append({
                        "x_center": float(x_center),
                        "y_center": float(y_center),
                        "width": float(width),
                        "height": float(height),
                        "angle": float(angle),
                        "confidence": float(confidence),
                        "class_id": class_id
                    })

            return {
                "detections": filtered_detections,
                "model_info": {
                    "model": "YOLOv11n-OBB",
                    "image_size": IMG_SIZE,
                    "original_size": original_size
                }
            }

        except Exception as e:
            # Log any errors that occur during processing
            import traceback
            print(f"Error in detect_darts: {str(e)}")
            print(traceback.format_exc())
            return {"error": str(e)}
