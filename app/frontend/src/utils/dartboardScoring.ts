// Dartboard scoring utilities
// This module provides utilities for determining which segment and ring
// a dart has landed in, based on its coordinates in the image.

export interface DartScore {
  segment: number; // 1-20, or 25 for bullseye
  ring: 'single' | 'double' | 'triple' | 'outer-bull' | 'inner-bull';
  points: number;
}

// Configuration for the dartboard calibration
// You can modify these values after using the calibration tool
interface DartboardCalibration {
  centerX: number;
  centerY: number;
  radius: number;
  innerBullRatio: number;
  outerBullRatio: number;
  tripleInnerRatio: number;
  tripleOuterRatio: number;
  doubleInnerRatio: number;
  doubleOuterRatio: number;
}

// ===== CALIBRATION VALUES - MODIFY THESE BASED ON CALIBRATION RESULTS =====
// These values will be used for all dart scoring calculations
const DARTBOARD_CONFIG: DartboardCalibration = {
  // Center coordinates
  centerX: 1132, // Center X coordinate measured from inner bull
  centerY: 782,  // Center Y coordinate measured from inner bull

  // Dartboard radius (to the outer edge)
  radius: 298,  // Based on measured points from double ring

  // Ring ratios (as proportion of full radius)
  innerBullRatio: 0.035,    // Inner bullseye (double bull)
  outerBullRatio: 0.0764,   // Outer bullseye (single bull) - from calibration
  tripleInnerRatio: 0.59,   // Inner edge of triple ring - estimated from calibration
  tripleOuterRatio: 0.65,   // Outer edge of triple ring - estimated from calibration
  doubleInnerRatio: 0.93,   // Inner edge of double ring - estimated
  doubleOuterRatio: 1.0     // Outer edge of double ring (used as full radius)
};

// ===== MANUAL FINE-TUNING ADJUSTMENTS =====
// These values can be tweaked to adjust the visual overlay and scoring
export const MANUAL_ADJUSTMENTS = {
  // Rotation adjustment in degrees (negative = counter-clockwise, positive = clockwise)
  rotationAdjustment: -5,  // Adjust this to rotate the entire dartboard

  // Scale factor for rings (values > 1 make rings bigger, < 1 make them smaller)
  ringScaleFactor: 1.16,   // Adjust this to make the rings bigger or smaller
  
  // Detection offset corrections for dart tip positioning
  // These account for the difference between where darts are detected vs where they actually strike
  detectionOffsetX: 13.66, // Difference from detected X to actual X (left/right adjustment)
  detectionOffsetY: 125.0, // Difference from detected Y to actual Y (up/down adjustment)
};
// =========================================================================

// Extract values from config object for easier use
const DARTBOARD_CENTER_X = DARTBOARD_CONFIG.centerX;
const DARTBOARD_CENTER_Y = DARTBOARD_CONFIG.centerY;
const DARTBOARD_RADIUS = DARTBOARD_CONFIG.radius;

// Define ratios from the config
const INNER_BULL_RADIUS_RATIO = DARTBOARD_CONFIG.innerBullRatio;
const OUTER_BULL_RADIUS_RATIO = DARTBOARD_CONFIG.outerBullRatio;
const TRIPLE_INNER_RADIUS_RATIO = DARTBOARD_CONFIG.tripleInnerRatio;
const TRIPLE_OUTER_RADIUS_RATIO = DARTBOARD_CONFIG.tripleOuterRatio;
const DOUBLE_INNER_RADIUS_RATIO = DARTBOARD_CONFIG.doubleInnerRatio;
const DOUBLE_OUTER_RADIUS_RATIO = DARTBOARD_CONFIG.doubleOuterRatio;

// Standard dartboard dimensions reference:
// - Inner Bull (Double Bull) is 12.7mm (0.5")
// - Outer Bull (Single Bull) is 31.8mm (1.25")
// - Triple ring inner edge is at ~107mm
// - Triple ring outer edge is at ~115mm
// - Double ring inner edge is at ~162mm
// - Double ring outer edge is at ~170mm
// - Full dartboard is 451mm (17.75") in diameter

// Standard dartboard segment order, clockwise starting from top (20)
// The standard dartboard has this order: 20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5
// We'll use this array to determine which segment a dart falls into based on its angle
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
 * Applies manual rotation adjustment from MANUAL_ADJUSTMENTS
 */
