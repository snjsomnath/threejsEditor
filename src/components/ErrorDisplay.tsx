import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Copy, Check } from 'lucide-react';

interface ErrorDisplayProps {
  errors: string[];
  onClearErrors: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errors, onClearErrors }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const errorText = errors.join('\n\n');
    navigator.clipboard.writeText(errorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (errors.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 max-w-md bg-red-900/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-red-700 z-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h3 className="text-red-100 font-semibold">Debug Errors</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={copyToClipboard}
            className="p-1 hover:bg-red-800 rounded transition-colors"
            title="Copy errors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-red-300" />
            )}
          </button>
          <button
            onClick={onClearErrors}
            className="p-1 hover:bg-red-800 rounded transition-colors"
            title="Clear errors"
          >
            <X className="w-4 h-4 text-red-300" />
          </button>
        </div>
      </div>
      
      <div className="max-h-60 overflow-y-auto space-y-2">
        {errors.map((error, index) => (
          <div key={index} className="bg-red-800/50 rounded p-2 text-sm text-red-100 font-mono">
            {error}
          </div>
        ))}
      </div>
    </div>
  );
};