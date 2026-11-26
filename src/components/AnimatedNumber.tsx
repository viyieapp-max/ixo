import { useEffect, useRef, useState } from 'react';
import { animate } from 'motion/react';
import { formatRupiah } from '../utils/finance';

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

export function AnimatedNumber({ value, className = '' }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const currentValueRef = useRef(value);

  useEffect(() => {
    const from = currentValueRef.current;
    if (from === value) return;

    const controls = animate(from, value, {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        const rounded = Math.round(latest);
        currentValueRef.current = rounded;
        setDisplayValue(rounded);
      },
      onComplete: () => {
        currentValueRef.current = value;
        setDisplayValue(value);
      },
    });

    return () => {
      controls.stop();
    };
  }, [value]);

  return (
    <span className={`font-mono-nums ${className}`}>
      {formatRupiah(displayValue)}
    </span>
  );
}
