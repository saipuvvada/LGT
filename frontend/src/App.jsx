import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from './context/CartContext'
import { supabase } from './lib/supabase'
import BottomNav from './components/BottomNav'
import Footer from './components/Footer'

const categories = [
  { id: 'pesticides', label: 'Pesticides', emoji: '🧴', path: '/category/pesticides' },
  { id: 'fertilizers', label: 'Fertilizers', emoji: '🌿', path: '/category/fertilizers' },
  { id: 'seeds', label: 'Seeds', emoji: '🌱', path: '/category/seeds' },
]

const heroSlides = [
  {
    id: 'pesticides',
    path: '/category/pesticides',
    tag: '🌾 Kharif Season Deals',
    headline: 'Upto 40% Off on Pesticides',
    sub: 'Shop top brands — Bayer, Syngenta, BASF & more',
    icon: '🧴',
    accentColor: '#a5d6a7'
  },
  {
    id: 'fertilizers',
    path: '/category/fertilizers',
    tag: '🌿 New Arrivals',
    headline: 'Premium Fertilizers In Stock',
    sub: 'Boost your yield with the best NPK & organic blends',
    icon: '🌿',
    accentColor: '#80cbc4'
  },
  {
    id: 'seeds',
    path: '/category/seeds',
    tag: '🌱 Seed Season',
    headline: 'Hybrid Seeds at Best Prices',
    sub: 'Cotton, Paddy, Chilli, Tomato & more certified varieties',
    icon: '🌱',
    accentColor: '#ffcc80'
  },
]

const brandEmojis = {
  'Bayer':       '🔬',  // pharma/science leader
  'Syngenta':    '🌸',  // crop science & flowers
  'BASF':        '⚗️',  // chemical giant
  'Coromandel':  '🌾',  // fertilizer / grain
  'UPL':         '🧫',  // bioscience / agri solutions
  'Rallis':      '🪴',  // plant growth / nursery
  'Dhanuka':     '🚁',  // precision crop protection (aerial)
  'Parijat':     '🌺',  // named after parijat flower
  'Godrej':      '🏡',  // household / agri consumer brand
  'PI':          '🔭',  // research-driven agriscience
  'FMC':         '🛡️',  // crop protection
  'Dupont':      '💎',  // innovation / premium
  'IFFCO':       '⚖️',  // cooperative / balanced nutrition
  'Multiplex':   '🌿',  // micronutrients / plant health
  'Sumitomo':    '🌊',  // japanese agri brand
  'Dow':         '🧬',  // biotech
}

function Toast({ message, visible }) {
  return <div className={`toast ${visible ? 'show' : ''}`}>✅ {message}</div>
}

