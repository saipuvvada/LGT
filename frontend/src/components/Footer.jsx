import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-grid">
          {/* Brand & About */}
          <div className="footer-brand-section">
            <div className="footer-logo">
              <img src="/logo.png" alt="AgroDeals Logo" />
              <span>AGRO<strong>DEALS</strong></span>
            </div>
            <p className="footer-description">
              Your trusted agri input store. We provide genuine agricultural products at the best market prices with exceptional support for farmers.
            </p>
            <div className="footer-contact">
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <a href="mailto:saipuvvada12@gmail.com">saipuvvada12@gmail.com</a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links-section">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Shop Now</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/advisory">Crop Advisory</Link></li>
              <li><Link to="/consult">Expert Consult</Link></li>
              <li><Link to="/support">Help & Support</Link></li>
              <li><Link to="/admin">Admin Panel</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="footer-links-section">
            <h4 className="footer-title">Categories</h4>
            <ul className="footer-links">
              <li><Link to="/category/pesticides">Pesticides</Link></li>
              <li><Link to="/category/fertilizers">Fertilizers</Link></li>
              <li><Link to="/category/seeds">Hybrid Seeds</Link></li>
              <li><Link to="/category/tools">Farm Tools</Link></li>
            </ul>
          </div>

          {/* Map */}
          <div className="footer-map-section">
            <h4 className="footer-title">Our Location</h4>
            <div className="footer-map-wrapper">
              <iframe
                title="AgroDeals Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d122283.79255850937!2d80.5699478!3d16.5102553!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a35eff9482d944b%3A0x939b7e84ab4a0265!2sVijayawada%2C%20Andhra%20Pradesh!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; {new Date().getFullYear()} AgroDeals. All rights reserved.</p>
          <div className="footer-social">
            <a href="#" aria-label="Facebook">📘</a>
            <a href="#" aria-label="Twitter">🐦</a>
            <a href="#" aria-label="Instagram">📸</a>
            <a href="#" aria-label="YouTube">▶️</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
