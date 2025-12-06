import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="container">
                    <div className="nav-content">
                        <div className="nav-brand">
                            <span className="brand-icon">⚡</span>
                            <span className="brand-text">InternSync</span>
                        </div>
                        <div className="nav-links">
                            <Link to="/login" className="btn btn-secondary">Sign In</Link>
                            <Link to="/register" className="btn btn-primary">Get Started</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            Streamline Your <span className="highlight">Internship</span> Management
                        </h1>
                        <p className="hero-subtitle">
                            A modern platform for managing intern submissions and evaluations.
                            Track progress, provide feedback, and build better internship programs.
                        </p>
                        <div className="hero-actions">
                            <Link to="/register" className="btn btn-primary btn-lg">
                                Start as Intern
                            </Link>
                            <Link to="/login" className="btn btn-secondary btn-lg">
                                Sign In
                            </Link>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="visual-card card-1">
                            <div className="card-icon">📝</div>
                            <div className="card-label">Daily Reports</div>
                        </div>
                        <div className="visual-card card-2">
                            <div className="card-icon">⭐</div>
                            <div className="card-label">Get Rated</div>
                        </div>
                        <div className="visual-card card-3">
                            <div className="card-icon">📊</div>
                            <div className="card-label">Track Progress</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <h2 className="section-title">Why InternSync?</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">📤</div>
                            <h3>Easy Submissions</h3>
                            <p>Submit daily logs or weekly reports with file attachments in seconds.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">↩️</div>
                            <h3>Undo Feature</h3>
                            <p>Made a mistake? Recall your submission before it's reviewed.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">⭐</div>
                            <h3>Clear Feedback</h3>
                            <p>Receive ratings and detailed feedback from your supervisors.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📈</div>
                            <h3>Progress Tracking</h3>
                            <p>Monitor your growth with a complete history of graded submissions.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works">
                <div className="container">
                    <h2 className="section-title">How It Works</h2>
                    <div className="steps">
                        <div className="step">
                            <div className="step-number">1</div>
                            <h3>Create Account</h3>
                            <p>Sign up with your email or Google account</p>
                        </div>
                        <div className="step-arrow">→</div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <h3>Submit Reports</h3>
                            <p>Upload your daily or weekly progress updates</p>
                        </div>
                        <div className="step-arrow">→</div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <h3>Get Feedback</h3>
                            <p>Receive ratings and comments from admins</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to Get Started?</h2>
                        <p>Join InternSync today and streamline your internship experience.</p>
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Create Your Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <span className="brand-icon">⚡</span>
                            <span className="brand-text">InternSync</span>
                        </div>
                        <p className="footer-text">
                            © 2024 InternSync. Built for better internships.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
