import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, PlayCircle, Lock, GraduationCap } from '@phosphor-icons/react';

const SubjectView = () => {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const [subject, setSubject] = useState(null);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEnrolled, setIsEnrolled] = useState(false);

    const API_URL = process.env.REACT_APP_BACKEND_URL;
    const token = localStorage.getItem('token');
    const config = { headers: { 'Authorization': `Bearer ${token}` } };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [subjRes, unitsRes] = await Promise.all([
                    axios.get(`${API_URL}/api/subjects/${subjectId}`),
                    axios.get(`${API_URL}/api/subjects/${subjectId}/units`)
                ]);
                setSubject(subjRes.data);

                const unitsWithVideos = await Promise.all(unitsRes.data.map(async (unit) => {
                    const videoRes = await axios.get(`${API_URL}/api/units/${unit.id}/videos`);
                    return { ...unit, videos: videoRes.data };
                }));
                setUnits(unitsWithVideos);

                const enrollRes = await axios.get(`${API_URL}/api/enrollments/check/${subjRes.data.program_id}`, config);
                setIsEnrolled(enrollRes.data.enrolled);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [subjectId]);

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lms-primary"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <Link to={`/app/program/${subject.program_id}`} className="inline-flex items-center gap-2 text-lms-muted hover:text-lms-fg mb-6 text-sm">
                <ArrowLeft /> Back to Program
            </Link>

            <header className="mb-10">
                <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">{subject.title}</h1>
                <p className="text-lg text-gray-500">{subject.description}</p>
            </header>

            {isEnrolled ? (
                <div className="space-y-6">
                    {units.map((unit) => (
                        <div key={unit.id} className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-white/60 px-6 py-4 border-b border-white/40 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-gray-900">Unit {unit.order}: {unit.title}</h3>
                                <span className="text-xs font-mono bg-white/80 px-2 py-1 rounded border border-gray-200 text-gray-500">{unit.videos.length} Videos</span>
                            </div>
                            <div className="divide-y divide-white/40">
                                {unit.videos.map(video => (
                                    <Link
                                        to={`/app/unit/${unit.id}/video/${video.id}`}
                                        key={video.id}
                                        className="flex items-center gap-4 px-6 py-4 hover:bg-lms-primary/5 transition-colors group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-lms-primary/10 text-lms-primary flex items-center justify-center group-hover:bg-lms-primary group-hover:text-white transition-colors">
                                            <PlayCircle size={24} weight="fill" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{video.title}</h4>
                                            <p className="text-xs text-gray-500">{video.duration} • {video.instructor}</p>
                                        </div>
                                    </Link>
                                ))}
                                <div className="bg-orange-50/60 px-6 py-4 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-orange-800">Unit Quiz</h4>
                                        <p className="text-xs text-orange-600">Test your knowledge to proceed to certification.</p>
                                    </div>
                                    <Link
                                        to={`/app/unit/${unit.id}/quiz`}
                                        className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 transition"
                                    >
                                        Take Quiz
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20 bg-white/30 backdrop-blur-xl border border-white/50 rounded-[2rem]"
                >
                    <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock size={36} weight="duotone" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-gray-900 mb-3">Content Locked</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-8 font-mono text-sm">
                        You need to enroll in this program before you can access the videos and quizzes.
                    </p>
                    <Link
                        to={`/app/program/${subject.program_id}`}
                        className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-lms-primary to-lms-accent text-white font-bold rounded-full shadow-lg hover:scale-105 transition-all"
                    >
                        <GraduationCap size={22} weight="fill" /> Go to Program & Enroll
                    </Link>
                </motion.div>
            )}
        </div>
    );
};

export default SubjectView;
