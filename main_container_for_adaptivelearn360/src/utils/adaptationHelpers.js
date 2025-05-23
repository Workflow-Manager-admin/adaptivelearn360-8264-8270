/**
 * Utility functions for adaptive behavior in AdaptiveLearn360
 */

// PUBLIC_INTERFACE
/**
 * Calculate the best learning time based on user habits
 * @param {Object} habits - User habits data
 * @returns {string} - Best time period for studying
 */
export const calculateBestLearningTime = (habits) => {
  if (!habits || !habits.preferredStudyTime) {
    return 'evening'; // Default if no data available
  }
  
  const { preferredStudyTime } = habits;
  let bestTime = 'evening';
  let highestScore = 0;
  
  Object.entries(preferredStudyTime).forEach(([timePeriod, score]) => {
    if (score > highestScore) {
      highestScore = score;
      bestTime = timePeriod;
    }
  });
  
  return bestTime;
};

// PUBLIC_INTERFACE
/**
 * Determine layout complexity based on user performance and device
 * @param {Object} performance - User performance data
 * @param {string} deviceType - Type of device being used
 * @returns {string} - Recommended layout complexity
 */
export const determineLayoutComplexity = (performance, deviceType) => {
  if (!performance) return 'simple';
  
  const { averageScore, completionRate } = performance;
  
  // Simplify for mobile regardless of performance
  if (deviceType === 'mobile') return 'simple';
  
  // For tablet and desktop, consider performance
  if (averageScore > 80 && completionRate > 0.7) {
    return 'advanced';
  } else if (averageScore > 60 && completionRate > 0.5) {
    return 'standard';
  } else {
    return 'guided';
  }
};

// PUBLIC_INTERFACE
/**
 * Calculate optimal study duration based on user habits and performance
 * @param {Object} habits - User habits data
 * @param {Object} performance - User performance data
 * @returns {number} - Recommended study duration in minutes
 */
export const calculateOptimalStudyDuration = (habits, performance) => {
  if (!habits || !performance) {
    return 25; // Default Pomodoro duration
  }
  
  const baseTime = habits.averageSessionLength || 25;
  const perfFactor = performance.averageScore / 100; // 0 to 1
  
  // Adjust based on performance - better performers can focus longer
  let optimalTime = baseTime * (0.7 + (0.5 * perfFactor));
  
  // Round to nearest 5 minutes for simplicity
  return Math.round(optimalTime / 5) * 5;
};

// PUBLIC_INTERFACE
/**
 * Determine if content should be broken into smaller chunks
 * @param {Object} performance - User performance data
 * @param {string} contentType - Type of content being presented
 * @returns {boolean} - Whether to chunk content
 */
export const shouldChunkContent = (performance, contentType) => {
  if (!performance) return true; // Default to chunking if no data
  
  // Different thresholds for different content types
  const thresholds = {
    reading: 70,
    video: 60,
    practice: 75,
    quiz: 80
  };
  
  const threshold = thresholds[contentType] || 70;
  return performance.averageScore < threshold;
};

// PUBLIC_INTERFACE
/**
 * Get accessibility recommendations based on user data and device
 * @param {Object} userData - Complete user data object
 * @param {string} deviceType - Type of device being used
 * @returns {Object} - Accessibility recommendations
 */
export const getAccessibilityRecommendations = (userData, deviceType) => {
  if (!userData) {
    return {
      highContrast: false,
      largeText: false,
      screenReader: false,
      motionReduced: false,
    };
  }
  
  const { performance, habits, accessibility } = userData;
  
  // Start with user's explicit accessibility settings
  const recommendations = { ...accessibility };
  
  // Make smart recommendations based on behavior
  if (deviceType === 'mobile') {
    // Recommend large text on mobile if not already set
    recommendations.largeText = recommendations.largeText || true;
  }
  
  // If user has low scores but high study time, might indicate reading difficulties
  if (performance && habits) {
    if (performance.averageScore < 65 && habits.averageSessionLength > 45) {
      recommendations.largeText = true;
    }
  }
  
  return recommendations;
};

// PUBLIC_INTERFACE
/**
 * Generate adaptive UI hints based on all available data
 * @param {Object} userData - Complete user data object
 * @param {string} deviceType - Type of device being used
 * @param {string} timeOfDay - Current time period
 * @param {string} adaptiveLayout - Current adaptive layout mode
 * @returns {Object} - UI adaptation hints
 */
export const generateAdaptiveUIHints = (userData, deviceType, timeOfDay, adaptiveLayout) => {
  return {
    // Simplified UI for night mode or mobile
    simplifyNavigation: timeOfDay === 'night' || deviceType === 'mobile',
    
    // Show more visual aids for users with lower performance
    useVisualAids: userData?.performance?.averageScore < 70,
    
    // Use step-by-step guidance for inexperienced users
    useStepByStep: userData?.habits?.consistencyScore < 0.6,
    
    // Show more breaks for longer study sessions
    suggestMoreBreaks: (userData?.habits?.averageSessionLength || 0) > 40,
    
    // Highlight key information for users in a hurry or with attention issues
    highlightKeyInfo: timeOfDay === 'morning' || (userData?.habits?.distractionLevel === 'high'),
    
    // Compact layout for mobile or focus mode
    useCompactLayout: deviceType === 'mobile' || adaptiveLayout === 'focused',
    
    // Show progress indicators for motivation
    emphasizeProgress: userData?.habits?.consistencyScore < 0.7,
  };
};
