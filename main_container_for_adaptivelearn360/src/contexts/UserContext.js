import React, { createContext, useState, useContext, useEffect } from 'react';

// Mock user data - would be fetched from API in a real application
const mockUserData = {
  id: 'user123',
  name: 'Alex Johnson',
  preferences: {
    colorScheme: 'default',
    fontSize: 'medium',
    notifications: true,
    studyDuration: 25, // minutes
    breakDuration: 5, // minutes
  },
  performance: {
    averageScore: 75,
    completionRate: 0.68,
    studyStreak: 5,
    weakAreas: ['calculus', 'organic_chemistry'],
    strongAreas: ['statistics', 'physics'],
  },
  habits: {
    preferredStudyTime: {
      morning: 0.7,
      afternoon: 0.3,
      evening: 0.9,
      night: 0.2,
    },
    averageSessionLength: 35, // minutes
    consistencyScore: 0.65,
    distractionLevel: 'medium',
    completionHistory: [
      { date: '2023-05-20', sessionsCompleted: 3, duration: 95 },
      { date: '2023-05-21', sessionsCompleted: 2, duration: 70 },
      { date: '2023-05-22', sessionsCompleted: 4, duration: 120 },
    ],
  },
  accessibility: {
    highContrast: false,
    screenReader: false,
    motionReduced: false,
    largeText: false,
  }
};

// Create the context
const UserContext = createContext();

// PUBLIC_INTERFACE
export function UserProvider({ children }) {
  /**
   * Provider component that wraps app and makes user data available to any
   * child component that calls the useUser hook.
   */
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulate API call to fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setUserData(mockUserData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load user data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Update user data
  const updateUserData = (newData) => {
    setUserData(prevData => ({
      ...prevData,
      ...newData
    }));
  };

  // Update user preferences
  const updatePreferences = (newPreferences) => {
    setUserData(prevData => ({
      ...prevData,
      preferences: {
        ...prevData.preferences,
        ...newPreferences
      }
    }));
  };

  // Update accessibility settings
  const updateAccessibility = (newSettings) => {
    setUserData(prevData => ({
      ...prevData,
      accessibility: {
        ...prevData.accessibility,
        ...newSettings
      }
    }));
  };

  // Track performance metrics
  const trackPerformance = (metric, value) => {
    setUserData(prevData => ({
      ...prevData,
      performance: {
        ...prevData.performance,
        [metric]: value
      }
    }));
  };

  // Add a study session to habits history
  const addStudySession = (sessionData) => {
    const today = new Date().toISOString().split('T')[0];
    
    setUserData(prevData => {
      // Check if there's already an entry for today
      const existingEntryIndex = prevData.habits.completionHistory.findIndex(
        entry => entry.date === today
      );
      
      let updatedHistory;
      
      if (existingEntryIndex >= 0) {
        // Update existing entry
        updatedHistory = [...prevData.habits.completionHistory];
        updatedHistory[existingEntryIndex] = {
          ...updatedHistory[existingEntryIndex],
          sessionsCompleted: updatedHistory[existingEntryIndex].sessionsCompleted + 1,
          duration: updatedHistory[existingEntryIndex].duration + sessionData.duration
        };
      } else {
        // Create new entry for today
        updatedHistory = [
          ...prevData.habits.completionHistory,
          {
            date: today,
            sessionsCompleted: 1,
            duration: sessionData.duration
          }
        ];
      }
      
      return {
        ...prevData,
        habits: {
          ...prevData.habits,
          completionHistory: updatedHistory
        }
      };
    });
  };

  const value = {
    userData,
    loading,
    error,
    updateUserData,
    updatePreferences,
    updateAccessibility,
    trackPerformance,
    addStudySession
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useUser() {
  /**
   * Custom hook that returns user context data
   */
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
