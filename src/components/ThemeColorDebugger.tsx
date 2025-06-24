import React, { useEffect, useState } from 'react';
import { getThemeColorAsHex, debugThemeColors, testThemeColorSystem } from '../utils/themeColors';

interface ThemeColorDebuggerProps {
  isVisible: boolean;
  onClose: () => void;
}

const ThemeColorDebugger: React.FC<ThemeColorDebuggerProps> = ({ isVisible, onClose }) => {
  const [testResults, setTestResults] = useState<Array<{
    variable: string;
    cssValue: string;
    hexValue: string;
    isWorking: boolean;
  }>>([]);

  useEffect(() => {
    if (isVisible) {
      runTests();
    }
  }, [isVisible]);

  const runTests = () => {
    const testVars = [
      '--color-primary',
      '--color-background',
      '--color-building-default',
      '--color-scene-background',
      '--color-sun-light',
      '--color-ambient-light',
      '--color-drawing-point',
      '--color-text-label'
    ];

    const results = testVars.map(varName => {
      const cssValue = getComputedStyle(document.documentElement)
        .getPropertyValue(varName).trim();
      const hexValue = getThemeColorAsHex(varName, 0x000000);
      
      return {
        variable: varName,
        cssValue: cssValue || '(not found)',
        hexValue: `0x${hexValue.toString(16).padStart(6, '0')}`,
        isWorking: cssValue !== '' && hexValue !== 0x000000
      };
    });

    setTestResults(results);
  };

  const handleDebugConsole = () => {
    debugThemeColors();
    testThemeColorSystem();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold">Theme Color Debugger</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-300"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-2 mb-4">
          {testResults.map((result) => (
            <div 
              key={result.variable}
              className={`p-2 rounded ${result.isWorking ? 'bg-green-900' : 'bg-red-900'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-mono text-sm">{result.variable}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  result.isWorking ? 'bg-green-600' : 'bg-red-600'
                } text-white`}>
                  {result.isWorking ? 'OK' : 'FAIL'}
                </span>
              </div>
              <div className="text-gray-300 text-xs mt-1">
                CSS: {result.cssValue}
              </div>
              <div className="text-gray-300 text-xs">
                Hex: {result.hexValue}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={runTests}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Re-test
          </button>
          <button
            onClick={handleDebugConsole}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
          >
            Debug to Console
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeColorDebugger;
