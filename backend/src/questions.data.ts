export type QuestionType =
  | {
      path:
        | 'Fun with Numbers!'
        | 'Shape Adventure!'
        | 'Patterns & Puzzles!'
        | 'Math in Life!'
        | 'Super Problem Solver!';
      type: 'input';
      question: string;
      answer: string;
    }
  | {
      path:
        | 'Fun with Numbers!'
        | 'Shape Adventure!'
        | 'Patterns & Puzzles!'
        | 'Math in Life!'
        | 'Super Problem Solver!';
      type: 'drag-fill';
      question: string;
      blanks: number;
      tiles: string[];
      answer: string[] | string[][];
    }
  | {
      path:
        | 'Fun with Numbers!'
        | 'Shape Adventure!'
        | 'Patterns & Puzzles!'
        | 'Math in Life!'
        | 'Super Problem Solver!';
      type: 'drag-show';
      prompt: string;
      tiles: string[];
      answer: string;
    }
  | {
      path:
        | 'Fun with Numbers!'
        | 'Shape Adventure!'
        | 'Patterns & Puzzles!'
        | 'Math in Life!'
        | 'Super Problem Solver!';
      type: 'drag-pattern';
      sequence: (string | null)[];
      tiles: string[];
      answer: string[];
    }
  | {
      path:
        | 'Fun with Numbers!'
        | 'Shape Adventure!'
        | 'Patterns & Puzzles!'
        | 'Math in Life!'
        | 'Super Problem Solver!';
      type: 'arrange';
      prompt: string;
      tiles: string[];
      answer: string[];
    }
  | {
      path:
        | 'Fun with Numbers!'
        | 'Shape Adventure!'
        | 'Patterns & Puzzles!'
        | 'Math in Life!'
        | 'Super Problem Solver!';
      type: 'tap-multi';
      prompt: string;
      tiles: string[];
      answer: string[];
    }
  | {
      path:
        | 'Fun with Numbers!'
        | 'Shape Adventure!'
        | 'Patterns & Puzzles!'
        | 'Math in Life!'
        | 'Super Problem Solver!';
      type: 'tap-single';
      prompt: string;
      tiles: string[];
      answer: string;
    }
  | {
      path:
        | 'Fun with Numbers!'
        | 'Shape Adventure!'
        | 'Patterns & Puzzles!'
        | 'Math in Life!'
        | 'Super Problem Solver!';
      type: 'tap-shape';
      prompt: string;
      shapes: { name: string; sides: number }[];
      answer: string;
    };

