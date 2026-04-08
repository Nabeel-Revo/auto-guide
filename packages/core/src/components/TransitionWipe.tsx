import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AutoguideTheme } from '../theme/types';
import { darkTheme } from '../theme/presets/dark';

export interface TransitionWipeProps {
  direction?: 'left' | 'right';
  durationFrames?: number;
  theme?: AutoguideTheme;
}

export const TransitionWipe: React.FC<TransitionWipeProps> = ({
  direction = 'left',
  durationFrames: customDuration,
  theme = darkTheme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durationFrames = customDuration ?? Math.round(fps * 0.5);

  const progress = interpolate(frame, [0, durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fadeOut = interpolate(
    frame,
    [durationFrames - 5, durationFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const translateX = direction === 'left'
    ? interpolate(progress, [0, 1], [100, -100])
    : interpolate(progress, [0, 1], [-100, 100]);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: fadeOut }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '120%',
          transform: `translateX(${translateX}%)`,
          background: `linear-gradient(${direction === 'left' ? '90deg' : '270deg'}, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
