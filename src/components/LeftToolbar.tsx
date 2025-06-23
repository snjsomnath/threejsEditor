import React from 'react';
import { Settings, Pencil, Download, Trash2 } from 'lucide-react';
import { ToolbarButton } from './ToolbarButton';

interface LeftToolbarProps {
  isDrawing: boolean;
  isInitialized: boolean;
  hasBuildings: boolean;
  onStartDrawing: () => void;
  onShowConfig: () => void;
  onExport: () => void;
  onClearAll: () => void;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  isDrawing,
  isInitialized,
  hasBuildings,
  onStartDrawing,
  onShowConfig,
  onExport,
  onClearAll
}) => {
  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 transform-gpu">
      <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl p-2">
        <div className="flex flex-col space-y-2">
          {/* Building Config */}
          <ToolbarButton
            icon={Settings}
            tooltip="Building Config"
            onClick={onShowConfig}
            disabled={!isInitialized}
            variant="default"
            keyboardShortcut="C"
          />

          {/* Draw Building */}
          <ToolbarButton
            icon={Pencil}
            tooltip={isDrawing ? "Currently Drawing" : "Draw Building"}
            onClick={onStartDrawing}
            disabled={!isInitialized || isDrawing}
            variant={isDrawing ? "active" : "primary"}
            keyboardShortcut="D"
          />

          {/* Divider */}
          <div className="h-px bg-gray-700/50 mx-2 my-1" />

          {/* Export */}
          <ToolbarButton
            icon={Download}
            tooltip="Export Buildings"
            onClick={onExport}
            disabled={!hasBuildings}
            variant="success"
            keyboardShortcut="E"
          />

          {/* Clear All */}
          <ToolbarButton
            icon={Trash2}
            tooltip="Clear All Buildings"
            onClick={onClearAll}
            disabled={!hasBuildings}
            variant="danger"
            keyboardShortcut="Del"
          />
        </div>
      </div>
    </div>
  );
};