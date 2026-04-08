import React from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

interface VideoEntry {
  id: string;
  component: React.FC;
  durationInFrames: number;
}

export interface MasterCompositionProps {
  videos: VideoEntry[];
  crossfadeFrames?: number;
  music?: {
    src: string;
    volume?: number;
    fadeIn?: number;
    fadeOut?: number;
    loop?: boolean;
  };
}

const FadeWrap: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
  crossfadeFrames: number;
  isFirst: boolean;
  isLast: boolean;
}> = ({ children, durationInFrames, crossfadeFrames, isFirst, isLast }) => {
  const frame = useCurrentFrame();

  const fadeIn = isFirst
    ? 1
    : interpolate(frame, [0, crossfadeFrames], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  const fadeOut = isLast
    ? 1
    : interpolate(
        frame,
        [durationInFrames - crossfadeFrames, durationInFrames],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      );

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      {children}
    </AbsoluteFill>
  );
};

export const MasterComposition: React.FC<MasterCompositionProps> = ({
  videos,
  crossfadeFrames = 10,
  music,
}) => {
  const { fps } = useVideoConfig();

  let cursor = 0;
  const entries: { from: number; dur: number; entry: VideoEntry; index: number }[] = [];

  for (let i = 0; i < videos.length; i++) {
    const from = cursor;
    const dur = videos[i].durationInFrames;
    entries.push({ from, dur, entry: videos[i], index: i });
    cursor += dur - (i < videos.length - 1 ? crossfadeFrames : 0);
  }

  const totalFrames = cursor;

  return (
    <>
      {music && (
        <Audio
          src={staticFile(music.src)}
          volume={(f) => {
            const fadeInFrames = (music.fadeIn ?? 2) * fps;
            const fadeOutFrames = (music.fadeOut ?? 2) * fps;
            const vol = music.volume ?? 0.15;
            return interpolate(
              f,
              [0, fadeInFrames, totalFrames - fadeOutFrames, totalFrames],
              [0, vol, vol * 0.67, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            );
          }}
          loop={music.loop ?? true}
        />
      )}

      {entries.map(({ from, dur, entry, index }) => {
        const VideoComponent = entry.component;
        return (
          <Sequence key={entry.id} from={from} durationInFrames={dur}>
            <FadeWrap
              durationInFrames={dur}
              crossfadeFrames={crossfadeFrames}
              isFirst={index === 0}
              isLast={index === videos.length - 1}
            >
              <VideoComponent />
            </FadeWrap>
          </Sequence>
        );
      })}
    </>
  );
};
