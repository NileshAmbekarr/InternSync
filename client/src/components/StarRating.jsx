import { useState } from 'react';
import { Star } from 'lucide-react';
import './StarRating.css';

const SIZES = { sm: 16, md: 22, lg: 28 };

const StarRating = ({ rating = 0, onChange, readonly = false, size = 'md' }) => {
    const [hoverRating, setHoverRating] = useState(0);
    const px = SIZES[size] || SIZES.md;

    const handleClick = (value) => {
        if (!readonly && onChange) onChange(value);
    };

    return (
        <div className={`star-rating star-rating-${size} ${readonly ? 'readonly' : ''}`}>
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (hoverRating || rating);
                return (
                    <button
                        key={star}
                        type="button"
                        className={`star ${filled ? 'filled' : ''}`}
                        onClick={() => handleClick(star)}
                        onMouseEnter={() => !readonly && setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        disabled={readonly}
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    >
                        <Star size={px} fill={filled ? 'currentColor' : 'none'} />
                    </button>
                );
            })}
            {rating > 0 && <span className="rating-value">{rating}/5</span>}
        </div>
    );
};

export default StarRating;
