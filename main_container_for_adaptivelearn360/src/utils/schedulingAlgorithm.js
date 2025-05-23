/**
 * Utility functions for adaptive scheduling in AdaptiveLearn360
 */

// PUBLIC_INTERFACE
/**
 * Generate an adaptive study schedule based on user performance and habits
 * @param {Object} userData - Complete user data object
 * @param {Array} contentItems - Array of content items to schedule
 * @param {Date} startDate - Starting date for the schedule
 * @param {number} daysToSchedule - Number of days to create schedule for
 * @returns {Array} - Scheduled study sessions
 */
export const generateAdaptiveSchedule = (userData, contentItems, startDate = new Date(), daysToSchedule = 7) => {
  if (!userData || !contentItems || contentItems.length === 0) {
    return [];
  }

  const { performance, habits, preferences } = userData;
  const schedule = [];
  const baseStudyDuration = preferences?.studyDuration || 25;
  const baseBreakDuration = preferences?.breakDuration || 5;
  
  // Clone startDate to avoid modifying the original
  const currentDate = new Date(startDate);
  
  // Determine best study hours based on user habits
  const getBestStudyHours = (dayOfWeek) => {
    // Default study hours if no data available
    const defaultHours = { morning: [9, 11], afternoon: [14, 16], evening: [19, 21] };
    
    // Return preferred times with highest scores
    const preferredTime = habits?.preferredStudyTime || {};
    let bestPeriod = 'evening';
    let highestScore = 0;
    
    Object.entries(preferredTime).forEach(([period, score]) => {
      if (score > highestScore) {
        highestScore = score;
        bestPeriod = period;
      }
    });
    
    // Return hours for that period
    return defaultHours[bestPeriod];
  };
  
  // Sort content by priority (weak areas first)
  const sortedContent = [...contentItems].sort((a, b) => {
    // Check if this subject is in weak areas
    const aIsWeak = performance?.weakAreas?.includes(a.subject);
    const bIsWeak = performance?.weakAreas?.includes(b.subject);
    
    if (aIsWeak && !bIsWeak) return -1;
    if (!aIsWeak && bIsWeak) return 1;
    
    // If both are weak or both are not weak, sort by difficulty
    return b.difficulty - a.difficulty;
  });
  
  // Calculate how many items to study per day based on user consistency
  const consistencyScore = habits?.consistencyScore || 0.5;
  const itemsPerDay = Math.max(1, Math.min(3, Math.ceil(sortedContent.length / (daysToSchedule * consistencyScore))));
  
  // Create schedule for each day
  for (let day = 0; day < daysToSchedule; day++) {
    // Get content items for this day
    const startIndex = (day * itemsPerDay) % sortedContent.length;
    const dayItems = [];
    
    for (let i = 0; i < itemsPerDay; i++) {
      const indexToAdd = (startIndex + i) % sortedContent.length;
      dayItems.push(sortedContent[indexToAdd]);
    }
    
    // Get best study hours for this day of week
    const dayOfWeek = currentDate.getDay();
    const [startHour, endHour] = getBestStudyHours(dayOfWeek);
    
    // Create study session
    const sessionDate = new Date(currentDate);
    sessionDate.setHours(startHour, 0, 0, 0);
    
    // Adjust duration based on item difficulty and user performance
    const averageScore = performance?.averageScore || 70;
    const difficultyFactor = dayItems.reduce((sum, item) => sum + item.difficulty, 0) / dayItems.length;
    
    // More difficult content or lower performance = longer sessions
    const adjustedDuration = Math.round(
      baseStudyDuration * (1 + (difficultyFactor - 3) * 0.1) * (1 + (70 - averageScore) * 0.005)
    );
    
    // Add session to schedule
    schedule.push({
      date: new Date(sessionDate),
      items: dayItems,
      duration: adjustedDuration,
      breakDuration: baseBreakDuration,
      completed: false
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return schedule;
};

// PUBLIC_INTERFACE
/**
 * Calculate optimal break times between study sessions
 * @param {number} sessionDuration - Duration of the study session in minutes
 * @param {number} userFatigueLevel - User fatigue level (0-10)
 * @param {number} contentDifficulty - Difficulty of content (1-5)
 * @returns {number} - Recommended break time in minutes
 */
export const calculateOptimalBreakTime = (sessionDuration, userFatigueLevel = 5, contentDifficulty = 3) => {
  // Base break calculation - longer sessions need longer breaks
  const baseBreak = Math.max(5, Math.round(sessionDuration / 5));
  
  // Adjust for fatigue and difficulty
  const fatigueAdjustment = (userFatigueLevel - 5) * 0.5;
  const difficultyAdjustment = (contentDifficulty - 3) * 0.5;
  
  // Calculate final break time
  const breakTime = Math.round(baseBreak + fatigueAdjustment + difficultyAdjustment);
  
  // Ensure break is between reasonable limits
  return Math.max(5, Math.min(20, breakTime));
};

// PUBLIC_INTERFACE
/**
 * Adjust schedule based on recent performance feedback
 * @param {Array} currentSchedule - Current study schedule
 * @param {Object} performanceFeedback - Recent performance data
 * @returns {Array} - Updated schedule
 */
export const adjustScheduleBasedOnPerformance = (currentSchedule, performanceFeedback) => {
  if (!currentSchedule || !performanceFeedback) {
    return currentSchedule;
  }
  
  const updatedSchedule = [...currentSchedule];
  
  // Extract performance metrics
  const { completedItems, struggledItems, averageScore } = performanceFeedback;
  
  // Find items that need reinforcement
  const reinforcementNeeded = struggledItems || [];
  
  if (reinforcementNeeded.length > 0 && updatedSchedule.length > 0) {
    // Find the next available session
    const now = new Date();
    const nextSessionIndex = updatedSchedule.findIndex(session => new Date(session.date) > now);
    
    if (nextSessionIndex !== -1) {
      // Add reinforcement items to next session
      updatedSchedule[nextSessionIndex] = {
        ...updatedSchedule[nextSessionIndex],
        items: [
          ...reinforcementNeeded.slice(0, 2), // Add up to 2 reinforcement items
          ...updatedSchedule[nextSessionIndex].items
        ],
        duration: updatedSchedule[nextSessionIndex].duration + 10 // Add time for reinforcement
      };
    }
  }
  
  // If performance is good, potentially reduce session duration
  if (averageScore && averageScore > 85) {
    updatedSchedule.forEach((session, index) => {
      if (index > 0) { // Don't modify immediate next session
        updatedSchedule[index] = {
          ...session,
          duration: Math.max(15, session.duration - 5) // Reduce duration but not below 15 min
        };
      }
    });
  }
  
  return updatedSchedule;
};

// PUBLIC_INTERFACE
/**
 * Detect study pattern and recommend optimal study times
 * @param {Object} habits - User habits data
 * @returns {Object} - Recommended study pattern
 */
export const detectStudyPattern = (habits) => {
  if (!habits || !habits.completionHistory || habits.completionHistory.length === 0) {
    return {
      pattern: 'unknown',
      recommendation: 'Start with short, regular study sessions to establish a pattern'
    };
  }
  
  const history = habits.completionHistory;
  
  // Calculate average sessions per day
  const totalSessions = history.reduce((sum, day) => sum + day.sessionsCompleted, 0);
  const averageSessions = totalSessions / history.length;
  
  // Calculate average duration per session
  const totalDuration = history.reduce((sum, day) => sum + day.duration, 0);
  const totalCompletedSessions = history.reduce((sum, day) => sum + day.sessionsCompleted, 0);
  const averageDuration = totalCompletedSessions > 0 ? totalDuration / totalCompletedSessions : 0;
  
  // Detect pattern
  let pattern = 'irregular';
  let recommendation = '';
  
  if (averageSessions >= 2.5) {
    pattern = 'frequent-short';
    recommendation = 'You study frequently in short bursts. Try grouping sessions for deeper focus.';
  } else if (averageSessions >= 1 && averageDuration >= 45) {
    pattern = 'daily-long';
    recommendation = 'You prefer longer daily sessions. Consider adding more breaks to maintain effectiveness.';
  } else if (averageSessions < 1 && averageDuration >= 60) {
    pattern = 'infrequent-intensive';
    recommendation = 'You study intensively but infrequently. Try adding shorter, more regular sessions.';
  } else {
    recommendation = 'Your study pattern is still developing. Aim for consistency with 25-minute focused sessions.';
  }
  
  return {
    pattern,
    recommendation,
    averageSessions,
    averageDuration
  };
};
