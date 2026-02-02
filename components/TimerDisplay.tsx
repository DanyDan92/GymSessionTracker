
import React from 'react';

interface TimerDisplayProps {
  seconds: number;
  className?: string;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ seconds, className = '' }) => {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const remainingSeconds = time % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return <span className={className}>{formatTime(seconds)}</span>;
};

export default TimerDisplay;
