import { NavLink, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    BarChart3,
    Users,
    Settings,
    User,
    Layers,
    X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ open, onClose }) => {
    const { isAdmin, organization } = useAuth();

    const adminLinks = [
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        { to: '/admin/team', label: 'Team', icon: Users },
        { to: '/settings', label: 'Settings', icon: Settings },
    ];

    const internLinks = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/my-reports', label: 'My Reports', icon: FileText },
        { to: '/profile', label: 'Profile', icon: User },
    ];

    const links = isAdmin() ? adminLinks : internLinks;

    return (
        <>
            <div
                className={`sidebar-backdrop ${open ? 'visible' : ''}`}
                onClick={onClose}
            />
            <aside className={`sidebar ${open ? 'open' : ''}`}>
                <div className="sidebar-top">
                    <Link to={isAdmin() ? '/admin' : '/dashboard'} className="sidebar-brand" onClick={onClose}>
                        <span className="brand-mark">
                            <Layers size={18} />
                        </span>
                        <span className="brand-text">InternSync</span>
                    </Link>
                    <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
                        <X size={18} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {links.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {organization && (
                    <div className="sidebar-footer">
                        <div className="org-pill">
                            <span className="org-name">{organization.name}</span>
                            <span className="org-plan">{(organization.plan || 'free').toUpperCase()} PLAN</span>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
};

export default Sidebar;
