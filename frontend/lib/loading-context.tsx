'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  completeLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  // Auto-hide splash screen after initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500); // Show splash screen for 3.5 seconds on initial load

    return () => clearTimeout(timer);
  }, []);

  const completeLoading = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider
      value={{ isLoading, setIsLoading, completeLoading }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    // During SSR or before provider mounts, return default values
    return {
      isLoading: true,
      setIsLoading: () => {},
      completeLoading: () => {},
    };
  }
  return context;
}
