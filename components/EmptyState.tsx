'use client';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-8 sm:py-12 px-4 ${className}`}>
      {icon && (
        <div className="text-6xl sm:text-7xl mb-4 opacity-50">
          {icon}
        </div>
      )}
      <h3 className="text-lg sm:text-xl font-semibold text-gray-200 mb-2">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-gray-400 mb-6 max-w-md mx-auto">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors font-medium shadow-md"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

