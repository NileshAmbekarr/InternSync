import { useState } from 'react';
import './StarRating.css';

const StarRating = ({ rating = 0, onChange, readonly = false, size = 'md' }) => {
    const [hoverRating, setHoverRating] = useState(0);

    const handleClick = (value) => {
        if (!readonly && onChange) {
            onChange(value);
        }
    };

    const handleMouseEnter = (value) => {
        if (!readonly) {
            setHoverRating(value);
        }
    };

    const handleMouseLeave = () => {
        setHoverRating(0);
    };

    return (
        <div className={`star-rating star-rating-${size} ${readonly ? 'readonly' : ''}`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                    onClick={() => handleClick(star)}
                    onMouseEnter={() => handleMouseEnter(star)}
                    onMouseLeave={handleMouseLeave}
                    disabled={readonly}
                >
                    ★
                </button>
            ))}
            {rating > 0 && <span className="rating-value">{rating}/5</span>}
        </div>
    );
};

export default StarRating;
