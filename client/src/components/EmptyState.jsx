const EmptyState = ({ icon: Icon, title, description, children }) => (
    <div className="empty-state">
        {Icon && (
            <span className="empty-state-icon">
                <Icon />
            </span>
        )}
        {title && <h3>{title}</h3>}
        {description && <p>{description}</p>}
        {children}
    </div>
);

export default EmptyState;
