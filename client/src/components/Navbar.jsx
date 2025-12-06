import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container container">
                <Link to={isAdmin() ? '/admin' : '/dashboard'} className="navbar-brand">
                    <span className="brand-icon">⚡</span>
                    <span className="brand-text">InternSync</span>
                </Link>

                <div className="navbar-menu">
                    {isAdmin() ? (
                        <>
                            <Link to="/admin" className="nav-link">Dashboard</Link>
                            <Link to="/admin/reports" className="nav-link">All Reports</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/dashboard" className="nav-link">Dashboard</Link>
                            <Link to="/my-reports" className="nav-link">My Reports</Link>
                        </>
                    )}
                </div>

                <div className="navbar-user">
                    <div className="user-info">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">{user?.role}</span>
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
