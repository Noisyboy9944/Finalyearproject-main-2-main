import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookBookmark, GraduationCap, Clock, Star, Users, Sparkle, TrendUp, BookOpen } from '@phosphor-icons/react';

const Dashboard = () => {
    const [programs, setPrograms] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const user = localStorage.getItem('user') || 'Student';

    const [progress, setProgress] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const API_URL = process.env.REACT_APP_BACKEND_URL;
                const token = localStorage.getItem('token');
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                
                const [progRes, statsRes, dashProgRes] = await Promise.all([
                    axios.get(`${API_URL}/api/enrollments/me`, config),
                    axios.get(`${API_URL}/api/stats`),
                    axios.get(`${API_URL}/api/progress/dashboard`, config)
                ]);
                setPrograms(progRes.data);
                setStats(statsRes.data);
                setProgress(dashProgRes.data);
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lms-primary"></div>
        </div>
    );

    return (
        <div className="max-w-full xl:max-w-7xl mx-auto">
            {/* Welcome Header */}
            <header className="mb-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-sans font-bold text-lms-fg mb-2">
                        Welcome back, {user}! 👋
                    </h1>
                    <p className="text-lms-muted text-base lg:text-lg">Continue where you left off or explore new programs.</p>
                </motion.div>
            </header>

            {/* Bento Grid - Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
                {/* Hero Stat Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="col-span-1 md:col-span-2 bg-gradient-to-br from-lms-primary to-lms-accent rounded-2xl p-8 text-white relative overflow-hidden shadow-lg"
                >
                    <div className="relative z-10">
                        <h3 className="text-lg font-medium mb-4 opacity-80">Weekly Progress</h3>
                        <div className="flex items-end gap-4 mb-2">
                            <span className="text-5xl font-bold font-mono">{progress?.weekly_progress || 0}%</span>
                            <span className="mb-2 text-white/80">Goal Reached</span>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-2 mt-4">
                            <div className="bg-white/80 h-2 rounded-full transition-all duration-1000" style={{ width: `${progress?.weekly_progress || 0}%` }} />
                        </div>
                    </div>
                    <GraduationCap size={200} className="absolute -right-10 -bottom-10 opacity-10 rotate-12" />
                </motion.div>

                {/* Study Streak */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white border border-lms-secondary rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-sm"
                >
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-3">
                        <Sparkle size={24} weight="fill" />
                    </div>
                    <h4 className="font-bold text-sm text-lms-muted mb-1">Study Streak</h4>
                    <p className="text-3xl font-mono font-bold text-lms-fg">{progress?.study_streak || 0} Days</p>
                </motion.div>

                {/* Total Courses */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white border border-lms-secondary rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-sm"
                >
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                        <BookOpen size={24} weight="fill" />
                    </div>
                    <h4 className="font-bold text-sm text-lms-muted mb-1">Available Videos</h4>
                    <p className="text-3xl font-mono font-bold text-lms-fg">{stats?.videos || 0}+</p>
                </motion.div>
            </div>

            {/* Programs Section */}
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg lg:text-xl font-bold text-lms-fg flex items-center gap-2">
                    <BookBookmark className="text-lms-primary" />
                    My Programs
                </h2>
                <Link to="/app/explore" className="text-sm text-lms-primary hover:underline font-medium flex items-center gap-1">
                    Explore All <TrendUp size={14} />
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {programs.map((program, idx) => (
                    <motion.div
                        key={program.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        className="h-full"
                    >
                        <Link 
                            to={`/app/program/${program.id}`}
                            className="group bg-white border border-lms-secondary rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                        >
                            <div className="h-40 overflow-hidden relative">
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors z-10" />
                                <img src={program.image_url} alt={program.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                                {/* Badge */}
                                <div className="absolute top-3 left-3 z-20 px-2.5 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-medium text-lms-primary flex items-center gap-1">
                                    <Star size={12} weight="fill" className="text-amber-500" />
                                    {program.rating || 4.5}
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="font-sans font-bold text-lg text-lms-fg line-clamp-2 mb-2 group-hover:text-lms-primary transition-colors">{program.title}</h3>
                                <p className="text-sm text-lms-muted line-clamp-2 mb-4 flex-1">{program.description}</p>
                                <div className="flex items-center gap-4 text-xs text-lms-muted mb-4 mt-auto">
                                    <span className="flex items-center gap-1"><Clock size={12} /> {program.duration || '20 Hours'}</span>
                                    <span className="flex items-center gap-1"><Users size={12} /> {(program.students_count || 0).toLocaleString()}</span>
                                </div>
                                <div className="mt-2 mb-4 text-sm">
                                    <div className="flex justify-between items-center mb-1 text-xs">
                                        <span className="text-gray-500 font-medium">Course Progress</span>
                                        <span className="text-lms-primary font-bold">{program.progress || 0}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div 
                                            className="bg-lms-primary h-1.5 rounded-full" 
                                            style={{ width: `${program.progress || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-2 text-sm font-medium text-lms-primary group-hover:underline">
                                    Continue Learning <BookBookmark />
                                </span>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
