import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface HighlightBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface HighlightOverlayProps {
  highlights: HighlightBoxProps[];
  delay?: number;
  color?: string;
  style?: 'glow' | 'border' | 'fill';
}

export const HighlightOverlay: React.FC<HighlightOverlayProps> = ({
  highlights,
  delay = 0,
  color = '#6366f1',
  style = 'glow',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {highlights.map((h, i) => {
        const itemDelay = delay + i * 10;
        const progress = spring({
          frame: frame - itemDelay,
          fps,
          config: { damping: 15, stiffness: 100 },
        });

        const scale = interpolate(progress, [0, 1], [0.85, 1]);
        const opacity = interpolate(progress, [0, 1], [0, 1]);

        const boxStyle: React.CSSProperties = {
          position: 'absolute',
          left: `${h.x}%`,
          top: `${h.y}%`,
          width: `${h.width}%`,
          height: `${h.height}%`,
          transform: `scale(${scale})`,
          opacity,
          borderRadius: 8,
          ...(style === 'glow'
            ? {
                border: `2px solid ${color}`,
                boxShadow: `0 0 20px ${color}40, inset 0 0 20px ${color}10`,
              }
            : style === 'border'
              ? {
                  border: `2px solid ${color}`,
                }
              : {
                  backgroundColor: `${color}20`,
                  border: `1px solid ${color}40`,
                }),
        };

        return (
          <React.Fragment key={i}>
            <div style={boxStyle} />
            {h.label && (
              <div
                style={{
                  position: 'absolute',
                  left: `${h.x}%`,
                  top: `${h.y - 3.5}%`,
                  opacity,
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'Inter Tight, system-ui, sans-serif',
                  color: '#ffffff',
                  backgroundColor: color,
                  padding: '4px 10px',
                  borderRadius: 6,
                  whiteSpace: 'nowrap',
                }}
              >
                {h.label}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
