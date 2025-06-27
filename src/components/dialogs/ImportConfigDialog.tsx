import React, { useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';

interface ImportConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (config: any) => void;
}

export const ImportConfigDialog: React.FC<ImportConfigDialogProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('Please select a valid JSON file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const config = JSON.parse(text);
      
      // Basic validation - check if it has the expected structure
      if (!Array.isArray(config) && !config.buildings) {
        throw new Error('Invalid configuration format. Expected an array of buildings or an object with a buildings property.');
      }

      onImport(config);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse JSON file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <h2 className="text-lg font-semibold text-white">Import Configuration</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500'
            } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex flex-col items-center space-y-4">
              {isLoading ? (
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
              )}
              
              <div>
                <div className="text-white font-medium mb-1">
                  {isLoading ? 'Processing...' : 'Drop JSON file here'}
                </div>
                <div className="text-gray-400 text-sm mb-3">
                  or click to browse
                </div>
                <button
                  onClick={handleBrowseClick}
                  disabled={isLoading}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors mx-auto"
                >
                  <Upload className="w-4 h-4" />
                  <span>Browse Files</span>
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-600/20 border border-red-600/50 rounded-lg">
              <div className="text-red-400 text-sm">{error}</div>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-400">
            <div className="font-medium mb-1">Supported formats:</div>
            <ul className="space-y-1">
              <li>• Exported building configurations (JSON)</li>
              <li>• Array of building objects</li>
              <li>• Single building configuration</li>
            </ul>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
