import React from 'react';
import { Link } from 'react-router-dom';

const CategoryCard = ({ category }) => {
  return (
    <Link to={`/products/${category.id}`} className="category-card">
      <img src={category.image} alt={category.name} className="category-icon" />
      <span className="category-title">{category.name}</span>
    </Link>
  );
};

export default CategoryCard;
