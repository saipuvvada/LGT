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

  // ── Inline-edit state  (keyed by product id) ──────────────────
  const [editingId, setEditingId]     = useState(null)
  const [editFields, setEditFields]   = useState({})
  const [editSaving, setEditSaving]   = useState(false)

  // ── Search filter state ────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')

  // Auto-lock when admin navigates away (component unmounts)
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('admin_auth')
    }
  }, [])

  useEffect(() => {
    if (isAuthorized) { fetchCategories(); fetchProducts() }
  }, [isAuthorized])

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
    }])

    setUploading(false)
    if (error) { alert(error.message) }
    else {
      alert('✅ Product Added!')
      setName(''); setBrand(''); setPrice(''); setCategoryId('')
      setHsnCode(''); setQuantity(''); setGstRate('18'); setImageFile(null)
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
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <h1 style={{ margin:0, fontSize:'22px', fontWeight:800 }}>🛠️ Admin Dashboard</h1>
        <Link to="/" style={{ color:'#2d7a4f', fontWeight:'bold', fontSize:'13px' }}>← Back to Store</Link>
      </div>

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
    </div>
  )
}

export default Admin
