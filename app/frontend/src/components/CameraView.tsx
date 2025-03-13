import React from 'react';

interface CameraViewProps {
  onCaptureImage: () => void;
  onGetLatestImage: () => void;
  onDeleteImages: () => void;
  onAnalyzeImage: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({
  onCaptureImage,
  onGetLatestImage,
  onDeleteImages,
  onAnalyzeImage
}) => {
  return (
    <section className="w-full bg-white rounded-lg shadow-md p-4 flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Camera View</h2>
      <div className="flex-grow bg-gray-200 rounded-lg flex items-center justify-center h-96 mb-4">
        <p className="text-gray-600">Camera feed will appear here</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button 
          onClick={onCaptureImage}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
        >
          Capture Image
        </button>
        <button 
          onClick={onGetLatestImage}
          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
        >
          Get Latest Image
        </button>
        <button 
          onClick={onAnalyzeImage}
          className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg"
        >
          Analyze Image
        </button>
        <button 
          onClick={onDeleteImages}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg"
        >
          Delete Images
        </button>
      </div>
    </section>
  );
};

export default CameraView;