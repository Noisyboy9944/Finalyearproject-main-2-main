import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ReactPlayer from 'react-player';
import { ArrowLeft, Play, NotePencil, VideoCamera, FloppyDisk, PencilSimple, Eye, SpinnerGap, CheckCircle, BookOpen } from '@phosphor-icons/react';
import clsx from 'clsx';

const VideoPlayer = () => {
    const { programId, videoId } = useParams();
    const [currentVideo, setCurrentVideo] = useState(null);
    const [playlist, setPlaylist] = useState([]);
    const [program, setProgram] = useState(null);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('playlist');
    const [isPlaying, setIsPlaying] = useState(false);

    // User notes state
    const [userNoteContent, setUserNoteContent] = useState('');
    const [userNoteSaving, setUserNoteSaving] = useState(false);
    const [userNoteSaved, setUserNoteSaved] = useState(false);
    const [userNoteLastSaved, setUserNoteLastSaved] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const saveTimeoutRef = useRef(null);
    const textareaRef = useRef(null);

    const API_URL = process.env.REACT_APP_BACKEND_URL;
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [videoRes, playlistRes, progRes, notesRes] = await Promise.all([
                    axios.get(`${API_URL}/api/videos/${videoId}`),
                    axios.get(`${API_URL}/api/programs/${programId}/videos`),
                    axios.get(`${API_URL}/api/programs/${programId}`),
                    axios.get(`${API_URL}/api/programs/${programId}/notes`)
                ]);

                setCurrentVideo(videoRes.data);
                setPlaylist(playlistRes.data);
                setProgram(progRes.data);
                setNotes(notesRes.data);

                // Fetch user's personal note
                try {
                    const userNoteRes = await axios.get(`${API_URL}/api/user-notes/${programId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (userNoteRes.data) {
                        setUserNoteContent(userNoteRes.data.content || '');
                        setUserNoteLastSaved(userNoteRes.data.updated_at);
                    }
                } catch (err) {
                    // No user note yet - that's fine
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [programId, videoId, API_URL, token]);

    // Reset playing state when video changes
    useEffect(() => {
        setIsPlaying(false);
    }, [videoId]);

    // Auto-save with debounce
    const saveNote = useCallback(async (content) => {
        setUserNoteSaving(true);
        setUserNoteSaved(false);
        try {
            await axios.put(`${API_URL}/api/user-notes/${programId}`, 
                { content },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUserNoteSaved(true);
            setUserNoteLastSaved(new Date().toISOString());
            setTimeout(() => setUserNoteSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save note:', err);
        } finally {
            setUserNoteSaving(false);
        }
    }, [API_URL, programId, token]);

    const handleNoteChange = (e) => {
        const content = e.target.value;
        setUserNoteContent(content);
        
        // Debounced auto-save (1.5 seconds after last keystroke)
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            saveNote(content);
        }, 1500);
    };

    const handleManualSave = () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveNote(userNoteContent);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lms-primary"></div>
        </div>
    );

    // Simple markdown renderer for course notes
    const renderMarkdown = (text) => {
        if (!text) return null;
        let html = text;
        html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-lms-fg mt-6 mb-2">$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-lms-fg mt-6 mb-3">$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-lms-fg mt-6 mb-3">$1</h1>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
        html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
        html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="bg-slate-900 text-green-300 rounded-xl p-4 my-4 text-sm overflow-x-auto font-mono leading-relaxed"><code>$2</code></pre>');
        html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-lms-muted mb-1">$1</li>');
        html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-lms-muted mb-1">$1</li>');
        html = html.replace(/\n/g, '<br/>');
        return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
    };

    // Preview user notes as rendered markdown
    const renderUserNotePreview = (text) => {
        if (!text) return (
            <div className="text-center py-8 text-gray-400">
                <Eye size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nothing to preview yet. Start writing!</p>
            </div>
        );
        return renderMarkdown(text);
    };

    const formatTimestamp = (ts) => {
        if (!ts) return '';
        try {
            const d = new Date(ts);
            return d.toLocaleString('en-US', { 
                month: 'short', day: 'numeric', 
                hour: '2-digit', minute: '2-digit' 
            });
        } catch { return ''; }
    };

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-6">
            {/* Main Player Section */}
            <div className="flex-1 flex flex-col min-w-0">
                <Link to={`/app/program/${programId}`} className="inline-flex items-center gap-2 text-lms-muted hover:text-lms-fg mb-4 text-sm">
                    <ArrowLeft /> Back to Course
                </Link>

                <div className="bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video w-full relative mb-6">
                    <ReactPlayer 
                        url={currentVideo.url} 
                        width="100%" 
                        height="100%" 
                        controls
                        playing={isPlaying}
                        onReady={() => setIsPlaying(true)}
                        onError={(e) => {
                            if (e && e.name === 'AbortError') {
                                console.warn('ReactPlayer: Playback aborted due to unmount or rapid navigation.');
                            }
                        }}
                    />
                </div>

                <div>
                    <h1 className="text-2xl font-serif font-bold text-lms-fg mb-2">{currentVideo.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-lms-muted font-mono">
                        <span>{currentVideo.instructor}</span>
                        <span>•</span>
                        <span>{currentVideo.duration}</span>
                    </div>
                </div>
            </div>

            {/* Sidebar with Tabs */}
            <div className="w-full lg:w-96 bg-white border border-lms-secondary rounded-2xl flex flex-col overflow-hidden h-fit max-h-[calc(100vh-100px)]">
                {/* Tab Headers */}
                <div className="flex border-b border-lms-secondary bg-slate-50 shrink-0">
                    <button
                        onClick={() => setActiveTab('playlist')}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors",
                            activeTab === 'playlist' 
                                ? "text-lms-primary border-b-2 border-lms-primary bg-white" 
                                : "text-lms-muted hover:text-lms-fg"
                        )}
                    >
                        <VideoCamera size={16} /> Playlist
                    </button>
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors",
                            activeTab === 'notes' 
                                ? "text-lms-primary border-b-2 border-lms-primary bg-white" 
                                : "text-lms-muted hover:text-lms-fg"
                        )}
                    >
                        <BookOpen size={16} /> Course
                    </button>
                    <button
                        onClick={() => { setActiveTab('mynotes'); setIsEditing(true); }}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors",
                            activeTab === 'mynotes' 
                                ? "text-lms-primary border-b-2 border-lms-primary bg-white" 
                                : "text-lms-muted hover:text-lms-fg"
                        )}
                    >
                        <PencilSimple size={16} /> My Notes
                    </button>
                </div>

                {/* Tab Content */}
                <div className="overflow-y-auto flex-1">
                    {/* PLAYLIST TAB */}
                    {activeTab === 'playlist' && (
                        <div className="p-2 space-y-1">
                            <div className="px-3 py-2">
                                <p className="text-xs text-lms-muted font-mono truncate">{program?.title}</p>
                            </div>
                            {playlist.map((video) => {
                                const isActive = video.id === currentVideo.id;
                                return (
                                    <Link 
                                        key={video.id}
                                        to={`/app/program/${programId}/video/${video.id}`}
                                        className={clsx(
                                            "flex items-start gap-3 p-3 rounded-lg transition-colors",
                                            isActive ? "bg-lms-primary/10 border border-lms-primary/20" : "hover:bg-slate-50"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                            isActive ? "bg-lms-primary text-white" : "bg-slate-200 text-slate-500"
                                        )}>
                                            {isActive ? <Play size={12} weight="fill" /> : <span className="text-xs font-mono">{video.order}</span>}
                                        </div>
                                        <div>
                                            <h4 className={clsx("text-sm font-medium leading-tight mb-1", isActive ? "text-lms-primary" : "text-lms-fg")}>
                                                {video.title}
                                            </h4>
                                            <p className="text-xs text-lms-muted">{video.duration}</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* COURSE NOTES TAB (Read-only) */}
                    {activeTab === 'notes' && (
                        <div className="p-4">
                            {notes.length > 0 ? (
                                <div className="space-y-6">
                                    {notes.map(note => (
                                        <div key={note.id}>
                                            {renderMarkdown(note.content)}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-sm text-lms-muted">No course notes available for this unit.</p>
                                    <p className="text-xs text-gray-400 mt-1">Switch to "My Notes" to write your own!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* MY NOTES TAB (Editable) */}
                    {activeTab === 'mynotes' && (
                        <div className="flex flex-col h-full">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-gray-100 shrink-0">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
                                            isEditing 
                                                ? "bg-indigo-100 text-indigo-700" 
                                                : "text-gray-500 hover:bg-gray-100"
                                        )}
                                    >
                                        <PencilSimple size={14} /> Edit
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
                                            !isEditing 
                                                ? "bg-indigo-100 text-indigo-700" 
                                                : "text-gray-500 hover:bg-gray-100"
                                        )}
                                    >
                                        <Eye size={14} /> Preview
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Save status indicator */}
                                    {userNoteSaving && (
                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                            <SpinnerGap size={12} className="animate-spin" /> Saving...
                                        </span>
                                    )}
                                    {userNoteSaved && !userNoteSaving && (
                                        <span className="flex items-center gap-1 text-xs text-green-500">
                                            <CheckCircle size={12} weight="fill" /> Saved
                                        </span>
                                    )}
                                    <button
                                        onClick={handleManualSave}
                                        disabled={userNoteSaving}
                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        <FloppyDisk size={14} /> Save
                                    </button>
                                </div>
                            </div>

                            {/* Editor / Preview */}
                            <div className="flex-1 p-4">
                                {isEditing ? (
                                    <div className="h-full flex flex-col">
                                        <textarea
                                            ref={textareaRef}
                                            value={userNoteContent}
                                            onChange={handleNoteChange}
                                            placeholder={"Write your notes here...\n\nTips:\n• Use # for headings\n• Use **text** for bold\n• Use `code` for inline code\n• Use ``` for code blocks\n• Use - for bullet points"}
                                            className="flex-1 w-full min-h-[300px] bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-700 font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all placeholder-gray-300"
                                            spellCheck={false}
                                        />
                                        {userNoteLastSaved && (
                                            <p className="text-xs text-gray-400 mt-2 text-right">
                                                Last saved: {formatTimestamp(userNoteLastSaved)}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-white border border-gray-200 rounded-xl p-4 min-h-[300px]">
                                        {renderUserNotePreview(userNoteContent)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
