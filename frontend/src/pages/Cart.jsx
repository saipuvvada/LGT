import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

export default function Cart() {
  const navigate = useNavigate()
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart()
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const cartItemCount = cartItems.reduce((n, i) => n + i.quantity, 0)
  const totalSavings = cartItems.reduce(
    (s, i) => s + ((i.originalPrice || i.price) - i.price) * i.quantity,
    0
  )

  return (
    <div className="app-shell">
      {/* HEADER */}
      <header className="header">
        <div className="header-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate(-1)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              aria-label="Go back"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <span style={{ fontSize: 18, fontWeight: 700 }}>Bag</span>
          </div>
          <Link to="/" aria-label="Home" style={{ color: 'white' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </Link>
        </div>
      </header>

      <main className="page-content">
        <div className="cart-page" style={{ paddingBottom: cartItems.length > 0 ? '140px' : '20px' }}>

          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <div className="empty-emoji">🛒</div>
              <h2>Your bag is empty</h2>
              <p>Add some products to get started!</p>
              <button className="btn-shop-now" onClick={() => navigate('/')}>
                Shop Now
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-light)' }}>
                {cartItemCount} item{cartItemCount > 1 ? 's' : ''} in your bag
              </div>

              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-top">
                    <div className="cart-item-emoji">{item.emoji || '🧴'}</div>
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-prices">
                        {item.originalPrice && (
                          <span className="cart-item-original">₹{item.originalPrice}</span>
                        )}
                        <span className="cart-item-sale">₹{item.price}</span>
                      </div>
                    </div>
                  </div>

                  <div className="cart-item-bottom">
                    <div className="qty-controls">
                      <button
                        className="qty-btn"
                        onClick={() => {
                          if (item.quantity === 1) removeFromCart(item.id)
                          else updateQuantity(item.id, item.quantity - 1)
                        }}
                      >
                        −
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <span className="qty-label">QUANTITY</span>
                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      REMOVE
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </main>

      {/* CART SUMMARY STICKY FOOTER */}
      {cartItems.length > 0 && (
        <div className="cart-summary">
          <div className="cart-summary-row">
            <span>Total Savings</span>
            <span style={{ color: 'var(--green-primary)', fontWeight: 700 }}>
              {totalSavings > 0 ? `₹${Math.round(totalSavings)}` : '₹0'}
            </span>
            <span className="cart-total-bold">Order Total ₹{Math.round(cartTotal)}</span>
          </div>
          <button 
            className="btn-checkout" 
            onClick={() => {
              if (user) {
                navigate('/checkout')
              } else {
                alert('Please login to place the order!')
                navigate('/login')
              }
            }}
          >
            PROCEED TO CHECK OUT &nbsp;›
          </button>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        <Link to="/" className="nav-item">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          Shop
        </Link>
        <div className="nav-item">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          My Farm
        </div>
        <div className="nav-item">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Consult
        </div>
        <Link to="/cart" className="nav-item active">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Bag {cartItemCount > 0 && `(${cartItemCount})`}
        </Link>
      </nav>
    </div>
  )
}
