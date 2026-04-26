import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatCircleDots, X, PaperPlaneRight, Robot, User } from '@phosphor-icons/react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hi! I'm your Unilearn AI assistant. I can help you navigate courses, explain concepts, or answer any learning questions. What can I help you with?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const location = useLocation();
    const [sessionId] = useState(() => {
        const stored = localStorage.getItem('chat_session_id');
        if (stored) return stored;
        const newId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('chat_session_id', newId);
        return newId;
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    // Load chat history on first open
    const [historyLoaded, setHistoryLoaded] = useState(false);
    useEffect(() => {
        if (isOpen && !historyLoaded) {
            const loadHistory = async () => {
                try {
                    const API_URL = process.env.REACT_APP_BACKEND_URL || '';
                    const res = await axios.get(`${API_URL}/api/chat/history/${sessionId}`);
                    if (res.data && res.data.length > 0) {
                        const historyMessages = res.data.map(h => ({
                            role: h.role,
                            content: h.content
                        }));
                        setMessages(prev => [prev[0], ...historyMessages]);
                    }
                } catch (err) {
                    // Silent fail - first time user
                }
                setHistoryLoaded(true);
            };
            loadHistory();
        }
    }, [isOpen, historyLoaded, sessionId]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const API_URL = process.env.REACT_APP_BACKEND_URL || '';
            const res = await axios.post(`${API_URL}/api/chat`, {
                message: userMsg,
                session_id: sessionId,
                context: location.pathname
            });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again in a moment." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const TypistDot = ({ delay }) => (
        <motion.span
            initial={{ opacity: 0.2, y: 0 }}
            animate={{ opacity: 1, y: [-3, 0] }}
            transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatType: "reverse",
                delay: delay
            }}
            className="w-1.5 h-1.5 bg-purple-500 rounded-full inline-block mx-0.5"
        />
    );

    const quickQuestions = [
        "What courses are available?",
        "How do I get started?",
        "Explain Machine Learning",
    ];

    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-24 right-6 z-[9999] w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:shadow-xl transition-shadow"
                    >
                        <ChatCircleDots size={28} weight="fill" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-24 right-6 z-[9999] w-[380px] h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                    <Robot size={20} className="text-white" weight="fill" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-sm">AI Learning Assistant</h3>
                                    <p className="text-white/70 text-xs">Always here to help</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="text-white/70 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                                        msg.role === 'user' 
                                            ? 'bg-indigo-100 text-indigo-600' 
                                            : 'bg-purple-100 text-purple-600'
                                    }`}>
                                        {msg.role === 'user' ? <User size={14} weight="bold" /> : <Robot size={14} weight="fill" />}
                                    </div>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-md'
                                            : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md'
                                    }`}>
                                        {msg.role === 'user' ? (
                                            msg.content
                                        ) : (
                                            <div className="prose prose-sm prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-green-300 prose-pre:p-3 prose-pre:rounded-lg prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1 prose-code:rounded max-w-none">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-2.5"
                                >
                                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-1">
                                        <Robot size={14} weight="fill" />
                                    </div>
                                    <div className="bg-white text-gray-700 border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3.5 flex items-center h-10">
                                        <TypistDot delay={0} />
                                        <TypistDot delay={0.2} />
                                        <TypistDot delay={0.4} />
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Questions (only show if few messages) */}
                        <AnimatePresence>
                            {messages.length <= 2 && !loading && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-4 py-3 bg-gray-50/80 border-t border-gray-100 flex flex-wrap gap-2 shrink-0"
                                >
                                    <p className="w-full text-xs text-gray-400 font-medium mb-1">Suggested questions:</p>
                                {quickQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setInput(q);
                                            setTimeout(() => {
                                                setInput('');
                                                setMessages(prev => [...prev, { role: 'user', content: q }]);
                                                setLoading(true);
                                                const API_URL = process.env.REACT_APP_BACKEND_URL || '';
                                                axios.post(`${API_URL}/api/chat`, {
                                                    message: q,
                                                    session_id: sessionId,
                                                    context: location.pathname
                                                }).then(res => {
                                                    setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
                                                }).catch(() => {
                                                    setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble right now." }]);
                                                }).finally(() => setLoading(false));
                                            }, 50);
                                        }}
                                        className="text-xs bg-white text-indigo-600 px-3 py-2 rounded-xl shadow-sm hover:bg-indigo-50 transition-colors border border-indigo-100 font-medium"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                        </AnimatePresence>

                        {/* Input */}
                        <div className="p-3 bg-white border-t border-gray-200 shrink-0">
                            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask me anything..."
                                    className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                                    disabled={loading}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || loading}
                                    className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <PaperPlaneRight size={16} weight="fill" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatBot;
