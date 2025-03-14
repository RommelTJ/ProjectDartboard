import { useState } from 'react';

// Simple hook to share debug overlay state between components
export const useDebugOverlay = (initialState: boolean = false) => {
  const [showDebugOverlay, setShowDebugOverlay] = useState(initialState);
  return { showDebugOverlay, setShowDebugOverlay };
};