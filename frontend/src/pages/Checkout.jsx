import { useState, useEffect } from 'react'
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

  const [pastOrders, setPastOrders] = useState([])
  const [applyLoyalty, setApplyLoyalty] = useState(false)
  const [loyaltyData, setLoyaltyData] = useState({
    previousOrderId: '',
    landAcres: '',
    cropType: '',
    medicinesUsed: ''
  })

  useEffect(() => {
    fetchPastOrders()
  }, [])

  const fetchPastOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data, error } = await supabase
          .from('orders')
          .select('id, created_at, transaction_id, total_price')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
        if (!error && data) {
          setPastOrders(data)
        }
      }
    } catch (err) {
      console.warn('Error fetching past orders:', err)
    }
  }

  // Per-item GST calculation using each product's gst_rate field
  const itemsWithGst = cartItems.map(item => {
    const rate = item.gst_rate ?? 18  // fallback to 18% if not set
    const basePrice = item.price * item.quantity
    const gstAmt = parseFloat((basePrice * rate / 100).toFixed(2))
    return { ...item, gstRate: rate, gstAmount: gstAmt, baseAmount: basePrice }
  })
  const subtotal = parseFloat(cartItems.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2))
  const totalGst = parseFloat(itemsWithGst.reduce((s, i) => s + i.gstAmount, 0).toFixed(2))
  const cgst = parseFloat((totalGst / 2).toFixed(2))
  const sgst = parseFloat((totalGst / 2).toFixed(2))
  const baseTotal = parseFloat((subtotal + totalGst).toFixed(2))

  const isLoyaltyValid = applyLoyalty && 
    loyaltyData.previousOrderId && 
    loyaltyData.landAcres && 
    loyaltyData.cropType && 
    loyaltyData.medicinesUsed;

  const loyaltyDiscount = isLoyaltyValid 
    ? parseFloat((baseTotal * 0.10).toFixed(2)) 
    : 0.00;

  const grandTotal = parseFloat((baseTotal - loyaltyDiscount).toFixed(2))

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
          status: 'pending_verification',
          loyalty_discount_applied: loyaltyDiscount,
          previous_order_id: isLoyaltyValid ? loyaltyData.previousOrderId : null,
          land_acres: isLoyaltyValid ? parseFloat(loyaltyData.landAcres) : null,
          crop_type: isLoyaltyValid ? loyaltyData.cropType : null,
          previous_medicines_used: isLoyaltyValid ? loyaltyData.medicinesUsed : null
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

      // 4. Fire invoice email to saipuvvada12@gmail.com via FormSubmit
      const invoiceNo = `INV-${order.id.substring(0, 8).toUpperCase()}`
      const itemLines = itemsWithGst.map((item, i) =>
        `${i + 1}. ${item.name} (${item.quantity_vol || ''}) x${item.quantity} @ ₹${item.price.toFixed(2)} + GST ₹${item.gstAmount.toFixed(2)} = ₹${(item.price * item.quantity + item.gstAmount).toFixed(2)}`
      ).join('\n')

      const loyaltyDetailsText = isLoyaltyValid
        ? `🌾 LOYALTY DISCOUNT CLAIMED\n` +
          `───────────────────────────────\n` +
          `• Prev Order ID:   ${loyaltyData.previousOrderId}\n` +
          `• Farm Size:       ${loyaltyData.landAcres} Acres\n` +
          `• Crop Type:       ${loyaltyData.cropType}\n` +
          `• Medicines Used:  ${loyaltyData.medicinesUsed}\n\n`
        : '';

      const emailBody =
        `📦 NEW ORDER RECEIVED — ${invoiceNo}\n` +
        `══════════════════════════════════\n\n` +
        `👤 Customer: ${formData.fullName}\n` +
        `📞 Phone:    +91 ${formData.phone}\n` +
        `📍 Address:  ${formData.address}, ${formData.city} - ${formData.pincode}\n` +
        `💳 Payment:  Cash on Delivery (COD)\n` +
        `🔖 Transaction ID: ${transactionId}\n\n` +
        loyaltyDetailsText +
        `─── ORDER ITEMS ───────────────────\n` +
        `${itemLines}\n\n` +
        `─── TOTALS ────────────────────────\n` +
        `Subtotal (excl. GST): ₹${subtotal.toFixed(2)}\n` +
        `CGST:                 ₹${cgst.toFixed(2)}\n` +
        `SGST:                 ₹${sgst.toFixed(2)}\n` +
        (loyaltyDiscount > 0 ? `Loyalty Discount (10%): -₹${loyaltyDiscount.toFixed(2)}\n` : '') +
        `Grand Total (COD):    ₹${grandTotal.toFixed(2)}\n\n` +
        `══════════════════════════════════\n` +
        `Lakshmi Ganapathi Traders — AgroDeals\n` +
        `GST: 37ANKPD0775A1ZC | Karempudi, AP`

      let emailSent = false
      try {
        const endpoint = import.meta.env.DEV
          ? 'https://formsubmit.co/ajax/saipuvvada12@gmail.com'
          : '/api/send-email'

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            _subject:      `🛒 New Order ${invoiceNo} — ₹${grandTotal.toFixed(2)} COD`,
            Invoice_No:    invoiceNo,
            Customer_Name: formData.fullName,
            Phone:         `+91 ${formData.phone}`,
            Address:       `${formData.address}, ${formData.city} - ${formData.pincode}`,
            Payment:       'Cash on Delivery (COD)',
            Transaction_ID: transactionId,
            Order_Items:   itemLines,
            Subtotal:      `₹${subtotal.toFixed(2)}`,
            CGST:          `₹${cgst.toFixed(2)}`,
            SGST:          `₹${sgst.toFixed(2)}`,
            Loyalty_Discount: loyaltyDiscount > 0 ? `-₹${loyaltyDiscount.toFixed(2)}` : '₹0.00',
            Grand_Total:   `₹${grandTotal.toFixed(2)}`,
            Loyalty_Claimed: isLoyaltyValid ? 'Yes' : 'No',
            Land_Acres:    isLoyaltyValid ? `${loyaltyData.landAcres} Acres` : 'N/A',
            Crop_Type:     isLoyaltyValid ? loyaltyData.cropType : 'N/A',
            Previous_Medicines: isLoyaltyValid ? loyaltyData.medicinesUsed : 'N/A',
            Full_Details:  emailBody,
            _honey:        '',
            _template:     'box',
          })
        })
        const data = await res.json()
        if (res.ok && (data.success === true || data.success === 'true')) emailSent = true
      } catch (emailErr) {
        console.warn('Invoice email dispatch failed (non-blocking):', emailErr)
      }

      // 5. Clear cart and navigate to success
      clearCart()
      navigate('/order-success', {
        state: {
          orderId: order.id,
          customerDetails: formData,
          items: itemsWithGst,
          totals: { subtotal, cgst, sgst, totalGst, grandTotal, loyaltyDiscount },
          emailSent,
        }
      })

    } catch (error) {
      console.error(error)
      alert('Error placing order: ' + error.message)
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

        {/* Farmer Loyalty Discount Section */}
        <div className="loyalty-section">
          <h3 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            🌾 Farmer Loyalty Program
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 16, lineHeight: 1.4 }}>
            Ordered from Lakshmi Ganapathi Traders before? Enter your previous order details to claim a **10% discount** on this purchase!
          </p>

          <label className="loyalty-checkbox-wrap">
            <input 
              type="checkbox" 
              checked={applyLoyalty}
              onChange={(e) => setApplyLoyalty(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-primary)' }}>
              I have ordered from AgroDeals before
            </span>
          </label>

          {applyLoyalty && (
            <div className="loyalty-survey-box">
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>
                Agricultural & Previous Invoice Details:
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4 }}>
                  Select Previous Order / Invoice ID *
                </label>
                {pastOrders.length > 0 ? (
                  <select 
                    value={loyaltyData.previousOrderId}
                    onChange={(e) => setLoyaltyData({ ...loyaltyData, previousOrderId: e.target.value })}
                    style={inputStyle}
                    required={applyLoyalty}
                  >
                    <option value="">-- Choose previous order --</option>
                    {pastOrders.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.transaction_id || `ORD-${o.id.substring(0, 8)}`} (₹{o.total_price} - {new Date(o.created_at).toLocaleDateString('en-IN')})
                      </option>
                    ))}
                    <option value="manual_or_other">Manual Entry / Other Dealer Invoice</option>
                  </select>
                ) : (
                  <input 
                    required={applyLoyalty}
                    placeholder="Enter Previous Order/Invoice ID (e.g. COD-17180...)"
                    value={loyaltyData.previousOrderId}
                    onChange={(e) => setLoyaltyData({ ...loyaltyData, previousOrderId: e.target.value })}
                    style={inputStyle}
                  />
                )}
                {loyaltyData.previousOrderId === 'manual_or_other' && (
                  <input 
                    required={applyLoyalty}
                    placeholder="Type Invoice ID or Previous Dealer Name here"
                    value={loyaltyData.previousOrderId === 'manual_or_other' ? '' : loyaltyData.previousOrderId}
                    onChange={(e) => setLoyaltyData({ ...loyaltyData, previousOrderId: e.target.value })}
                    style={{ ...inputStyle, marginTop: 8 }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4 }}>
                    Land Cultivated (Acres) *
                  </label>
                  <input 
                    type="number" 
                    step="0.1" 
                    min="0"
                    placeholder="e.g. 5" 
                    value={loyaltyData.landAcres}
                    onChange={(e) => setLoyaltyData({ ...loyaltyData, landAcres: e.target.value })}
                    style={inputStyle}
                    required={applyLoyalty}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4 }}>
                    Type of Crop Grown *
                  </label>
                  <input 
                    placeholder="e.g. Cotton, Paddy" 
                    value={loyaltyData.cropType}
                    onChange={(e) => setLoyaltyData({ ...loyaltyData, cropType: e.target.value })}
                    style={inputStyle}
                    required={applyLoyalty}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4 }}>
                  Products / Medicines Used Previously from Us *
                </label>
                <textarea 
                  placeholder="e.g. Sumiprempt Insecticide, Agromin Gold Fertilizer..." 
                  value={loyaltyData.medicinesUsed}
                  onChange={(e) => setLoyaltyData({ ...loyaltyData, medicinesUsed: e.target.value })}
                  style={inputStyle}
                  rows={2}
                  required={applyLoyalty}
                />
              </div>

              {isLoyaltyValid ? (
                <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', color: '#2d7a4f', padding: '10px 14px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🎉 10% Loyalty Discount Successfully Applied!
                </div>
              ) : (
                <div style={{ background: '#fff9c4', border: '1px solid #fff59d', color: '#b7791f', padding: '10px 14px', borderRadius: '6px', fontSize: '12.5px', fontWeight: '500' }}>
                  ℹ️ Fill out all agricultural details above to unlock your 10% discount.
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Order Summary</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#666' }}>
            <span>Items ({cartItems.length})</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#666' }}>
            <span>CGST</span>
            <span>₹{cgst.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#666', borderBottom: '1px solid #eee', paddingBottom: 12 }}>
            <span>SGST</span>
            <span>₹{sgst.toFixed(2)}</span>
          </div>

          {loyaltyDiscount > 0 && (
            <div className="discount-row-green">
              <span>Loyalty Discount (10% Off)</span>
              <span>-₹{loyaltyDiscount.toFixed(2)}</span>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800 }}>
            <span>Total to Pay</span>
            <span style={{ color: '#2d7a4f' }}>₹{grandTotal.toFixed(2)}</span>
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
