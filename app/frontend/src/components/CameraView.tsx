import React, { useState } from 'react';
import { DetectionResponse } from '../api';
import DebugOverlay from './DebugOverlay';

interface CameraViewProps {
  onCaptureImage: () => void;
  onDeleteImages: () => void;
  imageUrl?: string;
  isLoading?: boolean;
  errorMessage?: string;
  detectionResponse?: DetectionResponse;
  showDebugOverlay: boolean;
  setShowDebugOverlay: (show: boolean) => void;
}

const CameraView: React.FC<CameraViewProps> = ({
  onCaptureImage,
  onDeleteImages,
  imageUrl,
  isLoading = false,
  errorMessage,
  detectionResponse,
  showDebugOverlay,
  setShowDebugOverlay
}) => {
  const toggleDebugOverlay = () => {
    setShowDebugOverlay(!showDebugOverlay);
  };

  // Add calibration mode and state
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<{
    center?: { x: number, y: number };
    inner?: { x: number, y: number };
    outer?: { x: number, y: number };
    triple?: { x: number, y: number };
    double?: { x: number, y: number };
  }>({});

  // Handle image click for calibration
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!calibrationMode) return;

    // Get click coordinates relative to the image
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to original image coordinates
    const imageElement = e.currentTarget as HTMLImageElement;
    const originalWidth = detectionResponse?.model_info.original_size[0] || 2176;
    const originalHeight = detectionResponse?.model_info.original_size[1] || 2176;
    const displayWidth = imageElement.clientWidth;
    const displayHeight = imageElement.clientHeight;

    const originalX = Math.round((x / displayWidth) * originalWidth);
    const originalY = Math.round((y / displayHeight) * originalHeight);

    console.log(`Clicked at (${originalX}, ${originalY}) in original image coordinates`);

    // Determine which point to set based on the current state
    if (!calibrationPoints.center) {
      // First click sets the center (inner bull)
      setCalibrationPoints({
        ...calibrationPoints,
        center: { x: originalX, y: originalY }
      });
      alert(`Center point set at (${originalX}, ${originalY}). Now click on a point on the outer bull (single bull) ring.`);
    } else if (!calibrationPoints.outer) {
      // Second click sets the outer bull
      setCalibrationPoints({
        ...calibrationPoints,
        outer: { x: originalX, y: originalY }
      });
      alert(`Outer bull point set at (${originalX}, ${originalY}). Now click on a point on the triple ring.`);
    } else if (!calibrationPoints.triple) {
      // Third click sets the triple ring
      setCalibrationPoints({
        ...calibrationPoints,
        triple: { x: originalX, y: originalY }
      });
      alert(`Triple ring point set at (${originalX}, ${originalY}). Now click on a point on the double ring.`);
    } else if (!calibrationPoints.double) {
      // Fourth click sets the double ring
      setCalibrationPoints({
        ...calibrationPoints,
        double: { x: originalX, y: originalY }
      });

      // Calculate distances to get ring ratios
      const center = calibrationPoints.center!;
      const distanceToOuterBull = Math.sqrt(
        Math.pow(calibrationPoints.outer!.x - center.x, 2) + 
        Math.pow(calibrationPoints.outer!.y - center.y, 2)
      );
      const distanceToTriple = Math.sqrt(
        Math.pow(calibrationPoints.triple!.x - center.x, 2) + 
        Math.pow(calibrationPoints.triple!.y - center.y, 2)
      );
      const distanceToDouble = Math.sqrt(
        Math.pow(originalX - center.x, 2) + 
        Math.pow(originalY - center.y, 2)
      );

      // Assuming double ring is at the dartboard radius
      const dartboardRadius = distanceToDouble;
      const outerBullRatio = distanceToOuterBull / dartboardRadius;
      const tripleRatio = distanceToTriple / dartboardRadius;

      // Show calibration results
      const calibrationCode = `
// Dartboard center
const DARTBOARD_CENTER_X = ${center.x}; 
const DARTBOARD_CENTER_Y = ${center.y};
const DARTBOARD_RADIUS = ${Math.round(dartboardRadius)};

// Ring ratios
const OUTER_BULL_RADIUS_RATIO = ${outerBullRatio.toFixed(4)};
const TRIPLE_RING_RATIO = ${tripleRatio.toFixed(4)};
const DOUBLE_RING_RATIO = 1.0;
`;

      alert(`Calibration complete! Here are the values you can use:\n\n${calibrationCode}`);
      
      // Exit calibration mode
      setCalibrationMode(false);
    }
  };

  // Calibration button toggles calibration mode
  const toggleCalibrationMode = () => {
    if (!calibrationMode) {
      setCalibrationPoints({});
      alert("Calibration mode activated. Click on the following points in order:\n1. Center of the dartboard (inner bull)\n2. A point on the outer bull ring\n3. A point on the triple ring\n4. A point on the double ring");
    }
    setCalibrationMode(!calibrationMode);
  };

  return (
    <section className="w-full bg-white rounded-lg shadow-md p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Camera View</h2>
        <div className="flex items-center space-x-4">
          {/* Calibration button */}
          {showDebugOverlay && (
            <button
              onClick={toggleCalibrationMode}
              className={`px-2 py-1 text-sm rounded ${calibrationMode ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            >
              {calibrationMode ? 'Calibrating...' : 'Calibrate'}
            </button>
          )}
          <div className="flex items-center">
            <label className="mr-2 text-sm">Debug Overlay:</label>
            <input
              type="checkbox"
              checked={showDebugOverlay}
              onChange={toggleDebugOverlay}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
          </div>
        </div>
      </div>

      <div className="flex-grow bg-gray-200 rounded-lg flex items-center justify-center h-96 mb-4 overflow-hidden relative">
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : errorMessage ? (
          <div className="text-red-500 p-4 text-center">
            <p className="font-bold">Error</p>
            <p>{errorMessage}</p>
          </div>
        ) : imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt="Dart board"
              className={`max-w-full max-h-full object-contain ${calibrationMode ? 'cursor-crosshair' : ''}`}
              id="dartImage"
              onClick={handleImageClick}
              ref={(imgElement) => {
                // Store image dimensions even if debug overlay is not active yet
                if (imgElement && detectionResponse) {
                  window.setTimeout(() => {
                    const imageElement = document.getElementById('dartImage') as HTMLImageElement;
                    if (imageElement) {
                      // Always store dimensions for immediate use when overlay is toggled
                      imageElement.dataset.renderWidth = imageElement.clientWidth.toString();
                      imageElement.dataset.renderHeight = imageElement.clientHeight.toString();
                    }
                  }, 50);
                }
              }}
            />
            {/* Show calibration points */}
            {calibrationMode && Object.entries(calibrationPoints).length > 0 && (
              <svg className="absolute inset-0 pointer-events-none">
                {Object.entries(calibrationPoints).map(([key, point]) => {
                  if (!point) return null;
                  
                  // Convert original coordinates to display coordinates
                  const imageElement = document.getElementById('dartImage') as HTMLImageElement;
                  if (!imageElement) return null;
                  
                  const originalWidth = detectionResponse?.model_info.original_size[0] || 2176;
                  const originalHeight = detectionResponse?.model_info.original_size[1] || 2176;
                  const displayWidth = imageElement.clientWidth;
                  const displayHeight = imageElement.clientHeight;

                  const displayX = (point.x / originalWidth) * displayWidth;
                  const displayY = (point.y / originalHeight) * displayHeight;

                  const colors: Record<string, string> = {
                    center: "green",
                    outer: "cyan",
                    triple: "yellow",
                    double: "red"
                  };

                  return (
                    <g key={key}>
                      <circle 
                        cx={displayX} 
                        cy={displayY} 
                        r={6} 
                        fill={colors[key]} 
                        stroke="white" 
                        strokeWidth={2} 
                      />
                      <text 
                        x={displayX} 
                        y={displayY - 10} 
                        fill="white" 
                        stroke="black" 
                        strokeWidth="0.5"
                        fontSize="12" 
                        textAnchor="middle"
                      >
                        {key}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
            {/* Debug Overlay for Dart Detections - Only show if enabled */}
            {showDebugOverlay && detectionResponse && (
              <DebugOverlay
                key={`debug-overlay-${Date.now()}`} // Force new instance on toggle
                detectionResponse={detectionResponse}
                imageId="dartImage"
              />
            )}
          </>
        ) : (
          <p className="text-gray-600">No image available. Click "Capture Image" to take a photo.</p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={onCaptureImage}
          disabled={isLoading}
          className={`bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Capture Image
        </button>
        <button
          onClick={onDeleteImages}
          disabled={isLoading}
          className={`bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Delete Images
        </button>
      </div>
    </section>
  );
};

export default CameraView;