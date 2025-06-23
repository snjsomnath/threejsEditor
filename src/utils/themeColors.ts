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
  
  // Convert CSS hex to number (handle both #fff and #ffffff formats)
  try {
    return parseInt(cssColor.replace('#', ''), 16);
  } catch {
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
  // Event to notify components that theme colors have changed
  window.dispatchEvent(new CustomEvent('theme-colors-changed'));
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
