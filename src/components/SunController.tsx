import React, { useState, useEffect } from 'react';
import { Sun, Clock, Calendar, MapPin, RotateCcw, Play, Pause } from 'lucide-react';
import { 
  calculateSunPosition, 
  getCurrentSunPosition, 
  isDayTime,
  SWEDEN_LOCATION,
  type SunPosition 
} from '../utils/sunPosition';

interface SunControllerProps {
  onSunPositionChange: (position: SunPosition) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const SunController: React.FC<SunControllerProps> = ({
  onSunPositionChange,
  isOpen,
  onToggle
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());  const [selectedMinute, setSelectedMinute] = useState(new Date().getMinutes());
  const [isRealTime, setIsRealTime] = useState(true);  const [isAnimating, setIsAnimating] = useState(false);
  const [animationId, setAnimationId] = useState<number | null>(null);
  const [sunPosition, setSunPosition] = useState<SunPosition>(() => getCurrentSunPosition());
  // Update real-time clock
  useEffect(() => {
    if (!isRealTime) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setSelectedHour(now.getHours());
      setSelectedMinute(now.getMinutes());
      
      const newSunPosition = getCurrentSunPosition();
      setSunPosition(newSunPosition);
      onSunPositionChange(newSunPosition);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isRealTime, onSunPositionChange]);  // Animation effect
  useEffect(() => {
    if (!isAnimating) {
      // Cancel animation if it exists
      if (animationId) {
        cancelAnimationFrame(animationId);
        setAnimationId(null);
      }
      return;
    }
    
    // Calculate starting time in hours (current selectedHour + selectedMinute/60)
    const startTimeHours = selectedHour + selectedMinute / 60;
    const endTimeHours = 24; // End of day
    const totalHoursToAnimate = endTimeHours - startTimeHours;
    
    // If we're already at or past the end of day, don't animate
    if (totalHoursToAnimate <= 0) {
      setIsAnimating(false);
      return;
    }
    
    const animationDuration = totalHoursToAnimate * 500; // 500ms per hour for smooth animation
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1); // Clamp to 1
      
      // Calculate current time in the day
      const currentTimeHours = startTimeHours + (totalHoursToAnimate * progress);
      const hours = Math.floor(currentTimeHours) % 24;
      const minutes = Math.floor((currentTimeHours - Math.floor(currentTimeHours)) * 60);
      
      setSelectedHour(hours);
      setSelectedMinute(minutes);
      
      if (progress < 1 && isAnimating) {
        const nextAnimationId = requestAnimationFrame(animate);
        setAnimationId(nextAnimationId);
      } else {
        // Animation completed or was stopped
        setIsAnimating(false);
        setAnimationId(null);
        // Set final time to end of day
        setSelectedHour(23);
        setSelectedMinute(59);
      }
    };
    
    const initialAnimationId = requestAnimationFrame(animate);
    setAnimationId(initialAnimationId);
    
    return () => {
      if (initialAnimationId) {
        cancelAnimationFrame(initialAnimationId);
      }
    };
  }, [isAnimating, selectedHour, selectedMinute]);

  // Update sun position when manual controls change
  useEffect(() => {
    if (isRealTime) return;
    
    const customDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      selectedHour,
      selectedMinute
    );
    
    const newSunPosition = calculateSunPosition(customDate);
    setSunPosition(newSunPosition);
    onSunPositionChange(newSunPosition);
  }, [selectedDate, selectedHour, selectedMinute, isRealTime, onSunPositionChange]);  const handleRealTimeToggle = () => {
    setIsAnimating(false); // Stop animation when toggling
    setIsRealTime(!isRealTime);
    if (!isRealTime) {
      // Switching to real-time
      const now = new Date();
      setCurrentTime(now);
      setSelectedDate(now);
      setSelectedHour(now.getHours());
      setSelectedMinute(now.getMinutes());
    }
  };

  const resetToNow = () => {
    const now = new Date();
    setCurrentTime(now);
    setSelectedDate(now);
    setSelectedHour(now.getHours());
    setSelectedMinute(now.getMinutes());
    setIsRealTime(true);
    setIsAnimating(false);
  };
  const animateDay = () => {
    if (isAnimating) {
      // Stop animation
      setIsAnimating(false);
    } else {
      // Start animation
      setIsRealTime(false);
      setIsAnimating(true);
    }
  };

  const formatTime = (hours: number, minutes: number) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv-SE'); // Swedish date format
  };

  const getTimeOfDayLabel = () => {
    if (sunPosition.elevation > 30) return 'Day';
    if (sunPosition.elevation > 6) return 'Morning/Evening';
    if (sunPosition.elevation > -6) return 'Twilight';
    if (sunPosition.elevation > -12) return 'Dusk/Dawn';
    return 'Night';
  };

  if (!isOpen) {
    return null; // Don't render anything when closed since we control it from toolbar
  }

  return (
    <div className="fixed left-4 top-4 z-50 w-80">
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sun className="w-5 h-5 text-amber-400" />
            <h3 className="text-white font-semibold">Sun Controller</h3>
          </div>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        {/* Location Info */}
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">Stockholm, Sweden</span>
          </div>
          <div className="text-xs text-gray-400">
            {SWEDEN_LOCATION.latitude.toFixed(2)}°N, {SWEDEN_LOCATION.longitude.toFixed(2)}°E
          </div>
        </div>

        {/* Real-time Toggle */}
        <div className="mb-4">
          <button
            onClick={handleRealTimeToggle}
            className={`w-full flex items-center justify-center space-x-2 p-3 rounded-lg transition-all ${
              isRealTime 
                ? 'bg-green-500/20 border border-green-500/50 text-green-400' 
                : 'bg-gray-700/50 border border-gray-600/50 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {isRealTime ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span>{isRealTime ? 'Real-time' : 'Manual Control'}</span>
          </button>
        </div>        {/* Date Control */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <label className="text-sm text-gray-300">Date</label>
          </div>
          <div className="space-y-2">
            <input
              type="date"
              value={formatDate(selectedDate)}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              disabled={isRealTime || isAnimating}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Day of Year</span>
                <span>{Math.floor((selectedDate.getTime() - new Date(selectedDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))}</span>
              </div>
              <input
                type="range"
                min="1"
                max="365"
                value={Math.floor((selectedDate.getTime() - new Date(selectedDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))}
                onChange={(e) => {
                  const dayOfYear = parseInt(e.target.value);
                  const newDate = new Date(selectedDate.getFullYear(), 0, dayOfYear);
                  setSelectedDate(newDate);
                }}
                disabled={isRealTime || isAnimating}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed slider"
              />
            </div>
          </div>
        </div>        {/* Time Control */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <label className="text-sm text-gray-300">Time</label>
            <span className="text-sm text-amber-400 ml-auto">
              {formatTime(selectedHour, selectedMinute)}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Hour</span>
              <span>{(selectedHour + selectedMinute / 60).toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="0.25"
              value={selectedHour + selectedMinute / 60}
              onChange={(e) => {
                const totalHours = parseFloat(e.target.value);
                const hours = Math.floor(totalHours);
                const minutes = Math.round((totalHours - hours) * 60);
                setSelectedHour(hours === 24 ? 0 : hours);
                setSelectedMinute(minutes === 60 ? 0 : minutes);
              }}
              disabled={isRealTime}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed slider"
            />
          </div>
        </div>

        {/* Sun Position Info */}
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Sun Position</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isDayTime(sunPosition) 
                ? 'bg-amber-500/20 text-amber-400' 
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {getTimeOfDayLabel()}
            </span>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>Elevation: {sunPosition.elevation.toFixed(1)}°</div>
            <div>Azimuth: {sunPosition.azimuth.toFixed(1)}°</div>
            <div className="text-xs text-gray-500">
              XYZ: ({sunPosition.x.toFixed(1)}, {sunPosition.y.toFixed(1)}, {sunPosition.z.toFixed(1)})
            </div>
          </div>
        </div>        {/* Quick Actions */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <button
              onClick={resetToNow}
              className="flex-1 flex items-center justify-center space-x-2 p-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm">Now</span>
            </button>
            <button
              onClick={() => {
                setSelectedHour(12);
                setSelectedMinute(0);
                setIsRealTime(false);
                setIsAnimating(false);
              }}
              className="flex-1 flex items-center justify-center space-x-2 p-2 bg-amber-500/20 border border-amber-500/50 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
            >
              <Sun className="w-4 h-4" />
              <span className="text-sm">Noon</span>
            </button>
          </div>
          <button
            onClick={animateDay}
            disabled={isRealTime}
            className={`w-full flex items-center justify-center space-x-2 p-2 rounded-lg transition-all ${
              isAnimating
                ? 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30'
                : 'bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >            {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="text-sm">
              {isAnimating ? 'Stop Animation' : 'Animate to Sunset'}
            </span>
          </button>
        </div>

        {/* Current Time Display */}
        {isRealTime && (
          <div className="mt-3 text-center text-sm text-gray-400">
            Live: {formatTime(currentTime.getHours(), currentTime.getMinutes())}
          </div>
        )}
      </div>
    </div>
  );
};
