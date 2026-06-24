import { Link } from 'react-router-dom';
import {
    Layers,
    UploadCloud,
    Undo2,
    Star,
    TrendingUp,
    BarChart3,
    FileText,
    ArrowRight,
} from 'lucide-react';
import './LandingPage.css';

const features = [
    { icon: UploadCloud, title: 'Easy Submissions', text: 'Submit daily logs or weekly reports with file attachments in seconds.' },
    { icon: Undo2, title: 'Undo Anytime', text: 'Made a mistake? Recall your submission before it is reviewed.' },
    { icon: Star, title: 'Clear Feedback', text: 'Receive ratings and detailed feedback from your supervisors.' },
    { icon: TrendingUp, title: 'Progress Tracking', text: 'Monitor your growth with a complete history of graded submissions.' },
];

const steps = [
    { n: 1, title: 'Create Account', text: 'Sign up with your email or Google account.' },
    { n: 2, title: 'Submit Reports', text: 'Upload your daily or weekly progress updates.' },
    { n: 3, title: 'Get Feedback', text: 'Receive ratings and comments from admins.' },
];

const LandingPage = () => {
    const year = new Date().getFullYear();

    return (
        <div className="landing-page">
            <nav className="landing-nav">
                <div className="container">
                    <div className="nav-content">
                        <div className="nav-brand">
                            <span className="brand-mark"><Layers size={18} /></span>
                            <span className="brand-text">InternSync</span>
                        </div>
                        <div className="nav-links">
                            <Link to="/login" className="btn btn-secondary">Sign In</Link>
                            <Link to="/register" className="btn btn-primary">Get Started</Link>
                        </div>
                    </div>
                </div>
            </nav>

            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <span className="hero-eyebrow">Internship management, simplified</span>
                        <h1 className="hero-title">
                            Streamline your <span className="highlight">internship</span> program
                        </h1>
                        <p className="hero-subtitle">
                            A modern platform for managing intern submissions and evaluations.
                            Track progress, provide feedback, and build better internship programs.
                        </p>
                        <div className="hero-actions">
                            <Link to="/register" className="btn btn-primary btn-lg">Get Started</Link>
                            <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="visual-card card-1">
                            <span className="card-icon"><FileText size={20} /></span>
                            <span className="card-label">Daily Reports</span>
                        </div>
                        <div className="visual-card card-2">
                            <span className="card-icon"><Star size={20} /></span>
                            <span className="card-label">Get Rated</span>
                        </div>
                        <div className="visual-card card-3">
                            <span className="card-icon"><BarChart3 size={20} /></span>
                            <span className="card-label">Track Progress</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="features">
                <div className="container">
                    <h2 className="landing-section-title">Why InternSync</h2>
                    <div className="features-grid">
                        {features.map(({ icon: Icon, title, text }) => (
                            <div key={title} className="feature-card">
                                <span className="feature-icon"><Icon size={22} /></span>
                                <h3>{title}</h3>
                                <p>{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="how-it-works">
                <div className="container">
                    <h2 className="landing-section-title">How It Works</h2>
                    <div className="steps">
                        {steps.map((step, i) => (
                            <div className="step-wrap" key={step.n}>
                                <div className="step">
                                    <div className="step-number">{step.n}</div>
                                    <h3>{step.title}</h3>
                                    <p>{step.text}</p>
                                </div>
                                {i < steps.length - 1 && (
                                    <span className="step-arrow"><ArrowRight size={22} /></span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="cta">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to get started?</h2>
                        <p>Join InternSync today and streamline your internship experience.</p>
                        <Link to="/register" className="btn btn-primary btn-lg">Create Your Account</Link>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <span className="brand-mark"><Layers size={16} /></span>
                            <span className="brand-text">InternSync</span>
                        </div>
                        <p className="footer-text">© {year} InternSync · Built for better internships.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
