'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, RotateCcw, GraduationCap } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED = [
  'Explain photosynthesis for Grade 8',
  'Help me solve quadratic equations',
  'I have a science test tomorrow',
  'Explain Newton\'s laws of motion',
];

const STORAGE_KEY = 'campusflow_study_chat';

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    }
  }, [messages]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setInput('');
    setError('');

    const userMsg: Message = { role: 'user', content };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setStreamText('');
    setStreaming(true);

    abortRef.current = new AbortController();
    const slug = typeof window !== 'undefined' ? localStorage.getItem('campusflow_slug') ?? '' : '';

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/ai/study-chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-School-Slug': slug },
          body: JSON.stringify({ messages: updated.slice(-20) }),
          credentials: 'include',
          signal: abortRef.current.signal,
        },
      );

      if (!res.ok || !res.body) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message ?? 'Chat failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assembled = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') {
            setMessages((prev) => [...prev, { role: 'assistant', content: assembled }]);
            setStreamText('');
            setStreaming(false);
            return;
          }
          try {
            const { text, error: errMsg } = JSON.parse(payload);
            if (errMsg) throw new Error(errMsg);
            if (text) {
              assembled += text;
              setStreamText(assembled);
            }
          } catch { /* malformed chunk */ }
        }
      }
      if (assembled) {
        setMessages((prev) => [...prev, { role: 'assistant', content: assembled }]);
        setStreamText('');
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        const msg = (e as Error).message ?? 'Chat failed';
        setError(msg.includes('OPENAI_API_KEY') ? 'OpenAI API key not configured.' : msg);
        setMessages(updated);
      }
    } finally {
      setStreaming(false);
      setStreamText('');
    }
  }

  function clearChat() {
    setMessages([]);
    setStreamText('');
    localStorage.removeItem(STORAGE_KEY);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">AI Study Assistant</p>
            <p className="text-xs text-zinc-500">Powered by GPT-4o</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Your AI Study Tutor</p>
              <p className="text-zinc-400 text-sm mt-1 max-w-xs">
                Ask anything about your subjects, get explanations, or prepare for exams.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-3 rounded-xl transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming response */}
        {streaming && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="max-w-[80%] bg-zinc-800 text-zinc-200 rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed">
              {streamText || (
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-zinc-500"
                    />
                  ))}
                </span>
              )}
              {streamText && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 align-middle"
                />
              )}
            </div>
          </motion.div>
        )}

        {error && (
          <p className="text-sm text-red-400 text-center py-2">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-zinc-800 p-4">
        <div className="flex gap-3 items-end max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={streaming}
            placeholder="Ask anything about your studies... (Enter to send)"
            rows={1}
            style={{ resize: 'none' }}
            className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 disabled:opacity-50 placeholder-zinc-600 max-h-32 overflow-y-auto"
          />
          <button
            onClick={() => send()}
            disabled={streaming || !input.trim()}
            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-zinc-600 text-center mt-2">
          Chat history is saved locally on your device only.
        </p>
      </div>
    </div>
  );
}
