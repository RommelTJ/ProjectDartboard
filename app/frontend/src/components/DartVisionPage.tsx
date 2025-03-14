import React, { useState, useEffect, useRef } from 'react';
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
  
  // Automatic mode state
  const [autoMode, setAutoMode] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const captureIntervalRef = useRef<number>(30000); // Start with 30 seconds

  // Fetch the latest image on component mount
  useEffect(() => {
    fetchLatestImage();
    
    // Clean up timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  // Calculate dart scores when detection response changes
  useEffect(() => {
    if (detectionResponse?.detections) {
      const scores = detectionResponse.detections.map((dart, index) => ({
        ...getDartScore(dart.x_center, dart.y_center, dart.width, dart.height, dart.angle),
        dartIndex: index
      }));
      setDartScores(scores);
      
      // Auto mode dart detection logic
      if (autoMode) {
        const dartCount = detectionResponse.detections.length;
        
        // If at least one dart is detected, switch to faster interval
        if (dartCount > 0 && dartCount < 3) {
          captureIntervalRef.current = 5000; // 5 seconds
        }
        
        // If three darts are detected, update scoreboard and reset capture interval
        if (dartCount >= 3) {
          captureIntervalRef.current = 30000; // Back to 30 seconds
        }
      }
    } else {
      setDartScores([]);
    }
  }, [detectionResponse, autoMode]);
  
  // Handle changes in auto mode
  useEffect(() => {
    if (autoMode) {
      // Start the automatic capture cycle
      scheduleNextCapture();
    } else {
      // Clean up timer when auto mode is turned off
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [autoMode]);

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

  // Schedule the next image capture
  const scheduleNextCapture = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    if (!autoMode) return;
    
    timerRef.current = setTimeout(async () => {
      if (autoMode) {
        await handleCaptureImage();
        scheduleNextCapture();
      }
    }, captureIntervalRef.current);
  };

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

  // Toggle automatic mode
  const handleToggleAutoMode = async () => {
    // If turning on auto mode, first reset everything
    if (!autoMode) {
      // Reset scoreboard first (via ref to be added to Scoreboard)
      const scoreboardResetButton = document.querySelector('.scoreboard-reset') as HTMLButtonElement;
      if (scoreboardResetButton) {
        scoreboardResetButton.click();
      }
      
      // Delete all images
      await handleDeleteImages();
      
      // Set interval back to 30 seconds
      captureIntervalRef.current = 30000;
      
      // Start auto mode
      setAutoMode(true);
    } else {
      // Turn off auto mode, clear timer
      setAutoMode(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Reset everything
  const handleReset = async () => {
    // Turn off auto mode
    setAutoMode(false);
    
    // Clear timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Reset scoreboard
    const scoreboardResetButton = document.querySelector('.scoreboard-reset') as HTMLButtonElement;
    if (scoreboardResetButton) {
      scoreboardResetButton.click();
    }
    
    // Delete all images
    await handleDeleteImages();
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
            onToggleAutoMode={handleToggleAutoMode}
            onReset={handleReset}
            autoMode={autoMode}
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
