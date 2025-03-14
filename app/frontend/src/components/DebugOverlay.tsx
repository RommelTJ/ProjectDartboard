import React, { useEffect } from 'react';
import { DetectionResponse } from '../api';
import { estimateDartTipPosition, MANUAL_ADJUSTMENTS } from '../utils/dartboardScoring';

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

  // Import the dartboard center values from the scoring utility
  // These should match the values in dartboardScoring.ts
  const DARTBOARD_CENTER_X = 1132;
  const DARTBOARD_CENTER_Y = 782;

  return (
    <div className="absolute inset-0 pointer-events-none" id="detectionOverlay">
      <svg className="w-full h-full" preserveAspectRatio="none">
        {/* Visualize the dartboard center */}
        {(() => {
          // Get original and rendered dimensions for scaling
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
            
            // Calculate scaling factors and offsets
            scaleX = renderWidth / origWidth;
            scaleY = renderHeight / origHeight;
            
            // Calculate centering offsets if needed
            const containerWidth = imageElement.parentElement?.clientWidth || renderWidth;
            const containerHeight = imageElement.parentElement?.clientHeight || renderHeight;
            offsetX = (containerWidth - renderWidth) / 2;
            offsetY = (containerHeight - renderHeight) / 2;
          }
          
          // Draw the dartboard center and rings
          const centerX = DARTBOARD_CENTER_X * scaleX + offsetX;
          const centerY = DARTBOARD_CENTER_Y * scaleY + offsetY;
          
          // Radius values in pixels - keep in sync with dartboardScoring.ts DARTBOARD_CONFIG
          const dartboardRadius = 298; // Should match DARTBOARD_CONFIG.radius
          
          // Apply the ring scale factor to all ring measurements
          const scaleFactor = MANUAL_ADJUSTMENTS.ringScaleFactor;
          
          const innerBullRadius = dartboardRadius * 0.035 * scaleFactor;
          const outerBullRadius = dartboardRadius * 0.0764 * scaleFactor; 
          const tripleInnerRadius = dartboardRadius * 0.59 * scaleFactor;
          const tripleOuterRadius = dartboardRadius * 0.65 * scaleFactor;
          const doubleInnerRadius = dartboardRadius * 0.93 * scaleFactor;
          const doubleOuterRadius = dartboardRadius * 1.0 * scaleFactor;
          
          // Scale for display
          const scaledDartboardRadius = dartboardRadius * scaleX * scaleFactor;
          const scaledInnerBullRadius = innerBullRadius * scaleX;
          const scaledOuterBullRadius = outerBullRadius * scaleX;
          const scaledTripleInnerRadius = tripleInnerRadius * scaleX;
          const scaledTripleOuterRadius = tripleOuterRadius * scaleX;
          const scaledDoubleInnerRadius = doubleInnerRadius * scaleX;
          const scaledDoubleOuterRadius = doubleOuterRadius * scaleX;
          
          return (
            <g>
              {/* Outer dartboard boundary */}
              <circle 
                cx={centerX}
                cy={centerY}
                r={scaledDartboardRadius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              
              {/* Show radius labels - these are useful for calibration */}
              <text 
                x={centerX + scaledDartboardRadius + 10}
                y={centerY}
                fill="white"
                fontSize="10"
                textAnchor="start"
              >
                R={Math.round(dartboardRadius)}px
              </text>
              
              {/* Double ring */}
              <circle 
                cx={centerX}
                cy={centerY}
                r={scaledDoubleOuterRadius}
                fill="none"
                stroke="rgba(255, 0, 0, 0.4)"
                strokeWidth="1"
              />
              <circle 
                cx={centerX}
                cy={centerY}
                r={scaledDoubleInnerRadius}
                fill="none"
                stroke="rgba(255, 0, 0, 0.4)"
                strokeWidth="1"
              />
              
              {/* Triple ring */}
              <circle 
                cx={centerX}
                cy={centerY}
                r={scaledTripleOuterRadius}
                fill="none"
                stroke="rgba(0, 200, 0, 0.4)"
                strokeWidth="1"
              />
              <circle 
                cx={centerX}
                cy={centerY}
                r={scaledTripleInnerRadius}
                fill="none"
                stroke="rgba(0, 200, 0, 0.4)"
                strokeWidth="1"
              />
              
              {/* Outer bull (25) */}
              <circle 
                cx={centerX}
                cy={centerY}
                r={scaledOuterBullRadius}
                fill="none"
                stroke="rgba(0, 255, 255, 0.6)"
                strokeWidth="1"
              />
              
              {/* Inner bull (50) */}
              <circle 
                cx={centerX}
                cy={centerY}
                r={scaledInnerBullRadius}
                fill="rgba(0, 255, 0, 0.5)"
                stroke="green"
                strokeWidth="2"
              />
              
              {/* Labels */}
              <text 
                x={centerX}
                y={centerY - 15}
                fill="green"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                Bull's Eye
              </text>
              
              {/* Display current adjustments */}
              <text 
                x={centerX}
                y={centerY - 35}
                fill="yellow"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
                stroke="black"
                strokeWidth="0.3"
              >
                Rotate: {MANUAL_ADJUSTMENTS.rotationAdjustment}° | Scale: {MANUAL_ADJUSTMENTS.ringScaleFactor.toFixed(2)}x
              </text>
              
              <text 
                x={centerX}
                y={centerY - 50}
                fill="yellow"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
                stroke="black"
                strokeWidth="0.3"
              >
                Offset X: {MANUAL_ADJUSTMENTS.detectionOffsetX.toFixed(1)} | Y: {MANUAL_ADJUSTMENTS.detectionOffsetY.toFixed(1)}
              </text>
              
              {/* Triple ring label */}
              <text 
                x={centerX}
                y={centerY + scaledTripleOuterRadius + 15}
                fill="lime"
                fontSize="9"
                textAnchor="middle"
              >
                Triple Ring
              </text>
              
              {/* Double ring label */}
              <text 
                x={centerX}
                y={centerY + scaledDoubleOuterRadius + 15}
                fill="red"
                fontSize="9"
                textAnchor="middle"
              >
                Double Ring
              </text>
              
              {/* Draw segment lines and labels for cricket segments with adjustment */}
              {[...Array(20)].map((_, i) => {
                // Apply rotation adjustment
                const rotationOffset = MANUAL_ADJUSTMENTS.rotationAdjustment * (Math.PI / 180);
                const angle = (i * 18) * Math.PI / 180 + rotationOffset;
                
                // Apply scale factor to radius
                const adjustedRadius = scaledDartboardRadius * MANUAL_ADJUSTMENTS.ringScaleFactor;
                const x2 = centerX + Math.sin(angle) * adjustedRadius;
                const y2 = centerY - Math.cos(angle) * adjustedRadius;
                
                // Only draw the cricket segments (15-20)
                const segmentNumber = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5][i];
                const isCricketSegment = segmentNumber >= 15 && segmentNumber <= 20;
                const color = isCricketSegment ? "rgba(255, 255, 0, 0.7)" : "rgba(200, 200, 200, 0.25)";
                
                // Position for the label - also adjust for rotation and scale
                const labelAngle = ((i + 0.5) * 18) * Math.PI / 180 + rotationOffset;
                const labelDistance = adjustedRadius * 0.7; // Place label at 70% distance
                const labelX = centerX + Math.sin(labelAngle) * labelDistance;
                const labelY = centerY - Math.cos(labelAngle) * labelDistance;
                
                return (
                  <g key={`segment-${i}`}>
                    <line
                      x1={centerX}
                      y1={centerY}
                      x2={x2}
                      y2={y2}
                      stroke={color}
                      strokeWidth={isCricketSegment ? 1.5 : 0.5}
                      strokeDasharray={isCricketSegment ? "none" : "2,3"}
                    />
                    {isCricketSegment && (
                      <text
                        x={labelX}
                        y={labelY}
                        fill="yellow"
                        fontSize="12"
                        fontWeight="bold"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        stroke="black"
                        strokeWidth="0.5"
                      >
                        {segmentNumber}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })()}

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
          
          // Calculate the estimated dart tip position with the offset correction
          const tipPosition = estimateDartTipPosition(
            dart.x_center, 
            dart.y_center, 
            dart.width, 
            dart.height, 
            dart.angle
          );
          
          // Also calculate uncorrected position for comparison in debug view
          const rawTipPosition = {
            x: tipPosition.x + MANUAL_ADJUSTMENTS.detectionOffsetX,
            y: tipPosition.y + MANUAL_ADJUSTMENTS.detectionOffsetY
          };
          
          // Scale tip positions for display
          const scaledTipX = tipPosition.x * scaleX + offsetX;
          const scaledTipY = tipPosition.y * scaleY + offsetY;
          const scaledRawTipX = rawTipPosition.x * scaleX + offsetX;
          const scaledRawTipY = rawTipPosition.y * scaleY + offsetY;
          
          return (
            <g key={index}>
              {/* Draw the bounding box */}
              <polygon 
                points={scaledCorners.map(corner => `${corner[0]},${corner[1]}`).join(' ')}
                fill="rgba(255, 0, 0, 0.3)"
                stroke="red"
                strokeWidth="2"
              />
              
              {/* Show the dart center */}
              <circle 
                cx={dart.x_center * scaleX + offsetX}
                cy={dart.y_center * scaleY + offsetY}
                r={4}
                fill="yellow"
                stroke="black"
                strokeWidth="1"
              />
              
              {/* Draw the uncorrected dart tip (original calculation) */}
              <circle 
                cx={scaledRawTipX}
                cy={scaledRawTipY}
                r={5}
                fill="red"
                stroke="black"
                strokeWidth="1"
                opacity="0.4"
              />
              
              {/* Draw the corrected dart tip with offset applied */}
              <circle 
                cx={scaledTipX}
                cy={scaledTipY}
                r={6}
                fill="blue"
                stroke="white"
                strokeWidth="1"
              />
              
              {/* Draw a connecting line between raw and corrected tips */}
              <line
                x1={scaledRawTipX}
                y1={scaledRawTipY}
                x2={scaledTipX}
                y2={scaledTipY}
                stroke="purple"
                strokeWidth="1"
                strokeDasharray="3,2"
              />
              
              {/* Line connecting center to tip */}
              <line 
                x1={dart.x_center * scaleX + offsetX}
                y1={dart.y_center * scaleY + offsetY}
                x2={scaledTipX}
                y2={scaledTipY}
                stroke="white"
                strokeWidth="1"
                strokeDasharray="2,2"
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
              
              {/* Label the dart number */}
              <text 
                x={scaledTipX} 
                y={scaledTipY - 15} 
                fill="white" 
                fontSize="12"
                fontWeight="bold" 
                textAnchor="middle"
                stroke="black"
                strokeWidth="0.5"
              >
                Dart #{index + 1} Tip
              </text>
              
              {/* Show scoring debug info */}
              <text 
                x={scaledTipX} 
                y={scaledTipY + 15} 
                fill="cyan" 
                fontSize="11"
                textAnchor="middle"
                stroke="black"
                strokeWidth="0.3"
              >
                Distance: {Math.round(Math.sqrt(
                  Math.pow(tipPosition.x - DARTBOARD_CENTER_X, 2) + 
                  Math.pow(tipPosition.y - DARTBOARD_CENTER_Y, 2)
                ))}px
              </text>
              
              {/* Show segment and angle info */}
              <text 
                x={scaledTipX} 
                y={scaledTipY + 30} 
                fill="yellow" 
                fontSize="11"
                textAnchor="middle"
                stroke="black"
                strokeWidth="0.3"
              >
                Angle: {Math.round(
                  (Math.atan2(
                    tipPosition.y - DARTBOARD_CENTER_Y, 
                    tipPosition.x - DARTBOARD_CENTER_X
                  ) * 180 / Math.PI + 90) % 360
                )}°
              </text>
              
              {/* Calculate segment based on angle with additional ring info */}
              {(() => {
                // Same logic as in dartboardScoring.ts
                let angleDegrees = (Math.atan2(
                  tipPosition.y - DARTBOARD_CENTER_Y,
                  tipPosition.x - DARTBOARD_CENTER_X
                ) * 180 / Math.PI + 90) % 360;
                
                if (angleDegrees < 0) {
                  angleDegrees += 360;
                }
                
                // Calculate distance ratio to determine ring
                const distanceFromCenter = Math.sqrt(
                  Math.pow(tipPosition.x - DARTBOARD_CENTER_X, 2) +
                  Math.pow(tipPosition.y - DARTBOARD_CENTER_Y, 2)
                );
                
                // Hardcoded values to avoid scope issues
                // Should match the values in dartboardScoring.ts
                const radius = 298;
                const innerBullRatio = 0.035;
                const outerBullRatio = 0.0764;
                const tripleInnerRatio = 0.59;
                const tripleOuterRatio = 0.65;
                const doubleInnerRatio = 0.93;
                const doubleOuterRatio = 1.0;
                
                const distanceRatio = distanceFromCenter / radius;
                
                let ringName = "single";
                if (distanceRatio <= innerBullRatio) {
                  ringName = "inner-bull";
                } else if (distanceRatio <= outerBullRatio) {
                  ringName = "outer-bull";
                } else if (
                  distanceRatio >= tripleInnerRatio && 
                  distanceRatio <= tripleOuterRatio
                ) {
                  ringName = "triple";
                } else if (
                  distanceRatio >= doubleInnerRatio && 
                  distanceRatio <= doubleOuterRatio
                ) {
                  ringName = "double";
                }
                
                const segmentIndex = Math.floor(angleDegrees / 18) % 20;
                const segment = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5][segmentIndex];
                const isCricketSegment = segment >= 15 && segment <= 20;
                
                return (
                  <>
                    <text 
                      x={scaledTipX} 
                      y={scaledTipY + 45} 
                      fill={isCricketSegment ? "lime" : "white"} 
                      fontSize="11"
                      textAnchor="middle"
                      stroke="black"
                      strokeWidth="0.3"
                    >
                      Segment: {segment} ({isCricketSegment ? "Cricket!" : "Non-Cricket"})
                    </text>
                    
                    <text 
                      x={scaledTipX} 
                      y={scaledTipY + 60} 
                      fill="cyan" 
                      fontSize="11"
                      textAnchor="middle"
                      stroke="black" 
                      strokeWidth="0.3"
                    >
                      Ring: {ringName} ({Math.round(distanceRatio * 100)}% of radius)
                    </text>
                  </>
                );
              })()}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default DebugOverlay;