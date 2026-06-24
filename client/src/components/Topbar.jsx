import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Topbar.css';

const TITLES = [
    [/^\/admin\/analytics/, 'Analytics'],
    [/^\/admin\/reports/, 'Reports'],
    [/^\/admin\/team/, 'Team'],
    [/^\/admin\/review/, 'Review Report'],
    [/^\/admin/, 'Dashboard'],
    [/^\/dashboard/, 'Dashboard'],
    [/^\/my-reports/, 'My Reports'],
    [/^\/profile/, 'Profile'],
    [/^\/settings/, 'Settings'],
];

const getTitle = (pathname) => {
    const match = TITLES.find(([re]) => re.test(pathname));
    return match ? match[1] : 'InternSync';
};

const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

const Topbar = ({ onMenuClick }) => {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="topbar-menu" onClick={onMenuClick} aria-label="Open menu">
                    <Menu size={20} />
                </button>
                <h1 className="topbar-title">{getTitle(location.pathname)}</h1>
            </div>

            <div className="topbar-right">
                <NotificationBell />

                <div className="profile" ref={dropdownRef}>
                    <button className="profile-trigger" onClick={() => setDropdownOpen((o) => !o)}>
                        <span className="profile-avatar">{getInitials(user?.name)}</span>
                        <span className="profile-name">{user?.name}</span>
                        <ChevronDown size={16} className={`profile-chevron ${dropdownOpen ? 'open' : ''}`} />
                    </button>

                    {dropdownOpen && (
                        <div className="profile-dropdown">
                            <div className="profile-dropdown-header">
                                <span className="profile-dropdown-email">{user?.email}</span>
                                <span className={`profile-role role-${user?.role}`}>
                                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                                </span>
                            </div>

                            <div className="profile-dropdown-divider" />

                            <Link to="/profile" className="profile-dropdown-item" onClick={() => setDropdownOpen(false)}>
                                <User size={16} />
                                Profile
                            </Link>

                            {isAdmin() && (
                                <Link to="/settings" className="profile-dropdown-item" onClick={() => setDropdownOpen(false)}>
                                    <Settings size={16} />
                                    Organization Settings
                                </Link>
                            )}

                            <div className="profile-dropdown-divider" />

                            <button className="profile-dropdown-item danger" onClick={handleLogout}>
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;
