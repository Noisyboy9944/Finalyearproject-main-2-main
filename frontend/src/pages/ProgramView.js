import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, CaretRight, Certificate, GraduationCap, CheckCircle, Lock } from '@phosphor-icons/react';

const ProgramView = () => {
    const { programId } = useParams();
    const navigate = useNavigate();
    const [program, setProgram] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [progress, setProgress] = useState(null);
    const [enrolling, setEnrolling] = useState(false);

    const API_URL = process.env.REACT_APP_BACKEND_URL;
    const token = localStorage.getItem('token');
    const config = { headers: { 'Authorization': `Bearer ${token}` } };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [progRes, videoRes, enrollRes] = await Promise.all([
                    axios.get(`${API_URL}/api/programs/${programId}`),
                    axios.get(`${API_URL}/api/programs/${programId}/videos`),
                    axios.get(`${API_URL}/api/enrollments/check/${programId}`, config)
                ]);
                setProgram(progRes.data);
                setVideos(videoRes.data);
                setIsEnrolled(enrollRes.data.enrolled);

                if (enrollRes.data.enrolled) {
                    const progressRes = await axios.get(`${API_URL}/api/enrollments/progress/${programId}`, config);
                    setProgress(progressRes.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [programId]);

    const handleEnroll = async () => {
        setEnrolling(true);
        try {
            await axios.post(`${API_URL}/api/enrollments/${programId}`, {}, config);
            setIsEnrolled(true);
            const progressRes = await axios.get(`${API_URL}/api/enrollments/progress/${programId}`, config);
            setProgress(progressRes.data);
        } catch (err) {
            console.error('Enrollment failed', err);
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lms-primary"></div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto">
            <Link to="/app" className="inline-flex items-center gap-2 text-lms-muted hover:text-lms-fg mb-6 text-sm">
                <ArrowLeft /> Back to Dashboard
            </Link>

            {/* Program Header Card */}
            <div className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-xl mb-8">
                {program.image_url && (
                    <div className="h-48 overflow-hidden">
                        <img src={program.image_url} alt={program.title} className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="p-8 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    <div className="flex-1">
                        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">{program.title}</h1>
                        <p className="text-gray-500 max-w-2xl">{program.description}</p>
                        {isEnrolled && progress && (
                            <div className="mt-5">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-600">Your Progress</span>
                                    <span className="text-sm font-bold text-lms-primary">{progress.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress.progress}%` }}
                                        transition={{ duration: 1.2, ease: 'easeOut' }}
                                        className="h-3 rounded-full bg-gradient-to-r from-lms-primary to-lms-accent shadow-sm"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-2 font-mono">{progress.passed_quizzes} of {progress.total_units} quizzes passed</p>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-3 shrink-0">
                        {isEnrolled ? (
                            <Link
                                to={`/app/certificate/${programId}`}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors rounded-xl font-bold shadow-sm border border-amber-200"
                            >
                                <Certificate size={22} weight="fill" /> My Certificate
                            </Link>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleEnroll}
                                disabled={enrolling}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-lms-primary to-lms-accent text-white font-bold rounded-xl shadow-lg disabled:opacity-60 transition-all text-lg"
                            >
                                <GraduationCap size={22} weight="fill" />
                                {enrolling ? 'Enrolling...' : 'Enroll Now — It\'s Free'}
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>

            {/* Course Content */}
            {isEnrolled ? (
                <>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <BookOpen className="text-lms-primary" /> Course Content
                    </h2>
                    <div className="flex flex-col gap-4">
                        {videos.map((video, idx) => (
                            <Link
                                to={`/app/program/${programId}/video/${video.id}`}
                                key={video.id}
                                className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-xl p-6 hover:border-lms-primary/40 hover:shadow-lg transition-all group"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-lms-primary transition-colors">{idx + 1}. {video.title}</h3>
                                        <p className="text-sm text-gray-500 font-mono">{video.duration} • Instructor: {video.instructor}</p>
                                    </div>
                                    <CaretRight className="text-gray-400 group-hover:translate-x-1 transition-transform mt-1" />
                                </div>
                            </Link>
                        ))}
                        
                        {/* Course Quiz */}
                        <Link
                            to={`/app/program/${programId}/quiz`}
                            className="bg-indigo-50/50 backdrop-blur-xl border border-indigo-100 rounded-xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all group mt-2"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-indigo-900 mb-1 group-hover:text-indigo-700 transition-colors">Final Course Quiz</h3>
                                    <p className="text-sm text-indigo-600">Test your knowledge to earn your certificate</p>
                                </div>
                                <CaretRight className="text-indigo-400 group-hover:translate-x-1 transition-transform mt-1" />
                            </div>
                        </Link>
                    </div>
                </>
            ) : (
                /* Locked Preview */
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20 bg-white/30 backdrop-blur-xl border border-white/50 rounded-[2rem]"
                >
                    <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock size={36} weight="duotone" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-gray-900 mb-3">Enroll to Access Content</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-8 font-mono text-sm">
                        This program contains video lectures, notes, and a final quiz. Enroll to unlock everything — for free.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center text-sm text-gray-600 mb-8">
                        {videos.map(v => (
                            <span key={v.id} className="px-4 py-2 bg-white/60 border border-gray-200 rounded-full font-medium text-xs">{v.title}</span>
                        ))}
                    </div>
                    <button
                        onClick={handleEnroll}
                        disabled={enrolling}
                        className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-lms-primary to-lms-accent text-white font-bold rounded-full shadow-lg hover:scale-105 transition-all text-lg disabled:opacity-60"
                    >
                        <GraduationCap size={22} weight="fill" />
                        {enrolling ? 'Enrolling...' : 'Enroll Now — It\'s Free'}
                    </button>
                </motion.div>
            )}
        </div>
    );
};

export default ProgramView;
