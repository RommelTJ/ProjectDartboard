import React from 'react';
import { DetectionResponse } from '../api/types';
import { getDartScore, formatDartScore, isCricketSegment } from '../utils/dartboardScoring';

interface DartAnalysisProps {
  detectionResponse?: DetectionResponse;
  showDebugOverlay: boolean;
}

const DartAnalysis: React.FC<DartAnalysisProps> = ({ detectionResponse, showDebugOverlay }) => {
  // Calculate scores for detected darts with tip estimation
  const dartScores = detectionResponse?.detections.map((dart, index) => ({
    ...getDartScore(dart.x_center, dart.y_center, dart.width, dart.height, dart.angle),
    dartIndex: index
  })) || [];
  
  // Filter for cricket scoring segments (15-20 and bullseye)
  const cricketScores = dartScores.filter(score => isCricketSegment(score.segment));

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
              {showDebugOverlay && (
                <>
                  <p className="text-gray-700">
                    Model: <span className="font-medium">{detectionResponse.model_info.model}</span>
                  </p>
                  <p className="text-gray-700">
                    Image size: <span className="font-medium">{detectionResponse.model_info.image_size}px</span>
                  </p>
                </>
              )}
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium text-lg mb-2">Scoring Details</h3>
              {dartScores.length > 0 ? (
                <div className="space-y-2">
                  {dartScores.map((score, i) => (
                    <div key={i} className={`p-3 rounded shadow-sm border ${isCricketSegment(score.segment) ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300'}`}>
                      <h4 className="font-medium">Dart #{score.dartIndex + 1}: {formatDartScore(score)}</h4>
                      {isCricketSegment(score.segment) ? (
                        <p className="text-green-700 font-medium">Cricket Segment!</p>
                      ) : (
                        <p className="text-gray-500">Not a cricket segment</p>
                      )}
                    </div>
                  ))}
                  
                  {cricketScores.length === 0 && dartScores.length > 0 && (
                    <p className="text-yellow-700 italic mt-2">No darts in cricket segments (15-20, Bull).</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No darts were detected in the image.</p>
              )}
            </div>
            
            {showDebugOverlay && (
              <>
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
              </>
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