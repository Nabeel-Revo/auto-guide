import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface TextCalloutProps {
  text: string;
  x: number;
  y: number;
  delay?: number;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center' | 'right';
  accentColor?: string;
}

const fontSizes: Record<string, number> = {
  sm: 16,
  md: 20,
  lg: 26,
};

export const TextCallout: React.FC<TextCalloutProps> = ({
  text,
  x,
  y,
  delay = 0,
  size = 'md',
  align = 'left',
  accentColor = '#6366f1',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  const translateY = (1 - progress) * 10;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          transform: `translate(${align === 'center' ? '-50%' : '0'}, ${translateY}px)`,
          opacity: progress,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          borderLeft: `4px solid ${accentColor}`,
          padding: '10px 18px',
          borderRadius: '0 8px 8px 0',
          maxWidth: '45%',
          ...(align === 'right' && { textAlign: 'right' }),
        }}
      >
        <div
          style={{
            color: '#f8fafc',
            fontSize: fontSizes[size] ?? fontSizes.md,
            fontWeight: 500,
            fontFamily: 'Inter Tight, system-ui, sans-serif',
            lineHeight: 1.4,
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
