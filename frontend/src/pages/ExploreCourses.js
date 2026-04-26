import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MagnifyingGlass, Star, Clock, Users, BookOpen, CaretRight, GraduationCap } from '@phosphor-icons/react';

const ExploreCourses = () => {
    const [programs, setPrograms] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const API_URL = process.env.REACT_APP_BACKEND_URL || '';
                const token = localStorage.getItem('token');
                
                const requests = [axios.get(`${API_URL}/api/explore`)];
                
                if (token) {
                    requests.push(axios.get(`${API_URL}/api/enrollments/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }));
                }
                
                const responses = await Promise.all(requests);
                setPrograms(responses[0].data);
                
                if (responses.length > 1) {
                    setEnrollments(responses[1].data);
                }
            } catch (err) {
                console.error("Failed to fetch programs");
            } finally {
                setLoading(false);
            }
        };
        fetchPrograms();
    }, []);

    const filteredPrograms = programs.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lms-primary"></div>
        </div>
    );

    return (
        <div className="max-w-full xl:max-w-7xl mx-auto">
            {/* Header */}
            <header className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <GraduationCap size={26} weight="fill" />
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-sans font-bold text-lms-fg">Explore Programs</h1>
                            <p className="text-lms-muted text-sm lg:text-base">Discover programs that match your learning goals.</p>
                        </div>
                    </div>
                    {/* Search */}
                    <div className="relative w-full lg:max-w-sm xl:max-w-md">
                        <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search programs or subjects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </header>

            {/* Programs */}
            <div className="space-y-8">
                {filteredPrograms.map((program, idx) => {
                    const enrollment = enrollments.find(e => e.id === program.id);
                    const isEnrolled = !!enrollment;
                    
                    return (
                        <motion.div
                            key={program.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1, duration: 0.4 }}
                            className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                        >
                            {/* Program Header */}
                            <div className="flex flex-col md:flex-row">
                                <div className="md:w-72 h-48 md:h-auto overflow-hidden shrink-0">
                                    <Link to={`/app/program/${program.id}`}>
                                        <img 
                                            src={program.image_url} 
                                            alt={program.title} 
                                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                                        />
                                    </Link>
                                </div>
                                <div className="flex-1 p-6 flex flex-col justify-between">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <Link to={`/app/program/${program.id}`} className="hover:underline">
                                                <h2 className="text-xl font-bold text-lms-fg mb-2">{program.title}</h2>
                                            </Link>
                                            <p className="text-sm text-lms-muted mb-4 max-w-2xl">{program.description}</p>
                                        </div>
                                        {isEnrolled ? (
                                            <div className="shrink-0 ml-4 px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-200 flex items-center gap-1.5 cursor-default">
                                                Enrolled
                                            </div>
                                        ) : (
                                            <Link 
                                                to={`/app/program/${program.id}`}
                                                className="shrink-0 ml-4 px-4 py-2 bg-lms-primary text-white text-sm font-medium rounded-lg hover:bg-lms-accent transition-colors flex items-center gap-1.5"
                                            >
                                                Enroll <CaretRight size={14} />
                                            </Link>
                                        )}
                                    </div>
                                    
                                    <div>
                                        {/* Stats */}
                                        <div className="flex items-center gap-6 text-sm mb-4">
                                            <div className="flex items-center gap-1.5 text-gray-500">
                                                <Clock size={16} />
                                                <span>{program.duration || '20 Hours'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-500">
                                                <Users size={16} />
                                                <span>{(program.students_count || 0).toLocaleString()} students</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-amber-500">
                                                <Star size={16} weight="fill" />
                                                <span className="text-gray-600">{program.rating || 4.5}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Conditionally Render Progress Bar */}
                                        {isEnrolled && enrollment && (
                                            <div className="mt-2 text-sm">
                                                <div className="flex justify-between items-center mb-1 text-xs">
                                                    <span className="text-gray-500 font-medium">Course Progress</span>
                                                    <span className="text-lms-primary font-bold">{enrollment.progress || 0}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                    <div 
                                                        className="bg-lms-primary h-1.5 rounded-full" 
                                                        style={{ width: `${enrollment.progress || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {filteredPrograms.length === 0 && (
                <div className="text-center py-20">
                    <MagnifyingGlass size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-500">No programs found</h3>
                    <p className="text-sm text-gray-400">Try a different search term</p>
                </div>
            )}
        </div>
    );
};

export default ExploreCourses;
