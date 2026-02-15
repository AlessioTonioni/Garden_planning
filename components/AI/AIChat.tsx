'use client';
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, X, Sparkles, Sprout, Bug, RotateCcw, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AIChatProps {
    selectedZoneIds?: string[];
    selectedItemIds?: string[];
    selectedSeedIds?: string[];
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

export function AIChat({ selectedZoneIds = [], selectedItemIds = [], selectedSeedIds = [] }: AIChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [contextFilter, setContextFilter] = useState<'all' | 'planner' | 'seedbed' | 'selection'>('all');
    const [lastPrompt, setLastPrompt] = useState<string | null>(null);
    const [showDebug, setShowDebug] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user' as const, content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg],
                    contextFilter,
                    selectedZoneIds,
                    selectedItemIds,
                    selectedSeedIds,
                    systemPrompt
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            if (data.prompt) {
                setLastPrompt(data.prompt);
            }

            setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setMessages([]);
        setLastPrompt(null);
    };

    return (
        <>
            {/* Debug Dialog */}
            {showDebug && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 pointer-events-auto" onClick={() => setShowDebug(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                            <div className="flex items-center gap-2 text-slate-700">
                                <Bug size={16} />
                                <span className="font-bold text-sm">Debug: Last Prompt</span>
                            </div>
                            <button onClick={() => setShowDebug(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {lastPrompt ? (
                                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono bg-slate-50 p-4 rounded-lg border border-slate-200">{lastPrompt}</pre>
                            ) : (
                                <p className="text-slate-400 text-center">No prompt sent yet. Send a message first.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Dialog */}
            {showSettings && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 pointer-events-auto" onClick={() => setShowSettings(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-emerald-50">
                            <div className="flex items-center gap-2 text-emerald-700">
                                <Settings size={16} />
                                <span className="font-bold text-sm">System Prompt</span>
                            </div>
                            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <p className="text-xs text-slate-500 mb-2">This prompt is sent as context to the AI before each message. Edit it to customize the assistant's behavior.</p>
                            <textarea
                                className="w-full h-64 text-xs text-slate-700 font-mono bg-slate-50 p-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                                value={systemPrompt}
                                onChange={e => setSystemPrompt(e.target.value)}
                            />
                        </div>
                        <div className="p-4 border-t border-slate-100 flex gap-2">
                            <button onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)} className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200">Reset to Default</button>
                            <button onClick={() => setShowSettings(false)} className="flex-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Done</button>
                        </div>
                    </div>
                </div>
            )}

            <div className={cn("fixed bottom-6 right-6 z-[60] flex flex-col items-end pointer-events-none")}>

                {/* Chat Window */}
                <div className={cn(
                    "bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 pointer-events-auto flex flex-col",
                    isOpen ? "w-96 h-[32rem] opacity-100 translate-y-0" : "w-0 h-0 opacity-0 translate-y-10"
                )}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white shrink-0">
                        <div className="flex items-center gap-2 text-emerald-700">
                            <Sparkles size={16} />
                            <span className="font-bold text-sm">Garden Assistant</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleReset} className="text-slate-400 hover:text-red-500" title="Reset chat">
                                <RotateCcw size={14} />
                            </button>
                            <button onClick={() => setShowSettings(true)} className="text-slate-400 hover:text-emerald-600" title="Edit system prompt">
                                <Settings size={14} />
                            </button>
                            <button onClick={() => setShowDebug(true)} className="text-slate-400 hover:text-orange-500" title="Debug: View last prompt">
                                <Bug size={14} />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Context Toggles */}
                    <div className="flex gap-2 p-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase overflow-x-auto shrink-0">
                        {(['all', 'planner', 'seedbed', 'selection'] as const).map(filter => (
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

                    {/* Messages - scrollable area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-slate-50/50 min-h-0">
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
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
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
                    <div className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
                        <input
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-black placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="Ask anything..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>

                {/* Floating Toggle Button */}
                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="pointer-events-auto bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg hover:shadow-emerald-500/30 transition-all hover:scale-110 active:scale-95 group"
                    >
                        <Bot size={24} className="group-hover:animate-pulse" />
                    </button>
                )}
            </div>
        </>
    );
}
