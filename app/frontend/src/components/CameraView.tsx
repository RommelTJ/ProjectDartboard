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
}

const CameraView: React.FC<CameraViewProps> = ({
  onCaptureImage,
  onDeleteImages,
  imageUrl,
  isLoading = false,
  errorMessage,
  detectionResponse
}) => {
  // Default debug overlay to off
  const [showDebugOverlay, setShowDebugOverlay] = useState<boolean>(false);

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
