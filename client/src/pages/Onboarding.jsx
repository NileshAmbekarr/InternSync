import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Users, Rocket, Check, X, Plus, Mail, FileText, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import './Onboarding.css';

const Onboarding = () => {
    const { organization, isOwner } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [invites, setInvites] = useState([{ email: '', role: 'intern' }]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOwner()) {
            navigate('/dashboard');
        }
    }, [isOwner, navigate]);

    const addInvite = () => {
        if (invites.length < 5) setInvites([...invites, { email: '', role: 'intern' }]);
    };

    const removeInvite = (index) => setInvites(invites.filter((_, i) => i !== index));

    const updateInvite = (index, field, value) => {
        const newInvites = [...invites];
        newInvites[index][field] = value;
        setInvites(newInvites);
    };

    const sendInvites = async () => {
        const validInvites = invites.filter((inv) => inv.email.trim());
        if (validInvites.length === 0) {
            setStep(3);
            return;
        }
        setLoading(true);
        let successCount = 0;
        for (const invite of validInvites) {
            try {
                await authAPI.invite(invite);
                successCount++;
            } catch (error) {
                toast.error(`Failed to invite ${invite.email}`);
            }
        }
        if (successCount > 0) toast.success(`${successCount} invite(s) sent`);
        setLoading(false);
        setStep(3);
    };

    return (
        <div className="onboarding-page">
            <div className="onboarding-container">
                <div className="onboarding-progress">
                    <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
                    <div className={`progress-line ${step >= 2 ? 'active' : ''}`} />
                    <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
                    <div className={`progress-line ${step >= 3 ? 'active' : ''}`} />
                    <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
                </div>

                {step === 1 && (
                    <div className="onboarding-step">
                        <div className="step-icon"><Sparkles size={26} /></div>
                        <h1>Welcome to InternSync</h1>
                        <p className="step-subtitle">
                            Your organization <strong>{organization?.name}</strong> is ready.
                        </p>
                        <div className="info-card">
                            <h3>Your Plan: Free Tier</h3>
                            <ul>
                                <li><Check size={15} />Up to 5 interns</li>
                                <li><Check size={15} />100MB file storage</li>
                                <li><Check size={15} />Report submission & grading</li>
                                <li><Check size={15} />Email notifications</li>
                            </ul>
                        </div>
                        <button className="btn btn-primary btn-lg" onClick={() => setStep(2)}>Continue</button>
                    </div>
                )}

                {step === 2 && (
                    <div className="onboarding-step">
                        <div className="step-icon"><Users size={26} /></div>
                        <h1>Invite Your Team</h1>
                        <p className="step-subtitle">
                            Add your interns and admins to get started. You can always do this later.
                        </p>

                        <div className="invites-list">
                            {invites.map((invite, index) => (
                                <div key={index} className="invite-row">
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="Email address"
                                        value={invite.email}
                                        onChange={(e) => updateInvite(index, 'email', e.target.value)}
                                    />
                                    <select
                                        className="form-select role-select"
                                        value={invite.role}
                                        onChange={(e) => updateInvite(index, 'role', e.target.value)}
                                    >
                                        <option value="intern">Intern</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    {invites.length > 1 && (
                                        <button className="btn btn-ghost btn-sm icon-btn" onClick={() => removeInvite(index)} aria-label="Remove">
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {invites.length < 5 && (
                            <button className="btn btn-secondary add-invite-btn" onClick={addInvite}>
                                <Plus size={16} />
                                Add Another
                            </button>
                        )}

                        <div className="step-actions">
                            <button className="btn btn-ghost" onClick={() => setStep(3)}>Skip for now</button>
                            <button className="btn btn-primary" onClick={sendInvites} disabled={loading}>
                                {loading ? 'Sending...' : 'Send Invites'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="onboarding-step">
                        <div className="step-icon"><Rocket size={26} /></div>
                        <h1>You're All Set</h1>
                        <p className="step-subtitle">
                            Your organization is ready. Head to the dashboard to start managing submissions.
                        </p>

                        <div className="quick-tips">
                            <h3>Quick Tips</h3>
                            <div className="tip">
                                <span className="tip-icon"><Mail size={16} /></span>
                                <p>Interns receive email invites and set their own passwords.</p>
                            </div>
                            <div className="tip">
                                <span className="tip-icon"><FileText size={16} /></span>
                                <p>Submitted reports appear in your dashboard for review.</p>
                            </div>
                            <div className="tip">
                                <span className="tip-icon"><Star size={16} /></span>
                                <p>Grade reports with ratings, marks, and feedback.</p>
                            </div>
                        </div>

                        <button className="btn btn-primary btn-lg" onClick={() => navigate('/admin')}>
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Onboarding;
