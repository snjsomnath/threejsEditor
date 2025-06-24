/**
 * CSS Theme Color Utilities
 * 
 * This module provides utility functions for working with CSS variables
 * within the Three.js application. It helps convert CSS variables to
 * Three.js compatible color formats.
 */

import * as THREE from 'three';

/**
 * Gets a CSS variable value and returns it as a hex color number for Three.js
 * @param variableName CSS variable name (including --prefix)
 * @param fallback Fallback color in hex format (0xRRGGBB)
 */
export function getThemeColorAsHex(variableName: string, fallback: number = 0xffffff): number {
  if (typeof document === 'undefined') return fallback;
  
  const cssColor = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName).trim();
    
  if (!cssColor) return fallback;
  
  try {
    // Handle different CSS color formats
    if (cssColor.startsWith('#')) {
      // Handle hex format (#fff or #ffffff)
      return parseInt(cssColor.replace('#', ''), 16);
    } else if (cssColor.startsWith('rgb')) {
      // Handle rgb/rgba format
      const rgbMatch = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        return (r << 16) + (g << 8) + b;
      }
    }
    
    // If we can't parse the color, create a temporary element to have the browser parse it
    const tempEl = document.createElement('div');
    tempEl.style.color = cssColor;
    document.body.appendChild(tempEl);
    const computedColor = getComputedStyle(tempEl).color;
    document.body.removeChild(tempEl);
    
    // Now parse the computed RGB color
    const rgbMatch = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return (r << 16) + (g << 8) + b;
    }
    
    // If all else fails, return fallback
    return fallback;
  } catch (error) {
    console.warn(`Failed to parse color for ${variableName}:`, error);
    return fallback;
  }
}

/**
 * Gets a CSS variable and returns it as a THREE.Color object
 * @param variableName CSS variable name (including --prefix)
 * @param fallback Fallback color in hex format (0xRRGGBB)
 */
export function getThemeColorAsThreeColor(variableName: string, fallback: number = 0xffffff): THREE.Color {
  return new THREE.Color(getThemeColorAsHex(variableName, fallback));
}

/**
 * Gets multiple CSS variables and returns them as an object with hex number values
 * @param variables Object with keys as desired property names and values as CSS variable names
 * @param fallbacks Object with fallback colors
 */
export function getThemeColors(
  variables: Record<string, string>, 
  fallbacks: Record<string, number> = {}
): Record<string, number> {
  const result: Record<string, number> = {};
  
  Object.entries(variables).forEach(([key, varName]) => {
    result[key] = getThemeColorAsHex(varName, fallbacks[key] ?? 0xffffff);
  });
  
  return result;
}

/**
 * Updates the theme colors in the application
 * This can be called when theme changes
 */
export function updateThemeColors(): void {
  // Invalidate CSS cache by forcing a style recalculation
  if (typeof document !== 'undefined') {
    document.documentElement.style.display = 'none';
    // Trigger reflow
    void document.documentElement.offsetHeight;
    document.documentElement.style.display = '';
  }
  
  // Event to notify components that theme colors have changed
  window.dispatchEvent(new CustomEvent('theme-colors-changed'));
  
  console.log('Theme colors updated');
}

/**
 * Sets up a listener for theme changes
 * @param callback Function to run when theme changes
 */
export function addThemeChangeListener(callback: () => void): () => void {
  const handleThemeChange = () => {
    callback();
  };
  
  window.addEventListener('theme-colors-changed', handleThemeChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('theme-colors-changed', handleThemeChange);
  };
}

/**
 * Toggles between light and dark themes
 * @returns The name of the new active theme
 */
export function toggleTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  
  const isDarkTheme = document.documentElement.classList.contains('dark-theme');
  
  if (isDarkTheme) {
    document.documentElement.classList.remove('dark-theme');
    updateThemeColors();
    return 'light';
  } else {
    document.documentElement.classList.add('dark-theme');
    updateThemeColors();
    return 'dark';
  }
}

/**
 * Debug function to output all theme colors to the console
 * Useful for troubleshooting theme issues
 * @param variables Array of CSS variable names to debug
 */
export function debugThemeColors(variables: string[] = []): void {
  if (typeof document === 'undefined') return;
  
  // If no variables provided, debug common ones
  if (variables.length === 0) {
    variables = [
      '--color-sun-light',
      '--color-ambient-light',
      '--color-hemisphere-sky',
      '--color-hemisphere-ground',
      '--color-ground',
      '--color-grid',
      '--color-scene-background'
    ];
  }
  
  console.group('Theme Colors Debug');
  
  // Current theme
  const theme = document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light';
  console.log(`Current theme: ${theme}`);
  
  // Log each variable's CSS value and parsed Three.js value
  variables.forEach(varName => {
    const cssValue = getComputedStyle(document.documentElement)
      .getPropertyValue(varName).trim();
    const threeJsValue = getThemeColorAsHex(varName).toString(16).padStart(6, '0');
    
    console.log(
      `${varName}:`,
      cssValue || '(not set)',
      `→ 0x${threeJsValue}`
    );
  });
  
  console.groupEnd();
}
