import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';

// Create the context
const AdaptiveContext = createContext();

// PUBLIC_INTERFACE
export function AdaptiveProvider({ children }) {
  /**
   * Provider component that manages adaptive settings and behavior based on user data
   */
  const { userData, loading } = useUser();
  const [deviceType, setDeviceType] = useState('desktop');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [adaptiveLayout, setAdaptiveLayout] = useState('standard');
  const [contentPriority, setContentPriority] = useState([]);
  const [focusMode, setFocusMode] = useState(false);
  const [reminderSettings, setReminderSettings] = useState({
    enabled: true,
    frequency: 'medium',
    smartTiming: true
  });

  // Detect device type
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 480) {
        setDeviceType('mobile');
      } else if (window.innerWidth <= 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    // Set initial device type
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Determine time of day
  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      
      if (hour >= 5 && hour < 12) {
        setTimeOfDay('morning');
      } else if (hour >= 12 && hour < 17) {
        setTimeOfDay('afternoon');
      } else if (hour >= 17 && hour < 21) {
        setTimeOfDay('evening');
      } else {
        setTimeOfDay('night');
      }
    };

    updateTimeOfDay();
    
    // Update every hour
    const interval = setInterval(updateTimeOfDay, 60 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Set adaptive layout based on user data, device type, and time of day
  useEffect(() => {
    if (loading || !userData) return;

    // Determine the most appropriate layout based on multiple factors
    const determineLayout = () => {
      // Focus mode takes precedence
      if (focusMode) return 'focused';

      // Check device constraints
      if (deviceType === 'mobile') return 'compact';

      // Check user habits for current time period
      const habits = userData.habits.preferredStudyTime;
      const preferenceScore = habits[timeOfDay] || 0;
      
      // If user is highly active during this time period, offer more focused interface
      if (preferenceScore > 0.7) {
        return userData.performance.averageScore > 70 ? 'advanced' : 'guided';
      }
      
      // Default to standard layout
      return 'standard';
    };

    setAdaptiveLayout(determineLayout());
  }, [userData, loading, deviceType, timeOfDay, focusMode]);

  // Prioritize content based on user performance
  useEffect(() => {
    if (loading || !userData) return;

    // Sort content areas by priority (focusing on weak areas first)
    const weakAreas = userData.performance.weakAreas || [];
    const strongAreas = userData.performance.strongAreas || [];
    
    // Create prioritized list
    const priorityList = [
      ...weakAreas.map(area => ({ id: area, priority: 'high', type: 'weak-area' })),
      ...strongAreas.map(area => ({ id: area, priority: 'medium', type: 'strong-area' }))
    ];
    
    setContentPriority(priorityList);
  }, [userData, loading]);

  // Toggle focus mode
  const toggleFocusMode = () => {
    setFocusMode(prevMode => !prevMode);
  };

  // Update reminder settings
  const updateReminderSettings = (newSettings) => {
    setReminderSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings
    }));
  };

  const value = {
    deviceType,
    timeOfDay,
    adaptiveLayout,
    contentPriority,
    focusMode,
    reminderSettings,
    toggleFocusMode,
    updateReminderSettings
  };

  return (
    <AdaptiveContext.Provider value={value}>
      {children}
    </AdaptiveContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useAdaptive() {
  /**
   * Custom hook that returns adaptive context data
   */
  const context = useContext(AdaptiveContext);
  if (context === undefined) {
    throw new Error('useAdaptive must be used within an AdaptiveProvider');
  }
  return context;
}
