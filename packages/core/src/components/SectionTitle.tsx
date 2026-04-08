import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { AutoguideTheme } from '../theme/types';
import { darkTheme } from '../theme/presets/dark';

export interface SectionTitleProps {
  title: string;
  subtitle?: string;
  step?: string;
  theme?: AutoguideTheme;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  step,
  theme = darkTheme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame: frame - 5, fps, config: { damping: 14 } });
  const subtitleOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titleY = interpolate(titleProgress, [0, 1], [20, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bgDark,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: `${theme.fonts.heading}, system-ui, sans-serif`,
      }}
    >
      {step && (
        <div
          style={{
            position: 'absolute',
            fontSize: 120,
            fontWeight: 800,
            color: theme.colors.primaryLight,
            opacity: 0.15,
          }}
        >
          {step}
        </div>
      )}

      <div
        style={{
          opacity: titleProgress,
          transform: `translateY(${titleY}px)`,
          fontSize: 52,
          fontWeight: 700,
          color: theme.colors.textWhite,
          textAlign: 'center',
          maxWidth: '75%',
          zIndex: 1,
        }}
      >
        {title}
      </div>

      {subtitle && (
        <div
          style={{
            opacity: subtitleOpacity,
            fontSize: 24,
            fontWeight: 400,
            color: theme.colors.textMuted,
            marginTop: 16,
            textAlign: 'center',
            maxWidth: '65%',
            zIndex: 1,
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
