import React from 'react';
import { Store, BookOpen, TrendingUp, MessageCircle, ShoppingBag } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const BottomNav = () => {
  const location = useLocation();
  const { cartItems } = useCart();

  const cartCount = cartItems ? cartItems.reduce((total, item) => total + item.quantity, 0) : 0;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`} style={{ padding: '2px 8px' }}>
        <Store size={24} className="nav-icon" />
        <span>Shop</span>
      </Link>
      <Link to="/advisory" className={`nav-item ${isActive('/advisory') ? 'active' : ''}`} style={{ padding: '2px 8px' }}>
        <BookOpen size={24} className="nav-icon" />
        <span>Advisory</span>
      </Link>
      <Link to="/mandi" className={`nav-item ${isActive('/mandi') ? 'active' : ''}`} style={{ padding: '2px 8px' }}>
        <TrendingUp size={24} className="nav-icon" />
        <span>Mandi</span>
      </Link>
      <Link to="/consult" className={`nav-item ${isActive('/consult') ? 'active' : ''}`} style={{ padding: '2px 8px' }}>
        <MessageCircle size={24} className="nav-icon" />
        <span>Consult</span>
      </Link>
      <Link to="/cart" className={`nav-item ${isActive('/cart') ? 'active' : ''} nav-cart-item`} style={{ padding: '2px 8px' }}>
        <div className="nav-icon-container">
          <ShoppingBag size={24} className="nav-icon" />
          {cartCount > 0 && (
            <span className="cart-badge">{cartCount}</span>
          )}
        </div>
        <span>Bag</span>
      </Link>
    </nav>
  );
};

export default BottomNav;
