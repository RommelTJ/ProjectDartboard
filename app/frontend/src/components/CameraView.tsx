import React from 'react';

interface CameraViewProps {
  onCaptureImage: () => void;
  onDeleteImages: () => void;
  imageUrl?: string;
  isLoading?: boolean;
  errorMessage?: string;
}

const CameraView: React.FC<CameraViewProps> = ({
  onCaptureImage,
  onDeleteImages,
  imageUrl,
  isLoading = false,
  errorMessage
}) => {
  return (
    <section className="w-full bg-white rounded-lg shadow-md p-4 flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Camera View</h2>
      
      <div className="flex-grow bg-gray-200 rounded-lg flex items-center justify-center h-96 mb-4 overflow-hidden">
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
          <img 
            src={imageUrl} 
            alt="Dart board" 
            className="max-w-full max-h-full object-contain"
          />
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