export const questions: QuestionType[] = [
  // --- Fun with Numbers! (10 questions) ---
  {
    path: 'Fun with Numbers!',
    type: 'input',
    question: 'What is 4 + 2?',
    answer: '6',
  },
  {
    path: 'Fun with Numbers!',
    type: 'input',
    question: 'What is 10 - 7?',
    answer: '3',
  },
  {
    path: 'Fun with Numbers!',
    type: 'input',
    question: 'What is 5 + 9?',
    answer: '14',
  },
  {
    path: 'Fun with Numbers!',
    type: 'input',
    question: 'What is 3 x 3?',
    answer: '9',
  },
  {
    path: 'Fun with Numbers!',
    type: 'input',
    question: 'What is 12 / 4?',
    answer: '3',
  },
  {
    path: 'Fun with Numbers!',
    type: 'drag-fill',
    question: '__ + __ = 8',
    blanks: 2,
    tiles: ['3', '5', '6', '2'],
    answer: ['3', '5'],
  },
  {
    path: 'Fun with Numbers!',
    type: 'drag-fill',
    question: '__ + __ = 9',
    blanks: 2,
    tiles: ['7', '2', '4', '5'],
    answer: [
      ['7', '2'],
      ['2', '7'],
      ['4', '5'],
      ['5', '4'],
    ],
  },
  {
    path: 'Fun with Numbers!',
    type: 'input',
    question: 'What is 7 - 3?',
    answer: '4',
  },
  {
    path: 'Fun with Numbers!',
    type: 'input',
    question: 'What is 8 + 5?',
    answer: '13',
  },
  {
    path: 'Fun with Numbers!',
    type: 'drag-fill',
    question: '__ + __ = 10',
    blanks: 2,
    tiles: ['6', '4', '7', '3'],
    answer: [
      ['6', '4'],
      ['4', '6'],
      ['7', '3'],
      ['3', '7'],
    ],
  },

  // --- Shape Adventure! (10 questions) ---
  {
    path: 'Shape Adventure!',
    type: 'tap-shape',
    prompt: 'Tap the correct shape with 4 sides',
    shapes: [
      { name: 'triangle', sides: 3 },
      { name: 'square', sides: 4 },
      { name: 'circle', sides: 0 },
      { name: 'pentagon', sides: 5 },
    ],
    answer: 'square',
  },
  {
    path: 'Shape Adventure!',
    type: 'tap-shape',
    prompt: 'Tap the correct shape with 5 sides',
    shapes: [
      { name: 'triangle', sides: 3 },
      { name: 'square', sides: 4 },
      { name: 'circle', sides: 0 },
      { name: 'pentagon', sides: 5 },
    ],
    answer: 'pentagon',
  },
  {
    path: 'Shape Adventure!',
    type: 'tap-shape',
    prompt: 'Tap the shape with 3 sides',
    shapes: [
      { name: 'triangle', sides: 3 },
      { name: 'square', sides: 4 },
      { name: 'circle', sides: 0 },
      { name: 'pentagon', sides: 5 },
    ],
    answer: 'triangle',
  },
  {
    path: 'Shape Adventure!',
    type: 'tap-shape',
    prompt: 'Tap the shape with no sides',
    shapes: [
      { name: 'triangle', sides: 3 },
      { name: 'square', sides: 4 },
      { name: 'circle', sides: 0 },
      { name: 'pentagon', sides: 5 },
    ],
    answer: 'circle',
  },
  {
    path: 'Shape Adventure!',
    type: 'tap-shape',
    prompt: 'Tap the shape with the most sides',
    shapes: [
      { name: 'triangle', sides: 3 },
      { name: 'square', sides: 4 },
      { name: 'circle', sides: 0 },
      { name: 'pentagon', sides: 5 },
    ],
    answer: 'pentagon',
  },
  {
    path: 'Shape Adventure!',
    type: 'tap-shape',
    prompt: 'Tap the shape with 4 equal sides',
    shapes: [
      { name: 'triangle', sides: 3 },
      { name: 'square', sides: 4 },
      { name: 'circle', sides: 0 },
      { name: 'pentagon', sides: 5 },
    ],
    answer: 'square',
  },
  {
    path: 'Shape Adventure!',
    type: 'tap-shape',
    prompt: 'Tap the shape with 3 corners',
    shapes: [
      { name: 'triangle', sides: 3 },
      { name: 'square', sides: 4 },
      { name: 'circle', sides: 0 },
      { name: 'pentagon', sides: 5 },
    ],
    answer: 'triangle',
  },
  {
    path: 'Shape Adventure!',
    type: 'tap-shape',
    prompt: 'Tap the shape with 0 corners',
    shapes: [
      { name: 'triangle', sides: 3 },
      { name: 'square', sides: 4 },
      { name: 'circle', sides: 0 },
      { name: 'pentagon', sides: 5 },
    ],
    answer: 'circle',
  },
  {
    path: 'Shape Adventure!',
    type: 'tap-shape',
    prompt: 'Tap the shape with 5 corners',
    shapes: [
      { name: 'triangle', sides: 3 },
      { name: 'square', sides: 4 },
      { name: 'circle', sides: 0 },
      { name: 'pentagon', sides: 5 },
    ],
    answer: 'pentagon',
  },
  {
    path: 'Shape Adventure!',
    type: 'tap-shape',
    prompt: 'Tap the shape with 4 corners',
    shapes: [
      { name: 'triangle', sides: 3 },
      { name: 'square', sides: 4 },
      { name: 'circle', sides: 0 },
      { name: 'pentagon', sides: 5 },
    ],
    answer: 'square',
  },

  // --- Patterns & Puzzles! (10 questions) ---
  {
    path: 'Patterns & Puzzles!',
    type: 'drag-pattern',
    sequence: ['1', '2', null, '4', null],
    tiles: ['3', '5', '6'],
    answer: ['3', '5'],
  },
  {
    path: 'Patterns & Puzzles!',
    type: 'drag-pattern',
    sequence: ['2', null, '6', null, '10'],
    tiles: ['4', '8', '12'],
    answer: ['4', '8'],
  },
  {
    path: 'Patterns & Puzzles!',
    type: 'arrange',
    prompt: 'Arrange in order (ascending):',
    tiles: ['11', '7', '15', '3'],
    answer: ['3', '7', '11', '15'],
  },
  {
    path: 'Patterns & Puzzles!',
    type: 'arrange',
    prompt: 'Arrange in order (descending):',
    tiles: ['2', '9', '5', '8'],
    answer: ['9', '8', '5', '2'],
  },
  {
    path: 'Patterns & Puzzles!',
    type: 'drag-pattern',
    sequence: ['5', null, '15', null, '25'],
    tiles: ['10', '20', '30'],
    answer: ['10', '20'],
  },
  {
    path: 'Patterns & Puzzles!',
    type: 'drag-pattern',
    sequence: ['A', null, 'C', null, 'E'],
    tiles: ['B', 'D', 'F'],
    answer: ['B', 'D'],
  },
  {
    path: 'Patterns & Puzzles!',
    type: 'arrange',
    prompt: 'Arrange in order (A-Z):',
    tiles: ['D', 'A', 'C', 'B'],
    answer: ['A', 'B', 'C', 'D'],
  },
  {
    path: 'Patterns & Puzzles!',
    type: 'arrange',
    prompt: 'Arrange in order (Z-A):',
    tiles: ['X', 'Z', 'Y', 'W'],
    answer: ['Z', 'Y', 'X', 'W'],
  },
  {
    path: 'Patterns & Puzzles!',
    type: 'drag-pattern',
    sequence: ['10', null, '30', null, '50'],
    tiles: ['20', '40', '60'],
    answer: ['20', '40'],
  },
  {
    path: 'Patterns & Puzzles!',
    type: 'arrange',
    prompt: 'Arrange in order (smallest to largest):',
    tiles: ['8', '3', '12', '5'],
    answer: ['3', '5', '8', '12'],
  },

  // --- Math in Life! (10 questions) ---
  {
    path: 'Math in Life!',
    type: 'drag-show',
    prompt: 'Drag number blocks to show: 5',
    tiles: ['1', '2', '3', '4', '5'],
    answer: '5',
  },
  {
    path: 'Math in Life!',
    type: 'drag-show',
    prompt: 'Drag number blocks to show: 9',
    tiles: ['6', '7', '8', '9'],
    answer: '9',
  },
  {
    path: 'Math in Life!',
    type: 'input',
    question: 'How many apples are in a group of 7 and 2?',
    answer: '9',
  },
  {
    path: 'Math in Life!',
    type: 'arrange',
    prompt: 'Arrange the coins from least to most:',
    tiles: ['5', '1', '10', '2'],
    answer: ['1', '2', '5', '10'],
  },
  {
    path: 'Math in Life!',
    type: 'drag-show',
    prompt: 'Drag number blocks to show: 3',
    tiles: ['1', '2', '3', '4'],
    answer: '3',
  },
  {
    path: 'Math in Life!',
    type: 'input',
    question: 'If you have 2 candies and get 3 more, how many?',
    answer: '5',
  },
  {
    path: 'Math in Life!',
    type: 'arrange',
    prompt: 'Arrange the days: Mon, Wed, Tue, Fri',
    tiles: ['Mon', 'Wed', 'Tue', 'Fri'],
    answer: ['Mon', 'Tue', 'Wed', 'Fri'],
  },
  {
    path: 'Math in Life!',
    type: 'drag-show',
    prompt: 'Drag number blocks to show: 7',
    tiles: ['5', '6', '7', '8'],
    answer: '7',
  },
  {
    path: 'Math in Life!',
    type: 'input',
    question: 'How many legs do 2 cats have?',
    answer: '8',
  },
  {
    path: 'Math in Life!',
    type: 'arrange',
    prompt: 'Arrange the months: Jan, Mar, Feb, Apr',
    tiles: ['Jan', 'Mar', 'Feb', 'Apr'],
    answer: ['Jan', 'Feb', 'Mar', 'Apr'],
  },

  // --- Super Problem Solver! (10 questions) ---
  {
    path: 'Super Problem Solver!',
    type: 'tap-multi',
    prompt: 'Tap all even numbers',
    tiles: ['2', '3', '4', '5', '6'],
    answer: ['2', '4', '6'],
  },
  {
    path: 'Super Problem Solver!',
    type: 'tap-multi',
    prompt: 'Tap all odd numbers',
    tiles: ['1', '2', '3', '4', '5'],
    answer: ['1', '3', '5'],
  },
  {
    path: 'Super Problem Solver!',
    type: 'tap-multi',
    prompt: 'Tap all numbers greater than 5',
    tiles: ['2', '4', '6', '8', '5'],
    answer: ['6', '8'],
  },
  {
    path: 'Super Problem Solver!',
    type: 'tap-multi',
    prompt: 'Tap all sums that equal 10',
    tiles: ['7+3', '5+5', '8+2', '6+4', '4+7', '3+8'],
    answer: ['7+3', '5+5', '8+2', '6+4'],
  },
  {
    path: 'Super Problem Solver!',
    type: 'tap-multi',
    prompt: 'Tap all sums that equal 12',
    tiles: ['8+4', '6+6', '7+5', '9+3', '5+8', '10+1'],
    answer: ['8+4', '6+6', '7+5', '9+3'],
  },
  {
    path: 'Super Problem Solver!',
    type: 'tap-single',
    prompt: 'Tap the number that is 1 more than 4',
    tiles: ['4', '5', '6', '7'],
    answer: '5',
  },
  {
    path: 'Super Problem Solver!',
    type: 'tap-single',
    prompt: 'Tap the number that is 2 less than 9',
    tiles: ['5', '6', '7', '8'],
    answer: '7',
  },
  {
    path: 'Super Problem Solver!',
    type: 'input',
    question: 'What is the sum of 6 and 7?',
    answer: '13',
  },
  {
    path: 'Super Problem Solver!',
    type: 'input',
    question: 'If you have 5 apples and eat 2, how many left?',
    answer: '3',
  },
  {
    path: 'Super Problem Solver!',
    type: 'tap-single',
    prompt: 'Tap the number that is double 4',
    tiles: ['6', '7', '8', '9'],
    answer: '8',
  },
];
