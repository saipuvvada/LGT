import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, cartItems } = useCart()

  const [product, setProduct] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const [toast, setToast] = useState({ msg: '', visible: false })

  const cartCount = cartItems.reduce((n, i) => n + i.quantity, 0)

  useEffect(() => {
    setQty(1)
    setAdded(false)
    setDescExpanded(false)
    fetchProduct()
  }, [id])

  async function fetchProduct() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(id, name, slug)')
      .eq('id', id)
      .single()

    if (error || !data) {
      setLoading(false)
      return
    }

    setProduct(data)

    // Fetch similar products from same category
    if (data.category_id) {
      const { data: sim } = await supabase
        .from('products')
        .select('id, name, price, image_url, brand, stock, allow_dealer_procurement')
        .eq('category_id', data.category_id)
        .eq('is_active', true)
        .neq('id', id)
        .limit(8)

      setSimilar(sim || [])
    }
    setLoading(false)
  }

  function showToast(msg) {
    setToast({ msg, visible: true })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000)
  }

  function handleAdd() {
    if (!product) return
    addToCart({ ...product, originalPrice, quantity: qty })
    setAdded(true)
    showToast(`${product.name.split(',')[0]} added!`)
    setTimeout(() => setAdded(false), 2500)
  }

  if (loading) {
    return (
      <div className="pd-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', animation: 'floatSlow 2s ease-in-out infinite', marginBottom: '12px' }}>🌿</div>
          <p style={{ color: 'var(--text-light)', fontSize: '14px', fontWeight: 600 }}>Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="pd-shell" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
        <div style={{ fontSize: '56px' }}>😔</div>
        <h2 style={{ fontWeight: 800 }}>Product not found</h2>
        <button className="btn-shop-now" onClick={() => navigate('/')}>Go to Shop</button>
      </div>
    )
  }

  const originalPrice = Math.round(product.price * 1.3)
  const discount = Math.round(100 - (product.price / originalPrice) * 100)
  const savings = originalPrice - product.price
  const totalPrice = (product.price * qty).toFixed(2)

  const inStock = product.stock > 0
  const allowProcure = product.allow_dealer_procurement !== false
  const isAvailable = inStock || allowProcure

  // Static rating (placeholder)
  const rating = 4.2
  const reviewCount = Math.floor(Math.random() * 200) + 50

  // Build specs from available fields
  const specs = [
    product.brand        && ['Brand', product.brand],
    product.categories   && ['Category', product.categories.name],
    product.quantity     && ['Pack Size', product.quantity],
    product.description  && ['Description', null], // handled separately
    product.gst_rate     && ['GST Rate', `${product.gst_rate}%`],
    inStock              ? ['Stock Status', `${product.stock} units available`] : ['Availability', 'On Order'],
  ].filter(Boolean)

  const desc = product.description || `${product.name} is a premium agricultural product. Apply as directed by your agronomist. For best results, follow the recommended dosage and safety guidelines. Store in a cool, dry place away from direct sunlight.`

  return (
    <div className="pd-shell">
      {/* Header */}
      <header className="pd-header">
        <button className="pd-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span className="pd-header-title">{product.categories?.name || 'Product'}</span>
        <Link to="/cart" className="pd-header-cart" aria-label="Cart">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          {cartCount > 0 && (
            <span className="cart-badge" style={{ top: '-4px', right: '-4px', fontSize: '9px', width: '16px', height: '16px' }}>
              {cartCount}
            </span>
          )}
        </Link>
      </header>

      {/* Product Image */}
      <div className="pd-image-section">
        <div className="pd-image-wrapper">
          {discount > 0 && (
            <div className="pd-discount-tag">-{discount}% OFF</div>
          )}
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="pd-product-image" />
          ) : (
            <span className="pd-no-image">📦</span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="pd-info">
        <div className="pd-brand-row">
          <span className="pd-brand">{product.brand || product.categories?.name || 'AgroDeals'}</span>
          <span className={`pd-stock-badge ${inStock ? 'instock' : allowProcure ? 'onorder' : 'outofstock'}`}>
            {inStock ? '🟢 In Stock' : allowProcure ? '🤝 On Order' : '🚫 Out of Stock'}
          </span>
        </div>

        <h1 className="pd-name">{product.name}</h1>

        {/* Star Rating */}
        <div className="pd-rating-row">
          <span className="pd-stars">{'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}</span>
          <span className="pd-rating-val">{rating}</span>
          <span className="pd-rating-count">({reviewCount} farmers rated)</span>
        </div>

        {/* Price Block */}
        <div className="pd-price-block">
          <div className="pd-prices">
            <span className="pd-price-sale">₹{product.price}</span>
            <span className="pd-price-original">₹{originalPrice}</span>
          </div>
          {discount > 0 && (
            <div className="pd-savings">💚 You save ₹{savings} ({discount}% OFF)</div>
          )}
          <div className="pd-gst-note">🏷️ Price inclusive of all taxes (GST)</div>
        </div>

        {/* Quantity Selector */}
        <div className="pd-qty-row">
          <span className="pd-qty-label">Quantity:</span>
          <div className="pd-qty-controls">
            <button className="pd-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}>−</button>
            <span className="pd-qty-val">{qty}</span>
            <button className="pd-qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
          </div>
          {qty > 1 && (
            <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: 600 }}>
              Total: <strong style={{ color: 'var(--text-dark)' }}>₹{totalPrice}</strong>
            </span>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="pd-cta-row">
          <button
            className="pd-btn-add"
            onClick={handleAdd}
            disabled={!isAvailable}
          >
            {added ? (
              <><span>✅</span> Added to Bag!</>
            ) : isAvailable ? (
              <><span>🛒</span> Add to Bag — ₹{totalPrice}</>
            ) : (
              '🚫 Out of Stock'
            )}
          </button>
          <Link to="/consult" className="pd-btn-consult">
            <span>🌱</span> Ask Dr. Agro — Free Expert Advice
          </Link>
        </div>

        {/* Delivery Info */}
        <div className="pd-delivery-card">
          <div className="pd-delivery-title">
            <span>📦</span> Delivery Information
          </div>
          <div className="pd-delivery-item"><span className="pd-delivery-check">✓</span> Cash on Delivery (COD) available</div>
          <div className="pd-delivery-item"><span className="pd-delivery-check">✓</span> Ships from Karempudi, Andhra Pradesh</div>
          <div className="pd-delivery-item"><span className="pd-delivery-check">✓</span> Expected delivery: 3–5 working days</div>
          <div className="pd-delivery-item"><span className="pd-delivery-check">✓</span> Free consultation on dosage & application</div>
        </div>
      </div>

      {/* Description */}
      <div className="pd-section">
        <div className="pd-section-title">
          <span>📖</span> Product Description
        </div>
        <p className="pd-description" style={{
          display: '-webkit-box',
          WebkitLineClamp: descExpanded ? 'unset' : 3,
          WebkitBoxOrient: 'vertical',
          overflow: descExpanded ? 'visible' : 'hidden'
        }}>
          {desc}
        </p>
        {desc.length > 120 && (
          <button className="pd-show-more-btn" onClick={() => setDescExpanded(v => !v)}>
            {descExpanded ? '▲ Show Less' : '▼ Read More'}
          </button>
        )}
      </div>

      {/* Specifications */}
      <div className="pd-section">
        <div className="pd-section-title">
          <span>📋</span> Key Specifications
        </div>
        <table className="pd-specs-table">
          <tbody>
            {specs.map(([key, val]) => val && (
              <tr key={key}>
                <td>{key}</td>
                <td>{val}</td>
              </tr>
            ))}
            <tr>
              <td>Payment</td>
              <td>Cash on Delivery (COD)</td>
            </tr>
            <tr>
              <td>Warranty</td>
              <td>Manufacturer Guarantee on Sealed Products</td>
            </tr>
            <tr>
              <td>Sold By</td>
              <td>Lakshmi Ganapathi Traders, Karempudi</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Safety */}
      <div className="pd-section">
        <div className="pd-section-title">
          <span>⚠️</span> Safety & Usage Instructions
        </div>
        <div className="pd-safety-card">
          <span className="pd-safety-icon">🛡️</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px' }}>Important Safety Precautions:</strong>
            Wear protective gloves, safety goggles, and a face mask during application. Never spray against wind direction.
            Keep out of reach of children and livestock. Store in original container in a cool, dry place.
            Wash hands thoroughly with soap and water after handling. Consult Dr. Agro (our AI consultant) for exact dosage guidance for your crop and land size.
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similar.length > 0 && (
        <div className="pd-similar-section">
          <div className="pd-section-title">
            <span>🌿</span> Similar Products You May Like
          </div>
          <div className="pd-similar-scroll">
            {similar.map((sim) => {
              const simOriginal = Math.round(sim.price * 1.3)
              const simDisc = Math.round(100 - (sim.price / simOriginal) * 100)
              return (
                <Link key={sim.id} to={`/product/${sim.id}`} className="pd-similar-card">
                  <div className="pd-similar-img-wrap">
                    {sim.image_url ? (
                      <img src={sim.image_url} alt={sim.name} />
                    ) : (
                      <span>📦</span>
                    )}
                  </div>
                  <div className="pd-similar-name">{sim.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                    <span className="pd-similar-price">₹{sim.price}</span>
                    {simDisc > 0 && (
                      <span style={{ fontSize: '10px', fontWeight: 700, background: '#ecfdf5', color: 'var(--green-primary)', padding: '1px 5px', borderRadius: '4px' }}>
                        {simDisc}% OFF
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Cross-sell: Consult Banner */}
      <div className="pd-section" style={{ marginBottom: '80px' }}>
        <div style={{
          background: 'linear-gradient(135deg, hsl(150,40%,7%) 0%, hsl(147,50%,20%) 100%)',
          borderRadius: '16px',
          padding: '20px',
          color: 'white',
          display: 'flex',
          gap: '14px',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '40px', animation: 'floatSlow 3s ease-in-out infinite', display: 'block' }}>👨‍🌾</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '4px' }}>Not sure about dosage?</div>
            <div style={{ fontSize: '12.5px', opacity: 0.8, marginBottom: '12px', lineHeight: 1.4 }}>
              Ask Dr. Agro — our free AI agronomist. Get personalized crop advice in seconds.
            </div>
            <Link to="/consult" style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              borderRadius: '20px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(8px)',
              transition: 'background 0.2s'
            }}>
              🌱 Consult Now — Free
            </Link>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar (mobile) */}
      <div className="pd-sticky-bar">
        <div className="pd-sticky-price-block">
          <div className="pd-sticky-price-label">Total Price</div>
          <div className="pd-sticky-price-val">₹{totalPrice}</div>
        </div>
        <button
          className="pd-sticky-add-btn"
          onClick={handleAdd}
          disabled={!isAvailable}
        >
          {added ? '✅ Added!' : isAvailable ? '🛒 Add to Bag' : '🚫 Unavailable'}
        </button>
      </div>

      {/* Toast */}
      <div className={`toast ${toast.visible ? 'show' : ''}`}>✅ {toast.msg}</div>
    </div>
  )
}
