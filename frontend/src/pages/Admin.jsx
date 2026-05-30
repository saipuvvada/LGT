import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

function Admin() {
  const [products, setProducts]       = useState([])
  const [categories, setCategories]   = useState([])
  const [passcode, setPasscode]       = useState('')
  const [isAuthorized, setIsAuthorized] = useState(
    () => sessionStorage.getItem('admin_auth') === 'true'
  )
  const [authError, setAuthError]     = useState('')

  // ── Add-product form state ─────────────────────────────────────
  const [name, setName]           = useState('')
  const [brand, setBrand]         = useState('')
  const [price, setPrice]         = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [hsnCode, setHsnCode]     = useState('')
  const [quantity, setQuantity]   = useState('')
  const [gstRate, setGstRate]     = useState('18')
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [stock, setStock]         = useState('0')
  const [allowDealerProcurement, setAllowDealerProcurement] = useState(true)

  // ── Inline-edit state  (keyed by product id) ──────────────────
  const [editingId, setEditingId]     = useState(null)
  const [editFields, setEditFields]   = useState({})
  const [editSaving, setEditSaving]   = useState(false)

  // ── Search filter state ────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')

  // ── Multi-tab & Orders / Customers state ───────────────────
  const [activeTab, setActiveTab]     = useState('products')
  const [orders, setOrders]           = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [customers, setCustomers]     = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')

  // Auto-lock when admin navigates away (component unmounts)
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('admin_auth')
    }
  }, [])

  useEffect(() => {
    if (isAuthorized) {
      if (activeTab === 'products') {
        fetchCategories()
        fetchProducts()
      } else if (activeTab === 'orders') {
        fetchOrders()
      } else if (activeTab === 'customers') {
        fetchCustomers()
      }
    }
  }, [isAuthorized, activeTab])

  async function fetchOrders() {
    setLoadingOrders(true)
    const { data, error } = await supabase
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
            price
          )
        )
      `)
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setOrders(data)
    } else if (error) {
      console.error('Error fetching orders:', error)
    }
    setLoadingOrders(false)
  }

  async function fetchCustomers() {
    setLoadingCustomers(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setCustomers(data)
    } else if (error) {
      console.error('Error fetching customers:', error)
    }
    setLoadingCustomers(false)
  }

  async function updateOrderStatus(orderId, newStatus) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()
    
    if (error) {
      alert('❌ Error updating status: ' + error.message)
    } else if (!data || data.length === 0) {
      alert('⚠️ Order status could not be updated. This usually happens if your Supabase account is not logged in as an Administrator, or if the RLS policies are not executed yet on your database.')
    } else {
      alert(`✅ Order status successfully updated to "${newStatus.replace('_', ' ')}"!`)
      fetchOrders()
    }
  }

  async function toggleAdminStatus(profileId, currentIsAdmin) {
    if (!window.confirm(`Are you sure you want to ${currentIsAdmin ? 'remove' : 'grant'} Admin privileges for this user?`)) return
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !currentIsAdmin })
      .eq('id', profileId)
    
    if (error) {
      alert('Error toggling admin status: ' + error.message)
    } else {
      fetchCustomers()
    }
  }

  // ── Auth ───────────────────────────────────────────────────────
  function handleAuth(e) {
    e.preventDefault()
    if (passcode === '9160') {
      setIsAuthorized(true)
      sessionStorage.setItem('admin_auth', 'true')
      setAuthError('')
    } else {
      setAuthError('❌ Invalid Admin Passcode!')
    }
  }

  // ── Data fetching ──────────────────────────────────────────────
  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*')
    if (data) {
      // Exclude Tools & Equipment category from admin dropdown
      setCategories(data.filter(c => !c.slug?.toLowerCase().includes('tool') && !c.name?.toLowerCase().includes('tool')))
    }
  }

  async function seedCategories() {
    const defaultCategories = [
      { name: 'Pesticides',  slug: 'pesticides',  description: 'Insecticides, Fungicides, Herbicides' },
      { name: 'Fertilizers', slug: 'fertilizers', description: 'NPK, Micronutrients, Organic' },
      { name: 'Seeds',       slug: 'seeds',       description: 'Hybrid & certified seeds' },
    ]
    const { error } = await supabase.from('categories').insert(defaultCategories)
    if (error) alert(error.message)
    else fetchCategories()
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (!error) setProducts(data)
  }

  // ── Add product ────────────────────────────────────────────────
  async function addProduct(e) {
    e.preventDefault()
    if (!name || !price) return alert('Name and price are required')
    setUploading(true)
    let image_url = null

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('product-images').upload(fileName, imageFile)
      if (uploadError) { alert('Error uploading image: ' + uploadError.message); setUploading(false); return }
      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
      image_url = data.publicUrl
    }

    const { error } = await supabase.from('products').insert([{
      name,
      brand: brand || null,
      price: parseFloat(price),
      category_id: categoryId || null,
      image_url,
      hsn_code: hsnCode || null,
      quantity: quantity || null,
      gst_rate: gstRate ? parseInt(gstRate) : 18,
      stock: stock ? parseInt(stock) : 0,
      allow_dealer_procurement: allowDealerProcurement,
    }])

    setUploading(false)
    if (error) { alert(error.message) }
    else {
      alert('✅ Product Added!')
      setName(''); setBrand(''); setPrice(''); setCategoryId('')
      setHsnCode(''); setQuantity(''); setGstRate('18'); setImageFile(null)
      setStock('0'); setAllowDealerProcurement(true)
      e.target.reset()
      fetchProducts()
    }
  }

  // ── Archive (soft-delete) ──────────────────────────────────────
  async function archiveProduct(id) {
    if (!window.confirm('Remove this product from the store?')) return
    const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id)
    if (!error) fetchProducts()
    else alert(error.message)
  }

  // ── Inline edit helpers ────────────────────────────────────────
  function startEdit(product) {
    setEditingId(product.id)
    setEditFields({
      name:        product.name,
      brand:       product.brand       || '',
      price:       product.price,
      hsn_code:    product.hsn_code    || '',
      quantity:    product.quantity    || '',
      gst_rate:    product.gst_rate    ?? 18,
      category_id: product.category_id || '',
      stock:       product.stock       ?? 0,
      allow_dealer_procurement: product.allow_dealer_procurement !== false,
    })
  }
  function cancelEdit() { setEditingId(null); setEditFields({}) }

  async function saveEdit(id) {
    setEditSaving(true)
    const { error } = await supabase.from('products').update({
      name:        editFields.name,
      brand:       editFields.brand       || null,
      price:       parseFloat(editFields.price),
      hsn_code:    editFields.hsn_code    || null,
      quantity:    editFields.quantity    || null,
      gst_rate:    parseInt(editFields.gst_rate),
      category_id: editFields.category_id || null,
      stock:       editFields.stock ? parseInt(editFields.stock) : 0,
      allow_dealer_procurement: editFields.allow_dealer_procurement,
    }).eq('id', id)
    setEditSaving(false)
    if (error) { alert(error.message) }
    else { cancelEdit(); fetchProducts() }
  }

  // ─────────────────────────────────────────────────────────────
  // Auth gate
  // ─────────────────────────────────────────────────────────────
  if (!isAuthorized) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg,#1a2e22 0%,#111e16 100%)',
        fontFamily: 'Inter,sans-serif', padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)', padding: '40px 32px',
          borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.37)',
          maxWidth: '400px', width: '100%', textAlign: 'center', color: 'white'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.5px' }}>Admin Portal Locked</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
            Please enter your master passcode to access the management panel.
          </p>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="password" placeholder="Enter Admin Passcode"
              value={passcode} onChange={(e) => setPasscode(e.target.value)}
              style={{ width:'100%', padding:'12px 16px', borderRadius:'8px',
                border:'1px solid rgba(255,255,255,0.2)', background:'rgba(0,0,0,0.2)',
                color:'white', fontSize:'16px', outline:'none',
                textAlign:'center', letterSpacing: passcode ? '4px' : 'normal' }}
              autoFocus
            />
            {authError && <div style={{ fontSize:'13px', color:'#ff6b6b', fontWeight:'bold' }}>{authError}</div>}
            <button type="submit" style={{
              padding:'12px', background:'#2d7a4f', color:'white',
              border:'none', borderRadius:'8px', cursor:'pointer',
              fontWeight:'bold', fontSize:'16px', transition:'background 0.2s'
            }}>
              Unlock Dashboard
            </button>
          </form>
          <div style={{ marginTop: '24px' }}>
            <Link to="/" style={{ color:'#6fcf7c', textDecoration:'none', fontSize:'14px', fontWeight:'bold' }}>
              ← Return to Store
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // Main admin UI
  // ─────────────────────────────────────────────────────────────
  const inputStyle = { width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ccc', fontSize:'14px', fontFamily:'inherit' }
  const labelStyle = { display:'block', marginBottom:4, fontWeight:600, fontSize:'13px' }

  return (
    <div style={{ padding:'30px 20px', maxWidth:'900px', margin:'0 auto', fontFamily:'Inter,sans-serif' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <h1 style={{ margin:0, fontSize:'22px', fontWeight:800 }}>🛠️ Admin Dashboard</h1>
        <Link to="/" style={{ color:'#2d7a4f', fontWeight:'bold', fontSize:'13px' }}>← Back to Store</Link>
      </div>

      {/* Tab Selectors */}
      <div className="admin-nav">
        <button 
          className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`} 
          onClick={() => setActiveTab('products')}
        >
          📦 Products Sourcing
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`} 
          onClick={() => setActiveTab('orders')}
        >
          🛒 Orders Tracker
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'customers' ? 'active' : ''}`} 
          onClick={() => setActiveTab('customers')}
        >
          👥 Customers Directory
        </button>
      </div>

      {/* ── PRODUCTS TAB CONTENT ───────────────────────────── */}
      {activeTab === 'products' && (
        <>
          {/* ── ADD PRODUCT FORM ──────────────────────────────────── */}
          <div style={{ background:'white', padding:'24px', borderRadius:'12px', boxShadow:'0 4px 12px rgba(0,0,0,0.08)', marginBottom:'32px' }}>
            <h2 style={{ margin:'0 0 20px', fontSize:'17px', fontWeight:800 }}>➕ Add New Product</h2>

            {categories.length === 0 && (
              <div style={{ marginBottom:16, padding:14, background:'#fff3cd', borderRadius:8 }}>
                <p style={{ margin:'0 0 10px', fontSize:'13px' }}>⚠️ No categories found in database.</p>
                <button onClick={seedCategories} style={{ padding:'8px 16px', background:'#ffc107', border:'none', borderRadius:4, cursor:'pointer', fontSize:'13px' }}>
                  Create Default Categories
                </button>
              </div>
            )}

            <form onSubmit={addProduct} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              {/* Row 1: Name + Brand */}
              <div style={{ display:'flex', gap:'14px', flexWrap:'wrap' }}>
                <div style={{ flex:'1 1 200px' }}>
                  <label style={labelStyle}>Product Name *</label>
                  <input type="text" value={name} onChange={e=>setName(e.target.value)} style={inputStyle} required />
                </div>
                <div style={{ flex:'1 1 160px' }}>
                  <label style={labelStyle}>Brand</label>
                  <input type="text" value={brand} onChange={e=>setBrand(e.target.value)} style={inputStyle} placeholder="e.g. Bayer, Syngenta" />
                </div>
              </div>

              {/* Row 2: Price + Category */}
              <div style={{ display:'flex', gap:'14px', flexWrap:'wrap' }}>
                <div style={{ flex:'1 1 120px' }}>
                  <label style={labelStyle}>Price (₹) *</label>
                  <input type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} style={inputStyle} required />
                </div>
                <div style={{ flex:'1 1 180px' }}>
                  <label style={labelStyle}>Category</label>
                  <select value={categoryId} onChange={e=>setCategoryId(e.target.value)} style={inputStyle}>
                    <option value="">Select category...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3: HSN + Quantity + GST */}
              <div style={{ display:'flex', gap:'14px', flexWrap:'wrap' }}>
                <div style={{ flex:'1 1 120px' }}>
                  <label style={labelStyle}>HSN Code</label>
                  <input type="text" value={hsnCode} onChange={e=>setHsnCode(e.target.value)} style={inputStyle} placeholder="e.g. 38089190" />
                </div>
                <div style={{ flex:'1 1 160px' }}>
                  <label style={labelStyle}>Size / Volume</label>
                  <input type="text" value={quantity} onChange={e=>setQuantity(e.target.value)} style={inputStyle} placeholder="e.g. 250 ML, 1 KG" />
                </div>
                <div style={{ flex:'1 1 100px' }}>
                  <label style={labelStyle}>GST Rate (%)</label>
                  <select value={gstRate} onChange={e=>setGstRate(e.target.value)} style={inputStyle}>
                    <option value="18">18%</option>
                    <option value="12">12%</option>
                    <option value="5">5%</option>
                    <option value="0">0%</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Stock + Dealer Procurement Sourcing Toggle */}
              <div style={{ display:'flex', gap:'14px', flexWrap:'wrap', alignItems:'center' }}>
                <div style={{ flex:'1 1 120px' }}>
                  <label style={labelStyle}>Physical Stock Count</label>
                  <input type="number" min="0" value={stock} onChange={e=>setStock(e.target.value)} style={inputStyle} placeholder="e.g. 10" />
                </div>
                <div style={{ flex:'1 1 200px', display:'flex', alignItems:'center', gap:'8px', paddingTop:'18px' }}>
                  <input 
                    type="checkbox" 
                    id="allowDealerProcurement" 
                    checked={allowDealerProcurement} 
                    onChange={e=>setAllowDealerProcurement(e.target.checked)} 
                    style={{ width:'18px', height:'18px', cursor:'pointer' }}
                  />
                  <label htmlFor="allowDealerProcurement" style={{ fontWeight:600, fontSize:'13px', cursor:'pointer', userSelect:'none' }}>
                    🤝 Sourced from other dealers if out of stock
                  </label>
                </div>
              </div>

              {/* Image */}
              <div>
                <label style={labelStyle}>Product Image</label>
                <input type="file" accept="image/*" onChange={e=>setImageFile(e.target.files[0])}
                  style={{ width:'100%', padding:'10px', borderRadius:'6px', border:'1px dashed #ccc', background:'#f9f9f9', fontSize:'13px' }} />
              </div>

              <button type="submit" disabled={uploading} style={{
                padding:'12px', background: uploading ? '#aaa' : '#2d7a4f', color:'white',
                border:'none', borderRadius:'8px', cursor: uploading ? 'not-allowed' : 'pointer',
                fontWeight:'bold', fontSize:'15px'
              }}>
                {uploading ? '⏳ Uploading & Saving...' : '✅ Add Product'}
              </button>
            </form>
          </div>

          {/* ── PRODUCT LIST ───────────────────────────────── */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px', flexWrap:'wrap', gap:'12px' }}>
            <h2 style={{ margin:0, fontSize:'17px', fontWeight:800 }}>📦 Products ({products.length})</h2>
            <span style={{ fontSize:'12px', color:'#888' }}>Click ✏️ Edit to update price or details inline</span>
          </div>

          {/* Search bar */}
          <div style={{
            display:'flex', alignItems:'center', gap:'10px',
            background:'white', border:'1.5px solid #e0e0e0',
            borderRadius:'10px', padding:'10px 14px',
            marginBottom:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, brand or category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                border:'none', outline:'none', width:'100%',
                fontSize:'14px', fontFamily:'inherit', color:'#1a1a1a',
                background:'transparent'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#aaa', fontSize:'18px', lineHeight:1, padding:0 }}
                aria-label="Clear search"
              >×</button>
            )}
          </div>

          {/* Filtered results info */}
          {searchQuery && (() => {
            const count = products.filter(p => {
              const q = searchQuery.toLowerCase()
              return p.name?.toLowerCase().includes(q)
                || p.brand?.toLowerCase().includes(q)
                || p.categories?.name?.toLowerCase().includes(q)
            }).length
            return (
              <div style={{ fontSize:'13px', color:'#666', marginBottom:'14px' }}>
                Showing <strong>{count}</strong> result{count !== 1 ? 's' : ''} for “{searchQuery}”
              </div>
            )
          })()}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:'18px' }}>
            {products
              .filter(p => {
                if (!searchQuery.trim()) return true
                const q = searchQuery.toLowerCase()
                return p.name?.toLowerCase().includes(q)
                  || p.brand?.toLowerCase().includes(q)
                  || p.categories?.name?.toLowerCase().includes(q)
              })
              .map((product) => {
              const isEditing = editingId === product.id

              return (
                <div key={product.id} style={{
                  background:'white', border: isEditing ? '2px solid #2d7a4f' : '1px solid #eee',
                  borderRadius:'12px', overflow:'hidden',
                  boxShadow: isEditing ? '0 0 0 4px rgba(45,122,79,0.1)' : '0 2px 8px rgba(0,0,0,0.06)',
                  transition:'box-shadow 0.2s, border-color 0.2s'
                }}>
                  {/* Product image */}
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} style={{ width:'100%', height:'160px', objectFit:'cover' }} />
                  ) : (
                    <div style={{ width:'100%', height:'100px', background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', color:'#bbb', fontSize:'13px' }}>
                      No Image
                    </div>
                  )}

                  <div style={{ padding:'14px' }}>
                    {/* Category badge */}
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                      <span style={{ fontSize:'10px', color:'#888', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                        {product.categories?.name || 'Uncategorized'}
                      </span>
                      {!isEditing && (
                        <span style={{ fontSize:'10px', background:'#f0faf4', color:'#2d7a4f', fontWeight:'bold', padding:'2px 7px', borderRadius:'8px' }}>
                          {product.quantity || '—'}
                        </span>
                      )}
                    </div>

                    {/* ── VIEW MODE ─────────────────────── */}
                    {!isEditing ? (
                      <>
                        <h3 style={{ margin:'0 0 4px', fontSize:'15px', lineHeight:1.4, fontWeight:700 }}>{product.name}</h3>
                        <div style={{ fontSize:'12px', color:'#888', marginBottom:'8px' }}>{product.brand || 'No Brand'}</div>
                        <div style={{ fontSize:'22px', fontWeight:900, color:'#1a1a1a', marginBottom:'10px' }}>
                          ₹{product.price}
                        </div>
                        <div style={{ display:'flex', gap:'6px', padding:'8px 0', borderTop:'1px solid #f5f5f5', fontSize:'12px', color:'#666', marginBottom:'12px' }}>
                          <span><b>HSN:</b> {product.hsn_code || '—'}</span>
                          <span style={{ marginLeft:'auto' }}><b>GST:</b> {product.gst_rate ?? 18}%</span>
                        </div>
                        <div style={{ display:'flex', gap:'8px', flexDirection:'column', background:'#f8f9fa', padding:'8px', borderRadius:'6px', fontSize:'12.5px', marginBottom:'12px', border:'1px solid #eef0f2' }}>
                          <div style={{ display:'flex', justifyContent:'space-between' }}>
                            <span>📦 <b>Stock:</b> {product.stock ?? 0} units</span>
                            <span style={{ fontWeight:'bold', color: (product.stock ?? 0) > 0 ? '#2d7a4f' : '#e65100' }}>
                              {(product.stock ?? 0) > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>
                          <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px dashed #e2e8f0', paddingTop:'4px', marginTop:'4px' }}>
                            <span>🤝 <b>Dealer Sourcing:</b></span>
                            <span style={{ fontWeight:'bold', color: product.allow_dealer_procurement !== false ? '#2d7a4f' : '#e53935' }}>
                              {product.allow_dealer_procurement !== false ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:'8px' }}>
                          <button
                            onClick={() => startEdit(product)}
                            style={{ flex:1, padding:'8px', background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe', borderRadius:'6px', cursor:'pointer', fontWeight:700, fontSize:'13px' }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => archiveProduct(product.id)}
                            style={{ flex:1, padding:'8px', background:'#fff3e0', color:'#e65100', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:700, fontSize:'13px' }}
                          >
                            🗃️ Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      /* ── EDIT MODE ──────────────────────── */
                      <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                        <div style={{ background:'#f0faf4', borderRadius:'6px', padding:'6px 10px', fontSize:'12px', color:'#2d7a4f', fontWeight:700 }}>
                          ✏️ Editing — change any field and save
                        </div>

                        <div>
                          <label style={{ ...labelStyle, fontSize:'11px' }}>Product Name</label>
                          <input
                            style={{ ...inputStyle, fontSize:'13px', padding:'8px' }}
                            value={editFields.name}
                            onChange={e => setEditFields(f=>({...f, name:e.target.value}))}
                          />
                        </div>

                        <div style={{ display:'flex', gap:'8px' }}>
                          <div style={{ flex:1 }}>
                            <label style={{ ...labelStyle, fontSize:'11px' }}>Brand</label>
                            <input
                              style={{ ...inputStyle, fontSize:'13px', padding:'8px' }}
                              value={editFields.brand}
                              onChange={e => setEditFields(f=>({...f, brand:e.target.value}))}
                            />
                          </div>
                          <div style={{ flex:'0 0 90px' }}>
                            <label style={{ ...labelStyle, fontSize:'11px' }}>Price (₹)</label>
                            <input
                              type="number" min="0" step="0.01"
                              style={{ ...inputStyle, fontSize:'14px', padding:'8px', fontWeight:700, color:'#1a1a1a' }}
                              value={editFields.price}
                              onChange={e => setEditFields(f=>({...f, price:e.target.value}))}
                            />
                          </div>
                        </div>

                        <div style={{ display:'flex', gap:'8px' }}>
                          <div style={{ flex:1 }}>
                            <label style={{ ...labelStyle, fontSize:'11px' }}>Size / Volume</label>
                            <input
                              style={{ ...inputStyle, fontSize:'13px', padding:'8px' }}
                              value={editFields.quantity}
                              onChange={e => setEditFields(f=>({...f, quantity:e.target.value}))}
                              placeholder="e.g. 1 L, 500g"
                            />
                          </div>
                          <div style={{ flex:'0 0 90px' }}>
                            <label style={{ ...labelStyle, fontSize:'11px' }}>GST (%)</label>
                            <select
                              style={{ ...inputStyle, fontSize:'13px', padding:'8px' }}
                              value={editFields.gst_rate}
                              onChange={e => setEditFields(f=>({...f, gst_rate:e.target.value}))}
                            >
                              <option value="18">18%</option>
                              <option value="12">12%</option>
                              <option value="5">5%</option>
                              <option value="0">0%</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label style={{ ...labelStyle, fontSize:'11px' }}>HSN Code</label>
                          <input
                            style={{ ...inputStyle, fontSize:'13px', padding:'8px' }}
                            value={editFields.hsn_code}
                            onChange={e => setEditFields(f=>({...f, hsn_code:e.target.value}))}
                            placeholder="e.g. 38089190"
                          />
                        </div>

                        <div style={{ display:'flex', gap:'8px' }}>
                          <div style={{ flex:1 }}>
                            <label style={{ ...labelStyle, fontSize:'11px' }}>Stock</label>
                            <input
                              type="number" min="0"
                              style={{ ...inputStyle, fontSize:'13px', padding:'8px' }}
                              value={editFields.stock}
                              onChange={e => setEditFields(f=>({...f, stock:e.target.value}))}
                            />
                          </div>
                          <div style={{ flex:'1 1 auto', display:'flex', alignItems:'center', gap:'6px', paddingTop:'16px' }}>
                            <input
                              type="checkbox"
                              id={`edit_procure_${product.id}`}
                              checked={editFields.allow_dealer_procurement}
                              onChange={e => setEditFields(f=>({...f, allow_dealer_procurement:e.target.checked}))}
                              style={{ width:'16px', height:'16px', cursor:'pointer' }}
                            />
                            <label htmlFor={`edit_procure_${product.id}`} style={{ fontWeight:600, fontSize:'11px', cursor:'pointer', userSelect:'none' }}>
                              🤝 Dealer Sourced
                            </label>
                          </div>
                        </div>

                        <div>
                          <label style={{ ...labelStyle, fontSize:'11px' }}>Category</label>
                          <select
                            style={{ ...inputStyle, fontSize:'13px', padding:'8px' }}
                            value={editFields.category_id}
                            onChange={e => setEditFields(f=>({...f, category_id:e.target.value}))}
                          >
                            <option value="">No category</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                          </select>
                        </div>

                        <div style={{ display:'flex', gap:'8px', marginTop:'4px' }}>
                          <button
                            onClick={() => saveEdit(product.id)}
                            disabled={editSaving}
                            style={{ flex:1, padding:'9px', background: editSaving ? '#aaa' : '#2d7a4f', color:'white', border:'none', borderRadius:'6px', cursor: editSaving ? 'not-allowed' : 'pointer', fontWeight:700, fontSize:'13px' }}
                          >
                            {editSaving ? '⏳ Saving...' : '💾 Save Changes'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            style={{ flex:'0 0 80px', padding:'9px', background:'#f1f5f9', color:'#475569', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:700, fontSize:'13px' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {products.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'#888' }}>
              <div style={{ fontSize:'48px', marginBottom:'12px' }}>📦</div>
              <p>No products yet. Add your first product above!</p>
            </div>
          )}
        </>
      )}

      {/* ── ORDERS TAB CONTENT ────────────────────────────── */}
      {activeTab === 'orders' && (
        <div>
          {/* Order Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 250px', position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search orders by Name, Phone, Invoice No..." 
                value={orderSearch} 
                onChange={e => setOrderSearch(e.target.value)} 
                style={{ ...inputStyle, padding: '10px 14px' }}
              />
            </div>
            <div>
              <select 
                value={orderStatusFilter} 
                onChange={e => setOrderStatusFilter(e.target.value)}
                style={{ ...inputStyle, width: '180px' }}
              >
                <option value="all">⭐ All Statuses</option>
                <option value="pending_verification">⏳ Pending Verification</option>
                <option value="processing">⚙️ Processing</option>
                <option value="shipped">🚚 Shipped</option>
                <option value="delivered">✅ Delivered (Completed)</option>
                <option value="cancelled">🚫 Cancelled</option>
              </select>
            </div>
          </div>

          {loadingOrders ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>⏳ Loading orders tracker data...</div>
          ) : (
            (() => {
              const filteredOrders = orders.filter(o => {
                const s = orderSearch.toLowerCase().trim()
                if (!s) {
                  return orderStatusFilter === 'all' || 
                    o.status === orderStatusFilter || 
                    (orderStatusFilter === 'pending_verification' && o.status === 'pending')
                }

                const formattedInvoice = `ord-${o.id.substring(0, 8)}`.toLowerCase()
                const matchesSearch = 
                  o.customer_name?.toLowerCase().includes(s) ||
                  o.customer_phone?.includes(s) ||
                  o.transaction_id?.toLowerCase().includes(s) ||
                  o.id?.toLowerCase().includes(s) ||
                  formattedInvoice.includes(s) ||
                  o.order_items?.some(item => 
                    item.products?.name?.toLowerCase().includes(s) || 
                    item.products?.brand?.toLowerCase().includes(s)
                  )

                const matchesStatus = orderStatusFilter === 'all' || 
                  o.status === orderStatusFilter ||
                  (orderStatusFilter === 'pending_verification' && o.status === 'pending')

                return matchesSearch && matchesStatus
              })

              if (filteredOrders.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', border: '1px solid #eee' }}>
                    📦 No orders found matching the filter criteria.
                  </div>
                )
              }

              return (
                <div className="admin-orders-list">
                  {filteredOrders.map(order => {
                    const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })

                    const displayStatus = order.status === 'pending' ? 'pending_verification' : order.status

                    return (
                      <div key={order.id} className="admin-order-card">
                        <div className="admin-order-header">
                          <div>
                            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Invoice Number</div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#1a1a1a', fontFamily: 'monospace' }}>
                              {order.transaction_id || `ORD-${order.id.substring(0, 8).toUpperCase()}`}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#666', marginTop: '4px' }}>📅 {orderDate}</div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <select 
                              value={displayStatus}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className="admin-select-status"
                            >
                              <option value="pending_verification">Pending Verification</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered (Completed)</option>
                              <option value="cancelled">Cancelled</option>
                            </select>

                            <span className={`admin-status-badge admin-status-badge--${displayStatus?.split('_')[0]}`}>
                              {displayStatus === 'pending_verification' && '⏳ '}
                              {displayStatus === 'processing' && '⚙️ '}
                              {displayStatus === 'shipped' && '🚚 '}
                              {displayStatus === 'delivered' && '✅ '}
                              {displayStatus === 'cancelled' && '🚫 '}
                              {displayStatus?.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <div className="admin-order-details-grid">
                          <div style={{ paddingRight: '12px' }}>
                            <h4 style={{ margin: '0 0 8px', fontSize: '13.5px', color: '#1a1a1a', fontWeight: 'bold' }}>👤 Delivery Details</h4>
                            <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#444' }}>
                              <strong>Name:</strong> {order.customer_name}<br />
                              <strong>Phone:</strong> {order.customer_phone}<br />
                              <strong>Address:</strong> {order.shipping_address}
                            </div>

                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'delivered')}
                                style={{ 
                                  marginTop: '16px', 
                                  padding: '10px 14px', 
                                  background: 'var(--green-primary)', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '6px', 
                                  fontWeight: 'bold', 
                                  fontSize: '12.5px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                ✅ Confirm Payment & Deliver (Complete Order)
                              </button>
                            )}
                          </div>

                          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #eef0f2' }}>
                            <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#1a1a1a', fontWeight: 'bold' }}>📦 Invoice Items ({order.order_items?.length})</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {order.order_items?.map((item, index) => {
                                const prodName = item.products?.name || 'Unknown Product'
                                const brand = item.products?.brand ? `(${item.products.brand})` : ''
                                return (
                                  <div key={item.id || index} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '12.5px', borderBottom: '1px solid #edf2f7', paddingBottom: '6px' }}>
                                    <div style={{ maxWidth: '75%' }}>
                                      <span>{prodName}</span> <span style={{ color: '#888', fontSize: '11px' }}>{brand}</span>
                                      <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>Qty: <strong>{item.quantity}</strong> @ ₹{item.price_at_time}</div>
                                    </div>
                                    <div style={{ fontWeight: 'bold' }}>₹{(item.price_at_time * item.quantity).toFixed(2)}</div>
                                  </div>
                                )
                              })}
                            </div>

                            <div style={{ borderTop: '1px dashed #cbd5e1', marginTop: '12px', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {parseFloat(order.loyalty_discount_applied || 0) > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#2d7a4f', fontWeight: 'bold' }}>
                                  <span>Loyalty Discount (10%):</span>
                                  <span>-₹{parseFloat(order.loyalty_discount_applied).toFixed(2)}</span>
                                </div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 900, color: 'var(--green-primary)' }}>
                                  <span>Total Collected (COD):</span>
                                  <span>₹{parseFloat(order.total_price).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {parseFloat(order.loyalty_discount_applied || 0) > 0 && (
                          <div style={{ background: '#f0faf4', border: '1px dashed #a7f3d0', padding: '12px 16px', borderRadius: '8px', fontSize: '12px', marginTop: '12px' }}>
                            <div style={{ color: '#2d7a4f', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                              🌾 Loyalty Program Farmer Profile Responses:
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', color: '#444' }}>
                              <span>• <b>Farm Size:</b> {order.land_acres} Acres</span>
                              <span>• <b>Crop Cultivated:</b> {order.crop_type}</span>
                              <span>• <b>Previously Sourced Medicines:</b> {order.previous_medicines_used}</span>
                              <span>• <b>Previous Reference Invoice:</b> {order.previous_order_id ? String(order.previous_order_id).substring(0,8).toUpperCase() : 'Manual Sourcing'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()
          )}
        </div>
      )}

      {/* ── CUSTOMERS TAB CONTENT ─────────────────────────── */}
      {activeTab === 'customers' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '17px', fontWeight: 800 }}>👥 Registered Customers</h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
            List of all farmers and buyers registered on the AgroDeals platform. You can toggle admin privileges for any profile.
          </p>

          {loadingCustomers ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>⏳ Loading customer directory...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email Address</th>
                    <th>Name</th>
                    <th>Signed Up</th>
                    <th>Access Level</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(cust => {
                    const signupDate = new Date(cust.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })

                    return (
                      <tr key={cust.id}>
                        <td style={{ fontWeight: 600 }}>{cust.email}</td>
                        <td>{cust.full_name || '—'}</td>
                        <td style={{ color: '#666' }}>{signupDate}</td>
                        <td>
                          <button
                            onClick={() => toggleAdminStatus(cust.id, cust.is_admin)}
                            style={{
                              padding: '5px 10px',
                              fontSize: '11.5px',
                              fontWeight: 'bold',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer',
                              background: cust.is_admin ? '#fff3cd' : '#f1f5f9',
                              color: cust.is_admin ? '#856404' : '#475569',
                              transition: 'all 0.15s'
                            }}
                          >
                            {cust.is_admin ? '🛡️ Administrator' : '👤 Customer (Make Admin)'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Admin