export const getAngle = (x: number, y: number): number => {
  // Calculate the angle in radians (-PI to PI), with 0 at the right and increasing counterclockwise
  const angleRad = Math.atan2(y - DARTBOARD_CENTER_Y, x - DARTBOARD_CENTER_X);

  // Convert to degrees, shift to range 0-360, and rotate so 0 is at the top
  let angleDeg = (angleRad * 180 / Math.PI + 90) % 360;

  // Apply manual rotation adjustment
  angleDeg = (angleDeg + MANUAL_ADJUSTMENTS.rotationAdjustment) % 360;

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
 * Applies the manual ring scale factor from MANUAL_ADJUSTMENTS
 */
export const getRing = (distanceFromCenter: number): 'single' | 'double' | 'triple' | 'outer-bull' | 'inner-bull' => {
  // Apply the scale factor to adjust ring sizes
  // Dividing by the scale factor makes the effective distance smaller when scale > 1
  // This makes the rings effectively larger
  const adjustedDistance = distanceFromCenter / MANUAL_ADJUSTMENTS.ringScaleFactor;

  // Calculate with the adjusted distance
  const distanceRatio = adjustedDistance / DARTBOARD_RADIUS;

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

// Detection offsets are now defined in the MANUAL_ADJUSTMENTS object above

/**
 * Calculate the dart tip position based on its center, width, height, and angle
 * The dart detection gives us the center of the dart, but we need the tip for scoring
 */
export const estimateDartTipPosition = (
  x_center: number,
  y_center: number,
  width: number,
  height: number,
  angle_degrees: number
): { x: number, y: number } => {
  // Apply systematic offset correction - account for detection errors
  // Subtracting the offset since we need to move detected position closer to actual position
  const corrected_x = x_center - MANUAL_ADJUSTMENTS.detectionOffsetX;
  const corrected_y = y_center - MANUAL_ADJUSTMENTS.detectionOffsetY;

  // The YOLO detection seems to have width/height swapped or rotated.
  // The dart's long axis is height (not width) in our detection
  // We need to fix this by using height for the length and applying a -90° rotation

  // Correct for the orientation issue by adding -90 degrees to the angle
  // This makes the dart point up instead of sideways
  const correctedAngle = angle_degrees - 90;
  const angleRad = (correctedAngle * Math.PI) / 180;

  // Use height as the dart length since the detection seems rotated
  // Divide by 2 to get distance from center to tip
  const dartLength = height / 2;

  // Direction to the dartboard center from the dart center
  const dirToCenter = {
    x: DARTBOARD_CENTER_X - corrected_x,
    y: DARTBOARD_CENTER_Y - corrected_y
  };

  // Normalize the direction vector
  const dirLength = Math.sqrt(dirToCenter.x * dirToCenter.x + dirToCenter.y * dirToCenter.y);
  const normalizedDir = {
    x: dirToCenter.x / dirLength,
    y: dirToCenter.y / dirLength
  };

  // Create vector for the dart direction using the corrected angle
  const dartDir = {
    x: Math.cos(angleRad),
    y: Math.sin(angleRad)
  };

  // Determine which end of the dart is pointing toward the board
  // by comparing the dart direction to the direction to the board center
  const dotProduct = dartDir.x * normalizedDir.x + dartDir.y * normalizedDir.y;

  // If dot product is positive, the dart is pointing generally toward the center
  const sign = dotProduct > 0 ? 1 : -1;

  // Calculate tip position by moving from center in the dart direction
  return {
    x: corrected_x + (sign * dartLength * dartDir.x),
    y: corrected_y + (sign * dartLength * dartDir.y)
  };
};

/**
 * Calculate the score for a dart based on its coordinates
 * If width, height, and angle are provided, it will estimate the dart tip position
 */
export const getDartScore = (
  x: number,
  y: number,
  width?: number,
  height?: number,
  angleDegrees?: number
): DartScore => {
  // If we have width, height, and angle, estimate the tip position
  let tipX = x;
  let tipY = y;

  if (width !== undefined && height !== undefined && angleDegrees !== undefined) {
    const tip = estimateDartTipPosition(x, y, width, height, angleDegrees);
    tipX = tip.x;
    tipY = tip.y;
  }

  const distanceFromCenter = distance(tipX, tipY, DARTBOARD_CENTER_X, DARTBOARD_CENTER_Y);
  const angleDeg = getAngle(tipX, tipY);

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
    segment = getSegment(angleDeg);
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
