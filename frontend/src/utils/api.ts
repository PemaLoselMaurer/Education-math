
import type { QuestionType } from '../types/question';

export async function fetchQuestions(): Promise<QuestionType[]> {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  const res = await fetch(`${base}/questions`);
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}
