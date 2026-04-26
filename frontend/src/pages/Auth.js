import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CaretLeft } from '@phosphor-icons/react';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import LiquidBackground from '../components/LiquidBackground';

const Auth = ({ type }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        phone_number: '',
        gender: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/register';
        const API_URL = process.env.REACT_APP_BACKEND_URL || '';

        try {
            const res = await axios.post(`${API_URL}${endpoint}`, formData);
            localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('user', res.data.user_name);
            toast.success(`Welcome, ${res.data.user_name}!`);
            
            // Seed data automatically on first login if it's a new environment
            try { await axios.post(`${API_URL}/api/seed`); } catch(e) {}

            setTimeout(() => navigate('/app'), 1000);
        } catch (err) {
            toast.error(err.response?.data?.detail || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent text-gray-900 relative overflow-hidden selection:bg-marketing-secondary selection:text-white">
             <Toaster position="top-center" />
            <LiquidBackground />

            {/* Back Button */}
            <div className="absolute top-4 left-4 md:top-8 md:left-8 z-20">
                <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-mono rounded-full bg-white/50 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 border border-white/20 shadow-sm hover:shadow-md text-sm md:text-base">
                    <CaretLeft size={20} /> <span className="hidden sm:inline">Back to Home</span><span className="sm:hidden">Back</span>
                </Link>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md p-8 bg-white/60 backdrop-blur-2xl border border-white/50 rounded-3xl relative z-10 shadow-2xl shadow-indigo-500/10"
            >
                <h2 className="text-3xl font-serif text-center mb-8 text-gray-900">
                    {type === 'login' ? 'Welcome Back' : 'Join Unilearn'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6 font-mono">
                    {type === 'register' && (
                        <>
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Full Name</label>
                                <input 
                                    type="text"
                                    required
                                    className="w-full bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-marketing-secondary focus:ring-2 focus:ring-marketing-secondary/20 transition-all shadow-inner"
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-500 mb-2">Phone Number</label>
                                    <input 
                                        type="tel"
                                        required
                                        className="w-full bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-marketing-secondary focus:ring-2 focus:ring-marketing-secondary/20 transition-all shadow-inner"
                                        onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-2">Gender</label>
                                    <select 
                                        required
                                        className="w-full bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-marketing-secondary focus:ring-2 focus:ring-marketing-secondary/20 transition-all shadow-inner appearance-none"
                                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Address</label>
                                <textarea 
                                    required
                                    rows="2"
                                    className="w-full bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-marketing-secondary focus:ring-2 focus:ring-marketing-secondary/20 transition-all shadow-inner resize-none"
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                ></textarea>
                            </div>
                        </>
                    )}
                    <div>
                        <label className="block text-sm text-gray-500 mb-2">Email Address</label>
                        <input 
                            type="email" 
                            required
                            className="w-full bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-marketing-secondary focus:ring-2 focus:ring-marketing-secondary/20 transition-all shadow-inner"
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-2">Password</label>
                        <input 
                            type="password" 
                            required
                            className="w-full bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-marketing-secondary focus:ring-2 focus:ring-marketing-secondary/20 transition-all shadow-inner"
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>

                    <button 
                        disabled={loading}
                        className="w-full bg-marketing-secondary text-white font-bold py-4 rounded-xl hover:bg-marketing-secondary/90 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-md"
                    >
                        {loading ? 'Processing...' : (type === 'login' ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-500 font-mono">
                    {type === 'login' ? (
                        <p>Don't have an account? <Link to="/register" className="text-marketing-secondary hover:underline font-medium">Register</Link></p>
                    ) : (
                        <p>Already have an account? <Link to="/login" className="text-marketing-secondary hover:underline font-medium">Login</Link></p>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
