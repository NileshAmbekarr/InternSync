const StatCard = ({ icon: Icon, value, label, onClick, active }) => {
    const className = `stat-card ${onClick ? 'clickable' : ''} ${active ? 'active' : ''}`.trim();
    return (
        <div className={className} onClick={onClick}>
            {Icon && (
                <span className="stat-icon">
                    <Icon />
                </span>
            )}
            <span className="stat-info">
                <span className="stat-value">{value}</span>
                <span className="stat-label">{label}</span>
            </span>
        </div>
    );
};

export default StatCard;
