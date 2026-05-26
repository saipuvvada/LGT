import React from 'react';

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} className="product-image" />
      <h3 className="product-title">{product.name}</h3>
      <div className="product-price-row">
        <span className="price-original">₹{product.originalPrice}</span>
        <span className="price-discounted">₹{product.price}</span>
      </div>
      <button className="btn-primary">ADD TO BAG</button>
    </div>
  );
};

export default ProductCard;
