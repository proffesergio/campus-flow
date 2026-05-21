'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, User, Bot, Loader2, RefreshCw,
  Users, DollarSign, ClipboardCheck, GraduationCap,
  ChevronRight, Lightbulb,
} from 'lucide-react';
import { api } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  loading?: boolean;
}

const EXAMPLE_QUERIES = [
  { icon: Users,         text: 'Who are the students with attendance below 75%?' },
  { icon: DollarSign,   text: 'How is fee collection going this month?' },
  { icon: ClipboardCheck, text: 'Which classes have the highest absence rate?' },
  { icon: GraduationCap, text: 'Who are the top performers in Grade 8?' },
];

let idCounter = 0;
function uid() { return String(++idCounter); }

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: 'assistant',
      content: "Hello! I'm your school data assistant powered by Claude. Ask me anything about your students, attendance, fees, or exam results — I'll analyse your school's data and give you clear answers.",
    },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendQuery(query: string) {
    if (!query.trim() || streaming) return;
    const userMsg: Message = { id: uid(), role: 'user', content: query };
    const assistantId = uid();
    const placeholder: Message = { id: assistantId, role: 'assistant', content: '', loading: true };

    setMessages((prev) => [...prev, userMsg, placeholder]);
    setInput('');
    setStreaming(true);

    try {
      const res = await api.post<{ success: boolean; data: { answer: string } }>(
        '/ai/admin-query',
        { question: query },
      );
      const answer = res.data.data?.answer ?? 'I could not generate a response.';
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: answer, loading: false } : m),
      );
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const errMsg = status === 503 || status === 500
        ? 'AI service error — make sure OPENAI_API_KEY is set in the backend .env file.'
        : status === 404
        ? "This endpoint isn't mounted yet. Restart the backend after the Phase 7 update."
        : 'Failed to get a response. Please try again.';
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: errMsg, loading: false } : m),
      );
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery(input);
    }
  }

  function clearChat() {
    setMessages([{
      id: uid(),
      role: 'assistant',
      content: "Hello! I'm your school data assistant. Ask me anything about your school's data.",
    }]);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] p-6 gap-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Assistant</h1>
            <p className="text-xs text-zinc-500">Powered by Claude · Ask anything about your school data</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> New chat
        </button>
      </div>

      {/* Example chips — only show when conversation is at start */}
      {messages.length === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0"
        >
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs text-zinc-500 font-medium">Try asking</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXAMPLE_QUERIES.map(({ icon: Icon, text }) => (
              <motion.button
                key={text}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => sendQuery(text)}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-left transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">{text}</span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 ml-auto flex-shrink-0 transition-colors" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-blue-600'
                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
              }`}>
                {msg.role === 'user'
                  ? <User className="w-4 h-4 text-white" />
                  : <Bot className="w-4 h-4 text-white" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm'
              }`}>
                {msg.loading ? (
                  <div className="flex items-center gap-2 py-1">
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                    <span className="text-sm text-zinc-500">Analysing your school data...</span>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0">
        <div className="flex gap-3 items-end bg-zinc-900 border border-zinc-800 rounded-2xl p-3 focus-within:border-zinc-600 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about students, fees, attendance, grades... (Enter to send)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 resize-none focus:outline-none min-h-[20px] max-h-32"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => sendQuery(input)}
            disabled={!input.trim() || streaming}
            className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
          >
            {streaming
              ? <Loader2 className="w-4 h-4 text-white animate-spin" />
              : <Send className="w-4 h-4 text-white" />
            }
          </motion.button>
        </div>
        <p className="text-[10px] text-zinc-700 text-center mt-2">
          Claude analyses your school&apos;s live data · Responses may vary · Always verify critical decisions
        </p>
      </div>
    </div>
  );
}
