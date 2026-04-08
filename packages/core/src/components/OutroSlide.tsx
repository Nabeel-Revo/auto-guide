import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { AutoguideTheme } from '../theme/types';
import { darkTheme } from '../theme/presets/dark';

export interface OutroSlideProps {
  nextVideoTitle?: string;
  logoSrc?: string;
  websiteUrl?: string;
  docsUrl?: string;
  theme?: AutoguideTheme;
}

export const OutroSlide: React.FC<OutroSlideProps> = ({
  nextVideoTitle,
  logoSrc,
  websiteUrl,
  docsUrl,
  theme = darkTheme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame: frame - 5, fps, config: { damping: 12 } });
  const textOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const nextOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
      {logoSrc && (
        <Img
          src={staticFile(logoSrc)}
          style={{
            height: 80,
            objectFit: 'contain',
            marginBottom: 32,
            transform: `scale(${logoScale})`,
          }}
        />
      )}

      <div style={{ opacity: textOpacity, display: 'flex', gap: 40 }}>
        {websiteUrl && (
          <div style={{ color: theme.colors.textMuted, fontSize: 20, fontWeight: 500 }}>
            {websiteUrl}
          </div>
        )}
        {docsUrl && (
          <div style={{ color: theme.colors.textMuted, fontSize: 20, fontWeight: 500 }}>
            {docsUrl}
          </div>
        )}
      </div>

      {nextVideoTitle && (
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            opacity: nextOpacity,
            textAlign: 'center',
          }}
        >
          <div style={{ color: theme.colors.textSubtle, fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
            UP NEXT
          </div>
          <div style={{ color: theme.colors.primaryLight, fontSize: 24, fontWeight: 600 }}>
            {nextVideoTitle}
          </div>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: theme.gradients.accent,
        }}
      />
    </AbsoluteFill>
  );
};
