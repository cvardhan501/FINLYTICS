'use client';

import React, { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '@/lib/finance/calculations';

interface AnimatedMoneyProps {
  value: number;
  currency?: string;
  className?: string;
  duration?: number;
  showSign?: boolean;
}

export const AnimatedMoney: React.FC<AnimatedMoneyProps> = ({
  value,
  currency = 'INR',
  className = '',
  duration = 750,
  showSign = false,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [motionClass, setMotionClass] = useState<string>('');
  const [isPulsing, setIsPulsing] = useState<boolean>(false);

  const prevValueRef = useRef<number | undefined>(undefined);
  const animationFrameRef = useRef<number | null>(null);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Initial mount: display value immediately without entrance animation
    if (prevValueRef.current === undefined) {
      prevValueRef.current = value;
      setDisplayValue(value);
      return;
    }

    const startValue = displayValue;
    const targetValue = value;

    // If value hasn't changed or reduced motion is enabled, set target directly
    if (startValue === targetValue || prefersReducedMotion) {
      prevValueRef.current = value;
      setDisplayValue(value);
      return;
    }

    // Determine direction
    const isIncrease = targetValue > startValue;
    setMotionClass(isIncrease ? '-translate-y-[5px] opacity-90' : 'translate-y-[5px] opacity-90');

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Ease out cubic: 1 - Math.pow(1 - progress, 3)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (targetValue - startValue) * easeOut;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
        prevValueRef.current = targetValue;

        // Reset vertical motion
        setMotionClass('translate-y-0 opacity-100');

        // Micro-pulse animation (scale 1.015 for ~180ms)
        setIsPulsing(true);
        if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = setTimeout(() => {
          setIsPulsing(false);
          setMotionClass('');
        }, 180);
      }
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current);
      }
    };
  }, [value, duration]);

  const formattedText = formatCurrency(displayValue, currency);
  const signedFormattedText =
    showSign && displayValue > 0 ? `+${formattedText}` : formattedText;

  return (
    <span
      className={`inline-block transition-transform duration-200 ease-out transform-gpu ${motionClass} ${
        isPulsing ? 'scale-[1.015]' : 'scale-100'
      } ${className}`}
    >
      {signedFormattedText}
    </span>
  );
};
