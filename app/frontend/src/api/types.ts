// Camera models
export interface CameraImageResponse {
  success: boolean;
  message: string;
  file_path?: string;
  filename?: string;
}

export interface DeleteImagesResponse {
  success: boolean;
  message: string;
  count?: number;
}

// Detection models
export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DartDetection {
  x_center: number;
  y_center: number;
  width: number;
  height: number;
  angle: number;
  confidence: number;
  class_id: number;
  detection_index: number;
  corners: number[][];
  bbox: BoundingBox;
}

export interface ModelInfo {
  model: string;
  image_size: number;
  original_size: number[];
}

export interface DetectionResponse {
  detections: DartDetection[];
  model_info: ModelInfo;
  darts_count: number;
}

export interface DetectionError {
  error: string;
}