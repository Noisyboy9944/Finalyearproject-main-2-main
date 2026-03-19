import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HandWaving, BookBookmark, GraduationCap, Users, Clock, ArrowRight, Play, Star, CheckCircle, Info, BookmarkSimple, FacebookLogo, TwitterLogo, LinkedinLogo, InstagramLogo, CaretRight, Question, Code, PaintBrush, TrendUp, Sparkle, Compass, Trophy, BookOpen, Lightning, ChartLineUp, CaretDown, Quotes } from '@phosphor-icons/react';
import LiquidBackground from '../components/LiquidBackground';
import ChatBot from '../components/ChatBot';

// --- Assets ---
const IMAGES = {
    spark: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=2070&auto=format&fit=crop",
    chaos: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2190&auto=format&fit=crop",
    clarity: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop",
    community: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop",
    success: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop"
};

const SHOWCASE_IMAGES = [
    {
        title: "Full Stack Development",
        desc: "Master React, Node.js, and Cloud Architecture.",
        img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop",
        icon: <Code size={32} />
    },
    {
        title: "UI/UX Design",
        desc: "Craft intuitive interfaces and user experiences.",
        img: "https://images.unsplash.com/photo-1726365222176-425a1a1b9b98?q=80&w=2070&auto=format&fit=crop",
        icon: <PaintBrush size={32} />
    },
    {
        title: "Data Science",
        desc: "Analyze trends and build predictive models.",
        img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
        icon: <TrendUp size={32} />
    }
];

const TESTIMONIALS = [
    {
        name: "Anika Patel",
        role: "BCA Graduate, 2024",
        text: "Unilearn transformed my career. The structured curriculum and AI assistant helped me go from zero to full-stack developer in under a year.",
        avatar: "A"
    },
    {
        name: "James Rodriguez",
        role: "Data Science Student",
        text: "The course content is incredibly well-organized. Each unit builds perfectly on the last. The chatbot is like having a personal tutor 24/7.",
        avatar: "J"
    },
    {
        name: "Sarah Kim",
        role: "MCA Student",
        text: "I've tried many platforms, but Unilearn's narrative-driven approach to learning keeps me engaged. The cloud computing modules are exceptional.",
        avatar: "S"
    }
];

const FAQ_DATA = [
    {
        q: "Is Unilearn free to use?",
        a: "Yes! Our core curriculum is completely free. We believe education should be accessible to everyone. Premium features like certificates and 1-on-1 mentoring are available for a small fee."
    },
    {
        q: "What kind of courses are available?",
        a: "We offer programs in Computer Science including BCA, MCA, and Data Science tracks. Subjects range from Mobile App Development and Web Technologies to Machine Learning and Cloud Computing."
    },
    {
        q: "How does the AI assistant work?",
        a: "Our AI Learning Assistant is powered by advanced language models. It can explain concepts, help you navigate courses, suggest learning paths, and answer questions about any topic in our curriculum."
    },
    {
        q: "Can I learn at my own pace?",
        a: "Absolutely. All courses are self-paced with video lectures, reading materials, and notes. You can pause, rewind, and revisit any content as many times as you need."
    },
    {
        q: "Do I get a certificate?",
        a: "Yes, upon completion of each program, you receive a verifiable digital certificate that you can share on LinkedIn and other professional platforms."
    }
];

const HOW_IT_WORKS = [
    {
        step: "01",
        title: "Choose Your Path",
        desc: "Browse our curated programs — BCA, MCA, Data Science, and more. Each is designed by industry experts.",
        icon: <Compass size={28} />
    },
    {
        step: "02",
        title: "Learn With Structure",
        desc: "Follow a clear curriculum with video lectures, notes, and hands-on exercises organized into logical units.",
        icon: <BookOpen size={28} />
    },
    {
        step: "03",
        title: "Get AI Help Anytime",
        desc: "Stuck on a concept? Our AI assistant explains topics, suggests courses, and answers questions 24/7.",
        icon: <Lightning size={28} />
    },
    {
        step: "04",
        title: "Track & Grow",
        desc: "Monitor your progress, maintain study streaks, and earn certificates as you complete each program.",
        icon: <ChartLineUp size={28} />
    }
];

// --- Components ---