function UserMenu({ navigate, user }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const menuItems = user ? [
    { icon: '🛡️', label: 'Admin Panel', action: () => navigate('/admin') },
    { icon: '📦', label: 'My Orders', action: () => navigate('/orders') },
    { icon: '🎧', label: 'Support', action: () => navigate('/support') },
    { icon: 'ℹ️', label: 'About Us', action: () => navigate('/about') },
    { icon: '🚪', label: 'Sign Out', action: handleSignOut },
  ] : [
    { icon: '🔑', label: 'Login / Register', action: () => navigate('/login') },
    { icon: '🛡️', label: 'Admin Panel', action: () => navigate('/admin') },
    { icon: '🎧', label: 'Support', action: () => navigate('/support') },
    { icon: '📦', label: 'My Orders', action: () => navigate('/orders') },
    { icon: 'ℹ️', label: 'About Us', action: () => navigate('/about') },
  ]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="cart-btn"
        aria-label="Menu"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          color: 'white',
          padding: '5px 8px',
          borderRadius: '20px',
          background: open ? 'rgba(255,255,255,0.15)' : 'transparent',
          transition: 'background 0.2s',
        }}
      >
        {/* Person icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
        {/* Chevron arrow */}
        <svg
          width="12" height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div className="user-menu-dropdown">
          {user && (
            <div className="user-menu-header" style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', background: '#f9f9f9' }}>
              <div style={{ fontSize: '11px', color: 'var(--green-primary)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Welcome</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)' }}>
                {user.email?.split('@')[0]}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-light)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '2px' }}>
                {user.email}
              </div>
            </div>
          )}
          {menuItems.map((item) => (
            <button key={item.label} className="user-menu-item" onClick={() => { item.action(); setOpen(false) }}>
              <span className="user-menu-icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ProductCard({ product, handleAdd }) {
  const originalPrice = Math.round(product.price * 1.3) // Fake original price for UI
  const disc = Math.round(100 - (product.price / originalPrice) * 100)

  return (
    <div className="product-card">
      <div className="product-emoji-wrap" style={{ padding: product.image_url ? 0 : 20 }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
        ) : (
          <span>📦</span>
        )}
      </div>
      <div className="product-brand">{product.brand || product.categories?.name || 'AgroDeals'}</div>
      <div className="product-name">{product.name}</div>
      {product.quantity && (
        <div style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '8px', fontWeight: '500' }}>
          🧪 Size: <strong>{product.quantity}</strong>
        </div>
      )}
      <div className="product-prices">
        <span className="price-original">₹{originalPrice}</span>
        <span className="price-sale">₹{product.price}</span>
        {disc > 0 && <span className="discount-badge">{disc}% OFF</span>}
      </div>
      <button className="btn-add-to-bag" onClick={() => handleAdd({ ...product, originalPrice })}>
        ADD TO BAG
      </button>
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()
  const { cartItems, addToCart } = useCart()
  const [slide, setSlide] = useState(0)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState({ msg: '', visible: false })
  const headerRef = useRef(null)
  const [headerH, setHeaderH] = useState(120)
  const [user, setUser] = useState(null)

  const [products, setProducts] = useState([])
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [deferredPrompt, setDeferredPrompt] = useState(window.deferredPrompt || null)
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false)
  const [showInstallGuide, setShowInstallGuide] = useState(false)

  const cartItemCount = cartItems.reduce((n, i) => n + i.quantity, 0)

  useEffect(() => {
    if (headerRef.current) setHeaderH(headerRef.current.offsetHeight)
    fetchProducts()

    // Auth: get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('App - Initial Auth Session:', session)
      setUser(session?.user ?? null)
    })

    // Auth: listen for sign in/out changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      console.log('App - Auth State Change event:', _event, 'User:', currentUser)
      setUser(currentUser)
    })

    // PWA: Before install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      console.log('PWA installation prompt available locally')
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // PWA: Custom listener for globally captured prompt (due to late mounting)
    const handleGlobalPromptAvailable = () => {
      console.log('PWA installation prompt available globally')
      setDeferredPrompt(window.deferredPrompt)
    }
    window.addEventListener('pwa-prompt-available', handleGlobalPromptAvailable)

    // Push notification auto trigger
    if ('Notification' in window && Notification.permission === 'default') {
      const alreadyPrompted = localStorage.getItem('agrodeals-notification-prompted')
      if (!alreadyPrompted) {
        const timer = setTimeout(() => {
          setShowNotificationPrompt(true)
        }, 3000)
        return () => {
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
          window.removeEventListener('pwa-prompt-available', handleGlobalPromptAvailable)
          listener.subscription.unsubscribe()
          clearTimeout(timer)
        }
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('pwa-prompt-available', handleGlobalPromptAvailable)
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % heroSlides.length), 3500)
    return () => clearInterval(t)
  }, [])

  async function fetchProducts() {
    const { data } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (data) setProducts(data)
  }

  const showToast = (name) => {
    setToast({ msg: `${name} added to cart!`, visible: true })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000)
  }

  const handleAdd = (product) => {
    addToCart(product)
    showToast(product.name.split(',')[0])
  }

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.deferredPrompt
    if (promptEvent) {
      promptEvent.prompt()
      const { outcome } = await promptEvent.userChoice
      console.log(`PWA install prompt choice: ${outcome}`)
      setDeferredPrompt(null)
      window.deferredPrompt = null
    } else {
      setShowInstallGuide(true)
    }
  }

  const handleRequestNotification = async () => {
    setShowNotificationPrompt(false)
    localStorage.setItem('agrodeals-notification-prompted', 'true')
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        new Notification('AgroDeals', {
          body: '🌱 Welcome to AgroDeals! Notifications enabled successfully.',
          icon: '/logo.png'
        })
      }
    }
  }

  const activeBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean))).map(name => ({
    name,
    emoji: brandEmojis[name] || '🏷️'
  }))

  const filteredProducts = products.filter((product) => {
    const matchesSearch = !search || 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(search.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(search.toLowerCase()))

    const matchesBrand = !selectedBrand || product.brand === selectedBrand

    return matchesSearch && matchesBrand
  })

  const curr = heroSlides[slide]

  return (
    <div className="app-shell">
      <header className="header" ref={headerRef}>
        <div className="header-top">
          <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.png" alt="AgroDeals Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1.5px solid rgba(255,255,255,0.2)' }} />
            AGRO<span>DEALS</span>
          </div>
          <div className="header-actions">
            <button 
              className="install-header-btn" 
              onClick={handleInstallClick} 
              aria-label="Install App"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: 'rgba(255,255,255,0.12)', 
                border: 'none', 
                borderRadius: '20px', 
                padding: '6px 12px', 
                fontSize: '11px', 
                fontWeight: '700', 
                color: 'white', 
                cursor: 'pointer',
                transition: 'background 0.2s',
                marginRight: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              title="Install App"
            >
              <span>Install App</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            <Link to="/cart" className="cart-btn" aria-label="Cart">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
            </Link>
            <UserMenu navigate={navigate} user={user} />
          </div>
        </div>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input placeholder="Search for products and brands" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </header>

      <main className="page-content" style={{ paddingTop: headerH + 8 }}>
        <div className="category-tabs">
          {categories.map((cat) => (
            <div key={cat.id} className="cat-tab" onClick={() => navigate(cat.path)}>
              <div className={`cat-tab-icon cat-tab-icon--${cat.id}`}>
                <span className="cat-tab-emoji">{cat.emoji}</span>
              </div>
              <span className="cat-tab-label">{cat.label}</span>
            </div>
          ))}
        </div>

        <div className="hero-slider">
          <div className="hero-slide" style={{
            background: curr.id === 'pesticides'
              ? 'linear-gradient(135deg, #1a3a2a 0%, #2d7a4f 40%, #1b5e20 70%, #0a2e1a 100%)'
              : curr.id === 'fertilizers'
              ? 'linear-gradient(135deg, #004d40 0%, #00695c 40%, #00897b 70%, #00796b 100%)'
              : 'linear-gradient(135deg, #2e1a00 0%, #5d3a00 40%, #bf6f00 70%, #e65100 100%)'
          }}>
            <div className="hero-slide-inner">
              <div className="hero-slide-content">
                <div className="hero-slide-tag">{curr.tag}</div>
                <h2 className="hero-slide-headline">{curr.headline}</h2>
                <p className="hero-slide-sub">{curr.sub}</p>
                <button className="hero-btn" onClick={() => navigate(curr.path)}
                  style={{ backgroundColor: curr.accentColor, color: '#1a2e22' }}
                >
                  Shop Now →
                </button>
              </div>
              <div className="hero-slide-bg-icon">{curr.icon}</div>
            </div>
            <div className="hero-slide-pattern" />
          </div>
          <div className="slide-dots">
            {heroSlides.map((_, i) => <div key={i} className={`dot ${i === slide ? 'active' : ''}`} onClick={() => setSlide(i)} />)}
          </div>
        </div>

        <div className="section" style={{ background: 'white', margin: '0 0 4px' }}>
          <div className="section-header">
            <div className="section-title">
              {selectedBrand ? `🌾 ${selectedBrand} Products` : '📈 New Arrivals'}
            </div>
          </div>
          
          {filteredProducts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#888', background: '#f9f9f9', borderRadius: '10px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
              No products found matching your selection.
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} handleAdd={handleAdd} />
              ))}
            </div>
          )}
        </div>

        {activeBrands.length > 0 && (
          <div className="section">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="section-title">🏷️ Shop by Brand</div>
              {selectedBrand && (
                <span 
                  className="see-all" 
                  onClick={() => setSelectedBrand(null)}
                  style={{ cursor: 'pointer', color: '#e53935', fontSize: '12.5px', fontWeight: 'bold' }}
                >
                  Clear Filter ✕
                </span>
              )}
            </div>
            <div className="brands-scroll">
              {activeBrands.map((b) => {
                const isActive = selectedBrand === b.name
                return (
                  <div 
                    key={b.name} 
                    className={`brand-card ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedBrand(isActive ? null : b.name)}
                    style={{
                      border: isActive ? '2px solid var(--green-primary)' : '1px solid var(--border)',
                      background: isActive ? '#e8f5e9' : 'white',
                      color: isActive ? 'var(--green-primary)' : 'inherit',
                      fontWeight: isActive ? 'bold' : 'normal',
                      padding: '14px 10px',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                  >
                    <div className="brand-emoji-wrap">{b.emoji}</div>
                    <span className="brand-name" style={{ color: isActive ? 'var(--green-primary)' : 'var(--text-mid)' }}>{b.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </main>

      <Footer />

      <BottomNav />

      <Toast message={toast.msg} visible={toast.visible} />

      {showNotificationPrompt && (
        <div className="notification-prompt-overlay">
          <div className="notification-prompt-card">
            <div className="notification-prompt-icon">🔔</div>
            <h3>Enable Notifications?</h3>
            <p>Get instant alerts on premium fertilizer discounts, hybrid seed arrivals, and pesticide flash sales!</p>
            <div className="notification-prompt-actions">
              <button className="btn-secondary" onClick={() => {
                setShowNotificationPrompt(false)
                localStorage.setItem('agrodeals-notification-prompted', 'true')
              }}>Later</button>
              <button className="btn-primary" onClick={handleRequestNotification}>Enable</button>
            </div>
          </div>
        </div>
      )}

      {showInstallGuide && (
        <div className="notification-prompt-overlay" onClick={() => setShowInstallGuide(false)}>
          <div className="notification-prompt-card" onClick={(e) => e.stopPropagation()}>
            <div className="notification-prompt-icon">📱</div>
            <h3>Install AgroDeals App</h3>
            <p style={{ textAlign: 'left', margin: '14px 0', fontSize: '13.5px', lineHeight: '1.6', color: 'var(--text-mid)' }}>
              <strong>For Android / Chrome:</strong><br />
              Tap the browser menu <span style={{ fontSize: '15px' }}>⋮</span> and select <strong>Install app</strong> or <strong>Add to Home screen</strong>.<br /><br />
              <strong>For iPhone / iPad (Safari):</strong><br />
              1. Tap the Share button <span style={{ fontSize: '16px' }}>📤</span> at the bottom of Safari.<br />
              2. Scroll down and choose <strong>Add to Home Screen</strong>.
            </p>
            <div className="notification-prompt-actions">
              <button className="btn-primary" onClick={() => setShowInstallGuide(false)}>Got It</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
