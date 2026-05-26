import React from 'react';
import { Cloud, MapPin, ChevronRight, TrendingUp, ShieldCheck } from 'lucide-react';
import { categories, getTrendingProducts, getMostPurchased } from '../data/placeholderData';
import CategoryCard from '../components/CategoryCard';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const trending = getTrendingProducts();
  const mostPurchased = getMostPurchased();

  return (
    <div className="home-page">
      {/* Weather & Location Widget */}
      <div className="container">
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '16px 0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Cloud size={32} color="#a0aec0" />
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>32°</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} color="#666" />
            <span style={{ fontSize: '16px', fontWeight: '500' }}>Local Farm</span>
          </div>
          <ChevronRight size={24} color="#666" />
        </div>
      </div>

      {/* Categories */}
      <div className="container section">
        <div className="categories-grid">
          {categories.map(category => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>

      {/* Promotional Banner */}
      <div className="container section">
        <div className="promo-banner">
          <h2>Agri-products delivered to your farm</h2>
          <button className="btn-primary">LEARN MORE</button>
        </div>
      </div>

      {/* Most Purchased */}
      <div className="container section">
        <h2 className="section-title">
          <ShieldCheck size={24} color="#2b303a" />
          Most Purchased Products
        </h2>
        <div className="horizontal-scroll">
          {mostPurchased.map(product => (
            <div key={product.id} className="horizontal-item">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* Trending */}
      <div className="container section">
        <h2 className="section-title">
          <TrendingUp size={24} color="#2b303a" />
          This week's trending products
        </h2>
        <div className="products-grid">
          {trending.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
