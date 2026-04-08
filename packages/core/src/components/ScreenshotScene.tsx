import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

interface ZoomTarget {
  x: number;
  y: number;
  scale: number;
}

export interface ScreenshotSceneProps {
  src: string;
  zoomTo?: ZoomTarget;
  zoomDelay?: number;
  caption?: string;
  captionPosition?: 'top' | 'bottom';
  durationInFrames: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

export const ScreenshotScene: React.FC<ScreenshotSceneProps> = ({
  src,
  zoomTo,
  zoomDelay = 30,
  caption,
  captionPosition = 'bottom',
  durationInFrames,
  fadeInDuration = 8,
  fadeOutDuration = 8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, fadeInDuration, durationInFrames - fadeOutDuration, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  let scale = 1;
  let translateX = 0;
  let translateY = 0;

  if (zoomTo) {
    const zoomStart = zoomDelay;
    const zoomEnd = zoomStart + fps;
    const progress = interpolate(frame, [zoomStart, zoomEnd], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    scale = interpolate(progress, [0, 1], [1, zoomTo.scale]);
    translateX = interpolate(progress, [0, 1], [0, -(zoomTo.x - 50)]);
    translateY = interpolate(progress, [0, 1], [0, -(zoomTo.y - 50)]);
  }

  const captionOpacity = caption
    ? interpolate(frame, [15, 25], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0f1a', opacity }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transformOrigin: 'center center',
            transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
          }}
        />
      </div>

      {caption && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            ...(captionPosition === 'bottom'
              ? { bottom: 0 }
              : { top: 0 }),
            padding: '16px 32px',
            background:
              captionPosition === 'bottom'
                ? 'linear-gradient(transparent, rgba(0,0,0,0.7))'
                : 'linear-gradient(rgba(0,0,0,0.7), transparent)',
            opacity: captionOpacity,
          }}
        >
          <div
            style={{
              color: '#ffffff',
              fontSize: 22,
              fontWeight: 600,
              fontFamily: 'Inter Tight, system-ui, sans-serif',
              textAlign: 'center',
            }}
          >
            {caption}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
