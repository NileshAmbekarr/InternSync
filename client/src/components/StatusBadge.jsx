const StatusBadge = ({ status }) => {
    const statusLabels = {
        draft: 'Draft',
        submitted: 'Submitted',
        under_review: 'Under Review',
        graded: 'Graded',
    };

    return (
        <span className={`badge badge-${status}`}>
            {statusLabels[status] || status}
        </span>
    );
};

export default StatusBadge;
