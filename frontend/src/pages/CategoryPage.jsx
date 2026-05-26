import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

const categoryMeta = {
  pesticides: { label: 'Pesticides', emoji: '🧴', desc: 'Insecticides, Fungicides, Herbicides & more' },
  fertilizers: { label: 'Fertilizers', emoji: '🌿', desc: 'NPK, Micronutrients, Organic & more' },
  seeds: { label: 'Seeds', emoji: '🌱', desc: 'Hybrid & certified seeds for all crops' },
}

export default function CategoryPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart, cartItems } = useCart()
  const [sort, setSort] = useState('popular')
  const [toast, setToast] = useState({ msg: '', visible: false })
  
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const meta = categoryMeta[slug] || { label: slug, emoji: '🛒', desc: '' }
  const cartItemCount = cartItems.reduce((n, i) => n + i.quantity, 0)

  useEffect(() => {
    fetchCategoryProducts()
  }, [slug])

  async function fetchCategoryProducts() {
    setLoading(true)
    
    // First, find the category ID for this slug
    const { data: catData } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single()

    if (catData) {
      // Fetch products for this category
      const { data: prodData } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('category_id', catData.id)
        .eq('is_active', true)
      
      if (prodData) {
        // Add fake original price for UI
        const mappedData = prodData.map(p => ({
          ...p,
          originalPrice: Math.round(p.price * 1.3)
        }))
        setProducts(mappedData)
      }
    } else {
      setProducts([])
    }
    setLoading(false)
  }

  const sortedProducts = useMemo(() => {
    let arr = [...products]
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      arr = arr.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q)
      )
    }
    if (sort === 'price-asc') arr.sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') arr.sort((a, b) => b.price - a.price)
    else if (sort === 'discount') arr.sort((a, b) => (b.originalPrice - b.price) - (a.originalPrice - a.price))
    return arr
  }, [products, sort, searchQuery])

  const showToast = (name) => {
    setToast({ msg: `${name} added to cart!`, visible: true })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000)
  }

  const handleAdd = (product) => {
    addToCart(product)
    showToast(product.name.split(',')[0])
  }

  return (
    <div className="app-shell">
      {/* HEADER */}
      <header className="header">
        <div className="header-top">
          <div className="logo">AGRO<span>DEALS</span></div>
          <div className="header-actions">
            <Link to="/cart" className="cart-btn" aria-label="Cart">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
            </Link>
          </div>
        </div>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            placeholder={`Search in ${meta.label}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <main className="page-content">

        {/* Page Title */}
        <div className="category-page-header">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <div>
            <div className="category-page-title">{meta.emoji} {meta.label}</div>
            <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 2 }}>{meta.desc}</div>
          </div>
        </div>

        {/* Sort / Filter chips */}
        <div className="filter-row">
          {[
            { key: 'popular', label: '⭐ Popular' },
            { key: 'discount', label: '🏷️ Best Discount' },
            { key: 'price-asc', label: '↑ Price: Low–High' },
            { key: 'price-desc', label: '↓ Price: High–Low' },
          ].map((opt) => (
            <button
              key={opt.key}
              className={`filter-chip ${sort === opt.key ? 'active' : ''}`}
              onClick={() => setSort(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Product count */}
        <div style={{ padding: '0 16px 12px', fontSize: 13, color: 'var(--text-light)' }}>
          {loading ? 'Loading...' : `${sortedProducts.length} products found`}
        </div>

        {/* Products Grid */}
        {!loading && sortedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🚧</div>
            <h3 style={{ marginBottom: 8 }}>Empty Category</h3>
            <p style={{ color: 'var(--text-light)' }}>
              No products available here yet. Add some via the Admin panel!
            </p>
            <button className="btn-shop-now" onClick={() => navigate('/')} style={{ marginTop: 20 }}>
              Back to Home
            </button>
          </div>
        ) : (
          <div className="section" style={{ paddingTop: 0 }}>
            <div className="products-grid">
              {sortedProducts.map((product) => {
                const disc = Math.round(100 - (product.price / product.originalPrice) * 100)
                return (
                  <div key={product.id} className="product-card">
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
                      <span className="price-original">₹{product.originalPrice}</span>
                      <span className="price-sale">₹{product.price}</span>
                      {disc > 0 && <span className="discount-badge">{disc}% OFF</span>}
                    </div>
                    <select className="select-item-dropdown" defaultValue="">
                      <option value="" disabled>Select item</option>
                      <option value="1">1 Unit</option>
                      <option value="2">2 Units</option>
                      <option value="5">5 Units</option>
                    </select>
                    <button className="btn-add-to-bag" onClick={() => handleAdd(product)}>
                      ADD TO BAG
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </main>

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

      {/* Toast */}
      <div className={`toast ${toast.visible ? 'show' : ''}`}>✅ {toast.msg}</div>
    </div>
  )
}
