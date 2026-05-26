import React from 'react';
import { Store, Sprout, MessageCircle, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <Store size={24} />
        <span>Shop</span>
      </Link>
      <div className="nav-item">
        <Sprout size={24} />
        <span>My Farm</span>
      </div>
      <div className="nav-item">
        <MessageCircle size={24} />
        <span>Consult</span>
      </div>
      <div className="nav-item">
        <User size={24} />
        <span>Account</span>
      </div>
    </nav>
  );
};

export default BottomNav;
