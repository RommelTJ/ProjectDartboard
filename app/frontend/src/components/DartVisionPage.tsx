import React, { useState } from 'react';
import CameraView from './CameraView';
import DartAnalysis from './DartAnalysis';

// This would normally come from API calls
interface DetectionResponse {
  detections: any[];
  model_info: {
    model: string;
    image_size: number;
    original_size: number[];
  };
  darts_count: number;
}

const DartVisionPage: React.FC = () => {
  const [detectionResponse, setDetectionResponse] = useState<DetectionResponse | undefined>(undefined);

  // These handlers would normally make API calls
  const handleCaptureImage = () => {
    console.log('Capture image clicked');
  };

  const handleGetLatestImage = () => {
    console.log('Get latest image clicked');
  };

  const handleDeleteImages = () => {
    console.log('Delete images clicked');
  };

  const handleAnalyzeImage = () => {
    console.log('Analyze image clicked');
    // Here we'd normally make an API call and set the response
    // For now, we'll use dummy data
    setDetectionResponse({
      detections: [
        {
          x_center: 512.5,
          y_center: 384.7,
          width: 45.2,
          height: 150.8,
          angle: 15.3,
          confidence: 0.97,
          class_id: 0,
          detection_index: 0,
          corners: [[480, 350], [545, 350], [545, 420], [480, 420]],
          bbox: { x1: 480, y1: 350, x2: 545, y2: 420 }
        }
      ],
      model_info: {
        model: "yolov11n-obb",
        image_size: 1024,
        original_size: [2160, 3840]
      },
      darts_count: 1
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">DartVision</h1>
      </header>
      
      <main className="flex flex-grow flex-col md:flex-row p-4 gap-4">
        {/* Camera/Image View (2/3) */}
        <div className="w-full md:w-2/3">
          <CameraView 
            onCaptureImage={handleCaptureImage}
            onGetLatestImage={handleGetLatestImage} 
            onDeleteImages={handleDeleteImages}
            onAnalyzeImage={handleAnalyzeImage}
          />
        </div>
        
        {/* AI Analysis (1/3) */}
        <div className="w-full md:w-1/3">
          <DartAnalysis detectionResponse={detectionResponse} />
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>DartVision - Powered by AI</p>
      </footer>
    </div>
  );
};

export default DartVisionPage;