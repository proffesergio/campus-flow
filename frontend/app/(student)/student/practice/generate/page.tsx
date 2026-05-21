'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronLeft, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

type Stage = 'setup' | 'quiz' | 'results';

export default function GeneratePracticeTestPage() {
  const [stage, setStage] = useState<Stage>('setup');
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState('');

  // Form state
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState(5);
  const [studentClass, setStudentClass] = useState('');

  async function generateTest() {
    if (!subject.trim() || !topic.trim() || !studentClass.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setGenerating(true);
    try {
      const res = await api.post<{ success: boolean; data: { questions: Question[] } }>(
        '/ai/generate-practice-questions',
        { subject, topic, difficulty, count, studentClass },
      );
      const qs = res.data.data?.questions ?? [];
      if (qs.length === 0) {
        setError('AI could not generate questions. Try a different topic.');
        return;
      }
      setQuestions(qs);
      setAnswers({});
      setCurrent(0);
      setStage('quiz');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to generate questions';
      setError(msg.includes('OPENAI_API_KEY') ? 'OpenAI API key not configured.' : 'Failed to generate questions. Try again.');
    } finally {
      setGenerating(false);
    }
  }

  function selectAnswer(opt: string) {
    if (answers[current] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [current]: opt }));
  }

  function next() {
    if (current < questions.length - 1) setCurrent((c) => c + 1);
    else setStage('results');
  }

  function restart() {
    setStage('setup');
    setQuestions([]);
    setAnswers({});
    setCurrent(0);
  }

  const score = Object.entries(answers).filter(
    ([i, ans]) => ans === questions[parseInt(i)]?.correctAnswer,
  ).length;

  if (stage === 'setup') {
    return (
      <div className="p-6 max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            AI Practice Test
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Generate personalized MCQ questions instantly</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Your Class</label>
            <input
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              placeholder="e.g. Grade 9, Class 10"
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Mathematics, Physics, English"
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Topic</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Quadratic Equations, Newton's Laws"
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Questions</label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
              >
                {[5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={generateTest}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-3 rounded-lg transition-colors"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Practice Test
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'quiz') {
    const q = questions[current];
    const selected = answers[current];
    const isCorrect = selected === q.correctAnswer;

    return (
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <button
            onClick={restart}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            New Test
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">
              {current + 1} / {questions.length}
            </span>
            <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${((current + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5"
          >
            <p className="text-base font-medium text-zinc-100 leading-relaxed">{q.question}</p>

            <div className="space-y-2.5">
              {q.options.map((opt) => {
                const isSelected = selected === opt;
                const correct = q.correctAnswer === opt;
                let cls = 'border-zinc-700 text-zinc-300 hover:border-indigo-500 hover:text-white';
                if (selected !== undefined) {
                  if (correct) cls = 'border-green-500 bg-green-500/10 text-green-300';
                  else if (isSelected) cls = 'border-red-500 bg-red-500/10 text-red-300';
                  else cls = 'border-zinc-800 text-zinc-500';
                }
                return (
                  <button
                    key={opt}
                    onClick={() => selectAnswer(opt)}
                    disabled={selected !== undefined}
                    className={`w-full text-left text-sm px-4 py-3 rounded-lg border transition-all disabled:cursor-default ${cls}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {selected !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border ${
                  isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {isCorrect ? 'Correct!' : `Incorrect — ${q.correctAnswer}`}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{q.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {selected !== undefined && (
          <button
            onClick={next}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-3 rounded-lg transition-colors"
          >
            {current < questions.length - 1 ? 'Next Question' : 'See Results'}
          </button>
        )}
      </div>
    );
  }

  // Results
  const pct = Math.round((score / questions.length) * 100);
  return (
    <div className="p-6 max-w-lg mx-auto space-y-6 text-center">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-4">
        <div className="text-6xl font-bold text-white">{pct}%</div>
        <p className="text-zinc-300 text-lg">
          {score} / {questions.length} correct
        </p>
        <p className={`text-sm font-medium ${pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
          {pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort, keep practising!' : 'Keep studying — you can improve!'}
        </p>

        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
          />
        </div>
      </div>

      {/* Per-question review */}
      <div className="space-y-2 text-left">
        {questions.map((q, i) => {
          const correct = answers[i] === q.correctAnswer;
          return (
            <div
              key={i}
              className={`p-3 rounded-lg border text-sm ${correct ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}
            >
              <div className="flex items-start gap-2">
                {correct ? (
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="text-zinc-300 line-clamp-2">{q.question}</p>
                  {!correct && (
                    <p className="text-xs text-green-400 mt-1">Correct: {q.correctAnswer}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={restart}
        className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-3 rounded-lg transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}
