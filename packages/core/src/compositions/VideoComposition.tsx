import React from 'react';
import { Sequence } from 'remotion';

interface SceneEntry {
  from: number;
  duration: number;
  el: React.ReactNode;
}

export interface VideoCompositionProps {
  fps?: number;
  overlap?: number;
  children: (helpers: {
    add: (durationSec: number, el: React.ReactNode) => void;
    addHard: (durationSec: number, el: React.ReactNode) => void;
  }) => void;
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  fps = 30,
  overlap = 10,
  children,
}) => {
  const scenes: SceneEntry[] = [];
  let cursor = 0;

  const add = (durationSec: number, el: React.ReactNode) => {
    const dur = Math.round(durationSec * fps);
    scenes.push({ from: cursor, duration: dur, el });
    cursor += dur - overlap;
  };

  const addHard = (durationSec: number, el: React.ReactNode) => {
    const dur = Math.round(durationSec * fps);
    scenes.push({ from: cursor, duration: dur, el });
    cursor += dur;
  };

  children({ add, addHard });

  return (
    <>
      {scenes.map((scene, i) => (
        <Sequence key={i} from={scene.from} durationInFrames={scene.duration}>
          {scene.el}
        </Sequence>
      ))}
    </>
  );
};
