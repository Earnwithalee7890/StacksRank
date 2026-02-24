"use client";

import React, { useState, ReactNode, useEffect } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  retryDelayMs?: number; // optional delay before retrying
}

export default function ErrorBoundary({
  children,
  retryDelayMs = 1000,
}: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const resetError = () => {
    setHasError(false);
    setErrorMessage(null);
  };

  useEffect(() => {
    if (hasError && retryCount === 0) {
      const timer = setTimeout(() => {
        setRetryCount(1);
        resetError();
      }, retryDelayMs);
      return () => clearTimeout(timer);
    }
  }, [hasError, retryCount, retryDelayMs]);

  const ErrorWrapper = () => {
    try {
      return <>{children}</>;
    } catch (err) {
      console.error("ErrorBoundary caught an error:", err);
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : String(err));
      return null;
    }
  };

  if (hasError) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded">
        <h2>Something went wrong. Retrying...</h2>
        {errorMessage && <p>{errorMessage}</p>}
      </div>
    );
  }

  return <ErrorWrapper />;
}
