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
                    const API_URL = process.env.REACT_APP_BACKEND_URL;
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
                const API_URL = process.env.REACT_APP_BACKEND_URL;
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
        <div className="min-h-screen bg-transparent font-sans flex relative">
            <LiquidBackground />

            {/* Sidebar with Glassmorphism */}
            <aside className="w-64 fixed h-full bg-white/60 backdrop-blur-xl border-r border-white/40 flex flex-col z-20 shadow-xl shadow-gray-200/20">
                <div className="p-6 border-b border-white/20">
                    <h1 className="text-xl font-serif font-bold text-lms-primary mb-6">Unilearn</h1>
                    <div className="relative" ref={searchRef}>
                        <MagnifyingGlass size={18} className="absolute left-3 top-3 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search courses..." 
                            value={searchQuery}
                            onChange={handleSearch}
                            onFocus={() => setIsSearchOpen(true)}
                            className="w-full bg-white/40 border border-white/60 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-lms-primary/50 text-gray-800 placeholder-gray-500 backdrop-blur-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-shadow"
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
                                                        onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
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
                                                        onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
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

                <nav className="flex-1 p-4 space-y-2">
                    <NavItem to="/app" icon={<House size={20} />} label="Dashboard" end />
                    <NavItem to="/app/explore" icon={<Compass size={20} />} label="Explore Courses" />
                </nav>

                <div className="p-4 border-t border-white/20">
                    <Link 
                        to="/app/profile"
                        className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-white/40 border border-white/50 shadow-sm hover:shadow-md hover:bg-white/60 hover:-translate-y-0.5 transition-all outline-none focus:ring-2 focus:ring-lms-primary/50"
                    >
                        <div className="w-8 h-8 rounded-full bg-lms-primary text-white flex items-center justify-center font-bold">
                            {user[0]}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-medium text-lms-fg truncate">{user}</p>
                            <p className="text-xs text-lms-muted transition-colors group-hover:text-lms-primary mt-0.5">View Profile</p>
                        </div>
                    </Link>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50/50 rounded-lg transition-colors"
                    >
                        <SignOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 relative z-10">
                <Outlet />
            </main>

            {/* Chatbot */}
            <ChatBot />
        </div>
    );
};

const NavItem = ({ to, icon, label, end }) => (
    <NavLink 
        to={to} 
        end={end}
        className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive 
                ? 'bg-lms-primary text-white shadow-md shadow-lms-primary/20' 
                : 'text-lms-fg hover:bg-lms-secondary'
            }`
        }
    >
        {icon}
        {label}
    </NavLink>
);

export default Layout;
