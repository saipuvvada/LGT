import React from 'react';
import { Search, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="header">
      <div className="header-top">
        <Link to="/" className="logo">
          AGRO<span className="logo-highlight">DEALS</span>
        </Link>
        <div className="cart-icon-wrapper">
          <ShoppingBag size={24} />
          <span className="cart-badge">4</span>
        </div>
      </div>
      <div className="search-bar-container">
        <Search size={20} color="#666" />
        <input 
          type="text" 
          placeholder="Search for products and brands" 
          className="search-input"
        />
      </div>
    </header>
  );
};

export default Header;
