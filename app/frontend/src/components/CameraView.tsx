import React, { useState } from 'react';
import { DetectionResponse } from '../api/types';

interface CameraViewProps {
  onCaptureImage: () => void;
  onDeleteImages: () => void;
  imageUrl?: string;
  isLoading?: boolean;
  errorMessage?: string;
  detectionResponse?: DetectionResponse;
}

const CameraView: React.FC<CameraViewProps> = ({
  onCaptureImage,
  onDeleteImages,
  imageUrl,
  isLoading = false,
  errorMessage,
  detectionResponse
}) => {
  const [showDebugOverlay, setShowDebugOverlay] = useState<boolean>(true);
  
  const toggleDebugOverlay = () => {
    setShowDebugOverlay(!showDebugOverlay);
  };

  return (
    <section className="w-full bg-white rounded-lg shadow-md p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Camera View</h2>
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
              className="max-w-full max-h-full object-contain"
              id="dartImage"
              ref={(imgElement) => {
                // This reference will help us get the actual rendered dimensions later
                if (imgElement && showDebugOverlay && detectionResponse) {
                  window.setTimeout(() => {
                    const imageElement = document.getElementById('dartImage') as HTMLImageElement;
                    if (imageElement) {
                      // Store the rendered dimensions in data attributes for the overlay to use
                      imageElement.dataset.renderWidth = imageElement.clientWidth.toString();
                      imageElement.dataset.renderHeight = imageElement.clientHeight.toString();
                      // Force a re-render by toggling a class
                      imageElement.classList.add('image-loaded');
                    }
                  }, 100); // Small delay to ensure image has rendered
                }
              }}
            />
            {/* Debug Overlay for Dart Detections */}
            {showDebugOverlay && detectionResponse && detectionResponse.detections && detectionResponse.detections.length > 0 && (
              <div className="absolute inset-0 pointer-events-none" id="detectionOverlay">
                <svg className="w-full h-full" preserveAspectRatio="none">
                  {detectionResponse.detections.map((dart, index) => {
                    // Get original and rendered dimensions
                    const imageElement = document.getElementById('dartImage') as HTMLImageElement;
                    let scaleX = 1;
                    let scaleY = 1;
                    let offsetX = 0;
                    let offsetY = 0;
                    
                    if (imageElement && imageElement.dataset.renderWidth && imageElement.dataset.renderHeight) {
                      const renderWidth = parseInt(imageElement.dataset.renderWidth);
                      const renderHeight = parseInt(imageElement.dataset.renderHeight);
                      const origWidth = detectionResponse.model_info.original_size[0];
                      const origHeight = detectionResponse.model_info.original_size[1];
                      
                      // Calculate scaling factors and offsets for centered image
                      scaleX = renderWidth / origWidth;
                      scaleY = renderHeight / origHeight;
                      
                      // Calculate centering offsets if needed
                      const containerWidth = imageElement.parentElement?.clientWidth || renderWidth;
                      const containerHeight = imageElement.parentElement?.clientHeight || renderHeight;
                      offsetX = (containerWidth - renderWidth) / 2;
                      offsetY = (containerHeight - renderHeight) / 2;
                    }
                    
                    // Apply scaling and offsets to corners
                    const scaledCorners = dart.corners.map(corner => [
                      corner[0] * scaleX + offsetX,
                      corner[1] * scaleY + offsetY
                    ]);
                    
                    return (
                      <g key={index}>
                        {/* Draw the bounding box */}
                        <polygon 
                          points={scaledCorners.map(corner => `${corner[0]},${corner[1]}`).join(' ')}
                          fill="rgba(255, 0, 0, 0.3)"
                          stroke="red"
                          strokeWidth="2"
                        />
                        {/* Show confidence score */}
                        <text 
                          x={dart.x_center * scaleX + offsetX} 
                          y={dart.y_center * scaleY + offsetY - 10} 
                          fill="red" 
                          fontSize="12" 
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {Math.round(dart.confidence * 100)}%
                        </text>
                        {/* Show dimensions for debugging */}
                        <text 
                          x={dart.x_center * scaleX + offsetX} 
                          y={dart.y_center * scaleY + offsetY + 10} 
                          fill="yellow" 
                          fontSize="10" 
                          textAnchor="middle"
                        >
                          {Math.round(dart.width)}x{Math.round(dart.height)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
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
