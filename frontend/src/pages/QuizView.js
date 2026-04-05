import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ArrowLeft, Lock } from '@phosphor-icons/react';

const QuizView = () => {
    const { programId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const API_URL = process.env.REACT_APP_BACKEND_URL;
                const token = localStorage.getItem('token');
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                const res = await axios.get(`${API_URL}/api/programs/${programId}/quiz`, config);
                setQuiz(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [programId]);

    const handleOptionSelect = (qId, idx) => {
        if (result) return; // Prevent selection after submit
        setAnswers({ ...answers, [qId]: idx });
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < quiz.questions.length) {
            alert('Please answer all questions before submitting.');
            return;
        }

        try {
            const API_URL = process.env.REACT_APP_BACKEND_URL;
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const res = await axios.post(
                `${API_URL}/api/programs/${programId}/quiz/submit`,
                { answers },
                config
            );
            setResult(res.data);
            
            if (res.data.passed) {
                // Also log activity
                axios.post(`${API_URL}/api/progress/activity`, {}, config).catch(() => {});
            }
        } catch (err) {
            console.error('Failed to submit quiz', err);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lms-primary"></div>
        </div>
    );

    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        return <div className="text-center py-20">No Quiz available for this course yet.</div>;
    }

    if (quiz.all_videos_completed === false) {
        return (
            <div className="max-w-3xl mx-auto py-20 text-center">
                <button 
                    onClick={() => navigate(-1)} 
                    className="inline-flex items-center gap-2 text-lms-muted hover:text-lms-fg mb-10 text-sm"
                >
                    <ArrowLeft /> Back
                </button>
                <div className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-[2rem] p-12 shadow-xl inline-block max-w-lg">
                    <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock size={36} weight="duotone" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-gray-900 mb-3">Quiz Locked</h3>
                    <p className="text-gray-500 mb-6 font-mono text-sm">
                        You must watch all video lectures in this course before you can attempt the final quiz.
                    </p>
                    <button
                        onClick={() => navigate(`/app/program/${programId}`)}
                        className="px-8 py-3 bg-lms-primary text-white rounded-xl font-bold hover:scale-105 transition-all text-sm"
                    >
                        Go to Videos
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-10">
            <button 
                onClick={() => navigate(-1)} 
                className="inline-flex items-center gap-2 text-lms-muted hover:text-lms-fg mb-6 text-sm"
            >
                <ArrowLeft /> Back
            </button>

            <header className="mb-10 text-center">
                <h1 className="text-4xl font-serif font-bold text-lms-fg mb-2">Final Course Quiz</h1>
                <p className="text-lms-muted">Test your understanding to get your certificate.</p>
                
                {quiz.progress && quiz.progress.passed && !result &&(
                    <div className="mt-4 bg-green-50 text-green-700 py-3 rounded-xl border border-green-200">
                        <CheckCircle size={24} className="inline-block mr-2" weight="fill" />
                        You have already passed this quiz.
                    </div>
                )}
            </header>

            <div className="space-y-8">
                {quiz.questions.map((q, qIndex) => (
                    <div key={q.id} className="bg-white border border-lms-secondary rounded-2xl p-6 shadow-sm">
                        <h4 className="font-bold text-lg mb-4 text-lms-fg">
                            {qIndex + 1}. {q.text}
                        </h4>
                        <div className="space-y-3">
                            {q.options.map((opt, oIndex) => {
                                const isSelected = answers[q.id] === oIndex;
                                return (
                                    <button
                                        key={opt}
                                        onClick={() => handleOptionSelect(q.id, oIndex)}
                                        className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${
                                            isSelected 
                                                ? 'border-lms-primary bg-lms-primary/5 shadow-sm' 
                                                : 'border-lms-secondary hover:border-lms-primary/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                isSelected ? 'border-lms-primary bg-lms-primary' : 'border-gray-300'
                                            }`}>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                            </div>
                                            <span className="text-lms-fg">{opt}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {result && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-10 p-8 rounded-2xl text-center border shadow-lg ${
                        result.passed ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                >
                    {result.passed ? (
                        <CheckCircle size={64} className="mx-auto mb-4" weight="fill" />
                    ) : (
                        <XCircle size={64} className="mx-auto mb-4" weight="fill" />
                    )}
                    <h2 className="text-2xl font-bold mb-2">
                        {result.passed ? 'Congratulations!' : 'Keep Trying!'}
                    </h2>
                    <p className="text-lg mb-6">You scored {result.score} out of {result.total}.</p>
                </motion.div>
            )}

            {!result && (
                <div className="mt-10 text-center">
                    <button
                        onClick={handleSubmit}
                        className="px-10 py-4 bg-lms-primary text-white rounded-xl font-bold shadow-xl shadow-lms-primary/20 hover:-translate-y-1 transition-all"
                    >
                        Submit Answers
                    </button>
                </div>
            )}
        </div>
    );
};

export default QuizView;
