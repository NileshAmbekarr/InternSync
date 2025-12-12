import { useState } from 'react';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import './InviteModal.css';

const InviteModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        role: 'intern'
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await authAPI.invite(formData);
            toast.success(`Invitation sent to ${formData.email}!`);
            setFormData({ email: '', name: '', role: 'intern' });
            onSuccess?.();
            onClose();
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to send invitation';
            toast.error(message);

            if (error.response?.data?.upgradeRequired) {
                toast.error('Upgrade your plan to invite more team members.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Invite Team Member</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            placeholder="colleague@company.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Name (Optional)</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            placeholder="Their name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Role</label>
                        <select
                            name="role"
                            className="form-input"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="intern">Intern</option>
                            <option value="admin">Admin</option>
                        </select>
                        <p className="form-hint">
                            {formData.role === 'intern'
                                ? 'Interns can submit reports and view their grades.'
                                : 'Admins can review and grade reports.'}
                        </p>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Invite'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InviteModal;
