import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion, useScroll, useTransform } from 'framer-motion';
import {
    Layers,
    UploadCloud,
    Undo2,
    Star,
    TrendingUp,
    BarChart3,
    Bell,
    MessageSquare,
    ShieldCheck,
    Users,
    Play,
    ArrowRight,
    Check,
} from 'lucide-react';
import './LandingPage.css';

/* ---- animation helpers ---- */
const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const Reveal = ({ children, className, delay = 0 }) => (
    <Motion.div
        className={className}
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ delay }}
    >
        {children}
    </Motion.div>
);

/* ---- data ---- */
const features = [
    { icon: UploadCloud, title: 'Effortless submissions', text: 'Interns post daily logs or weekly reports with attachments in seconds.' },
    { icon: MessageSquare, title: 'Threaded feedback', text: 'Discuss any report inline — a real conversation between intern and reviewer.' },
    { icon: Star, title: 'Ratings & grading', text: 'Score submissions with stars, marks, and written feedback in one place.' },
    { icon: BarChart3, title: 'Live analytics', text: 'Track submission trends, status breakdowns, and your top performers.' },
    { icon: Bell, title: 'Smart notifications', text: 'In-app and email alerts keep everyone in sync — with a daily digest option.' },
    { icon: ShieldCheck, title: 'Roles & isolation', text: 'Owner, admin, and intern roles with strict per-organization data isolation.' },
];

const steps = [
    { n: '01', title: 'Create your org', text: 'Sign up in seconds and invite your team by email.' },
    { n: '02', title: 'Interns submit', text: 'Daily and weekly reports flow in, with files attached.' },
    { n: '03', title: 'Review & grade', text: 'Give ratings, marks, and feedback — interns see it instantly.' },
    { n: '04', title: 'Track progress', text: 'Watch growth unfold with analytics and a full report history.' },
];

