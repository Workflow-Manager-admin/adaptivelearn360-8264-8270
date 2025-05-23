/**
 * Utility functions for prioritizing study content in AdaptiveLearn360
 */

// PUBLIC_INTERFACE
/**
 * Prioritize content items based on user performance and habits
 * @param {Array} contentItems - Content items to prioritize
 * @param {Object} userData - User data containing performance metrics
 * @returns {Array} - Prioritized content items
 */
export const prioritizeContent = (contentItems, userData) => {
  if (!contentItems || contentItems.length === 0 || !userData) {
    return [];
  }

  const { performance } = userData;
  const weakAreas = performance?.weakAreas || [];
  const strongAreas = performance?.strongAreas || [];
  
  // Create a copy to avoid modifying the original
  const prioritizedItems = [...contentItems];
  
  // Calculate priority score for each item
  prioritizedItems.forEach(item => {
    let priorityScore = 5; // Default middle priority
    
    // Factor 1: Is this a weak area? (+3 priority)
    if (weakAreas.includes(item.subject)) {
      priorityScore += 3;
    }
    
    // Factor 2: Is this a strong area? (-2 priority)
    if (strongAreas.includes(item.subject)) {
      priorityScore -= 2;
    }
    
    // Factor 3: Item difficulty (+0 to +2 priority)
    priorityScore += Math.min(2, Math.max(0, item.difficulty - 3));
    
    // Factor 4: Time sensitivity (deadline proximity) (+0 to +3)
    if (item.dueDate) {
      const daysUntilDue = Math.max(0, (new Date(item.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue < 1) {
        priorityScore += 3; // Due within 24 hours
      } else if (daysUntilDue < 3) {
        priorityScore += 2; // Due within 3 days
      } else if (daysUntilDue < 7) {
        priorityScore += 1; // Due within a week
      }
    }
    
    // Factor 5: Previously struggled item (+2)
    if (item.previouslyStruggled) {
      priorityScore += 2;
    }
    
    // Factor 6: New content that hasn't been studied yet (+1)
    if (!item.lastStudied) {
      priorityScore += 1;
    }
    
    // Save priority score and mapping to priority level
    item.priorityScore = priorityScore;
    
    if (priorityScore >= 10) {
      item.priority = 'critical';
    } else if (priorityScore >= 8) {
      item.priority = 'high';
    } else if (priorityScore >= 5) {
      item.priority = 'medium';
    } else if (priorityScore >= 3) {
      item.priority = 'low';
    } else {
      item.priority = 'optional';
    }
  });
  
  // Sort by priority score (descending)
  return prioritizedItems.sort((a, b) => b.priorityScore - a.priorityScore);
};

// PUBLIC_INTERFACE
/**
 * Group content items into focused study sessions
 * @param {Array} prioritizedItems - Already prioritized content items
 * @param {number} sessionDuration - Target session duration in minutes
 * @returns {Array} - Content grouped into study sessions
 */
export const groupContentIntoSessions = (prioritizedItems, sessionDuration = 25) => {
  if (!prioritizedItems || prioritizedItems.length === 0) {
    return [];
  }
  
  const sessions = [];
  let currentSession = {
    items: [],
    estimatedDuration: 0,
    priority: 'medium'
  };
  
  // Assign items to sessions based on estimated duration and priority
  prioritizedItems.forEach(item => {
    const itemDuration = item.estimatedDuration || 10; // Default 10 minutes
    
    // If adding this item would exceed session duration, start a new session
    if (currentSession.estimatedDuration + itemDuration > sessionDuration && currentSession.items.length > 0) {
      // Set the overall session priority based on highest priority item
      const highestPriorityItem = currentSession.items.reduce(
        (highest, item) => (getPriorityValue(item.priority) > getPriorityValue(highest.priority) ? item : highest),
        { priority: 'low' }
      );
      currentSession.priority = highestPriorityItem.priority;
      
      // Add current session to sessions array
      sessions.push({...currentSession});
      
      // Start new session
      currentSession = {
        items: [],
        estimatedDuration: 0,
        priority: 'medium'
      };
    }
    
    // Add item to current session
    currentSession.items.push(item);
    currentSession.estimatedDuration += itemDuration;
  });
  
  // Add the final session if it has any items
  if (currentSession.items.length > 0) {
    // Set the overall session priority based on highest priority item
    const highestPriorityItem = currentSession.items.reduce(
      (highest, item) => (getPriorityValue(item.priority) > getPriorityValue(highest.priority) ? item : highest),
      { priority: 'low' }
    );
    currentSession.priority = highestPriorityItem.priority;
    
    sessions.push(currentSession);
  }
  
  return sessions;
};

// Helper function to convert priority string to numeric value for comparisons
function getPriorityValue(priority) {
  const priorities = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    optional: 0
  };
  return priorities[priority] || 0;
}

// PUBLIC_INTERFACE
/**
 * Recommend content sequence based on learning theory
 * @param {Array} contentItems - Content items to sequence
 * @returns {Array} - Content items in recommended sequence
 */
export const recommendContentSequence = (contentItems) => {
  if (!contentItems || contentItems.length === 0) {
    return [];
  }
  
  // Group items by subject
  const bySubject = contentItems.reduce((groups, item) => {
    const subject = item.subject || 'general';
    if (!groups[subject]) {
      groups[subject] = [];
    }
    groups[subject].push(item);
    return groups;
  }, {});
  
  // Within each subject, arrange by dependency and difficulty
  Object.keys(bySubject).forEach(subject => {
    bySubject[subject].sort((a, b) => {
      // First by dependencies
      if (a.dependsOn && a.dependsOn.includes(b.id)) return 1;
      if (b.dependsOn && b.dependsOn.includes(a.id)) return -1;
      
      // Then by difficulty (shallow to deep)
      return a.difficulty - b.difficulty;
    });
  });
  
  // Interleave subjects for better learning retention (spaced repetition)
  const result = [];
  let hasMore = true;
  let index = 0;
  const subjects = Object.keys(bySubject);
  
  while (hasMore) {
    hasMore = false;
    subjects.forEach(subject => {
      if (index < bySubject[subject].length) {
        result.push(bySubject[subject][index]);
        hasMore = true;
      }
    });
    index++;
  }
  
  return result;
};

// PUBLIC_INTERFACE
/**
 * Generate a balanced study mix based on user performance
 * @param {Array} contentItems - Available content items
 * @param {Object} performance - User performance metrics
 * @returns {Array} - Balanced study mix
 */
export const generateBalancedStudyMix = (contentItems, performance) => {
  if (!contentItems || contentItems.length === 0) {
    return [];
  }
  
  // Default distribution if no performance data
  let weakAreaPercentage = 60;
  let strongAreaPercentage = 20;
  let newContentPercentage = 20;
  
  // Adjust based on performance data
  if (performance) {
    const avgScore = performance.averageScore || 70;
    
    if (avgScore < 60) {
      // Struggling - focus more on weak areas
      weakAreaPercentage = 70;
      strongAreaPercentage = 15;
      newContentPercentage = 15;
    } else if (avgScore > 85) {
      // Doing very well - more new content, less weak area review
      weakAreaPercentage = 40;
      strongAreaPercentage = 20;
      newContentPercentage = 40;
    }
  }
  
  const weakAreas = performance?.weakAreas || [];
  const strongAreas = performance?.strongAreas || [];
  
  // Group content by category
  const weakAreaItems = contentItems.filter(item => weakAreas.includes(item.subject));
  const strongAreaItems = contentItems.filter(item => strongAreas.includes(item.subject));
  const newContentItems = contentItems.filter(item => 
    !weakAreas.includes(item.subject) && !strongAreas.includes(item.subject)
  );
  
  // Calculate how many of each type to include
  const totalItems = Math.min(contentItems.length, 10); // Max items to return
  const weakCount = Math.round(totalItems * (weakAreaPercentage / 100));
  const strongCount = Math.round(totalItems * (strongAreaPercentage / 100));
  let newCount = Math.round(totalItems * (newContentPercentage / 100));
  
  // Adjust counts if we don't have enough items in a category
  if (weakAreaItems.length < weakCount) {
    newCount += weakCount - weakAreaItems.length;
  }
  if (strongAreaItems.length < strongCount) {
    newCount += strongCount - strongAreaItems.length;
  }
  
  // Grab items from each category
  const selectedWeak = weakAreaItems.slice(0, Math.min(weakCount, weakAreaItems.length));
  const selectedStrong = strongAreaItems.slice(0, Math.min(strongCount, strongAreaItems.length));
  const selectedNew = newContentItems.slice(0, Math.min(newCount, newContentItems.length));
  
  // Combine and tag items
  return [
    ...selectedWeak.map(item => ({...item, category: 'weak-area'})),
    ...selectedStrong.map(item => ({...item, category: 'strong-area'})),
    ...selectedNew.map(item => ({...item, category: 'new-content'}))
  ];
};
