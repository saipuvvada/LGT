import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Package, 
  Calendar, 
  MapPin, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Truck, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText
} from 'lucide-react';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    
    const orderIdStr = String(order.id);
    const invFormatStr = `inv-${orderIdStr.substring(0, 8).toLowerCase()}`;
    const transIdStr = String(order.transaction_id || '').toLowerCase();
    const nameStr = String(order.customer_name || '').toLowerCase();

    return orderIdStr.includes(q) || invFormatStr.includes(q) || transIdStr.includes(q) || nameStr.includes(q);
  });

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Please login to see your order history.");
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      // 2. Query orders with nested order_items and products
      const { data, error: queryError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price_at_time,
            products (
              id,
              name,
              brand,
              price,
              image_url
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setOrders(data || []);

    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.message || "Failed to load order history.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case 'pending_verification':
      case 'pending':
        return { 
          label: 'Pending Verification', 
          color: '#b45309', 
          bg: '#fffbeb', 
          border: '#fde68a',
          icon: <Clock size={16} />,
          step: 1
        };
      case 'processing':
        return { 
          label: 'Processing', 
          color: '#1d4ed8', 
          bg: '#eff6ff', 
          border: '#bfdbfe',
          icon: <Package size={16} />,
          step: 2
        };
      case 'shipped':
        return { 
          label: 'Shipped', 
          color: '#4338ca', 
          bg: '#e0e7ff', 
          border: '#c7d2fe',
          icon: <Truck size={16} />,
          step: 3
        };
      case 'delivered':
        return { 
          label: 'Delivered', 
          color: '#047857', 
          bg: '#ecfdf5', 
          border: '#a7f3d0',
          icon: <CheckCircle size={16} />,
          step: 4
        };
      case 'cancelled':
        return { 
          label: 'Cancelled', 
          color: '#b91c1c', 
          bg: '#fef2f2', 
          border: '#fca5a5',
          icon: <XCircle size={16} />,
          step: 0
        };
      default:
        return { 
          label: status || 'Pending', 
          color: '#475569', 
          bg: '#f1f5f9', 
          border: '#cbd5e1',
          icon: <AlertCircle size={16} />,
          step: 1
        };
    }
  };

  if (loading) {
    return (
      <div className="app-shell" style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="typing-indicator" style={{ justifyContent: 'center', marginBottom: '12px' }}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p style={{ color: 'var(--text-light)', fontSize: '14px', fontWeight: '500' }}>Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell" style={{ padding: '40px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h3>Unable to load orders</h3>
        <p style={{ color: 'var(--text-light)', marginTop: '8px', marginBottom: '24px' }}>{error}</p>
        <button onClick={() => navigate('/login')} className="btn-shop-now">Go to Login</button>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="header" style={{ position: 'relative' }}>
        <div className="header-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }} aria-label="Go home">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <span style={{ fontSize: 18, fontWeight: 700 }}>My Orders</span>
          </div>
        </div>
      </header>

      <main className="page-content" style={{ padding: '20px 16px', paddingBottom: '90px' }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
            <h2>No orders placed yet</h2>
            <p style={{ color: 'var(--text-light)', marginTop: '8px', marginBottom: '24px', fontSize: '14px' }}>
              You haven't ordered any crop protectants or fertilizers yet.
            </p>
            <button className="btn-shop-now" onClick={() => navigate('/')}>
              Browse Inputs Shop
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '720px', margin: '0 auto' }}>
            {/* Search Input Filter */}
            <div className="search-bar" style={{ margin: '0 0 16px 0', width: '100%', maxWidth: '720px', boxSizing: 'border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Search by Order ID, Invoice No, or Customer Name..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>

            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔍</div>
                <h3>No matching orders found</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '13px', marginTop: '4px' }}>
                  We couldn't find any orders matching "<strong>{searchQuery}</strong>". Check your spelling and try again.
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => {
              const statusInfo = getStatusDetails(order.status);
              const isExpanded = expandedOrder === order.id;
              const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              });

              return (
                <div key={order.id} className="cart-item" style={{ margin: 0, padding: '16px' }}>
                  {/* Order Overview Panel */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                        Order ID
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-dark)', fontFamily: 'monospace', marginTop: '2px' }}>
                        {order.transaction_id || `ORD-${order.id}`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-light)', marginTop: '6px' }}>
                        <Calendar size={12} />
                        <span>{dateStr}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          fontSize: '11px', 
                          fontWeight: 700, 
                          color: statusInfo.color, 
                          backgroundColor: statusInfo.bg, 
                          border: `1px solid ${statusInfo.border}`,
                          padding: '4px 10px', 
                          borderRadius: '12px' 
                        }}
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                      <div style={{ fontSize: '16px', fontWeight: 850, color: 'var(--green-primary)', marginTop: '8px' }}>
                        ₹{parseFloat(order.total_price).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Purchased Items Previews */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-mid)', fontWeight: 650 }}>
                      📋 {order.order_items?.length} item{order.order_items?.length > 1 ? 's' : ''} purchased
                    </div>
                    <button 
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        color: 'var(--green-primary)',
                        fontSize: '12.5px',
                        fontWeight: 700
                      }}
                    >
                      {isExpanded ? 'Hide Details' : 'Show Details'}
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  {/* Expanded Items & Progress Timeline */}
                  {isExpanded && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
                      
                      {/* Interactive Step Progress Tracker */}
                      {order.status !== 'cancelled' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 auto 24px', maxWidth: '400px', position: 'relative', padding: '0 10px' }}>
                          
                          {/* Progress Line */}
                          <div style={{ 
                            position: 'absolute', 
                            top: '12px', 
                            left: '30px', 
                            right: '30px', 
                            height: '4px', 
                            backgroundColor: '#e2e8f0', 
                            zIndex: 1 
                          }}>
                            <div style={{ 
                              height: '100%', 
                              backgroundColor: 'var(--green-primary)', 
                              width: `${((statusInfo.step - 1) / 3) * 100}%`,
                              transition: 'width 0.4s ease'
                            }} />
                          </div>

                          {/* Step Dots */}
                          {[
                            { step: 1, label: 'Order Placed' },
                            { step: 2, label: 'Processing' },
                            { step: 3, label: 'Shipped' },
                            { step: 4, label: 'Delivered' }
                          ].map((s) => {
                            const isDone = statusInfo.step >= s.step;
                            return (
                              <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                                <div style={{ 
                                  width: '24px', 
                                  height: '24px', 
                                  borderRadius: '50%', 
                                  backgroundColor: isDone ? 'var(--green-primary)' : 'white', 
                                  border: `2.5px solid ${isDone ? 'var(--green-primary)' : '#cbd5e1'}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '10px',
                                  fontWeight: 'bold'
                                }}>
                                  {isDone ? '✓' : s.step}
                                </div>
                                <span style={{ fontSize: '9px', fontWeight: 700, color: isDone ? 'var(--text-dark)' : 'var(--text-light)', marginTop: '6px' }}>{s.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Items Detailed List */}
                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={15} />
                        Invoice Items
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                        {order.order_items?.map((item) => {
                          const prod = item.products || {};
                          return (
                            <div key={item.id} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
                              <div>
                                <span style={{ fontWeight: 800, color: 'var(--text-dark)' }}>{prod.name}</span>
                                <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                                  {prod.brand && `${prod.brand} • `}Qty: <strong>{item.quantity}</strong>
                                </div>
                              </div>
                              <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                                ₹{(item.price_at_time * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Loyalty Discount & Farmer Survey Answers */}
                      {parseFloat(order.loyalty_discount_applied || 0) > 0 && (
                        <div style={{ backgroundColor: '#f0faf4', border: '1px solid #c8e6c9', padding: '12px', borderRadius: '8px', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                          <div style={{ color: '#2d7a4f', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            🌾 Farmer Loyalty Discount: -₹{parseFloat(order.loyalty_discount_applied).toFixed(2)}
                          </div>
                          <div style={{ color: 'var(--text-mid)', fontSize: '12px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span>• <b>Previous Order ID:</b> {order.previous_order_id ? String(order.previous_order_id).substring(0,8).toUpperCase() : 'Manual Entry'}</span>
                            <span>• <b>Farm Size Cultivated:</b> {order.land_acres} Acres</span>
                            <span>• <b>Type of Crop:</b> {order.crop_type}</span>
                            <span>• <b>Previously Used Medicines:</b> {order.previous_medicines_used}</span>
                          </div>
                        </div>
                      )}
 
                      {/* Delivery and Address Details */}
                      <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <MapPin size={16} style={{ color: 'var(--text-light)', flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong>Delivery Address:</strong>
                            <div style={{ color: 'var(--text-mid)', marginTop: '4px', lineHeight: 1.4 }}>
                              {order.customer_name} ({order.customer_phone})<br />
                              {order.shipping_address}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            })
          )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;
