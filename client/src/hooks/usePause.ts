import { useState, useCallback, useEffect } from 'react';

export function usePause() {
  const [isPaused, setIsPaused] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    setShowCountdown(true);
    setCountdownValue(3);
  }, []);

  const unpause = useCallback(() => {
    setIsPaused(false);
    setShowCountdown(false);
  }, []);

  useEffect(() => {
    if (showCountdown && countdownValue > 0) {
      const timer = setTimeout(() => {
        setCountdownValue(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showCountdown && countdownValue === 0) {
      const timer = setTimeout(() => {
        setShowCountdown(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showCountdown, countdownValue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPaused(prev => !prev);
        if (isPaused) {
          resume();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, resume]);

  return {
    isPaused,
    showCountdown,
    countdownValue,
    pause,
    resume,
    unpause,
  };
}
