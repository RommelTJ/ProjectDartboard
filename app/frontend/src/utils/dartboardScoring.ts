// Dartboard scoring utilities
// This module provides utilities for determining which segment and ring
// a dart has landed in, based on its coordinates in the image.

export interface DartScore {
  segment: number; // 1-20, or 25 for bullseye
  ring: 'single' | 'double' | 'triple' | 'outer-bull' | 'inner-bull';
  points: number;
}

// Define the center of the dartboard in the image
// This will need to be calibrated based on actual dartboard position
const DARTBOARD_CENTER_X = 1080; // Estimated center X coordinate
const DARTBOARD_CENTER_Y = 1080; // Estimated center Y coordinate
const DARTBOARD_RADIUS = 700;    // Estimated dartboard radius in pixels

// Define radii for different rings as proportions of the dartboard radius
const INNER_BULL_RADIUS_RATIO = 0.035;   // Inner bullseye (double bull)
const OUTER_BULL_RADIUS_RATIO = 0.09;    // Outer bullseye (single bull)
const TRIPLE_INNER_RADIUS_RATIO = 0.39;  // Inner edge of triple ring
const TRIPLE_OUTER_RADIUS_RATIO = 0.45;  // Outer edge of triple ring
const DOUBLE_INNER_RADIUS_RATIO = 0.93;  // Inner edge of double ring
const DOUBLE_OUTER_RADIUS_RATIO = 0.97;  // Outer edge of double ring

// Cricket segments (ordered clockwise from the top)
const CRICKET_SEGMENTS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

/**
 * Calculate the distance between two points
 */
export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

/**
 * Calculate the angle in degrees for a point relative to the center
 * Returns angle in degrees (0-360), with 0 at the top and increasing clockwise
 */
export const getAngle = (x: number, y: number): number => {
  // Calculate the angle in radians (-PI to PI), with 0 at the right and increasing counterclockwise
  const angleRad = Math.atan2(y - DARTBOARD_CENTER_Y, x - DARTBOARD_CENTER_X);
  
  // Convert to degrees, shift to range 0-360, and rotate so 0 is at the top
  let angleDeg = (angleRad * 180 / Math.PI + 90) % 360;
  
  // Ensure positive angle
  if (angleDeg < 0) {
    angleDeg += 360;
  }
  
  return angleDeg;
};

/**
 * Determine which segment (1-20 or bullseye) the dart has landed in
 */
export const getSegment = (angleDegrees: number): number => {
  // If angle is negative, make it positive
  const angle = angleDegrees < 0 ? angleDegrees + 360 : angleDegrees;
  
  // Calculate which segment (out of 20) the dart landed in
  const segmentIndex = Math.floor(angle / 18) % 20;
  
  // Return the actual segment number using our segment mapping
  return CRICKET_SEGMENTS[segmentIndex];
};

/**
 * Determine which ring the dart has landed in
 */
export const getRing = (distanceFromCenter: number): 'single' | 'double' | 'triple' | 'outer-bull' | 'inner-bull' => {
  const distanceRatio = distanceFromCenter / DARTBOARD_RADIUS;
  
  if (distanceRatio <= INNER_BULL_RADIUS_RATIO) {
    return 'inner-bull';
  } else if (distanceRatio <= OUTER_BULL_RADIUS_RATIO) {
    return 'outer-bull';
  } else if (distanceRatio >= DOUBLE_INNER_RADIUS_RATIO && distanceRatio <= DOUBLE_OUTER_RADIUS_RATIO) {
    return 'double';
  } else if (distanceRatio >= TRIPLE_INNER_RADIUS_RATIO && distanceRatio <= TRIPLE_OUTER_RADIUS_RATIO) {
    return 'triple';
  } else {
    return 'single';
  }
};

/**
 * Determine if a segment is part of cricket scoring (15-20 and bullseye)
 */
export const isCricketSegment = (segment: number): boolean => {
  return segment >= 15 && segment <= 20 || segment === 25;
};

/**
 * Calculate the score for a dart based on its coordinates
 */
export const getDartScore = (x: number, y: number): DartScore => {
  const distanceFromCenter = distance(x, y, DARTBOARD_CENTER_X, DARTBOARD_CENTER_Y);
  const angleDegrees = getAngle(x, y);
  
  let segment = 0;
  let ring: 'single' | 'double' | 'triple' | 'outer-bull' | 'inner-bull';
  
  // Check if dart is in bullseye region
  const distanceRatio = distanceFromCenter / DARTBOARD_RADIUS;
  if (distanceRatio <= OUTER_BULL_RADIUS_RATIO) {
    // Bullseye region
    segment = 25;
    ring = distanceRatio <= INNER_BULL_RADIUS_RATIO ? 'inner-bull' : 'outer-bull';
  } else {
    // Regular segment
    segment = getSegment(angleDegrees);
    ring = getRing(distanceFromCenter);
  }
  
  // Calculate points based on segment and ring
  let points = 0;
  if (segment === 25) {
    // Bullseye scoring
    points = ring === 'inner-bull' ? 50 : 25;
  } else {
    // Regular segment scoring
    const basePoints = segment;
    if (ring === 'double') {
      points = basePoints * 2;
    } else if (ring === 'triple') {
      points = basePoints * 3;
    } else {
      points = basePoints;
    }
  }
  
  return { segment, ring, points };
};

/**
 * Format the dart score for display
 */
export const formatDartScore = (score: DartScore): string => {
  if (score.segment === 25) {
    return score.ring === 'inner-bull' ? 'BULL (50)' : 'BULL (25)';
  }
  
  let ringText = '';
  switch (score.ring) {
    case 'double':
      ringText = 'D';
      break;
    case 'triple':
      ringText = 'T';
      break;
    default:
      ringText = '';
  }
  
  return `${ringText}${score.segment} (${score.points})`;
};