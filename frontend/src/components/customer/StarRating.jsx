import React from 'react';

const StarRating = ({ value = 0, onChange, readOnly = false }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={`star-rating ${readOnly ? 'is-readonly' : ''}`}>
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          className={`star ${value >= n ? 'filled' : ''}`}
          onClick={() => !readOnly && onChange && onChange(n)}
          disabled={readOnly}
          aria-label={`${n} sao`}
        >
          {value >= n ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
};

export default StarRating;
