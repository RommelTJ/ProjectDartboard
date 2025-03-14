import React, { useState, useEffect } from 'react';
import CameraView from './CameraView';
import DartAnalysis from './DartAnalysis';
import Scoreboard from './Scoreboard';
import apiClient from '../api';
import { DetectionResponse } from '../api/types';
import { useDebugOverlay } from '../hooks/useDebugOverlay';
import { getDartScore } from '../utils/dartboardScoring';

const DartVisionPage: React.FC = () => {
  // State management
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [detectionResponse, setDetectionResponse] = useState<DetectionResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const { showDebugOverlay, setShowDebugOverlay } = useDebugOverlay(false);
  
  // State for dart scores (derived from detectionResponse)
  const [dartScores, setDartScores] = useState<Array<ReturnType<typeof getDartScore> & { dartIndex: number }>>([]);

  // Fetch the latest image on component mount
  useEffect(() => {
    fetchLatestImage();
  }, []);
  
  // Calculate dart scores when detection response changes
  useEffect(() => {
    if (detectionResponse?.detections) {
      const scores = detectionResponse.detections.map((dart, index) => ({
        ...getDartScore(dart.x_center, dart.y_center, dart.width, dart.height, dart.angle),
        dartIndex: index
      }));
      setDartScores(scores);
    } else {
      setDartScores([]);
    }
  }, [detectionResponse]);

  // Convert blob to URL for display
  const createImageUrl = (blob: Blob): string => {
    const url = URL.createObjectURL(blob);
    return url;
  };

  // Clean up image URLs on unmount
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  // Handle API errors
  const handleApiError = (error: any) => {
    console.error('API Error:', error);
    const message = error.data?.error || error.data?.message || 'An unexpected error occurred';
    setErrorMessage(message);
    setIsLoading(false);
  };

  // Fetch the latest image from the API and analyze it
  const fetchLatestImage = async () => {
    setIsLoading(true);
    setErrorMessage(undefined);
    setDetectionResponse(undefined);
    
    try {
      const blob = await apiClient.getLatestImage();
      
      // Create a File object from the blob for later use with predictDarts
      const file = new File([blob], 'latest-image.jpg', { type: 'image/jpeg' });
      setImageFile(file);
      
      // Create URL for display
      const url = createImageUrl(blob);
      setImageUrl(url);
      
      // Automatically analyze the image
      try {
        const response = await apiClient.predictDarts(file);
        setDetectionResponse(response);
        setIsLoading(false);
      } catch (analysisError) {
        handleApiError(analysisError);
      }
    } catch (error: any) {
      // 404 is expected when no images exist yet - don't treat as error
      if (error.status === 404) {
        setImageUrl(undefined);
        setImageFile(null);
        setIsLoading(false);
      } else {
        handleApiError(error);
      }
    }
  };

  // Capture a new image
  const handleCaptureImage = async () => {
    setIsLoading(true);
    setErrorMessage(undefined);
    setDetectionResponse(undefined);

    try {
      await apiClient.captureImage();
      await fetchLatestImage();
    } catch (error) {
      handleApiError(error);
    }
  };

  // Delete all images
  const handleDeleteImages = async () => {
    setIsLoading(true);
    setErrorMessage(undefined);
    setDetectionResponse(undefined);

    try {
      await apiClient.deleteAllImages();
      // Clear image and detection data
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      setImageUrl(undefined);
      setImageFile(null);
      setIsLoading(false);
    } catch (error) {
      handleApiError(error);
    }
  };

  // Analyze the current image
  const handleAnalyzeImage = async () => {
    if (!imageFile) {
      setErrorMessage('No image available to analyze');
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      const response = await apiClient.predictDarts(imageFile);
      setDetectionResponse(response);
      setIsLoading(false);
    } catch (error) {
      handleApiError(error);
      setDetectionResponse(undefined);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">DartVision: Automated Dart Scoring System</h1>
      </header>

      <main className="flex flex-grow flex-col md:flex-row p-4 gap-4">
        {/* Camera/Image View (2/3) */}
        <div className="w-full md:w-2/3">
          <CameraView
            onCaptureImage={handleCaptureImage}
            onDeleteImages={handleDeleteImages}
            imageUrl={imageUrl}
            isLoading={isLoading}
            errorMessage={errorMessage}
            detectionResponse={detectionResponse}
            showDebugOverlay={showDebugOverlay}
            setShowDebugOverlay={setShowDebugOverlay}
          />
        </div>

        {/* AI Analysis and Scoreboard (1/3) */}
        <div className="w-full md:w-1/3">
          <Scoreboard 
            detectionResponse={detectionResponse}
            dartScores={dartScores}
          />
          <DartAnalysis 
            detectionResponse={detectionResponse} 
            showDebugOverlay={showDebugOverlay}
          />
        </div>
      </main>

      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>DartVision - By Rommel Rico</p>
      </footer>
    </div>
  );
};

export default DartVisionPage;
