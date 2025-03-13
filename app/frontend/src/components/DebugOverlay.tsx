import React, { useEffect } from 'react';
import { DetectionResponse } from '../api';

interface DebugOverlayProps {
  detectionResponse: DetectionResponse;
  imageId: string;
}

const DebugOverlay: React.FC<DebugOverlayProps> = ({ detectionResponse, imageId }) => {
  useEffect(() => {
    // This effect will run after render to calculate dimensions if not already calculated
    const checkDimensions = () => {
      const imageElement = document.getElementById(imageId) as HTMLImageElement;
      if (imageElement) {
        // If dimensions aren't already set by CameraView, set them now
        if (!imageElement.dataset.renderWidth || !imageElement.dataset.renderHeight) {
          imageElement.dataset.renderWidth = imageElement.clientWidth.toString();
          imageElement.dataset.renderHeight = imageElement.clientHeight.toString();
        }
        // Force a re-render by toggling a class
        imageElement.classList.add('image-loaded');
        return true;
      }
      return false;
    };

    // Try immediately first
    if (!checkDimensions()) {
      // If that didn't work, try again after a short delay
      const timer = setTimeout(checkDimensions, 50);
      return () => clearTimeout(timer);
    }
  }, [detectionResponse, imageId]);
  
  // Force re-render when the component mounts to ensure we have dimensions
  useEffect(() => {
    // This is a second hook to force a re-render immediately when overlay is shown
    const forceUpdate = setTimeout(() => {
      const element = document.getElementById('detectionOverlay');
      if (element) {
        // Just toggling a class to force React to re-render
        element.classList.add('initialized');
      }
    }, 5);
    
    return () => clearTimeout(forceUpdate);
  }, []);

  if (!detectionResponse || !detectionResponse.detections || detectionResponse.detections.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none" id="detectionOverlay">
      <svg className="w-full h-full" preserveAspectRatio="none">
        {detectionResponse.detections.map((dart, index) => {
          // Get original and rendered dimensions
          const imageElement = document.getElementById(imageId) as HTMLImageElement;
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
  );
};

export default DebugOverlay;