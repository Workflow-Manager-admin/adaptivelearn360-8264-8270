import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { useAdaptive } from './AdaptiveContext';

// Define theme options
const themeOptions = {
  default: {
    main: '#E87A41', // kavia-orange
    background: '#1A1A1A', // kavia-dark
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    border: 'rgba(255, 255, 255, 0.1)',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  },
  highContrast: {
    main: '#FF6D00',
    background: '#000000',
    text: '#ffffff',
    textSecondary: '#ffffff',
    border: '#ffffff',
    success: '#00C853',
    warning: '#FFD600',
    error: '#FF1744',
    info: '#00B0FF',
  },
  night: {
    main: '#BB5A30',
    background: '#121212',
    text: '#E0E0E0',
    textSecondary: 'rgba(224, 224, 224, 0.7)',
    border: 'rgba(224, 224, 224, 0.1)',
    success: '#388E3C',
    warning: '#F57C00',
    error: '#D32F2F',
    info: '#1976D2',
  },
  focus: {
    main: '#78909C',
    background: '#263238',
    text: '#ECEFF1',
    textSecondary: '#B0BEC5',
    border: '#455A64',
    success: '#388E3C',
    warning: '#F57C00',
    error: '#D32F2F',
    info: '#1976D2',
  }
};

// Font size options
const fontSizeOptions = {
  small: {
    base: '0.875rem',
    large: '1.125rem',
    heading: '1.75rem',
    subheading: '1.375rem',
  },
  medium: {
    base: '1rem',
    large: '1.25rem',
    heading: '2rem',
    subheading: '1.5rem',
  },
  large: {
    base: '1.125rem',
    large: '1.5rem',
    heading: '2.25rem',
    subheading: '1.75rem',
  },
  extraLarge: {
    base: '1.25rem',
    large: '1.75rem',
    heading: '2.5rem',
    subheading: '2rem',
  },
};

// Create the context
const ThemeContext = createContext();

// PUBLIC_INTERFACE
export function ThemeProvider({ children }) {
  /**
   * Provider component that handles theme and appearance settings
   */
  const { userData, loading } = useUser();
  const { timeOfDay, adaptiveLayout, focusMode } = useAdaptive();
  
  const [activeTheme, setActiveTheme] = useState('default');
  const [fontSize, setFontSize] = useState('medium');
  const [themeColors, setThemeColors] = useState(themeOptions.default);
  const [fontSizes, setFontSizes] = useState(fontSizeOptions.medium);
  const [animation, setAnimation] = useState('enabled');

  // Apply appropriate theme based on user preferences, time of day, and focus mode
  useEffect(() => {
    if (loading || !userData) return;

    // Apply accessibility settings first (highest priority)
    if (userData.accessibility.highContrast) {
      setActiveTheme('highContrast');
    } 
    // Then check focus mode
    else if (focusMode) {
      setActiveTheme('focus');
    }
    // Then check time of day
    else if (timeOfDay === 'night') {
      setActiveTheme('night');
    }
    // Default theme
    else {
      setActiveTheme('default');
    }
    
    // Set font size based on accessibility settings
    if (userData.accessibility.largeText) {
      setFontSize('extraLarge');
    } else {
      setFontSize(userData.preferences.fontSize || 'medium');
    }
    
    // Set animation preference based on reduced motion setting
    setAnimation(userData.accessibility.motionReduced ? 'reduced' : 'enabled');
    
  }, [userData, loading, timeOfDay, focusMode, adaptiveLayout]);

  // Update theme colors and font sizes when activeTheme or fontSize changes
  useEffect(() => {
    setThemeColors(themeOptions[activeTheme]);
    setFontSizes(fontSizeOptions[fontSize]);
  }, [activeTheme, fontSize]);

  // Method to manually change the theme
  const changeTheme = (themeName) => {
    if (themeOptions[themeName]) {
      setActiveTheme(themeName);
    }
  };

  // Method to manually change font size
  const changeFontSize = (size) => {
    if (fontSizeOptions[size]) {
      setFontSize(size);
    }
  };

  // Method to toggle animation
  const toggleAnimation = () => {
    setAnimation(prev => (prev === 'enabled' ? 'reduced' : 'enabled'));
  };

  const value = {
    activeTheme,
    themeColors,
    fontSize,
    fontSizes,
    animation,
    changeTheme,
    changeFontSize,
    toggleAnimation
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useTheme() {
  /**
   * Custom hook that returns theme context data
   */
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
