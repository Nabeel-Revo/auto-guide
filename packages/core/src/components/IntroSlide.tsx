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

export interface IntroSlideProps {
  title: string;
  subtitle?: string;
  videoNumber: number;
  moduleName?: string;
  theme?: AutoguideTheme;
}

export const IntroSlide: React.FC<IntroSlideProps> = ({
  title,
  subtitle,
  videoNumber,
  moduleName,
  theme = darkTheme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeProgress = spring({ frame: frame - 10, fps, config: { damping: 12 } });
  const titleProgress = spring({ frame: frame - 20, fps, config: { damping: 14 } });
  const subtitleOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titleY = interpolate(titleProgress, [0, 1], [30, 0]);

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
      {/* Accent line at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: theme.gradients.accent,
        }}
      />

      {/* Module badge */}
      <div
        style={{
          opacity: badgeProgress,
          transform: `scale(${interpolate(badgeProgress, [0, 1], [0.8, 1])})`,
          border: `1px solid ${theme.colors.primaryLight}40`,
          borderRadius: 20,
          padding: '6px 20px',
          marginBottom: 24,
          fontSize: 16,
          fontWeight: 600,
          color: theme.colors.primaryLight,
          letterSpacing: 1,
        }}
      >
        {moduleName ? `${moduleName} — Video ${String(videoNumber).padStart(2, '0')}` : `Video ${String(videoNumber).padStart(2, '0')}`}
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleProgress,
          transform: `translateY(${titleY}px)`,
          fontSize: 72,
          fontWeight: 800,
          color: theme.colors.textWhite,
          textAlign: 'center',
          maxWidth: '80%',
          lineHeight: 1.1,
        }}
      >
        {title}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div
          style={{
            opacity: subtitleOpacity,
            fontSize: 28,
            fontWeight: 400,
            color: theme.colors.textMuted,
            marginTop: 20,
            textAlign: 'center',
            maxWidth: '70%',
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
