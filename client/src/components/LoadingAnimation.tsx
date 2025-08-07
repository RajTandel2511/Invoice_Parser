import React, { useState } from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '../loading-animation.json';

interface LoadingAnimationProps {
  isVisible: boolean;
  message?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  isVisible, 
  message = "Processing invoices..." 
}) => {
  const [animationError, setAnimationError] = useState(false);
  
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center space-y-6 max-w-xl mx-4 shadow-2xl">
        <div className="w-96 h-32 flex items-center justify-center">
          {!animationError ? (
            <Lottie 
              animationData={loadingAnimation}
              loop={true}
              autoplay={true}
              style={{ width: '100%', height: '100%' }}
              onError={(error) => {
                console.error('Lottie animation error:', error);
                setAnimationError(true);
              }}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
        <div className="text-center space-y-3">
          <p className="text-foreground text-lg font-medium">
            {message}
          </p>
          <p className="text-muted-foreground text-sm">
            This may take a few moments...
          </p>
        </div>
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}; 