


"use client";

// Puzzle piece color palette for tiles/buttons
const puzzleColors = [
  '#ff5994', // pink
  '#ffe066', // yellow
  '#84ff9f', // green
  '#82b6ff', // blue
  '#ff9668', // orange
];

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import Link from 'next/link';
import type { QuestionType } from '../../types/question';
import { fetchQuestions } from '../../utils/api';

type UserAnswer = string | string[];
const getInitialUserAnswer = (q: QuestionType): UserAnswer => {
  if (q.type === 'arrange' && 'tiles' in q) return [...q.tiles];
  if (q.type === 'drag-fill' || q.type === 'drag-pattern') return [];
  return '';
};

// No longer need block index, filter by path property

function MathPageInner() {
  let questionContent = null;
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const searchParams = useSearchParams();
  const path = searchParams?.get('path') || '';
  const [current, setCurrent] = useState(0);
  const [userAnswer, setUserAnswer] = useState<UserAnswer>('');
  const [feedback, setFeedback] = useState('');
  const [showEnd, setShowEnd] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragged, setDragged] = useState<string|null>(null);
  const [dragBlanks, setDragBlanks] = useState<string[]>([]);
  // Ref for audio elements (must be inside component)
  const audioRef = useRef<HTMLAudioElement|null>(null);
  const correctAudioRef = useRef<HTMLAudioElement|null>(null);
  const wrongAudioRef = useRef<HTMLAudioElement|null>(null);

  useEffect(() => {
	fetchQuestions().then(qs => {
	  let filtered = qs;
	  if (path) {
		filtered = qs.filter(q => q.path === path);
	  }
	  // Always take the first 10 questions for the selected path
	  filtered = filtered.slice(0, 10);
	  setQuestions(filtered);
	  if (filtered.length > 0) setUserAnswer(getInitialUserAnswer(filtered[0]));
	});
  }, [path]);

  useEffect(() => {
	const handleKeyDown = (e: KeyboardEvent) => {
	  if (e.key === 'Enter') {
		document.getElementById('check-btn')?.click();
	  } else if (e.key === 'Escape') {
		setUserAnswer('');
		inputRef.current?.focus();
	  }
	};
	window.addEventListener('keydown', handleKeyDown);
	return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

	if (!questions.length) return <div>Loading questions...</div>;
  if (showEnd) {
	return (
			<div className="font-quicksand min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-500" style={{
				background: 'transparent',
				position: 'relative',
				overflow: 'hidden',
			}}>
		{/* Nebula/star field overlay */}
		<div style={{
		  pointerEvents: 'none',
		  position: 'absolute',
		  inset: 0,
		  zIndex: 1,
		  background: 'radial-gradient(ellipse at 60% 20%, rgba(59,7,100,0.58) 0%, rgba(24,26,42,0) 80%)',
		}} />
	  <nav className="w-full flex items-center justify-between px-6 py-4 min-h-[64px] rounded-b-[2.5rem] bg-white/60 shadow-xl border-b-4 border-blue-200 z-20 relative backdrop-blur-md" style={{background: 'linear-gradient(90deg, rgba(236,72,153,0.18) 0%, rgba(59,130,246,0.18) 100%)', marginBottom: 0, paddingBottom: 0, marginTop: 0, paddingTop: 0}}>
		  <div className="flex items-center gap-3">
			<span className="text-3xl select-none">🦉</span>
			<span className="text-2xl font-extrabold tracking-tight text-blue-600 drop-shadow font-[Comic Sans MS,Comic Sans,cursive]">
			  Space Math Quiz
			</span>
		  </div>
		  <Link
			href="/"
			className="ml-4 bg-pink-500 hover:bg-pink-600 text-white px-7 py-2 rounded-full text-base font-bold shadow transition text-center font-[Comic Sans MS,Comic Sans,cursive] border-2 border-pink-300"
			onClick={() => { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); } }}
		  >
			Home
		  </Link>
		</nav>
	{/* Gap below navbar and above progress bar/level indicator */}
	<div style={{ marginTop: '0.75rem', minHeight: '0.75rem' }} />
  <div className="flex flex-col items-center justify-center w-full max-w-2xl gap-8 mx-auto">
		  <div className="w-full flex flex-col items-center mb-5">
			<div className="text-center text-pink-700 text-lg font-bold mt-0 mb-0 font-[Comic Sans MS,cursive,sans-serif]">Level {current + 1} / {questions.length}</div>
			<div className="text-center text-blue-500 text-xs mt-0 mb-0 font-semibold">Try to get as many correct in a row as you can!</div>
			<div className="w-full h-4 bg-pink-100 rounded-full mt-1">
									<div
										className="h-4 rounded-full transition-all duration-500"
										style={{
											width: `${((current + (feedback === '✅ Correct!' ? 1 : 0)) / questions.length) * 100}%`,
											background: 'linear-gradient(90deg, #fffbe7 0%, #ffe6fa 40%, #b2f7ff 100%)',
											boxShadow: '0 0 32px 8px #fffbe7cc, 0 0 48px 16px #b2f7ffcc, 0 0 32px 8px #ffe6fa99',
											filter: 'brightness(1.7) drop-shadow(0 0 24px #fff)',
										}}
									/>
			</div>
		  </div>
		  {/* Main question card */}
			<Card className="puzzle-card p-4 sm:p-8 w-full max-w-2xl min-h-[320px] h-auto flex flex-col items-center justify-center mx-auto overflow-hidden shadow-2xl rounded-[2rem] border-0" style={{
				background: 'rgba(255, 255, 255, 0.92)',
				boxShadow: '0 0 64px 16px #fffbe7cc, 0 0 96px 32px #b2f7ffcc, 0 0 48px 12px #ffe6fa99',
				border: 'none',
				outline: '3px solid #b2f7ff',
				outlineOffset: '-8px',
				backdropFilter: 'blur(12px)',
				filter: 'drop-shadow(0 0 32px #fffbe7) drop-shadow(0 0 24px #b2f7ff)',
			}}>
				<CardContent className="flex flex-col flex-1 min-h-full w-full h-full items-center justify-center">
					<div className="flex flex-col flex-1 min-h-full w-full h-full items-center justify-center text-center">
				<div className="text-4xl sm:text-5xl font-extrabold text-pink-600 drop-shadow-lg mb-6 font-[Comic Sans MS,cursive,sans-serif]">🎉 You finished all the questions! 🎉</div>
				<div className="text-lg text-blue-500 font-semibold mb-8 text-center">Great job! Want to play again?</div>
				<Button
				  className="bg-gradient-to-tr from-pink-400 to-blue-400 text-white px-8 py-4 rounded-3xl text-2xl font-extrabold shadow-lg hover:scale-105 hover:from-pink-500 hover:to-blue-500 transition-all duration-150 font-[Comic Sans MS,cursive,sans-serif]"
				  onClick={() => {
					setCurrent(0);
					setUserAnswer(getInitialUserAnswer(questions[0]));
					setDragBlanks([]);
					setShowEnd(false);
				  }}
				>
				  Restart
				</Button>
			  </div>
			</CardContent>
		  </Card>
		</div>
	</div>
	);
  }
  // ...existing code for the main quiz return...
  const q = questions[current];

  // Calculator pad for input questions
  const calculatorKeys = [
	['7', '8', '9'],
	['4', '5', '6'],
	['1', '2', '3'],
	['0', 'C']
  ];

  const handleCalcClick = (val: string) => {
	if (audioRef.current) {
	  audioRef.current.currentTime = 0;
	  audioRef.current.play();
	}
	if (val === 'C') {
	  setUserAnswer('');
	  inputRef.current?.focus();
	  return;
	}
	setUserAnswer((prev) => (prev as string) + val);
	inputRef.current?.focus();
  };

  const handleSubmit = (e?: React.FormEvent) => {
	if (e) e.preventDefault();
	const q = questions[current];
	let correct = false;
	if (q.type === 'input') {
	  correct = typeof userAnswer === 'string' && userAnswer.trim() === q.answer;
	} else if (q.type === 'drag-fill') {
	  if (Array.isArray(userAnswer)) {
		if (
		  Array.isArray(q.answer) &&
		  q.answer.length > 0 &&
		  Array.isArray(q.answer[0])
		) {
		  // Multiple correct answers (array of arrays)
		  const multiAnswers = q.answer as unknown as string[][];
		  correct = multiAnswers.some(
			(ans) =>
			  Array.isArray(ans) &&
			  ans.length === userAnswer.length &&
			  ans.every((v, i) => v === userAnswer[i])
		  );
		} else if (Array.isArray(q.answer)) {
		  // Single correct answer (array)
		  correct = userAnswer.join() === (q.answer as string[]).join();
		}
	  }
	} else if (q.type === 'drag-show') {
	  correct = userAnswer === q.answer;
	} else if (q.type === 'drag-pattern') {
	  correct = Array.isArray(userAnswer) && userAnswer.join() === q.answer.join();
	} else if (q.type === 'arrange') {
	  correct = Array.isArray(userAnswer) && userAnswer.join() === q.answer.join();
	} else if (q.type === 'tap-multi') {
	  correct = Array.isArray(userAnswer) && userAnswer.sort().join() === q.answer.sort().join();
	} else if (q.type === 'tap-single') {
	  correct = userAnswer === q.answer;
	} else if (q.type === 'tap-shape') {
	  correct = userAnswer === q.answer;
	}
	if (correct) {
	  setFeedback('✅ Correct!');
	  if (correctAudioRef.current) {
		correctAudioRef.current.currentTime = 0;
		correctAudioRef.current.play();
	  }
	} else {
	  setFeedback('❌ Try again!');
	  if (wrongAudioRef.current) {
		wrongAudioRef.current.currentTime = 0;
		wrongAudioRef.current.play();
	  }
	  return;
	}
	setTimeout(() => {
	  // Advance to next question or show end message after delay
	  setFeedback('');
	  if (current < questions.length - 1) {
		setCurrent(current + 1);
		setUserAnswer(getInitialUserAnswer(questions[current + 1]));
		setDragBlanks([]);
	  } else {
		// Show end message after last question
		setShowEnd(true);
	  }
	}, 900);
  };


  // Render question types with playful design
  if (q.type === 'input') {
	// ...input type JSX as before...
	let questionParts = null;
	if (q.question && q.question.includes('=')) {
	  const eqIdx = q.question.indexOf('=');
	  const beforeEq = q.question.slice(0, eqIdx).trim();
	  const afterEq = q.question.slice(eqIdx + 1).trim();
	  const afterEqClean = afterEq.replace(/\?\s*$/, '');
	  questionParts = (
		<span className="inline-flex flex-wrap items-center justify-center w-full text-xl sm:text-2xl font-extrabold" style={{color:'#ff5994', textShadow:'0 2px 0 #fff', lineHeight:1.1, wordBreak:'break-word', minHeight: '2.5em'}}>
		  <span className="whitespace-pre-line">{beforeEq} = </span>
		  <input
			ref={inputRef}
			className="inline-block align-middle border-4 rounded-xl p-2 w-20 sm:w-28 text-center text-lg sm:text-2xl font-bold focus:ring-4 transition-all duration-200 mx-2"
			style={{
			  borderColor:'#82b6ff',
			  color:'#82b6ff',
			  background:'#edff8f',
			  boxShadow:'0 2px 0 #fff',
			  minWidth:60,
			  maxWidth:120
			}}
			value={userAnswer as string}
			onChange={e => setUserAnswer(e.target.value)}
			autoFocus
		  />
		  <span className="whitespace-pre-line">{afterEqClean}</span>
		</span>
	  );
	}
	questionContent = (
	  <div className="flex flex-col w-full h-full items-center" style={{height:'100%'}}>
		<div className="w-full flex-none text-center mb-1" style={{minHeight: '2.5em'}}>
		  {questionParts || (
			<>
			  <span className="text-xl sm:text-2xl font-extrabold text-pink-600 drop-shadow-lg font-[Comic Sans MS,cursive,sans-serif] leading-tight" style={{lineHeight:1.1, wordBreak:'break-word'}}>
				{q.question || '\u00A0'}
			  </span>
			  <input
				ref={inputRef}
				className="flex-none border-4 border-blue-300 rounded-xl p-2 w-28 sm:w-36 text-center text-lg sm:text-2xl font-bold text-blue-700 bg-blue-50 focus:ring-4 focus:ring-pink-200 transition-all duration-200 mb-1 mt-2"
				value={userAnswer as string}
				onChange={e => setUserAnswer(e.target.value)}
				autoFocus
				style={{ minWidth: 80, maxWidth: 160, marginLeft: 12 }}
			  />
			</>
		  )}
		</div>
  {/* Feedback above calculator for input questions (single location) */}
  {/* Only show feedback here for input questions; remove duplicate below */}
  <div style={{ minHeight: 0, marginTop: 2, marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
	{feedback ? (
	  <div className={`text-center text-2xl font-extrabold animate-bounce-fast ${feedback.includes('Correct') ? 'text-pink-600' : 'text-blue-700'}`}
		style={{
		  animation: 'bounce 0.6s',
		  animationIterationCount: 1,
		  filter: feedback.includes('Correct') ? 'drop-shadow(0 0 10px #f472b6)' : 'drop-shadow(0 0 10px #60a5fa)'
		}}>
		{feedback}
	  </div>
	) : null}
  </div>
  <form onSubmit={handleSubmit} className="flex flex-col items-center w-full flex-none mt-0">
	<div className="flex flex-col gap-1" style={{ transform: 'scale(0.9)', maxWidth: '100%' }}>
	  {calculatorKeys.map((row, i) => (
		<div key={i} className="flex gap-1 sm:gap-2 justify-center">
		  {row.map((key) => (
			<Button
			  key={key}
			  type="button"
			  className="w-14 h-14 rounded-2xl shadow hover:scale-105 focus:outline-none transition-all duration-150 flex items-center justify-center border-2 font-black text-2xl sm:text-3xl"
			  style={{
				background: key === 'C' ? '#ff9668' : '#edff8f',
				color: key === 'C' ? '#ff5994' : '#82b6ff',
				borderColor: key === 'C' ? '#ff5994' : '#82b6ff',
				boxShadow: '0 2px 0 #fff',
			  }}
			  onClick={() => handleCalcClick(key)}
			  tabIndex={0}
			>
			  {key === 'C' ? <span style={{color:'#ff5994'}} className="text-2xl sm:text-3xl font-black">⌫</span> : <span className="text-2xl sm:text-3xl font-black">{key}</span>}
			</Button>
		  ))}
		</div>
	  ))}
	</div>
	<div className="w-full flex justify-center" style={{marginTop: 8, marginBottom: 0}}>
	  <Button
		id="check-btn"
		type="button"
		className="bg-gradient-to-tr from-pink-400 to-blue-400 text-white px-6 py-3 rounded-2xl text-lg font-extrabold shadow-lg hover:scale-105 hover:from-pink-500 hover:to-blue-500 transition-all duration-150 font-[Comic Sans MS,cursive,sans-serif]"
		onClick={() => {
		  if (audioRef.current) {
			audioRef.current.currentTime = 0;
			audioRef.current.play();
		  }
		  handleSubmit();
		}}
	  >
		Check
	  </Button>
	</div>
  </form>
	  </div>
	);
  } else if (q.type === 'drag-fill') {
	// ...drag-fill JSX as before...
	let blankIdx = 0;
	const parts = q.question.split(/(__)/g);
	questionContent = (
	  <>
		<div className="mb-6 text-3xl text-center font-extrabold text-blue-500 drop-shadow-lg font-[Comic Sans MS,cursive,sans-serif] flex flex-wrap justify-center items-center gap-2">
		  {parts.map((part, i) => {
			if (part === '__') {
			  const idx = blankIdx++;
			  return (
				<span key={i} className="inline-block align-middle mx-1">
				  <span
					className={`w-16 h-16 border-4 border-dashed rounded-2xl inline-flex items-center justify-center text-2xl font-extrabold bg-pink-50 ${dragBlanks[idx] ? 'border-blue-400' : 'border-pink-200'}`}
					onDragOver={e => e.preventDefault()}
					onDrop={() => {
					  if (dragged) {
						const newBlanks = [...dragBlanks];
						newBlanks[idx] = dragged;
						setDragBlanks(newBlanks);
						setUserAnswer(newBlanks);
						setDragged(null);
					  }
					}}
					style={{ minWidth: 64, minHeight: 64 }}
				  >{dragBlanks[idx] || ''}</span>
				</span>
			  );
			}
			return <span key={i}>{part}</span>;
		  })}
		</div>
		<div className="flex gap-4 flex-wrap justify-center">
		  {q.tiles.map((tile, idx) => (
			<div
			  key={tile+idx}
			  className="w-16 h-16 puzzle-tile flex items-center justify-center font-extrabold text-2xl shadow-lg cursor-grab hover:scale-110 transition-all duration-150"
			  style={{
				background: puzzleColors[idx % puzzleColors.length],
				color: '#fff',
				borderRadius: '12px',
				border: '4px solid #fff',
				boxShadow: '0 4px 12px 0 rgba(0,0,0,0.12)',
				fontFamily: 'Fredoka One, Comic Sans MS, Comic Sans, cursive, sans-serif',
				textShadow: '0 2px 0 #0002',
			  }}
			  draggable
			  onDragStart={() => setDragged(tile)}
			>{tile}</div>
		  ))}
		</div>
	  </>
	);
  } else if (q.type === 'drag-show') {
	// ...drag-show JSX as before...
	questionContent = (
	  <>
		<div className="mb-6 text-3xl text-center font-extrabold text-blue-500 drop-shadow-lg font-[Comic Sans MS,cursive,sans-serif]">{q.prompt}</div>
		<div className="flex gap-3 flex-wrap justify-center mb-4">
		  {q.tiles.map((tile, idx) => (
			<div
			  key={tile+idx}
			  className={`w-14 h-14 bg-gradient-to-tr from-blue-200 to-pink-200 text-blue-700 rounded-2xl flex items-center justify-center font-extrabold text-xl shadow-lg cursor-pointer transition-all duration-150 ${userAnswer === tile ? 'ring-4 ring-pink-400 scale-110' : ''}`}
			  onClick={() => setUserAnswer(tile)}
			>{tile}</div>
		  ))}
		</div>
	  </>
	);
  } else if (q.type === 'drag-pattern') {
	// ...drag-pattern JSX as before...
	questionContent = (
	  <>
		<div className="mb-6 text-3xl text-center font-extrabold text-blue-500 drop-shadow-lg font-[Comic Sans MS,cursive,sans-serif]">Drag to complete the pattern:</div>
		<div className="flex gap-3 justify-center mb-4">
		  {q.sequence.map((val, i) => val !== null ? (
			<div key={i} className="w-16 h-16 bg-gradient-to-tr from-blue-200 to-pink-200 text-blue-700 rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-lg">{val}</div>
		  ) : (
			<div
			  key={i}
			  className={`w-16 h-16 border-4 border-dashed rounded-2xl flex items-center justify-center text-2xl font-extrabold bg-pink-50 ${dragBlanks[i] ? 'border-blue-400' : 'border-pink-200'}`}
			  onDragOver={e => e.preventDefault()}
			  onDrop={() => {
				if (dragged) {
				  const newBlanks = [...dragBlanks];
				  newBlanks[i] = dragged;
				  setDragBlanks(newBlanks);
				  setUserAnswer(newBlanks.filter(Boolean));
				  setDragged(null);
				}
			  }}
			>{dragBlanks[i] || ''}</div>
		  ))}
		</div>
		<div className="flex gap-4 flex-wrap justify-center">
		  {q.tiles.map((tile, idx) => (
			<div
			  key={tile+idx}
			  className="w-14 h-14 bg-gradient-to-tr from-blue-200 to-pink-200 text-blue-700 rounded-2xl flex items-center justify-center font-extrabold text-xl shadow-lg cursor-grab hover:scale-110 transition-all duration-150"
			  draggable
			  onDragStart={() => setDragged(tile)}
			>{tile}</div>
		  ))}
		</div>
	  </>
	);
  } else if (q.type === 'arrange') {
	// ...arrange JSX as before...
	const answerArr = Array.isArray(userAnswer) && userAnswer.length === q.tiles.length ? userAnswer : q.tiles;
	const handleDropAt = (toIdx: number) => {
	  if (dragged) {
		const newOrder = [...answerArr];
		const from = newOrder.indexOf(dragged);
		if (from > -1) newOrder.splice(from, 1);
		newOrder.splice(toIdx, 0, dragged);
		setUserAnswer(newOrder);
	  }
	  setDragged(null);
	};
	questionContent = (
	  <>
		<div className="mb-6 text-3xl text-center font-extrabold text-blue-500 drop-shadow-lg font-[Comic Sans MS,cursive,sans-serif]">{q.prompt}</div>
		<div className="flex gap-3 flex-wrap justify-center mb-4 items-center">
		  <div
			className="w-8 h-16 flex items-center justify-center opacity-0 hover:opacity-60 transition-opacity duration-150 border-2 border-dashed border-blue-300 rounded-xl"
			onDragOver={e => e.preventDefault()}
			onDrop={() => handleDropAt(0)}
		  />
		  {answerArr.map((tile: string, idx: number) => <React.Fragment key={tile+idx}>
			<div
			  className="w-16 h-16 bg-gradient-to-tr from-blue-200 to-pink-200 text-blue-700 rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-lg cursor-grab hover:scale-110 transition-all duration-150"
			  draggable
			  onDragStart={() => setDragged(tile)}
			  onDragOver={e => e.preventDefault()}
			  onDrop={() => handleDropAt(idx)}
			>{tile}</div>
			<div
			  className="w-8 h-16 flex items-center justify-center opacity-0 hover:opacity-60 transition-opacity duration-150 border-2 border-dashed border-blue-300 rounded-xl"
			  onDragOver={e => e.preventDefault()}
			  onDrop={() => handleDropAt(idx+1)}
			/>
		  </React.Fragment>)}
		</div>
	  </>
	);
  } else if (q.type === 'tap-multi') {
	// ...tap-multi JSX as before...
	questionContent = (
	  <>
		<div className="mb-6 text-3xl text-center font-extrabold text-blue-500 drop-shadow-lg font-[Comic Sans MS,cursive,sans-serif]">{q.prompt}</div>
		<div className="flex gap-4 flex-wrap justify-center mb-4">
		  {q.tiles.map((tile, idx) => (
			<button
			  key={tile+idx}
			  className={`w-16 h-16 puzzle-tile flex items-center justify-center font-extrabold text-2xl shadow-lg border-4 transition-all duration-150 ${Array.isArray(userAnswer) && userAnswer.includes(tile) ? 'ring-4 ring-yellow-400 scale-110' : ''}`}
			  style={{
				background: puzzleColors[idx % puzzleColors.length],
				color: '#fff',
				borderRadius: '12px',
				border: '4px solid #fff',
				boxShadow: '0 4px 12px 0 rgba(0,0,0,0.12)',
				fontFamily: 'Fredoka One, Comic Sans MS, Comic Sans, cursive, sans-serif',
				textShadow: '0 2px 0 #0002',
			  }}
			  onClick={() => {
				if (audioRef.current) {
				  audioRef.current.currentTime = 0;
				  audioRef.current.play();
				}
				let next = Array.isArray(userAnswer) ? [...userAnswer] : [];
				if (next.includes(tile)) {
				  next = next.filter((t) => t !== tile);
				} else {
				  next.push(tile);
				}
				setUserAnswer(next);
			  }}
			>{tile}</button>
		  ))}
		</div>
	  </>
	);
  } else if (q.type === 'tap-single') {
	// ...tap-single JSX as before...
	questionContent = (
	  <>
		<div className="mb-6 text-3xl text-center font-extrabold text-blue-500 drop-shadow-lg font-[Comic Sans MS,cursive,sans-serif]">{q.prompt}</div>
		<div className="flex gap-4 flex-wrap justify-center mb-4">
		  {q.tiles.map((tile, idx) => (
			<button
			  key={tile+idx}
			  className={`w-16 h-16 puzzle-tile flex items-center justify-center font-extrabold text-2xl shadow-lg border-4 transition-all duration-150 ${userAnswer === tile ? 'ring-4 ring-yellow-400 scale-110' : ''}`}
			  style={{
				background: puzzleColors[idx % puzzleColors.length],
				color: '#fff',
				borderRadius: '12px',
				border: '4px solid #fff',
				boxShadow: '0 4px 12px 0 rgba(0,0,0,0.12)',
				fontFamily: 'Fredoka One, Comic Sans MS, Comic Sans, cursive, sans-serif',
				textShadow: '0 2px 0 #0002',
			  }}
			  onClick={() => {
				if (audioRef.current) {
				  audioRef.current.currentTime = 0;
				  audioRef.current.play();
				}
				setUserAnswer(tile);
			  }}
			>{tile}</button>
		  ))}
		</div>
	  </>
	);
  } else if (q.type === 'tap-shape') {
	// Render shape selection question, supporting both string and object shape definitions
	questionContent = (
	  <>
		<div className="mb-6 text-3xl text-center font-extrabold text-blue-500 drop-shadow-lg font-[Comic Sans MS,cursive,sans-serif]">
		  {q.prompt || 'Tap the correct shape:'}
		</div>
		<div className="flex gap-6 flex-wrap justify-center mb-4">
		  {q.shapes && q.shapes.map((shape, idx) => {
			// Support both string and object
			const shapeName = typeof shape === 'string' ? shape : shape.name;
			let shapeElem = null;
			if (shapeName === 'circle') {
			  shapeElem = (
				<svg width="56" height="56"><circle cx="28" cy="28" r="24" fill="#82b6ff" stroke="#ffe066" strokeWidth="4" /></svg>
			  );
			} else if (shapeName === 'square') {
			  shapeElem = (
				<svg width="56" height="56"><rect x="8" y="8" width="40" height="40" rx="8" fill="#ff5994" stroke="#ffe066" strokeWidth="4" /></svg>
			  );
			} else if (shapeName === 'triangle') {
			  shapeElem = (
				<svg width="56" height="56"><polygon points="28,8 48,48 8,48" fill="#ffe066" stroke="#ff5994" strokeWidth="4" /></svg>
			  );
			} else if (shapeName === 'star') {
			  shapeElem = (
				<svg width="56" height="56" viewBox="0 0 56 56"><polygon points="28,8 34,24 52,24 37,34 42,50 28,40 14,50 19,34 4,24 22,24" fill="#84ff9f" stroke="#ff5994" strokeWidth="3" /></svg>
			  );
			} else if (shapeName === 'pentagon') {
			  // Pentagon SVG
			  shapeElem = (
				<svg width="56" height="56" viewBox="0 0 56 56">
				  <polygon points="28,8 50,24 41,48 15,48 6,24" fill="#ff9668" stroke="#ff5994" strokeWidth="4" />
				</svg>
			  );
			} else {
			  // fallback: show shape name
			  shapeElem = (
				<div className="w-14 h-14 flex items-center justify-center font-bold text-lg bg-gray-200 rounded-xl border-2 border-gray-400">{shapeName}</div>
			  );
			}
			return (
			  <button
				key={shapeName + '-' + idx}
				className={`flex flex-col items-center justify-center p-2 rounded-2xl shadow-lg border-4 transition-all duration-150 bg-white ${userAnswer === shapeName ? 'ring-4 ring-yellow-400 scale-110' : ''}`}
				style={{
				  borderColor: '#ffe066',
				  background: '#fff',
				  minWidth: 64,
				  minHeight: 64,
				  boxShadow: '0 4px 12px 0 rgba(0,0,0,0.12)',
				}}
				onClick={() => {
				  if (audioRef.current) {
					audioRef.current.currentTime = 0;
					audioRef.current.play();
				  }
				  setUserAnswer(shapeName);
				}}
			  >
				{shapeElem}
				<span className="mt-1 text-xs font-bold text-blue-400 capitalize">{shapeName}</span>
			  </button>
			);
		  })}
		</div>
	  </>
	);
  }

  // Defensive fallback: if questionContent is still null, show debug info
  if (!questionContent) {
	questionContent = (
	  <div className="text-center text-red-600 font-bold p-8">
		<div>⚠️ Unable to render this question.</div>
		<pre className="text-xs text-gray-500 mt-2" style={{whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{JSON.stringify(q, null, 2)}</pre>
	  </div>
	);
  }

	return (
	<div className="font-quicksand min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-500" style={{
				background: 'transparent',
				position: 'relative',
				overflow: 'hidden',
			}}>
			{/* Soft nebula overlay only; global stars sit behind */}
			<div style={{
				pointerEvents: 'none',
				position: 'absolute',
				inset: 0,
				zIndex: 1,
				background: 'radial-gradient(ellipse at 60% 20%, rgba(59,7,100,0.58) 0%, rgba(24,26,42,0) 80%)',
			}} />
	  {/* Navbar copied from learning-path for consistency */}
	<nav className="w-full flex items-center justify-between px-6 py-4 min-h-[64px] rounded-b-[2.5rem] bg-white/60 shadow-xl border-b-4 border-blue-200 z-20 relative backdrop-blur-md" style={{background: 'linear-gradient(90deg, rgba(236,72,153,0.18) 0%, rgba(59,130,246,0.18) 100%)', marginBottom: 0, paddingBottom: 0, marginTop: 0, paddingTop: 0}}>
		<div className="flex items-center gap-3">
		  <span className="text-3xl select-none">🦉</span>
		  <span className="text-2xl font-extrabold tracking-tight text-blue-600 drop-shadow font-[Comic Sans MS,Comic Sans,cursive]">
			Math Quest
		  </span>
		</div>
		<Link
		  href="/"
		  className="ml-4 bg-pink-500 hover:bg-pink-600 text-white px-7 py-2 rounded-full text-base font-bold shadow transition text-center font-[Comic Sans MS,Comic Sans,cursive] border-2 border-pink-300"
		  onClick={() => { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); } }}
		>
		  Home
		</Link>
	  </nav>

	  {/* Audio elements for button/correct/wrong sounds */}
	  <audio ref={audioRef} src="/button-click.mp3" preload="auto" />
	  <audio ref={correctAudioRef} src="/correct.mp3" preload="auto" />
	  <audio ref={wrongAudioRef} src="/wrong.mp3" preload="auto" />

	  {/* Gap below navbar and above progress bar/level indicator */}
	  <div style={{ marginTop: '0.75rem', minHeight: '0.75rem' }} />
	  <div className="flex flex-col items-center justify-center w-full max-w-2xl gap-8 mx-auto">
		<div className="w-full flex flex-col items-center mb-5">
		  <div className="text-center text-pink-700 text-lg font-bold mt-0 mb-0 font-[Comic Sans MS,cursive,sans-serif]">Level {current + 1} / {questions.length}</div>
		  <div className="text-center text-blue-500 text-xs mt-0 mb-0 font-semibold">Try to get as many correct in a row as you can!</div>
		  <div className="w-full h-4 bg-pink-100 rounded-full mt-1">
			<div
			  className="h-4 rounded-full bg-gradient-to-r from-pink-400 to-blue-400 transition-all duration-500"
			  style={{ width: `${((current + (feedback === '✅ Correct!' ? 1 : 0)) / questions.length) * 100}%` }}
			/>
		  </div>
		</div>
		{/* Main question card */}
			<Card className="puzzle-card p-4 sm:p-8 w-full max-w-2xl min-h-[320px] h-auto flex flex-col items-center justify-center mx-auto overflow-hidden shadow-2xl rounded-[2rem] border-0" style={{
				background: 'rgba(20, 24, 56, 0.88)',
				boxShadow: '0 0 32px 8px #1a237e99, 0 0 64px 0 #00e5ff33',
				border: 'none',
				outline: '3px solid #536dfe',
				outlineOffset: '-8px',
				backdropFilter: 'blur(6px)',
			}}>
		  <CardContent className="flex flex-col flex-1 min-h-full w-full h-full items-center justify-center">
			<div className="flex flex-col flex-1 min-h-full w-full h-full items-center justify-center">
			  {questionContent}
			</div>
			{q.type !== 'input' && (
			  <div className="w-full flex justify-center mt-10">
				<Button
				  id="check-btn"
				  type="button"
				  className="bg-gradient-to-tr from-pink-400 to-blue-400 text-white px-12 py-5 rounded-3xl text-2xl font-extrabold shadow-lg hover:scale-105 hover:from-pink-500 hover:to-blue-500 transition-all duration-150 font-[Comic Sans MS,cursive,sans-serif]"
				  style={{
					background: 'linear-gradient(135deg, #f472b6 0%, #60a5fa 100%)',
					borderRadius: '1.5rem',
					fontSize: '2rem',
					fontWeight: 800,
					boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)',
				  }}
				  onClick={() => {
					if (audioRef.current) {
					  audioRef.current.currentTime = 0;
					  audioRef.current.play();
					}
					handleSubmit();
				  }}
				>
				  Check
				</Button>
			  </div>
			)}
			{/* Only show feedback here for non-input questions */}
			{q.type !== 'input' && (
			  <div style={{ minHeight: 44, marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				{feedback ? (
				  <div className={`text-center text-2xl font-extrabold animate-bounce-fast ${feedback.includes('Correct') ? 'text-pink-600' : 'text-blue-700'}`}
					style={{
					  animation: 'bounce 0.6s',
					  animationIterationCount: 1,
					  filter: feedback.includes('Correct') ? 'drop-shadow(0 0 10px #f472b6)' : 'drop-shadow(0 0 10px #60a5fa)'
					}}>
					{feedback}
				  </div>
				) : null}
			  </div>
			)}
		  </CardContent>
		</Card>
		<style>{`
		  @keyframes bounce-fast {
			0%, 100% { transform: translateY(0); }
			20% { transform: translateY(-20px); }
			40% { transform: translateY(0); }
			60% { transform: translateY(-10px); }
			80% { transform: translateY(0); }
		  }
		  .animate-bounce-fast { animation: bounce-fast 0.6s; }
		  .animate-bounce-slow { animation: bounce 3s infinite alternate; }
		  .animate-bounce-slower { animation: bounce 5s infinite alternate; }
		  .animate-bounce-slowest { animation: bounce 7s infinite alternate; }
		`}</style>
	  </div>
	</div>
  );
}

export default function MathPage() {
	return (
		<Suspense>
			<MathPageInner />
		</Suspense>
	);
}

