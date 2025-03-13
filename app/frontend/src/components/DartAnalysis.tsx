import React from 'react';

interface Point {
  x: number;
  y: number;
}

interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface DartDetection {
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

interface ModelInfo {
  model: string;
  image_size: number;
  original_size: number[];
}

interface DetectionResponse {
  detections: DartDetection[];
  model_info: ModelInfo;
  darts_count: number;
}

interface DartAnalysisProps {
  detectionResponse?: DetectionResponse;
}

const DartAnalysis: React.FC<DartAnalysisProps> = ({ detectionResponse }) => {
  return (
    <section className="w-full bg-white rounded-lg shadow-md p-4 flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Dart Analysis</h2>
      <div className="flex-grow bg-gray-200 rounded-lg p-4 overflow-y-auto min-h-96">
        {detectionResponse ? (
          <div>
            <div className="mb-4">
              <h3 className="font-medium text-lg">Detection Summary</h3>
              <p className="text-gray-700">
                Darts detected: <span className="font-bold">{detectionResponse.darts_count}</span>
              </p>
              <p className="text-gray-700">
                Model: <span className="font-medium">{detectionResponse.model_info.model}</span>
              </p>
              <p className="text-gray-700">
                Image size: <span className="font-medium">{detectionResponse.model_info.image_size}px</span>
              </p>
            </div>
            
            <h3 className="font-medium text-lg mb-2">Dart Details</h3>
            {detectionResponse.detections.length > 0 ? (
              <div className="space-y-4">
                {detectionResponse.detections.map((dart, index) => (
                  <div key={index} className="bg-white p-3 rounded shadow-sm border border-gray-300">
                    <h4 className="font-medium">Dart #{index + 1}</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                      <p>Center: ({dart.x_center.toFixed(2)}, {dart.y_center.toFixed(2)})</p>
                      <p>Size: {dart.width.toFixed(2)} × {dart.height.toFixed(2)}</p>
                      <p>Angle: {dart.angle.toFixed(2)}°</p>
                      <p>Confidence: {(dart.confidence * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No darts were detected in the image.</p>
            )}
          </div>
        ) : (
          <p className="text-gray-600">Analyze an image to see dart detection results here.</p>
        )}
      </div>
    </section>
  );
};

export default DartAnalysis;