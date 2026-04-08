// Components
export {
  IntroSlide,
  OutroSlide,
  ScreenshotScene,
  HighlightOverlay,
  TextCallout,
  SectionTitle,
  TransitionWipe,
} from './components';
export type {
  IntroSlideProps,
  OutroSlideProps,
  ScreenshotSceneProps,
  HighlightOverlayProps,
  HighlightBoxProps,
  TextCalloutProps,
  SectionTitleProps,
  TransitionWipeProps,
} from './components';

// Compositions
export { VideoComposition, MasterComposition } from './compositions';
export type { VideoCompositionProps, MasterCompositionProps } from './compositions';

// Theme
export { createTheme, darkTheme, lightTheme, minimalTheme } from './theme';
export type { AutoguideTheme, ThemeColors, ThemeFonts, ThemeGradients, ThemeInput } from './theme';

// Types
export type {
  VideoPlan,
  VideoMeta,
  SceneSection,
  Scene,
  SceneCapture,
  AutoCapture,
  ManualCapture,
  CaptureAction,
  HighlightBox,
  TextCalloutConfig,
  VoiceoverEntry,
  PlanMetadata,
  OutroConfig,
  IntroConfig,
} from './types/plan';

export type {
  AutoguideConfig,
  ProjectConfig,
  BrandingConfig,
  VoiceoverConfig,
  CaptureConfig,
  OutputConfig,
  MusicConfig,
  DefaultsConfig,
  AuthConfig,
} from './types/config';
