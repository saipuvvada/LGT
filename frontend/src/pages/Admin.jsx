import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

function Admin() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [passcode, setPasscode] = useState('')
  const [isAuthorized, setIsAuthorized] = useState(() => sessionStorage.getItem('admin_auth') === 'true')
  const [authError, setAuthError] = useState('')

  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (isAuthorized) {
      fetchCategories()
      fetchProducts()
    }
  }, [isAuthorized])

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

  async function fetchCategories() {
    const { data, error } = await supabase.from('categories').select('*')
    if (data) setCategories(data)
  }

  async function seedCategories() {
    const defaultCategories = [
      { name: 'Pesticides', slug: 'pesticides', description: 'Insecticides, Fungicides, Herbicides' },
      { name: 'Fertilizers', slug: 'fertilizers', description: 'NPK, Micronutrients, Organic' },
      { name: 'Seeds', slug: 'seeds', description: 'Hybrid & certified seeds' },
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

    if (error) {
      console.log(error)
    } else {
      setProducts(data)
    }
  }

  async function addProduct(e) {
    e.preventDefault()
    if (!name || !price) return alert("Name and price are required")
    
    setUploading(true)
    let image_url = null

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile)

      if (uploadError) {
        alert('Error uploading image: ' + uploadError.message)
        setUploading(false)
        return
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)
      
      image_url = data.publicUrl
    }

    const { error } = await supabase
      .from('products')
      .insert([
        {
          name,
          brand: brand || null,
          price: parseFloat(price),
          description,
          category_id: categoryId || null,
          image_url
        }
      ])

    setUploading(false)

    if (error) {
      alert(error.message)
    } else {
      alert('Product Added')
      setName('')
      setBrand('')
      setPrice('')
      setDescription('')
      setCategoryId('')
      setImageFile(null)
      e.target.reset()
      fetchProducts()
    }
  }

  async function archiveProduct(id) {
    const confirmed = window.confirm('Remove this product from the store? It will be hidden but not permanently deleted.')
    if (!confirmed) return

    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)

    if (!error) {
      fetchProducts()
    } else {
      alert(error.message)
    }
  }

  if (!isAuthorized) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a2e22 0%, #111e16 100%)',
        fontFamily: 'Inter, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '40px 32px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.5px' }}>Admin Portal Locked</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '24px' }}>
            Please enter your master passcode to access the management panel.
          </p>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="password"
              placeholder="Enter Admin Passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: 'white',
                fontSize: '16px',
                outline: 'none',
                textAlign: 'center',
                letterSpacing: passcode ? '4px' : 'normal'
              }}
              autoFocus
            />

            {authError && (
              <div style={{ fontSize: '13px', color: '#ff6b6b', fontWeight: 'bold' }}>{authError}</div>
            )}

            <button
              type="submit"
              style={{
                padding: '12px',
                background: '#2d7a4f',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'background 0.2s'
              }}
            >
              Unlock Dashboard
            </button>
          </form>

          <div style={{ marginTop: '24px' }}>
            <Link to="/" style={{ color: '#6fcf7c', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>
              ← Return to Store
            </Link>
          </div>
        </div>
      </div>
    )
  }

  function handleLock() {
    setIsAuthorized(false)
    sessionStorage.removeItem('admin_auth')
    setPasscode('')
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin Dashboard</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button
            onClick={handleLock}
            style={{
              background: '#ffebee',
              color: '#c62828',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            🔒 Lock Dashboard
          </button>
          <Link to="/" style={{ color: '#2d7a4f', fontWeight: 'bold' }}>← Back to Store</Link>
        </div>
      </div>

      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h2>Add Product</h2>

        {categories.length === 0 && (
          <div style={{ marginBottom: 20, padding: 16, background: '#fff3cd', borderRadius: 8 }}>
            <p style={{ margin: '0 0 10px' }}>⚠️ No categories found in database.</p>
            <button onClick={seedCategories} style={{ padding: '8px 16px', background: '#ffc107', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              Create Default Categories
            </button>
          </div>
        )}

        <form onSubmit={addProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Product Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Brand (e.g., Bayer, Syngenta)</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                placeholder="AgroDeals"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                <option value="">Select a category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px dashed #ccc', background: '#f9f9f9' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={uploading}
            style={{ 
              padding: '12px', 
              background: '#2d7a4f', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            {uploading ? 'Uploading & Saving...' : 'Add Product'}
          </button>
        </form>
      </div>

      <h2 style={{ marginTop: '40px' }}>Products ({products.length})</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {products.map((product) => (
          <div key={product.id} style={{ background: 'white', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '180px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                No Image
              </div>
            )}
            
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {product.brand || 'No Brand'}
                </span>
                <span style={{ fontSize: '11px', color: '#2d7a4f', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {product.categories?.name || 'Uncategorized'}
                </span>
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', lineHeight: '1.4' }}>{product.name}</h3>
              <p style={{ margin: '0 0 12px', fontWeight: 'bold', fontSize: '18px' }}>₹{product.price}</p>
              
              <button
                onClick={() => archiveProduct(product.id)}
                style={{ width: '100%', padding: '8px', background: '#fff3e0', color: '#e65100', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                🗃️ Remove from Store
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Admin
