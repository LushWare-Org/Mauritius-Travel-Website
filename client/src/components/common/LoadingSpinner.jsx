import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...', fullScreen = false }) => {
  // Size mapping
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-10 w-10',
    large: 'h-16 w-16',
    xlarge: 'h-24 w-24'
  };

  // Border size mapping
  const borderClasses = {
    small: 'border-2',
    medium: 'border-3',
    large: 'border-4',
    xlarge: 'border-6'
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.medium;
  const borderSize = borderClasses[size] || borderClasses.medium;

  const SpinnerContent = () => (
    <div className={`animate-spin rounded-full ${borderSize} border-t-transparent border-blue-600 ${spinnerSize}`}></div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-50 bg-opacity-75 flex flex-col items-center justify-center z-50">
        <SpinnerContent />
        {text && (
          <div className="mt-4">
            <p className="text-gray-700 font-medium">{text}</p>
            <p className="text-gray-500 text-sm mt-1">Please wait a moment...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <SpinnerContent />
        {/* Optional: Pulse effect */}
        <div className={`absolute inset-0 rounded-full ${spinnerSize} bg-blue-100 animate-ping opacity-75`}></div>
      </div>
      {text && (
        <div className="mt-4 text-center">
          <p className="text-gray-700 font-medium">{text}</p>
          {size !== 'small' && (
            <p className="text-gray-500 text-sm mt-1">This may take a few seconds</p>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;