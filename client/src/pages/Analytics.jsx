import { useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from 'recharts';
import { FileText, CheckCircle2, GraduationCap, Star, BarChart3 } from 'lucide-react';
import { reportsAPI } from '../utils/api';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';
import './Analytics.css';

const COLORS = {
    primary: '#8b5cf6',
    success: '#34d399',
    warning: '#fbbf24',
    info: '#60a5fa',
    grid: '#232329',
    axis: '#71717a',
};

const STATUS_META = [
    { key: 'submitted', label: 'Submitted', color: COLORS.primary },
    { key: 'under_review', label: 'Under Review', color: COLORS.warning },
    { key: 'graded', label: 'Graded', color: COLORS.success },
];

const tooltipStyle = {
    background: '#131316',
    border: '1px solid #232329',
    borderRadius: 10,
    color: '#f4f4f5',
    fontSize: 13,
};

const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await reportsAPI.getAnalytics();
                setData(res.data.analytics);
            } catch (error) {
                toast.error('Failed to load analytics');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="loading-container">
                        <div className="spinner" />
                        <p>Loading analytics...</p>
                    </div>
                </div>
            </div>
        );
    }

    const trend = (data?.trend || []).map((d) => ({
        ...d,
        label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

    const statusData = STATUS_META
        .map((s) => ({ name: s.label, value: data?.statusDistribution?.[s.key] || 0, color: s.color }))
        .filter((s) => s.value > 0);

    const topInterns = data?.topInterns || [];
    const hasData = (data?.totalReports || 0) > 0;

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Analytics</h1>
                    <p className="page-subtitle">Insights across your organization's reports.</p>
                </div>

                <div className="grid grid-4 mb-lg">
                    <StatCard icon={FileText} value={data?.totalReports || 0} label="Total Reports" />
                    <StatCard icon={CheckCircle2} value={data?.gradedCount || 0} label="Graded" />
                    <StatCard icon={GraduationCap} value={data?.avgMarks || 0} label="Avg Marks" />
                    <StatCard icon={Star} value={data?.avgRating || 0} label="Avg Rating" />
                </div>

                {!hasData ? (
                    <EmptyState
                        icon={BarChart3}
                        title="No data yet"
                        description="Analytics will appear once your interns start submitting reports."
                    />
                ) : (
                    <div className="analytics-grid">
                        <div className="card chart-card chart-wide">
                            <div className="chart-head">
                                <h3>Submissions (last 30 days)</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.35} />
                                            <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
                                    <XAxis dataKey="label" stroke={COLORS.axis} fontSize={11} tickLine={false} axisLine={false} interval={4} />
                                    <YAxis stroke={COLORS.axis} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: COLORS.grid }} />
                                    <Area type="monotone" dataKey="count" name="Reports" stroke={COLORS.primary} strokeWidth={2} fill="url(#trendFill)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="card chart-card">
                            <div className="chart-head">
                                <h3>Status Breakdown</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2} stroke="none">
                                        {statusData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="chart-legend">
                                {statusData.map((s) => (
                                    <div key={s.name} className="legend-item">
                                        <span className="legend-dot" style={{ background: s.color }} />
                                        {s.name} <span className="legend-value">{s.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card chart-card chart-wide">
                            <div className="chart-head">
                                <h3>Top Interns by Average Marks</h3>
                            </div>
                            {topInterns.length === 0 ? (
                                <p className="text-muted">No graded reports yet.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={Math.max(180, topInterns.length * 48)}>
                                    <BarChart data={topInterns} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} horizontal={false} />
                                        <XAxis type="number" stroke={COLORS.axis} fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                                        <YAxis type="category" dataKey="name" stroke={COLORS.axis} fontSize={12} tickLine={false} axisLine={false} width={110} />
                                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                        <Bar dataKey="avgMarks" name="Avg Marks" fill={COLORS.primary} radius={[0, 6, 6, 0]} barSize={18} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;