const NarrativeSection = ({ step, currentStep, text, title, icon }) => {
    const distance = Math.abs(currentStep - step);
    const isActive = distance < 0.7;
    const isPast = currentStep > step;
    
    return (
        <motion.div 
            className={`min-h-[60vh] md:min-h-[80vh] flex flex-col justify-center p-6 sm:p-10 md:p-16 w-full max-w-4xl mx-auto transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                isActive 
                    ? 'opacity-100 blur-0 scale-100 translate-y-0' 
                    : isPast
                        ? 'opacity-0 blur-xl scale-90 translate-y-20'
                        : 'opacity-10 blur-sm scale-95 translate-y-10'
            }`}
        >
            <div className="bg-white/40 backdrop-blur-3xl border border-white/60 p-8 md:p-16 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] w-full">
                <div className="mb-6 md:mb-8 inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shadow-[inset_0_2px_10px_rgba(255,255,255,0.6)] backdrop-blur-xl border border-white text-marketing-secondary">
                    {React.cloneElement(icon, { size: "50%" })}
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif text-gray-900 mb-6 leading-tight drop-shadow-sm font-bold tracking-tight">
                    {title}
                </h2>
                <p className="text-lg sm:text-xl md:text-2xl font-mono text-gray-700 leading-relaxed font-medium">
                    {text}
                </p>
            </div>
        </motion.div>
    );
};

const ShowcaseCard = ({ item, index }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -10 }}
            className="group relative overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-lg shadow-gray-100 flex flex-col h-full"
        >
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
            <img src={item.img} alt={item.title} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-700 shrink-0" />
            <div className="p-8 relative z-20 flex-1 flex flex-col">
                <div className="mb-4 text-marketing-secondary">{item.icon}</div>
                <h3 className="text-2xl font-serif text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 mb-6 font-mono text-sm flex-1">{item.desc}</p>
                <Link to="/register" className="inline-flex items-center gap-2 text-marketing-secondary font-bold hover:gap-3 transition-all mt-auto self-start">
                    Explore Path <CaretRight />
                </Link>
            </div>
        </motion.div>
    );
};

const AnimatedCounter = ({ target, suffix = "", label }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    
    useEffect(() => {
        if (isInView) {
            let start = 0;
            const duration = 2000;
            const increment = target / (duration / 16);
            const timer = setInterval(() => {
                start += increment;
                if (start >= target) {
                    setCount(target);
                    clearInterval(timer);
                } else {
                    setCount(Math.floor(start));
                }
            }, 16);
            return () => clearInterval(timer);
        }
    }, [isInView, target]);

    return (
        <div ref={ref} className="text-center">
            <div className="text-5xl md:text-6xl font-bold font-mono text-marketing-secondary mb-2">
                {count.toLocaleString()}{suffix}
            </div>
            <div className="text-gray-500 font-mono text-sm uppercase tracking-wider">{label}</div>
        </div>
    );
};

const FAQItem = ({ item, isOpen, onClick }) => {
    return (
        <motion.div 
            className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm"
            initial={false}
        >
            <button 
                onClick={onClick}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
            >
                <span className="text-lg text-gray-900 font-medium pr-4">{item.q}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-marketing-secondary shrink-0"
                >
                    <CaretDown size={20} />
                </motion.div>
            </button>
            <motion.div
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
            >
                <p className="px-6 pb-6 text-gray-600 leading-relaxed">{item.a}</p>
            </motion.div>
        </motion.div>
    );
};

