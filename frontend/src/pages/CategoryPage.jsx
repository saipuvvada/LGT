import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'

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

        {/* 3D Category Banner */}
        <div className={`category-3d-banner category-3d-banner--${slug}`}>
          <div className="category-3d-banner-mesh" />
          <span className="category-3d-banner-icon">{meta.emoji}</span>
          <div className="category-3d-banner-title">{meta.label}</div>
          <div className="category-3d-banner-sub">{meta.desc}</div>
          <div className="category-3d-banner-count">
            ✨ {loading ? '...' : `${sortedProducts.length} Products Available`}
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
                const inStock = product.stock > 0;
                const allowProcure = product.allow_dealer_procurement !== false;
                const isAvailable = inStock || allowProcure;

                return (
                  <div key={product.id} className="product-card" style={{ position: 'relative' }}>
                    <Link
                      to={`/product/${product.id}`}
                      style={{ position: 'absolute', inset: 0, zIndex: 1, borderRadius: '18px' }}
                      aria-label={`View ${product.name} details`}
                    />
                    <div className="product-emoji-wrap" style={{ padding: product.image_url ? 0 : 20 }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                      ) : (
                        <span>📦</span>
                      )}
                    </div>
                    <div className="product-brand">{product.brand || product.categories?.name || 'AgroDeals'}</div>
                    
                    {inStock ? (
                      <div className="stock-badge stock-badge--instock">🟢 In Stock</div>
                    ) : allowProcure ? (
                      <div className="stock-badge stock-badge--partner">🤝 Available on Order</div>
                    ) : (
                      <div className="stock-badge stock-badge--outofstock">🚫 Out of Stock</div>
                    )}

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
                    <button 
                      className="btn-add-to-bag" 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAdd(product) }}
                      disabled={!isAvailable}
                      style={{ position: 'relative', zIndex: 2 }}
                    >
                      {isAvailable ? 'ADD TO BAG' : 'OUT OF STOCK'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </main>

      {/* BOTTOM NAV */}
      <BottomNav />

      {/* Toast */}
      <div className={`toast ${toast.visible ? 'show' : ''}`}>✅ {toast.msg}</div>
    </div>
  )
}