const LandingPage = () => {
    const year = new Date().getFullYear();
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    return (
        <div className="landing">
            {/* ambient background */}
            <div className="landing-bg" aria-hidden="true">
                <span className="glow glow-1" />
                <span className="glow glow-2" />
                <span className="grid-overlay" />
            </div>

            {/* nav */}
            <Motion.nav
                className="lnav"
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease }}
            >
                <div className="container lnav-inner">
                    <a href="#top" className="lnav-brand">
                        <span className="brand-mark"><Layers size={18} /></span>
                        <span>InternSync</span>
                    </a>
                    <div className="lnav-links">
                        <a href="#features">Features</a>
                        <a href="#showcase">Showcase</a>
                        <a href="#how">How it works</a>
                    </div>
                    <div className="lnav-actions">
                        <Link to="/login" className="btn btn-ghost">Sign In</Link>
                        <Link to="/register" className="btn btn-primary">Get Started</Link>
                    </div>
                </div>
            </Motion.nav>

            {/* hero */}
            <header className="hero" id="top" ref={heroRef}>
                <Motion.div className="container hero-inner" style={{ y: heroY, opacity: heroOpacity }}>
                    <Motion.span
                        className="hero-badge"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease, delay: 0.1 }}
                    >
                        <span className="badge-dot" /> Internship management, reimagined
                    </Motion.span>

                    <Motion.h1
                        className="hero-title display"
                        initial="hidden"
                        animate="show"
                        variants={stagger}
                    >
                        <Motion.span variants={fadeUp}>Run internships</Motion.span>{' '}
                        <Motion.span variants={fadeUp}>that actually</Motion.span>{' '}
                        <Motion.span variants={fadeUp} className="grad-text">deliver growth.</Motion.span>
                    </Motion.h1>

                    <Motion.p
                        className="hero-sub"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease, delay: 0.45 }}
                    >
                        One workspace for submissions, reviews, feedback, and analytics —
                        so interns stay on track and mentors stay in the loop.
                    </Motion.p>

                    <Motion.div
                        className="hero-cta"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease, delay: 0.6 }}
                    >
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Get Started <ArrowRight size={16} />
                        </Link>
                        <a href="#showcase" className="btn btn-secondary btn-lg">
                            <Play size={15} /> Watch the demo
                        </a>
                    </Motion.div>

                    <Motion.div
                        className="hero-trust"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.85 }}
                    >
                        <span><Check size={14} /> No credit card</span>
                        <span><Check size={14} /> Free to start</span>
                        <span><Check size={14} /> Email & Google sign-in</span>
                    </Motion.div>
                </Motion.div>
            </header>

            {/* showcase video placeholder */}
            <section className="section showcase" id="showcase">
                <div className="container">
                    <Reveal className="section-head">
                        <h2 className="section-title display">See it in action</h2>
                        <p className="section-lead">A guided walkthrough of the full intern-to-grade workflow.</p>
                    </Reveal>

                    <Motion.div
                        className="video-frame"
                        initial={{ opacity: 0, y: 40, scale: 0.97 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.8, ease }}
                    >
                        {/*
                          VIDEO PLACEHOLDER
                          Replace the .video-placeholder block below with your media, e.g.:
                            <video src="/demo.mp4" controls poster="/demo-poster.jpg" />
                          or an embed:
                            <iframe src="https://www.youtube.com/embed/VIDEO_ID" title="InternSync demo"
                                    allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                        */}
                        <div className="video-placeholder">
                            <button className="play-btn" aria-label="Play demo">
                                <Play size={26} />
                            </button>
                            <span className="video-caption">Product walkthrough — video coming soon</span>
                        </div>
                    </Motion.div>
                </div>
            </section>

            {/* features */}
            <section className="section features" id="features">
                <div className="container">
                    <Reveal className="section-head">
                        <h2 className="section-title display">Everything you need to run great internships</h2>
                        <p className="section-lead">From the first submission to the final grade — covered.</p>
                    </Reveal>

                    <Motion.div
                        className="feature-grid"
                        variants={stagger}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.2 }}
                    >
                        {features.map(({ icon: Icon, title, text }) => (
                            <Motion.div className="feature-card" key={title} variants={fadeUp}>
                                <span className="feature-icon"><Icon size={22} /></span>
                                <h3>{title}</h3>
                                <p>{text}</p>
                            </Motion.div>
                        ))}
                    </Motion.div>
                </div>
            </section>

            {/* how it works */}
            <section className="section how" id="how">
                <div className="container">
                    <Reveal className="section-head">
                        <h2 className="section-title display">How it works</h2>
                        <p className="section-lead">Up and running in four simple steps.</p>
                    </Reveal>

                    <Motion.div
                        className="step-grid"
                        variants={stagger}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.2 }}
                    >
                        {steps.map((s) => (
                            <Motion.div className="step-card" key={s.n} variants={fadeUp}>
                                <span className="step-num display">{s.n}</span>
                                <h3>{s.title}</h3>
                                <p>{s.text}</p>
                            </Motion.div>
                        ))}
                    </Motion.div>
                </div>
            </section>

            {/* built for both sides */}
            <section className="section split">
                <div className="container split-grid">
                    <Reveal className="split-card">
                        <span className="split-icon"><Users size={20} /></span>
                        <h3>For interns</h3>
                        <ul>
                            <li><Check size={15} /> Submit daily & weekly reports with files</li>
                            <li><Check size={15} /> Undo a submission before it's reviewed</li>
                            <li><Check size={15} /> See ratings, marks, and feedback instantly</li>
                            <li><Check size={15} /> Discuss reports in a comment thread</li>
                        </ul>
                    </Reveal>
                    <Reveal className="split-card" delay={0.1}>
                        <span className="split-icon"><TrendingUp size={20} /></span>
                        <h3>For mentors & admins</h3>
                        <ul>
                            <li><Check size={15} /> Review and grade in a focused workspace</li>
                            <li><Check size={15} /> Manage your team and roles with invites</li>
                            <li><Check size={15} /> Track trends and top performers in analytics</li>
                            <li><Check size={15} /> Stay notified by in-app alerts and digests</li>
                        </ul>
                    </Reveal>
                </div>
            </section>

            {/* CTA */}
            <section className="section cta-section">
                <div className="container">
                    <Motion.div
                        className="cta-panel"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 0.7, ease }}
                    >
                        <h2 className="display">Ready to elevate your internship program?</h2>
                        <p>Create your organization in under a minute. It's free to start.</p>
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Get Started <ArrowRight size={16} />
                        </Link>
                    </Motion.div>
                </div>
            </section>

            {/* footer */}
            <footer className="landing-footer">
                <div className="container footer-inner">
                    <div className="footer-brand">
                        <span className="brand-mark"><Layers size={16} /></span>
                        <span>InternSync</span>
                    </div>
                    <p className="footer-text">© {year} InternSync · Built for better internships.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
