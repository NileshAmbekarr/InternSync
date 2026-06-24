import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { notificationsAPI } from '../utils/api';
import './NotificationBell.css';

const POLL_INTERVAL = 30000;

const timeAgo = (dateString) => {
    const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationBell = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const res = await notificationsAPI.getAll();
                if (!active) return;
                setItems(res.data.notifications);
                setUnread(res.data.unreadCount);
            } catch {
                // best-effort; ignore polling errors
            }
        };
        load();
        const id = setInterval(load, POLL_INTERVAL);
        return () => {
            active = false;
            clearInterval(id);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleItemClick = async (item) => {
        setOpen(false);
        if (!item.read) {
            setItems((prev) => prev.map((n) => (n._id === item._id ? { ...n, read: true } : n)));
            setUnread((u) => Math.max(0, u - 1));
            try {
                await notificationsAPI.markRead(item._id);
            } catch {
                /* ignore */
            }
        }
        if (item.link) navigate(item.link);
    };

    const handleMarkAll = async () => {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnread(0);
        try {
            await notificationsAPI.markAllRead();
        } catch {
            /* ignore */
        }
    };

    return (
        <div className="notif" ref={ref}>
            <button
                className="notif-trigger"
                onClick={() => setOpen((o) => !o)}
                aria-label="Notifications"
            >
                <Bell size={19} />
                {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
            </button>

            {open && (
                <div className="notif-dropdown">
                    <div className="notif-header">
                        <span>Notifications</span>
                        {unread > 0 && (
                            <button className="notif-markall" onClick={handleMarkAll}>
                                <CheckCheck size={14} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="notif-list">
                        {items.length === 0 ? (
                            <div className="notif-empty">
                                <Inbox size={22} />
                                <span>No notifications yet</span>
                            </div>
                        ) : (
                            items.map((item) => (
                                <button
                                    key={item._id}
                                    className={`notif-item ${item.read ? '' : 'unread'}`}
                                    onClick={() => handleItemClick(item)}
                                >
                                    <div className="notif-item-body">
                                        <span className="notif-item-title">{item.title}</span>
                                        {item.message && <span className="notif-item-msg">{item.message}</span>}
                                    </div>
                                    <span className="notif-item-time">{timeAgo(item.createdAt)}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
