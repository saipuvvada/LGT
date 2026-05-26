import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

export default function Checkout() {
  const navigate = useNavigate()
  const { cartItems, cartTotal, clearCart } = useCart()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    pincode: ''
  })

  // Tax calculation
  const totalAmount = Math.round(cartTotal)
  const gstAmount = Math.round(totalAmount * 0.18) // Assuming 18% GST overall
  const grandTotal = totalAmount + gstAmount

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const placeOrder = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Get current session
      const { data: { session } } = await supabase.auth.getSession()
      
      // If no session, we might want to store guest orders or force login. 
      // For this demo, if no user, we proceed but user_id will be null.
      // But orders table requires user_id. Let's check if the user is logged in.
      if (!session) {
        alert("Please login to place an order.")
        navigate('/login')
        return
      }

      const userId = session.user.id

      const transactionId = 'COD-' + Date.now()

      // 2. Create the Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: userId,
          total_price: grandTotal,
          transaction_id: transactionId,
          customer_name: formData.fullName,
          customer_phone: formData.phone,
          shipping_address: `${formData.address}, ${formData.city} - ${formData.pincode}`,
          status: 'pending_verification'
        }])
        .select()
        .single()

      if (orderError) throw orderError

      // 3. Create Order Items
      console.log(JSON.stringify(cartItems, null, 2))

      // Validate all product IDs exist in the products table first
      const cartProductIds = cartItems.map(i => i.id)
      const { data: validProducts } = await supabase
        .from('products')
        .select('id')
        .in('id', cartProductIds)

      const validIds = new Set(validProducts?.map(p => p.id) || [])
      const invalidItems = cartItems.filter(i => !validIds.has(i.id))

      if (invalidItems.length > 0) {
        alert(`Some items in your cart are no longer available and have been removed:\n${invalidItems.map(i => i.name).join(', ')}\n\nPlease review your cart and try again.`)
        setLoading(false)
        return
      }

      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
      }))

      console.log(JSON.stringify(orderItems, null, 2))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // 4. Success! Clear cart and redirect to success page
      clearCart()
      navigate('/order-success', { 
        state: { 
          orderId: order.id, 
          customerDetails: formData,
          items: cartItems,
          totals: {
            subtotal: totalAmount,
            gst: gstAmount,
            grandTotal: grandTotal
          }
        } 
      })

    } catch (error) {
      console.error(error)
      alert("Error placing order: " + error.message)
      setLoading(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="app-shell" style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Your bag is empty</h2>
        <button onClick={() => navigate('/')} className="btn-shop-now" style={{ marginTop: 20 }}>Return to Shop</button>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="header" style={{ position: 'relative' }}>
        <div className="header-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <span style={{ fontSize: 18, fontWeight: 700 }}>Checkout</span>
          </div>
        </div>
      </header>

      <main className="page-content" style={{ paddingTop: 20, padding: '20px 16px' }}>
        
        <div style={{ background: 'white', padding: 20, borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: 16 }}>Delivery Details</h3>
          <form id="checkout-form" onSubmit={placeOrder} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input required name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} style={inputStyle} />
            <input required name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} style={inputStyle} />
            <textarea required name="address" placeholder="Full Delivery Address" value={formData.address} onChange={handleChange} rows={3} style={inputStyle} />
            <div style={{ display: 'flex', gap: 12 }}>
              <input required name="city" placeholder="City / District" value={formData.city} onChange={handleChange} style={{ ...inputStyle, flex: 1 }} />
              <input required name="pincode" placeholder="PIN Code" value={formData.pincode} onChange={handleChange} style={{ ...inputStyle, flex: 1 }} />
            </div>
          </form>
        </div>

        <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: 16 }}>Order Summary</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#666' }}>
            <span>Items ({cartItems.length})</span>
            <span>₹{totalAmount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, color: '#666', borderBottom: '1px solid #eee', paddingBottom: 16 }}>
            <span>GST (18%)</span>
            <span>₹{gstAmount}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800 }}>
            <span>Total to Pay</span>
            <span style={{ color: '#2d7a4f' }}>₹{grandTotal}</span>
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4, textAlign: 'right' }}>
            Payment Method: Cash on Delivery (COD)
          </div>
        </div>

        <button 
          form="checkout-form"
          type="submit"
          disabled={loading}
          className="btn-checkout" 
          style={{ marginTop: 24 }}
        >
          {loading ? 'Processing...' : `PLACE ORDER (COD) - ₹${grandTotal}`}
        </button>

      </main>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  fontSize: '15px',
  fontFamily: 'inherit'
}
