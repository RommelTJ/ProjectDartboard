import React from 'react';
import { formatDartScore, isCricketSegment } from '../utils/dartboardScoring';
import { DetectionResponse } from '../api/types';

interface DartCardProps {
  score: {
    segment: number;
    ring: 'single' | 'double' | 'triple' | 'outer-bull' | 'inner-bull';
    points: number;
    dartIndex: number;
  };
  showDetails?: boolean;
  detection?: DetectionResponse['detections'][0];
}

const DartCard: React.FC<DartCardProps> = ({ score, showDetails = false, detection }) => {
  const isInCricketSegment = isCricketSegment(score.segment);
  
  // Function to generate a simplified description of the dart
  const getDartDescription = () => {
    if (score.segment === 25) {
      return score.ring === 'inner-bull' ? 'Bullseye' : 'Bull';
    }
    
    if (score.segment === 0) {
      return 'Miss';
    }
    
    const ringName = score.ring === 'single' ? '' : ` (${score.ring})`;
    return `${score.segment}${ringName}`;
  };
  
  return (
    <div 
      className={`p-3 rounded shadow-sm border ${isInCricketSegment ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300'}`}
    >
      <h4 className="font-medium">Dart #{score.dartIndex + 1}: {getDartDescription()}</h4>
      
      {showDetails && detection && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
          <p>Center: ({detection.x_center.toFixed(2)}, {detection.y_center.toFixed(2)})</p>
          <p>Size: {detection.width.toFixed(2)} × {detection.height.toFixed(2)}</p>
          <p>Angle: {detection.angle.toFixed(2)}°</p>
          <p>Confidence: {(detection.confidence * 100).toFixed(1)}%</p>
        </div>
      )}
    </div>
  );
};

export default DartCard;