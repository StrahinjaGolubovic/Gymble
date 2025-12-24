'use client';

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  className?: string;
  color?: 'primary' | 'green' | 'yellow' | 'red';
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  showLabel = true,
  label,
  className = '',
  color = 'primary',
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const colorClasses = {
    primary: {
      track: 'stroke-primary-500/20',
      progress: 'stroke-primary-500',
      text: 'text-primary-400',
    },
    green: {
      track: 'stroke-green-500/20',
      progress: 'stroke-green-500',
      text: 'text-green-400',
    },
    yellow: {
      track: 'stroke-yellow-500/20',
      progress: 'stroke-yellow-500',
      text: 'text-yellow-400',
    },
    red: {
      track: 'stroke-red-500/20',
      progress: 'stroke-red-500',
      text: 'text-red-400',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={colors.track}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colors.progress} transition-all duration-500 ease-out`}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl sm:text-3xl font-bold ${colors.text}`}>
            {Math.round(value)}%
          </span>
          {label && (
            <span className="text-xs text-gray-400 mt-1">{label}</span>
          )}
        </div>
      )}
    </div>
  );
}

