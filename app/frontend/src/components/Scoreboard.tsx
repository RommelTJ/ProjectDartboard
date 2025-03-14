import React, { useState, useEffect } from 'react';
import { DetectionResponse } from '../api/types';
import { isCricketSegment } from '../utils/dartboardScoring';

interface ScoreboardProps {
  detectionResponse?: DetectionResponse;
  dartScores: Array<{
    segment: number;
    ring: 'single' | 'double' | 'triple' | 'outer-bull' | 'inner-bull';
    points: number;
    dartIndex: number;
  }>;
}

// Cricket segments in standard order
const CRICKET_SEGMENTS = [20, 19, 18, 17, 16, 15, 'bull'] as const;
type CricketSegment = typeof CRICKET_SEGMENTS[number];

// Game state type
interface GameState {
  [key: string]: number; // Maps segment to hit count (0-3)
}

const Scoreboard: React.FC<ScoreboardProps> = ({ detectionResponse, dartScores }) => {
  // Game state to track cricket marks
  const [gameState, setGameState] = useState<GameState>({
    '20': 0,
    '19': 0,
    '18': 0,
    '17': 0,
    '16': 0,
    '15': 0,
    'bull': 0
  });
  
  // Process new dart scores when detected
  useEffect(() => {
    if (!dartScores || dartScores.length === 0) return;
    
    // Clone the current state
    const newState = { ...gameState };
    
    // Process each dart for cricket scoring
    dartScores.forEach(dart => {
      if (dart.segment >= 15 && dart.segment <= 20) {
        // Regular cricket segment
        const segmentKey = dart.segment.toString();
        const hitsToAdd = dart.ring === 'triple' ? 3 : dart.ring === 'double' ? 2 : 1;
        newState[segmentKey] = Math.min(3, (newState[segmentKey] || 0) + hitsToAdd);
      } else if (dart.segment === 25) {
        // Bull
        const hitsToAdd = dart.ring === 'inner-bull' ? 2 : 1;
        newState['bull'] = Math.min(3, (newState['bull'] || 0) + hitsToAdd);
      }
    });
    
    // Only update if changes were made
    if (JSON.stringify(newState) !== JSON.stringify(gameState)) {
      setGameState(newState);
    }
  }, [dartScores]);
  
  // Reset game state
  const handleReset = () => {
    setGameState({
      '20': 0,
      '19': 0,
      '18': 0,
      '17': 0,
      '16': 0,
      '15': 0,
      'bull': 0
    });
  };
  
  // Render marks (/, X, or ●) based on hit count
  const renderMarks = (count: number) => {
    if (count === 0) return null;
    
    if (count === 1) {
      return <div className="text-2xl font-bold text-green-700">/</div>;
    } 
    
    if (count === 2) {
      return <div className="text-2xl font-bold text-green-700">X</div>;
    }
    
    // For 3 (closed), render a filled circle
    return <div className="text-2xl font-bold text-green-700">●</div>;
  };
  
  return (
    <section className="w-full bg-white rounded-lg shadow-md p-4 flex flex-col mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Cricket Scoreboard</h2>
        <button 
          className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-lg text-sm"
          onClick={handleReset}
        >
          Erase
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {CRICKET_SEGMENTS.map(segment => {
          const segmentKey = segment.toString();
          const isClosed = gameState[segmentKey] === 3;
          
          return (
            <div 
              key={segment} 
              className={`flex flex-col items-center justify-between p-2 border rounded shadow-sm ${
                isClosed 
                  ? 'border-green-500 bg-green-50' 
                  : gameState[segmentKey] > 0
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className={`text-lg font-bold mb-1 ${isClosed ? 'text-green-700' : ''}`}>
                {segment}
              </div>
              <div className="h-12 flex items-center justify-center">
                {renderMarks(gameState[segmentKey])}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Scoreboard;