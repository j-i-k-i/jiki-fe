// Type stubs for useScrubber and related components

export interface AnimationTimeline {
  pause: () => void;
  play: () => void;
  paused: boolean;
  duration: number;
  progress: number;
  currentTime: number;
  completed: boolean;
  hasPlayedOrScrubbed?: boolean;
  seek: (time: number) => void;
  seekEndOfTimeline: () => void;
  onUpdate: (callback: (anime: AnimationTimeline) => void) => void;
  timeline: {
    duration: number;
    currentTime: number;
  };
}

export interface Frame {
  line: number;
  time: number;
  timelineTime: number;
  status: "SUCCESS" | "ERROR";
  description?: string;
  error?: StaticError;
}

export interface StaticError {
  message: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

export interface EditorStoreState {
  breakpoints: number[];
  foldedLines: number[];
  setHighlightedLine: (line: number | undefined) => void;
  setHighlightedLineColor: (color: string) => void;
  setInformationWidgetData: (data: {
    html?: string;
    line: number;
    status: "SUCCESS" | "ERROR";
  }) => void;
  shouldShowInformationWidget: boolean;
  setShouldShowInformationWidget: (value: boolean) => void;
  setUnderlineRange: (range: { from: number; to: number } | null) => void;
}

export interface AnimationTimelineStoreState {
  setIsTimelineComplete: (value: boolean) => void;
  setShouldAutoplayAnimation: (value: boolean) => void;
}

export interface JikiscriptExercisePageContextValue {
  editorView: unknown;
  isSpotlightActive: boolean;
}

export interface ShowErrorParams {
  error: StaticError;
  setHighlightedLine: (line: number | undefined) => void;
  setHighlightedLineColor: (color: string) => void;
  setInformationWidgetData: (data: {
    html?: string;
    line: number;
    status: "SUCCESS" | "ERROR";
  }) => void;
  setShouldShowInformationWidget: (value: boolean) => void;
  setUnderlineRange: (range: { from: number; to: number } | null) => void;
  editorView: unknown;
  context?: string;
}

export type ShowErrorFunction = (params: ShowErrorParams) => void;
export type ScrollToLineFunction = (editorView: unknown, line: number) => void;
export type CleanUpEditorFunction = (editorView: unknown) => void;
