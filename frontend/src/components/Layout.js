import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { House, Books, SignOut, User, Compass, ChatCircleDots, MagnifyingGlass } from '@phosphor-icons/react';
import ChatBot from './ChatBot';
import LiquidBackground from './LiquidBackground';

const Layout = () => {
    const navigate = useNavigate();
    const user = localStorage.getItem('user') || 'Student';

    // Global Search State
    const [programs, setPrograms] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const searchRef = useRef(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('chat_session_id');
        navigate('/login');
    };

    React.useEffect(() => {
        const recordActivity = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const API_URL = process.env.REACT_APP_BACKEND_URL || '';
                    await fetch(`${API_URL}/api/progress/activity`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                } catch (e) {
                    console.error('Failed to log activity', e);
                }
            }
        };
        recordActivity();
    }, []);

    // Fetch Programs for Global Search
    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const API_URL = process.env.REACT_APP_BACKEND_URL || '';
                const res = await axios.get(`${API_URL}/api/explore`);
                setPrograms(res.data);
            } catch (err) {
                console.error("Failed to fetch programs for global search");
            }
        };
        fetchPrograms();
    }, []);

    // Close Search onClick Outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchRef]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setIsSearchOpen(true);
    };

    const getSearchResults = () => {
        if (!searchQuery.trim()) return { programs: [], subjects: [] };
        
        const q = searchQuery.toLowerCase();
        
        const matchingPrograms = programs.filter(p => 
            p.title.toLowerCase().includes(q) || 
            (p.description && p.description.toLowerCase().includes(q))
        ).slice(0, 3);
        
        const matchingSubjects = [];
        programs.forEach(p => {
            if (p.subjects) {
                p.subjects.forEach(s => {
                    if (s.title.toLowerCase().includes(q)) {
                        matchingSubjects.push({ ...s, programId: p.id, programTitle: p.title });
                    }
                });
            }
        });
        
        return { 
            programs: matchingPrograms, 
            subjects: matchingSubjects.slice(0, 5) 
        };
    };

    const searchResults = getSearchResults();

    return (
        <div className="min-h-screen bg-transparent font-sans flex flex-col md:flex-row relative">
            <LiquidBackground />

            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30 bg-white/40 backdrop-blur-2xl border-b border-white/30 shadow-sm shadow-black/5">
                <h1 className="text-xl font-serif font-bold text-lms-primary tracking-tight">Unilearn</h1>
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`p-2.5 rounded-xl transition-all duration-300 active:scale-95 ${isSidebarOpen ? 'bg-lms-primary/10 text-lms-primary' : 'bg-lms-primary text-white shadow-md shadow-lms-primary/30'}`}
                    aria-label="Toggle menu"
                >
                    <div className="w-5 h-4 flex flex-col justify-between relative">
                        <span className={`w-full h-0.5 rounded-full transition-all duration-300 ${isSidebarOpen ? 'bg-lms-primary rotate-45 translate-y-[7px]' : 'bg-white'}`} />
                        <span className={`w-full h-0.5 rounded-full transition-all duration-300 ${isSidebarOpen ? 'opacity-0 bg-lms-primary' : 'bg-white'}`} />
                        <span className={`w-full h-0.5 rounded-full transition-all duration-300 ${isSidebarOpen ? 'bg-lms-primary -rotate-45 -translate-y-[9px]' : 'bg-white'}`} />
                    </div>
                </button>
            </header>

            {/* Liquid Glass Overlay (Mobile Only) */}
            <div 
                className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                style={{
                    background: isSidebarOpen ? 'rgba(255,255,255,0.15)' : 'transparent',
                    backdropFilter: isSidebarOpen ? 'blur(12px) saturate(180%)' : 'none',
                    WebkitBackdropFilter: isSidebarOpen ? 'blur(12px) saturate(180%)' : 'none',
                }}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`w-72 shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto fixed h-full flex flex-col z-50 transition-transform duration-300 ease-in-out shadow-2xl shadow-black/10 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
                style={{
                    background: 'rgba(255,255,255,0.72)',
                    backdropFilter: 'blur(28px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(28px) saturate(200%)',
                    borderRight: '1px solid rgba(255,255,255,0.5)',
                }}
            >
                <div className="p-5 border-b border-white/20">
                    <h1 className="text-xl font-serif font-bold text-lms-primary mb-5">Unilearn</h1>
                    <div className="relative" ref={searchRef}>
                        <MagnifyingGlass size={16} className="absolute left-3 top-3 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search courses..." 
                            value={searchQuery}
                            onChange={handleSearch}
                            onFocus={() => setIsSearchOpen(true)}
                            className="w-full bg-white/40 border border-white/60 text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-lms-primary/50 text-gray-800 placeholder-gray-400 backdrop-blur-sm transition-shadow"
                        />
                        
                        {/* Search Dropdown */}
                        {isSearchOpen && searchQuery.trim().length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-2xl border border-white/50 rounded-xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden z-50">
                                {searchResults.programs.length === 0 && searchResults.subjects.length === 0 ? (
                                    <div className="p-4 text-sm text-gray-500 text-center font-mono">No results found</div>
                                ) : (
                                    <div className="max-h-[60vh] overflow-y-auto">
                                        {searchResults.programs.length > 0 && (
                                            <div>
                                                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100">Programs</div>
                                                {searchResults.programs.map(p => (
                                                    <Link 
                                                        key={`p-${p.id}`} 
                                                        to={`/app/program/${p.id}`}
                                                        onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setIsSidebarOpen(false); }}
                                                        className="block px-4 py-3 hover:bg-lms-primary/5 transition-colors border-b border-gray-50 last:border-0"
                                                    >
                                                        <div className="text-sm font-semibold text-gray-900 line-clamp-1">{p.title}</div>
                                                        <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">{p.description}</div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                        {searchResults.subjects.length > 0 && (
                                            <div>
                                                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 border-t">Subjects</div>
                                                {searchResults.subjects.map(s => (
                                                    <Link 
                                                        key={`s-${s.id}`} 
                                                        to={`/app/subject/${s.id}`}
                                                        onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setIsSidebarOpen(false); }}
                                                        className="block px-4 py-3 hover:bg-lms-primary/5 transition-colors border-b border-gray-50 last:border-0"
                                                    >
                                                        <div className="text-sm font-bold text-gray-900 line-clamp-1">{s.title}</div>
                                                        <div className="text-xs text-gray-500 font-mono mt-0.5">{s.programTitle}</div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1.5">
                    <NavItem to="/app" icon={<House size={20} />} label="Dashboard" end onNavigate={() => setIsSidebarOpen(false)} />
                    <NavItem to="/app/explore" icon={<Compass size={20} />} label="Explore Courses" onNavigate={() => setIsSidebarOpen(false)} />
                </nav>

                <div className="p-4 border-t border-white/20">
                    <Link 
                        to="/app/profile"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-white/40 border border-white/50 shadow-sm hover:shadow-md hover:bg-white/60 hover:-translate-y-0.5 transition-all outline-none focus:ring-2 focus:ring-lms-primary/50"
                    >
                        <div className="w-8 h-8 rounded-full bg-lms-primary text-white flex items-center justify-center font-bold text-sm">
                            {user[0]}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-medium text-lms-fg truncate">{user}</p>
                            <p className="text-xs text-lms-muted mt-0.5">View Profile</p>
                        </div>
                    </Link>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50/50 rounded-lg transition-colors font-medium"
                    >
                        <SignOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 lg:p-10 relative z-10">
                <Outlet />
            </main>

            {/* Chatbot */}
            <ChatBot />
        </div>
    );
};

const NavItem = ({ to, icon, label, end, onNavigate }) => (
    <NavLink 
        to={to} 
        end={end}
        onClick={onNavigate}
        className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive 
                ? 'bg-lms-primary text-white shadow-md shadow-lms-primary/20' 
                : 'text-lms-fg hover:bg-white/60 hover:shadow-sm'
            }`
        }
    >
        {icon}
        {label}
    </NavLink>
);

export default Layout;
