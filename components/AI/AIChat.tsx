'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Rnd } from 'react-rnd';
import { Send, Bot, X, Sparkles, Sprout, Bug, RotateCcw, Settings, History, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Modal from '@/components/UI/Modal';

export interface AIChatProps {
    selectedZoneIds?: string[];
    selectedItemIds?: string[];
    selectedSeedIds?: string[];
    onTasksMutated?: () => void;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ConversationSummary {
    id: string;
    title: string;
    contextFilter: string;
    updatedAt: string;
    createdAt: string;
}

const DEFAULT_SYSTEM_PROMPT = `You are an expert AI Gardening Assistant for a home garden planning application.

LOCATION: Zurich, Switzerland (temperate climate, USDA Zone 6-7)
CURRENT DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

YOUR EXPERTISE:
- Seasonal planting schedules for temperate climates
- Companion planting and crop rotation
- Pest management and organic gardening
- Soil health and fertilization
- Space optimization for small gardens

INSTRUCTIONS:
- Answer questions based on the provided garden context
- Give practical, actionable advice
- Consider the current season when making recommendations
- Format responses in Markdown for readability
- Try to answer in a concise and direct way`;

export function AIChat({ selectedZoneIds = [], selectedItemIds = [], selectedSeedIds = [], onTasksMutated }: AIChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [contextFilter, setContextFilter] = useState<'all' | 'tasks' | 'planner' | 'seedbed' | 'selection'>('all');
    const [lastPrompt, setLastPrompt] = useState<string | null>(null);
    const [showDebug, setShowDebug] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
    const [showHistory, setShowHistory] = useState(false);
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [rndConfig, setRndConfig] = useState({ x: 0, y: 0, width: 384, height: 512 });

    useEffect(() => {
        setIsMounted(true);
        setRndConfig({
            x: window.innerWidth >= 420 ? window.innerWidth - 420 : 10,
            y: window.innerHeight >= 550 ? window.innerHeight - 550 : 10,
            width: Math.min(384, window.innerWidth - 20),
            height: Math.min(512, window.innerHeight - 20)
        });
    }, []);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
        }
    }, [input]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const loadConversations = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const res = await fetch('/api/conversations');
            const data = await res.json();
            setConversations(data);
        } catch {
            // ignore
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    const handleOpenHistory = () => {
        setShowHistory(true);
        loadConversations();
    };

    const handleLoadConversation = async (id: string) => {
        try {
            const res = await fetch(`/api/conversations/${id}`);
            const data = await res.json();
            setMessages(data.messages ?? []);
            setConversationId(data.id);
            setContextFilter(data.contextFilter ?? 'all');
            setLastPrompt(null);
            setShowHistory(false);
        } catch {
            // ignore
        }
    };

    const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
        setConversations(prev => prev.filter(c => c.id !== id));
        if (conversationId === id) {
            setMessages([]);
            setConversationId(null);
            setLastPrompt(null);
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setConversationId(null);
        setLastPrompt(null);
        setShowHistory(false);
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { role: 'user', content: input };
        const outgoingMessages = [...messages, userMsg];
        setMessages(outgoingMessages);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: outgoingMessages,
                    contextFilter,
                    selectedZoneIds,
                    selectedItemIds,
                    selectedSeedIds,
                    systemPrompt
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            if (data.prompt) setLastPrompt(data.prompt);
            if (data.taskMutated && onTasksMutated) onTasksMutated();

            const assistantMsg: Message = { role: 'assistant', content: data.content };
            const finalMessages = [...outgoingMessages, assistantMsg];
            setMessages(finalMessages);

            // Persist conversation (fire-and-forget — don't block the UI)
            if (!conversationId) {
                const title = userMsg.content.trim().slice(0, 60);
                fetch('/api/conversations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, messages: finalMessages, contextFilter })
                })
                    .then(r => r.json())
                    .then(conv => setConversationId(conv.id))
                    .catch(() => undefined);
            } else {
                fetch(`/api/conversations/${conversationId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: finalMessages })
                }).catch(() => undefined);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
        if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <>
            {/* Debug Dialog */}
            <Modal isOpen={showDebug} onClose={() => setShowDebug(false)} title="Debug: Last Prompt">
                {lastPrompt ? (
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono bg-slate-50 p-4 rounded-lg border border-slate-200 max-h-[60vh] overflow-y-auto">{lastPrompt}</pre>
                ) : (
                    <p className="text-slate-400 text-center">No prompt sent yet. Send a message first.</p>
                )}
            </Modal>

            {/* Settings Dialog */}
            <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="System Prompt">
                <p className="text-xs text-slate-500 mb-2">This prompt is sent as context to the AI before each message. Edit it to customize the assistant&apos;s behavior.</p>
                <textarea
                    className="w-full h-64 text-xs text-slate-700 font-mono bg-slate-50 p-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                    value={systemPrompt}
                    onChange={e => setSystemPrompt(e.target.value)}
                />
                <div className="flex gap-2 mt-4">
                    <button onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)} className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200">Reset to Default</button>
                    <button onClick={() => setShowSettings(false)} className="flex-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Done</button>
                </div>
            </Modal>

            <div className={cn("fixed bottom-6 right-6 z-[60] flex flex-col items-end pointer-events-none")}>
                {/* Floating Toggle Button */}
                {isMounted && !isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="pointer-events-auto bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg hover:shadow-emerald-500/30 transition-all hover:scale-110 active:scale-95 group"
                    >
                        <Bot size={24} className="group-hover:animate-pulse" />
                    </button>
                )}
            </div>

            {/* Chat Window */}
            {isMounted && isOpen && (
                <Rnd
                    default={rndConfig}
                    minWidth={300}
                    minHeight={400}
                    bounds="window"
                    dragHandleClassName="chat-handle"
                    cancel=".nodrag"
                    style={{ position: 'fixed', zIndex: 70 }}
                    className="pointer-events-auto shadow-2xl rounded-2xl"
                >
                    <div className="w-full h-full flex flex-col bg-white/90 backdrop-blur-xl border border-white/40 rounded-2xl overflow-hidden">
                        {/* Header */}
                        <div className="chat-handle cursor-move flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white shrink-0 group">
                            <div className="flex items-center gap-2 text-emerald-700">
                                <Sparkles size={16} />
                                <span className="font-bold text-sm select-none group-hover:text-emerald-800 transition-colors title">
                                    {showHistory ? 'Chat History' : 'Garden Assistant'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {!showHistory && (
                                    <>
                                        <button onClick={handleNewChat} className="text-slate-400 hover:text-red-500" title="New chat">
                                            <RotateCcw size={14} />
                                        </button>
                                        <button onClick={() => setShowSettings(true)} className="text-slate-400 hover:text-emerald-600" title="Edit system prompt">
                                            <Settings size={14} />
                                        </button>
                                        <button onClick={() => setShowDebug(true)} className="text-slate-400 hover:text-orange-500" title="Debug: View last prompt">
                                            <Bug size={14} />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={showHistory ? () => setShowHistory(false) : handleOpenHistory}
                                    className={cn("transition-colors", showHistory ? "text-emerald-600" : "text-slate-400 hover:text-emerald-600")}
                                    title="Chat history"
                                >
                                    <History size={14} />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {showHistory ? (
                            /* History Panel */
                            <div className="nodrag flex-1 flex flex-col overflow-hidden">
                                <div className="p-3 border-b border-slate-100 shrink-0">
                                    <button
                                        onClick={handleNewChat}
                                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors"
                                    >
                                        <Plus size={14} />
                                        New conversation
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {historyLoading && (
                                        <p className="text-xs text-slate-400 text-center mt-8">Loading...</p>
                                    )}
                                    {!historyLoading && conversations.length === 0 && (
                                        <div className="text-center text-slate-400 mt-10 px-6">
                                            <History size={28} className="mx-auto mb-2 opacity-40" />
                                            <p className="text-xs">No past conversations yet.</p>
                                        </div>
                                    )}
                                    {conversations.map(conv => (
                                        <div
                                            key={conv.id}
                                            onClick={() => handleLoadConversation(conv.id)}
                                            className={cn(
                                                "w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2 group/item cursor-pointer",
                                                conversationId === conv.id && "bg-emerald-50"
                                            )}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-slate-700 truncate leading-snug">{conv.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-slate-400">{formatDate(conv.updatedAt)}</span>
                                                    <span className="text-[10px] text-slate-300 uppercase font-bold">{conv.contextFilter}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={e => handleDeleteConversation(e, conv.id)}
                                                className="opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-red-400 transition-all shrink-0 mt-0.5"
                                                title="Delete"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Context Toggles */}
                                <div className="flex gap-2 p-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase overflow-x-auto shrink-0">
                                    {(['all', 'tasks', 'planner', 'seedbed', 'selection'] as const).map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => setContextFilter(filter)}
                                            className={cn(
                                                "px-3 py-1 rounded-full transition-colors border whitespace-nowrap",
                                                contextFilter === filter
                                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                                            )}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>

                                {/* Messages */}
                                <div className="nodrag flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-slate-50/50 min-h-0">
                                    {messages.length === 0 && (
                                        <div className="text-center text-slate-400 mt-10 px-6">
                                            <Sprout size={32} className="mx-auto mb-2 opacity-50" />
                                            <p>Hello! Ask me about your garden layout or what seeds to plant.</p>
                                        </div>
                                    )}
                                    {messages.map((m, i) => (
                                        <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                                            <div className={cn(
                                                "max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed",
                                                m.role === 'user'
                                                    ? "bg-emerald-600 text-white rounded-br-none"
                                                    : "bg-white border border-slate-100 text-slate-700 rounded-bl-none prose prose-sm prose-emerald"
                                            )}>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        table: ({ node, ...props }) => (
                                                            <div className="overflow-x-auto my-4">
                                                                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg" {...props} />
                                                            </div>
                                                        ),
                                                        thead: ({ node, ...props }) => <thead className="bg-slate-50" {...props} />,
                                                        th: ({ node, ...props }) => <th className="px-3 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider" {...props} />,
                                                        td: ({ node, ...props }) => <td className="px-3 py-2 text-xs text-slate-600 border-t border-slate-100" {...props} />,
                                                    }}
                                                >
                                                    {m.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm flex gap-1">
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className="nodrag p-3 bg-white border-t border-slate-100 flex items-end gap-2 shrink-0">
                                    <textarea
                                        ref={inputRef}
                                        rows={1}
                                        className="nodrag flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-black placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none min-h-[40px] max-h-32 overflow-y-auto"
                                        placeholder="Ask anything..."
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={loading || !input.trim()}
                                        className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </Rnd>
            )}
        </>
    );
}