const LandingPage = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const [activeStep, setActiveStep] = useState(0);
    const [openFAQ, setOpenFAQ] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

    useEffect(() => {
        const unsubscribe = scrollYProgress.on("change", (latest) => {
            const step = latest * 6; 
            setActiveStep(step);
        });
        return () => unsubscribe();
    }, [scrollYProgress]);

    // Hero Parallax
    const heroRef = useRef(null);
    const { scrollYProgress: heroProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });
    const heroY = useTransform(heroProgress, [0, 1], [0, 200]);
    const heroOpacity = useTransform(heroProgress, [0, 0.5], [1, 0]);

    return (
        <div className="bg-white text-gray-900 font-sans selection:bg-marketing-secondary selection:text-white relative">
            <LiquidBackground />
            
            {/* Navigation */}
            <nav className="fixed w-full z-50 px-6 py-4 flex justify-between items-center bg-white/30 backdrop-blur-3xl border-b border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
                <div className="text-2xl font-serif font-bold text-gray-900 tracking-tighter drop-shadow-sm">Unilearn</div>
                
                {/* Desktop Menu */}
                <div className="hidden lg:flex items-center gap-8 text-sm font-mono text-gray-700 font-medium">
                    <a href="#how-it-works" className="hover:text-marketing-secondary transition-colors">How It Works</a>
                    <a href="#courses" className="hover:text-marketing-secondary transition-colors">Courses</a>
                    <a href="#testimonials" className="hover:text-marketing-secondary transition-colors">Reviews</a>
                    <a href="#faq" className="hover:text-marketing-secondary transition-colors">FAQ</a>
                </div>

                <div className="hidden lg:flex gap-4">
                    <Link to="/login" className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 font-mono hover:bg-gray-100 transition-colors">
                        Login
                    </Link>
                    <Link to="/register" className="px-6 py-2 rounded-full bg-marketing-secondary text-white font-mono font-bold hover:bg-marketing-secondary/90 transition-transform hover:scale-105 shadow-md">
                        Start Learning
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="lg:hidden p-2 text-gray-900 z-50"
                >
                    <div className="w-6 h-5 flex flex-col justify-between relative">
                        <span className={`w-full h-0.5 bg-gray-900 rounded-full transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                        <span className={`w-full h-0.5 bg-gray-900 rounded-full transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
                        <span className={`w-full h-0.5 bg-gray-900 rounded-full transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                    </div>
                </button>

                {/* Mobile Menu Overlay */}
                <motion.div 
                    initial={false}
                    animate={{ x: isMenuOpen ? 0 : '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 bg-white/95 backdrop-blur-2xl z-40 lg:hidden flex flex-col items-center justify-center gap-8 p-10"
                >
                    <div className="flex flex-col items-center gap-6 text-xl font-serif font-bold text-gray-800">
                        <a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>How It Works</a>
                        <a href="#courses" onClick={() => setIsMenuOpen(false)}>Courses</a>
                        <a href="#testimonials" onClick={() => setIsMenuOpen(false)}>Reviews</a>
                        <a href="#faq" onClick={() => setIsMenuOpen(false)}>FAQ</a>
                    </div>
                    <div className="flex flex-col gap-4 w-full max-w-xs">
                        <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full text-center px-6 py-4 rounded-xl border border-gray-300 text-gray-700 font-mono">
                            Login
                        </Link>
                        <Link to="/register" onClick={() => setIsMenuOpen(false)} className="w-full text-center px-6 py-4 rounded-xl bg-marketing-secondary text-white font-mono font-bold">
                            Start Learning
                        </Link>
                    </div>
                </motion.div>
            </nav>

            {/* --- SCENE 1: THE SPARK (HERO) --- */}
            <section ref={heroRef} className="h-screen flex flex-col items-center justify-center relative overflow-hidden bg-transparent">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-[100px]" />
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-100 contrast-150 mix-blend-multiply"></div>
                </div>

                <motion.div style={{ y: heroY, opacity: heroOpacity }} className="z-10 text-center px-6 max-w-5xl">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="mb-8 inline-block"
                    >
                        <span className="px-4 py-2 rounded-full border border-marketing-secondary/30 text-marketing-secondary bg-marketing-secondary/5 font-mono text-sm tracking-widest uppercase">
                            The Journey Begins Here
                        </span>
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 1 }}
                        className="text-5xl sm:text-7xl md:text-9xl font-serif font-medium text-gray-900 mb-8 leading-none"
                    >
                        Knowledge <br/> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-marketing-secondary to-marketing-accent">
                            Awaits.
                        </span>
                    </motion.h1>

                    <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto font-mono mb-12"
                    >
                        Every expert was once a beginner who just refused to quit.
                    </motion.p>
                    
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                    >
                        <span className="text-sm font-mono text-gray-400">Scroll to unfold the story</span>
                        <motion.div 
                            animate={{ y: [0, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="mt-4 flex justify-center text-gray-400"
                        >
                            <CaretRight size={24} className="rotate-90" />
                        </motion.div>
                    </motion.div>
                </motion.div>
            </section>

            {/* --- THE NARRATIVE SCROLL CONTAINER --- */}
            <div ref={containerRef} className="relative">
                
                {/* Sticky Visual Background */}
                <div className="sticky top-0 h-screen w-full overflow-hidden -z-10">
                    <motion.img src={IMAGES.spark} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out" style={{ opacity: activeStep < 1.5 ? 1 : 0 }} alt="" />
                    <motion.img src={IMAGES.chaos} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out" style={{ opacity: activeStep >= 1.5 && activeStep < 2.5 ? 1 : 0 }} alt="" />
                    <motion.img src={IMAGES.clarity} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out" style={{ opacity: activeStep >= 2.5 && activeStep < 3.5 ? 1 : 0 }} alt="" />
                    <motion.img src={IMAGES.community} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out" style={{ opacity: activeStep >= 3.5 && activeStep < 5.5 ? 1 : 0 }} alt="" />
                    <motion.img src={IMAGES.success} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out" style={{ opacity: activeStep >= 5.5 ? 1 : 0 }} alt="" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent md:w-3/4" />
                </div>

                {/* Scrolling Text Content */}
                <div className="relative z-10 -mt-[100vh]">
                    <div className="h-[50vh]" />

                    <NarrativeSection 
                        step={1} currentStep={activeStep}
                        icon={<Sparkle size={32} />}
                        title="It starts with a question."
                        text="Curiosity is the engine of growth. But in a world of infinite information, where do you even begin?"
                    />
                    <NarrativeSection 
                        step={2} currentStep={activeStep}
                        icon={<Compass size={32} />}
                        title="The path is often unclear."
                        text="Tutorial hell. Outdated documentation. Disconnected videos. Trying to piece it all together feels like solving a puzzle in the dark."
                    />
                    <NarrativeSection 
                        step={3} currentStep={activeStep}
                        icon={<Trophy size={32} />}
                        title="Enter Unilearn."
                        text="A structured, crystal-clear curriculum designed to take you from 'Hello World' to 'System Architect'. No fluff, just mastery."
                    />
                    <NarrativeSection 
                        step={4} currentStep={activeStep}
                        icon={<Users size={32} />}
                        title="You never walk alone."
                        text="Join a global classroom. Debate ideas, review code, and grow alongside thousands of other ambitious minds."
                    />

                    <div id="courses" className={`min-h-screen flex flex-col justify-center p-6 md:p-12 lg:p-16 transition-all duration-700 ${Math.abs(activeStep - 5) < 0.8 ? 'opacity-100 blur-0 translate-y-0' : 'opacity-20 blur-md translate-y-10'}`}>
                        <div className="max-w-7xl mx-auto w-full relative z-20">
                            <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif text-gray-900 mb-12 text-center drop-shadow-md tracking-tight font-bold">Master In-Demand Skills</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                                {SHOWCASE_IMAGES.map((item, index) => (
                                    <ShowcaseCard key={index} item={item} index={index} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Final CTA */}
                    <div className={`min-h-[80vh] flex flex-col justify-center px-4 py-8 md:p-16 max-w-4xl mx-auto transition-all duration-500 ${Math.abs(activeStep - 6) < 0.8 ? 'opacity-100 blur-0 scale-100 translate-y-0' : 'opacity-20 blur-sm scale-95 translate-y-10'}`}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            className="bg-white/50 backdrop-blur-2xl border border-white/60 p-6 sm:p-12 md:p-16 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] text-center w-full"
                        >
                            <h2 className="text-4xl sm:text-5xl md:text-7xl font-serif text-gray-900 mb-6 leading-tight drop-shadow-sm font-bold tracking-tight">Your future is waiting.</h2>
                            <p className="text-lg md:text-xl text-gray-600 mb-10 font-mono">
                                The only thing standing between you and your potential is the decision to start.
                            </p>
                            <Link to="/register" className="inline-flex w-full sm:w-auto justify-center items-center gap-3 px-10 py-5 bg-gradient-to-r from-marketing-secondary to-marketing-accent text-white text-lg md:text-xl font-bold rounded-full hover:scale-105 transition-all shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] mx-auto">
                                Claim Your Spot <CaretRight size={24} weight="bold" />
                            </Link>
                        </motion.div>
                    </div>

                    <div className="h-[20vh]" />
                </div>
            </div>

            {/* === STATS SECTION (REMOVED) === */}

            {/* === HOW IT WORKS === */}
            <section id="how-it-works" className="py-24 md:py-32 relative bg-transparent z-10">
                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16 md:mb-20"
                    >
                        <span className="text-marketing-accent font-mono text-sm uppercase tracking-widest bg-white/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/60 shadow-sm inline-block">Simple Process</span>
                        <h2 className="text-4xl md:text-6xl font-serif text-gray-900 mt-6 drop-shadow-sm font-bold tracking-tight">How It Works</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {HOW_IT_WORKS.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                className="relative group"
                            >
                                {/* Connector line */}
                                {i < 3 && (
                                    <div className="hidden lg:block absolute top-10 left-[60%] w-[calc(100%-20%)] h-px bg-gradient-to-r from-marketing-secondary/30 to-transparent" />
                                )}
                                <div className="bg-white/30 backdrop-blur-3xl border border-white/60 rounded-[2rem] p-6 hover:border-white transition-all group-hover:-translate-y-2 duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.04)] h-full">
                                    <div className="text-6xl font-bold font-mono text-white/50 absolute top-4 right-6 drop-shadow-sm">{item.step}</div>
                                    <div className="w-16 h-16 rounded-2xl bg-white/50 text-marketing-accent flex items-center justify-center mb-6 border border-white shadow-sm">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-serif text-gray-900 mb-3 font-semibold">{item.title}</h3>
                                    <p className="text-sm text-gray-700 font-mono leading-relaxed">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === TESTIMONIALS === */}
            <section id="testimonials" className="py-24 md:py-32 relative z-10 bg-transparent">
                <div className="relative z-10 max-w-6xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16 md:mb-20"
                    >
                        <span className="bg-white/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/60 shadow-sm text-marketing-secondary font-mono text-sm uppercase tracking-widest inline-block">Student Stories</span>
                        <h2 className="text-4xl md:text-6xl font-serif text-gray-900 mt-6 drop-shadow-sm font-bold tracking-tight">Loved by Learners</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {TESTIMONIALS.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white/40 backdrop-blur-2xl border border-white/70 rounded-[2rem] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all"
                            >
                                <Quotes size={36} className="text-marketing-secondary mb-6 opacity-30" weight="fill" />
                                <p className="text-gray-800 mb-8 leading-relaxed font-mono text-sm md:text-base font-medium">"{t.text}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-marketing-secondary to-marketing-accent flex items-center justify-center text-white font-bold text-lg shadow-md border border-white/20">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="text-gray-900 font-bold text-sm md:text-base">{t.name}</p>
                                        <p className="text-gray-600 text-xs md:text-sm font-mono">{t.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === AI ASSISTANT FEATURE === */}
            <section className="py-32 relative bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <span className="text-marketing-accent font-mono text-sm uppercase tracking-widest">AI-Powered</span>
                            <h2 className="text-4xl md:text-5xl font-serif text-gray-900 mt-4 mb-6">Your Personal<br/>Learning Assistant</h2>
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                Never get stuck again. Our AI chatbot understands your curriculum, explains complex concepts in simple terms, and guides you through the platform — all in real time.
                            </p>
                            <div className="space-y-4">
                                {[
                                    "Explains any concept from any course",
                                    "Suggests the best learning path for you",
                                    "Available 24/7, no waiting",
                                    "Remembers your conversation context"
                                ].map((feat, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <CheckCircle size={20} className="text-marketing-secondary" weight="fill" />
                                        <span className="text-gray-700 font-mono text-sm">{feat}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            {/* Mock Chat Window */}
                            <div className="bg-white rounded-2xl shadow-2xl shadow-marketing-primary/10 overflow-hidden border border-gray-200 max-w-sm mx-auto">
                                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <Lightning size={16} className="text-white" weight="fill" />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-semibold">AI Learning Assistant</p>
                                        <p className="text-white/60 text-xs">Online</p>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3 bg-gray-50">
                                    <div className="flex gap-2">
                                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 text-xs">AI</div>
                                        <div className="bg-white rounded-2xl rounded-bl-md px-3 py-2 text-xs text-gray-600 border border-gray-100 max-w-[85%]">
                                            Hi! What would you like to learn about today?
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-row-reverse">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 text-xs">U</div>
                                        <div className="bg-indigo-600 rounded-2xl rounded-br-md px-3 py-2 text-xs text-white max-w-[85%]">
                                            Explain neural networks simply
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 text-xs">AI</div>
                                        <div className="bg-white rounded-2xl rounded-bl-md px-3 py-2 text-xs text-gray-600 border border-gray-100 max-w-[85%]">
                                            Think of a neural network like layers of decision-makers. Each layer takes input, processes it, and passes results to the next layer — like an assembly line for pattern recognition! 🧠
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative glow */}
                            <div className="absolute -inset-10 bg-marketing-secondary/5 blur-3xl rounded-full -z-10" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* === FAQ === */}
            <section id="faq" className="py-24 md:py-32 relative z-10 bg-transparent">
                <div className="max-w-3xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12 md:mb-16"
                    >
                        <span className="bg-white/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/60 shadow-sm text-marketing-secondary font-mono text-sm uppercase tracking-widest inline-block">Got Questions?</span>
                        <h2 className="text-4xl md:text-6xl font-serif text-gray-900 mt-6 drop-shadow-sm font-bold tracking-tight">Frequently Asked</h2>
                    </motion.div>

                    <div className="space-y-4">
                        {FAQ_DATA.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <FAQItem 
                                    item={item} 
                                    isOpen={openFAQ === i}
                                    onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === FINAL CTA BANNER === */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 max-w-4xl mx-auto text-center px-6"
                >
                    <div className="bg-white/60 backdrop-blur-2xl border border-white/80 p-12 md:p-20 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
                        <div className="w-24 h-24 bg-marketing-secondary/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-marketing-secondary/20">
                            <GraduationCap size={48} className="text-marketing-secondary" weight="duotone" />
                        </div>
                        <h2 className="text-5xl md:text-7xl font-serif text-gray-900 mb-8 leading-tight tracking-tight drop-shadow-sm">
                            Ready to claim<br/>your future?
                        </h2>
                        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto font-mono leading-relaxed">
                            Join thousands of students building their dream careers. 
                            The journey starts today, and it's completely free.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                            <Link to="/register" className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-marketing-secondary to-marketing-accent text-white text-xl font-bold rounded-full hover:scale-[1.03] transition-transform shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]">
                                Start Learning Free
                            </Link>
                            <Link to="/login" className="w-full sm:w-auto px-10 py-5 bg-white/80 backdrop-blur border-2 border-transparent hover:border-marketing-secondary/20 text-gray-800 text-xl font-medium rounded-full hover:bg-white transition-all shadow-sm">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* === FOOTER === */}
            <footer className="border-t border-white/40 py-12 md:py-16 bg-white/20 backdrop-blur-3xl z-10 relative">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
                        <div>
                            <h3 className="text-xl font-serif font-bold text-gray-900 mb-4 tracking-tight">Unilearn</h3>
                            <p className="text-sm text-gray-700 font-mono leading-relaxed font-medium">
                                Empowering the next generation of tech professionals with structured, narrative-driven learning.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Programs</h4>
                            <div className="space-y-2 text-sm text-gray-600 font-mono font-medium">
                                <p className="hover:text-marketing-secondary cursor-pointer transition-colors">BCA</p>
                                <p className="hover:text-marketing-secondary cursor-pointer transition-colors">MCA</p>
                                <p className="hover:text-marketing-secondary cursor-pointer transition-colors">Data Science</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Platform</h4>
                            <div className="space-y-2 text-sm text-gray-600 font-mono font-medium">
                                <p className="hover:text-marketing-secondary cursor-pointer transition-colors">Video Lectures</p>
                                <p className="hover:text-marketing-secondary cursor-pointer transition-colors">Course Notes</p>
                                <p className="hover:text-marketing-secondary cursor-pointer transition-colors">AI Assistant</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Support</h4>
                            <div className="space-y-2 text-sm text-gray-600 font-mono font-medium">
                                <p className="hover:text-marketing-secondary cursor-pointer transition-colors">FAQ</p>
                                <p className="hover:text-marketing-secondary cursor-pointer transition-colors">Contact Us</p>
                                <p className="hover:text-marketing-secondary cursor-pointer transition-colors">Community</p>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-white/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-gray-600 font-mono font-medium">&copy; 2025 Unilearn. All rights reserved.</p>
                        <div className="flex gap-6 text-xs text-gray-600 font-mono font-medium">
                            <span className="hover:text-gray-900 cursor-pointer transition-colors">Privacy Policy</span>
                            <span className="hover:text-gray-900 cursor-pointer transition-colors">Terms of Service</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Chatbot */}
            <ChatBot />
        </div>
    );
};

export default LandingPage;
