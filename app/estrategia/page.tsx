"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Bot, User, Loader2, Zap, ShieldAlert, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function StrategyPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    async function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-coach`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    type: 'war_mode',
                    customPrompt: userMessage
                })
            });

            const data = await response.json();
            if (data.content) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
            }
        } catch (error) {
            console.error("Error in Strategy Chat:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Erro ao conectar com o estrategista. Verifique sua conexão." }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                        <Zap className="w-6 h-6 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Modo Guerra</h1>
                </div>
                <p className="text-muted-foreground">Estratégias agressivas e planos de ação para o seu negócio.</p>
            </header>

            <div className="flex-1 glass-card rounded-3xl border-white/5 flex flex-col overflow-hidden">
                {/* Chat Messages */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <ShieldAlert className="w-16 h-16 text-white/20" />
                            <div className="max-w-xs space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-white">O QG está pronto.</p>
                                    <p className="text-xs text-muted-foreground">Qual o problema ou meta que precisamos atacar hoje?</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setInput("Gere um relatório diário completo com base nos meus dados de hoje. Foco em vendas, gastos e tarefas.");
                                        // Trigger send immediately
                                        setTimeout(() => {
                                            const form = document.querySelector('form');
                                            if (form) form.requestSubmit();
                                        }, 100);
                                    }}
                                    className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-colors flex items-center gap-2 mx-auto"
                                >
                                    <History className="w-4 h-4" />
                                    Gerar Relatório Diário
                                </button>
                            </div>
                        </div>
                    ) : (
                        messages.map((m, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "flex gap-4",
                                    m.role === 'user' ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                    m.role === 'user' ? "bg-primary/20 border border-primary/30" : "bg-red-500/20 border border-red-500/30"
                                )}>
                                    {m.role === 'user' ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-red-500" />}
                                </div>
                                <div className={cn(
                                    "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                                    m.role === 'user'
                                        ? "bg-primary/10 text-white rounded-tr-none border border-primary/10"
                                        : "bg-white/5 text-white/90 rounded-tl-none border border-white/5"
                                )}>
                                    {m.role === 'user' ? (
                                        <p className="whitespace-pre-wrap">{m.content}</p>
                                    ) : (
                                        <div className="prose prose-invert prose-sm max-w-none [&>p]:mb-4 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>h3]:mt-4 [&>strong]:text-white [&>strong]:font-bold">
                                            <ReactMarkdown>{m.content}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                    {loading && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                                <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-red-500/50 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-red-500/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-1.5 h-1.5 bg-red-500/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <form
                    onSubmit={sendMessage}
                    className="p-4 bg-white/5 border-t border-white/5 flex gap-3"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Descreva o desafio ou peça um plano..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="p-3 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
