import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { UserCircle, Certificate, BookBookmark, PencilSimple, FloppyDisk, NotePencil, Clock, Users, ArrowRight, ArrowLeft } from '@phosphor-icons/react';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info'); // 'info', 'courses', 'certificates'
    
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editGender, setEditGender] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [saveLoading, setSaveLoading] = useState(false);

    const [enrolledCourses, setEnrolledCourses] = useState([]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const API_URL = process.env.REACT_APP_BACKEND_URL;
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };
                const [profileRes, enrollRes] = await Promise.all([
                    axios.get(`${API_URL}/api/profile`, { headers }),
                    axios.get(`${API_URL}/api/enrollments/me`, { headers })
                ]);
                setProfile(profileRes.data);
                setEditName(profileRes.data.user.full_name || '');
                setEditPhone(profileRes.data.user.phone_number || '');
                setEditGender(profileRes.data.user.gender || '');
                setEditAddress(profileRes.data.user.address || '');
                setEnrolledCourses(enrollRes.data);
            } catch (err) {
                console.error("Failed to fetch profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSaveProfile = async () => {
        setSaveLoading(true);
        try {
            const API_URL = process.env.REACT_APP_BACKEND_URL;
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_URL}/api/profile`, 
                { 
                    full_name: editName,
                    phone_number: editPhone,
                    gender: editGender,
                    address: editAddress
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setProfile({ ...profile, user: res.data.user });
            localStorage.setItem('user', res.data.user.full_name); // Update global username
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update profile", err);
        } finally {
            setSaveLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lms-primary"></div>
        </div>
    );

    return (
        <div className="max-w-full xl:max-w-5xl mx-auto pb-16">
            {/* Mobile Back to Dashboard Button */}
            <div className="md:hidden mb-6">
                <Link
                    to="/app"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/60 backdrop-blur-md border border-white/60 text-lms-primary font-medium rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-sm"
                >
                    <ArrowLeft size={18} weight="bold" />
                    Back to Dashboard
                </Link>
            </div>

            {/* Header Section */}
            <header className="mb-10 bg-white/40 backdrop-blur-2xl border border-white/60 p-6 md:p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex items-center gap-4 md:gap-6">
                <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl md:text-4xl lg:text-5xl text-white font-bold shadow-lg border-4 border-white shrink-0">
                    {profile?.user?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-gray-900 mb-1">{profile?.user?.full_name}</h1>
                    <p className="text-gray-500 font-mono text-sm lg:text-base">{profile?.user?.email}</p>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-8">
                <button
                    onClick={() => setActiveTab('info')}
                    className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'info' ? 'border-lms-primary text-lms-primary' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                >
                    <UserCircle size={20} /> Personal Info
                </button>
                <button
                    onClick={() => setActiveTab('courses')}
                    className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'courses' ? 'border-lms-primary text-lms-primary' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                >
                    <BookBookmark size={20} /> Enrolled Courses
                </button>
                <button
                    onClick={() => setActiveTab('certificates')}
                    className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'certificates' ? 'border-lms-primary text-lms-primary' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                >
                    <Certificate size={20} /> Certificates
                </button>
            </div>

            {/* Tab Contents */}
            <div>
                {activeTab === 'info' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-200 rounded-2xl p-8 max-w-2xl shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold text-gray-900 font-serif">Account Details</h2>
                            {!isEditing ? (
                                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors border border-gray-200">
                                    <PencilSimple size={16} /> Edit Profile
                                </button>
                            ) : (
                                <button onClick={handleSaveProfile} disabled={saveLoading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                                    <FloppyDisk size={16} /> {saveLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Full Name</label>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                    />
                                ) : (
                                    <div className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-gray-900 font-medium">
                                        {profile.user.full_name}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Phone Number</label>
                                    {isEditing ? (
                                        <input 
                                            type="tel" 
                                            value={editPhone}
                                            onChange={(e) => setEditPhone(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                        />
                                    ) : (
                                        <div className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-gray-900 font-medium whitespace-pre-wrap min-h-[48px]">
                                            {profile.user.phone_number || <span className="text-gray-400 italic">Not provided</span>}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Gender</label>
                                    {isEditing ? (
                                        <select 
                                            value={editGender}
                                            onChange={(e) => setEditGender(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium cursor-pointer"
                                        >
                                            <option value="" disabled>Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                            <option value="Prefer not to say">Prefer not to say</option>
                                        </select>
                                    ) : (
                                        <div className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-gray-900 font-medium whitespace-pre-wrap min-h-[48px]">
                                            {profile.user.gender || <span className="text-gray-400 italic">Not provided</span>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Address</label>
                                {isEditing ? (
                                    <textarea 
                                        rows="2"
                                        value={editAddress}
                                        onChange={(e) => setEditAddress(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none"
                                    />
                                ) : (
                                    <div className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-gray-900 font-medium whitespace-pre-wrap min-h-[48px]">
                                        {profile.user.address || <span className="text-gray-400 italic">Not provided</span>}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Email Address</label>
                                <div className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-gray-500 cursor-not-allowed">
                                    {profile.user.email}
                                </div>
                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><NotePencil size={12}/> Email cannot be changed.</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'courses' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        {enrolledCourses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {enrolledCourses.map(program => (
                                    <Link 
                                        key={program.id}
                                        to={`/app/program/${program.id}`}
                                        className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                                    >
                                        <div className="h-40 overflow-hidden relative shrink-0">
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors z-10" />
                                            <img src={program.image_url} alt={program.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col">
                                            <h3 className="font-sans font-bold text-lg text-gray-900 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">{program.title}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{program.description}</p>
                                            {/* Progress bar */}
                                            <div className="mt-auto">
                                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                    <span>Progress</span>
                                                    <span className="font-bold text-lms-primary">{program.progress}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="h-2 rounded-full bg-gradient-to-r from-lms-primary to-lms-accent transition-all duration-700"
                                                        style={{ width: `${program.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 group-hover:underline mt-4">
                                                Continue Learning <ArrowRight />
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white/50 border border-white/60 rounded-3xl backdrop-blur-xl">
                                <BookBookmark size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Yet</h3>
                                <p className="text-sm text-gray-500 mb-6">You haven't enrolled in any courses.</p>
                                <Link to="/app/explore" className="px-6 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-colors inline-block shadow-md">
                                    Explore Courses
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'certificates' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        {profile?.certificates?.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {profile.certificates.map(cert => (
                                    <Link 
                                        key={cert.id}
                                        to={`/app/certificate/${cert.program_id}`}
                                        className="group bg-white border border-amber-100 rounded-2xl p-6 hover:shadow-xl hover:border-amber-300 transition-all flex flex-col h-full items-center text-center relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 to-yellow-500" />
                                        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4 border border-amber-100 group-hover:scale-110 transition-transform">
                                            <Certificate size={32} weight="duotone" />
                                        </div>
                                        <h3 className="font-serif font-bold text-lg text-gray-900 mb-2 flex-1">{cert.program_name}</h3>
                                        <p className="text-xs text-gray-400 font-mono mb-4 mt-auto">Issued: {new Date(cert.issued_at).toLocaleDateString()}</p>
                                        <span className="text-sm font-medium text-amber-600 group-hover:underline flex items-center gap-1">
                                            View Certificate
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white/50 border border-white/60 rounded-3xl backdrop-blur-xl">
                                <Certificate size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Certificates Yet</h3>
                                <p className="text-sm text-gray-500">Complete a program by finishing all quizzes to earn a certificate!</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Profile;
