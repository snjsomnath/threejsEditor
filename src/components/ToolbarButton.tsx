import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ToolbarButtonProps {
  icon: LucideIcon;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'active';
  keyboardShortcut?: string;
}

const variantStyles = {
  default: 'hover:bg-gray-700/80 hover:text-white text-gray-300',
  primary: 'hover:bg-blue-600/80 hover:text-white text-blue-400',
  success: 'hover:bg-green-600/80 hover:text-white text-green-400',
  danger: 'hover:bg-red-600/80 hover:text-white text-red-400',
  active: 'bg-blue-600/60 text-blue-300 hover:bg-blue-600/80'
};

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon: Icon,
  tooltip,
  onClick,
  disabled = false,
  variant = 'default',
  keyboardShortcut
}) => {
  return (
    <div className="relative group/tooltip">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          transition-colors duration-150 ease-out
          disabled:opacity-40 disabled:cursor-not-allowed
          ${disabled ? 'text-gray-600' : variantStyles[variant]}
        `}
      >
        <Icon className="w-5 h-5" />
      </button>

      {/* Tooltip - CSS only hover */}
      {!disabled && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50
                        opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible
                        transition-all duration-200 ease-out delay-300
                        bg-gray-900/95 backdrop-blur-sm text-white text-sm
                        px-3 py-2 rounded-lg border border-gray-600 shadow-xl
                        whitespace-nowrap pointer-events-none">
          {tooltip}
          {keyboardShortcut && (
            <span className="ml-2 text-gray-400 text-xs">({keyboardShortcut})</span>
          )}
          {/* Arrow */}
          <div className="absolute right-full top-1/2 -translate-y-1/2
                          border-4 border-transparent border-r-gray-900/95" />
        </div>
      )}
    </div>
  );
};