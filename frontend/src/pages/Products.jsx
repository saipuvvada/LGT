import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { categories, getProductsByCategory } from '../data/placeholderData';
import ProductCard from '../components/ProductCard';

const Products = () => {
  const { categoryId } = useParams();
  const category = categories.find(c => c.id === categoryId);
  const products = getProductsByCategory(categoryId);

  if (!category) {
    return (
      <div className="container section" style={{ textAlign: 'center' }}>
        <h2>Category not found</h2>
        <Link to="/" style={{ color: 'var(--primary-color)', marginTop: '16px', display: 'inline-block' }}>
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="container" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/">
          <ArrowLeft size={24} color="#333" />
        </Link>
        <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>{category.name}</h1>
      </div>

      <div className="container section">
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
            <p>No products found in this category yet.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
