import { useState, useEffect, useRef } from 'react';
import { Send, Trash2, MessageSquare } from 'lucide-react';
import { reportsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './CommentThread.css';

const initials = (name) => (name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?');

const timeAgo = (dateString) => {
    const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const CommentThread = ({ reportId }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [body, setBody] = useState('');
    const [posting, setPosting] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const res = await reportsAPI.getComments(reportId);
                if (active) setComments(res.data.comments);
            } catch {
                if (active) toast.error('Failed to load comments');
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [reportId]);

    const handlePost = async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setPosting(true);
        try {
            const res = await reportsAPI.addComment(reportId, body.trim());
            setComments((prev) => [...prev, res.data.comment]);
            setBody('');
            setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to post comment');
        } finally {
            setPosting(false);
        }
    };

    const handleDelete = async (commentId) => {
        const prev = comments;
        setComments((c) => c.filter((x) => x._id !== commentId));
        try {
            await reportsAPI.deleteComment(reportId, commentId);
        } catch {
            setComments(prev);
            toast.error('Failed to delete comment');
        }
    };

    const myId = user?.id || user?._id;

    return (
        <div className="comment-thread">
            <h4 className="thread-title">
                <MessageSquare size={16} />
                Discussion
                {comments.length > 0 && <span className="thread-count">{comments.length}</span>}
            </h4>

            {loading ? (
                <div className="thread-loading">
                    <span className="spinner spinner-sm" />
                </div>
            ) : comments.length === 0 ? (
                <p className="thread-empty">No comments yet. Start the conversation.</p>
            ) : (
                <div className="comment-list">
                    {comments.map((c) => {
                        const mine = (c.author?._id || c.author) === myId;
                        return (
                            <div key={c._id} className={`comment ${mine ? 'mine' : ''}`}>
                                <span className="comment-avatar">{initials(c.author?.name)}</span>
                                <div className="comment-body">
                                    <div className="comment-meta">
                                        <span className="comment-author">{c.author?.name || 'User'}</span>
                                        {c.author?.role && c.author.role !== 'intern' && (
                                            <span className="comment-role">{c.author.role}</span>
                                        )}
                                        <span className="comment-time">{timeAgo(c.createdAt)}</span>
                                        {mine && (
                                            <button
                                                className="comment-delete"
                                                onClick={() => handleDelete(c._id)}
                                                aria-label="Delete comment"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="comment-text">{c.body}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={endRef} />
                </div>
            )}

            <form className="comment-form" onSubmit={handlePost}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Write a comment..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={2000}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={posting || !body.trim()}>
                    <Send size={14} />
                    Send
                </button>
            </form>
        </div>
    );
};

export default CommentThread;
