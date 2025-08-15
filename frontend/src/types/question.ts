export type QuestionType =
  | { path: string; type: 'input'; question: string; answer: string }
  | {
      path: string;
      type: 'drag-fill';
      question: string;
      blanks: number;
      tiles: string[];
      answer: string[] | string[][];
    }
  | { path: string; type: 'drag-show'; prompt: string; tiles: string[]; answer: string }
  | {
      path: string;
      type: 'drag-pattern';
      sequence: (string | null)[];
      tiles: string[];
      answer: string[];
    }
  | { path: string; type: 'arrange'; prompt: string; tiles: string[]; answer: string[] }
  | { path: string; type: 'tap-multi'; prompt: string; tiles: string[]; answer: string[] }
  | { path: string; type: 'tap-single'; prompt: string; tiles: string[]; answer: string }
  | {
      path: string;
      type: 'tap-shape';
      prompt: string;
      shapes: { name: string; sides: number }[];
      answer: string;
    };
