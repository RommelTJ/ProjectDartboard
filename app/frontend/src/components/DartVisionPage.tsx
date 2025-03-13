import React from 'react';

const DartVisionPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">DartVision</h1>
      </header>
      
      <main className="flex flex-grow flex-col md:flex-row p-4 gap-4">
        {/* Camera/Image View (2/3) */}
        <section className="w-full md:w-2/3 bg-white rounded-lg shadow-md p-4 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Camera View</h2>
          <div className="flex-grow bg-gray-200 rounded-lg flex items-center justify-center">
            <p className="text-gray-600">Camera feed will appear here</p>
          </div>
          <div className="mt-4 flex justify-center gap-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg">
              Capture Image
            </button>
            <button className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">
              Get Latest Image
            </button>
          </div>
        </section>
        
        {/* AI Analysis (1/3) */}
        <section className="w-full md:w-1/3 bg-white rounded-lg shadow-md p-4 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Dart Analysis</h2>
          <div className="flex-grow bg-gray-200 rounded-lg p-4 overflow-y-auto">
            <p className="text-gray-600">Dart detection results will appear here</p>
          </div>
        </section>
      </main>
      
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>DartVision - Powered by AI</p>
      </footer>
    </div>
  );
};

export default DartVisionPage;