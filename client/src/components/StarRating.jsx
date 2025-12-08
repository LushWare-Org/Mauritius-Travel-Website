// components/StarRating.jsx
import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';

const StarRating = ({ rating, setRating, editable = true }) => {
  const [hover, setHover] = useState(null);

  return (
    <div className="flex">
      {[...Array(5)].map((_, index) => {
        const currentRating = index + 1;
        return (
          <label key={index}>
            <input
              type="radio"
              name="rating"
              value={currentRating}
              onClick={() => editable && setRating(currentRating)}
              style={{ display: 'none' }}
            />
            <FaStar
              className="cursor-pointer"
              size={24}
              color={currentRating <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
              onMouseEnter={() => editable && setHover(currentRating)}
              onMouseLeave={() => editable && setHover(null)}
            />
          </label>
        );
      })}
    </div>
  );
};

export default StarRating;