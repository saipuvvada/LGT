import { useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import html2pdf from 'html2pdf.js'

export default function OrderSuccess() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const invoiceRef = useRef(null)

  if (!state || !state.orderId) {
    return (
      <div className="app-shell" style={{ padding: 40, textAlign: 'center' }}>
        <h2>Invalid Order</h2>
        <button onClick={() => navigate('/')} className="btn-shop-now">Go Home</button>
      </div>
    )
  }

  const { orderId, customerDetails, items, totals } = state
  const date = new Date().toLocaleDateString('en-IN')
  
  // Calculate CGST and SGST (assuming 18% total GST, so 9% each)
  const cgst = totals.gst / 2
  const sgst = totals.gst / 2

  const downloadInvoice = () => {
    const element = invoiceRef.current
    const opt = {
      margin: 10,
      filename: `Invoice_${orderId.substring(0,8)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
  }

  return (
    <div className="app-shell">
      <header className="header" style={{ position: 'relative' }}>
        <div className="header-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/" style={{ color: 'white' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </Link>
            <span style={{ fontSize: 18, fontWeight: 700 }}>Order Placed</span>
          </div>
        </div>
      </header>

      <main className="page-content" style={{ paddingTop: 20, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ color: '#2d7a4f', marginBottom: 8 }}>Order Successful!</h2>
        <p style={{ color: '#666', textAlign: 'center', marginBottom: 24 }}>
          Thank you for shopping with AGRODEALS. Your order will be delivered soon via Cash on Delivery.
        </p>

        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 400 }}>
          <button className="btn-shop-now" style={{ flex: 1, background: '#fff', color: '#2d7a4f', border: '1px solid #2d7a4f' }} onClick={() => navigate('/')}>
            Continue Shopping
          </button>
          <button className="btn-shop-now" style={{ flex: 1 }} onClick={downloadInvoice}>
            📄 Download Invoice
          </button>
        </div>

        {/* --- HIDDEN INVOICE HTML FOR PDF GENERATION --- */}
        <div style={{ display: 'none' }}>
          <div ref={invoiceRef} style={invoiceStyle}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #1a3a2a', paddingBottom: 20, marginBottom: 20 }}>
              <div>
                <h1 style={{ color: '#2d7a4f', margin: 0, fontSize: 28, letterSpacing: '-1px' }}>AGRO<span style={{color:'#6fcf7c'}}>DEALS</span></h1>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#555' }}>Your Trusted Agri Input Partner</p>
                <div style={{ marginTop: 12, fontSize: 11, color: '#444', lineHeight: 1.5 }}>
                  <strong>AGL No:</strong> AGL-892374-IN<br/>
                  <strong>TL No:</strong> TL-4482-991<br/>
                  <strong>GSTIN:</strong> 27AADCB2230M1Z4<br/>
                  123 Farming Hub, Green Road, Maharashtra, 400001
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0, fontSize: 24, color: '#333' }}>TAX INVOICE</h2>
                <div style={{ marginTop: 12, fontSize: 12, color: '#444', lineHeight: 1.5 }}>
                  <strong>Invoice No:</strong> INV-{orderId.substring(0,8).toUpperCase()}<br/>
                  <strong>Date:</strong> {date}<br/>
                  <strong>Payment Mode:</strong> Cash on Delivery
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div style={{ marginBottom: 30 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#2d7a4f', textTransform: 'uppercase' }}>Billed To:</h3>
              <div style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>
                <strong>{customerDetails.fullName}</strong><br/>
                {customerDetails.address}<br/>
                {customerDetails.city} - {customerDetails.pincode}<br/>
                Phone: +91 {customerDetails.phone}
              </div>
            </div>

            {/* Item Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 30, fontSize: 12 }}>
              <thead>
                <tr style={{ backgroundColor: '#f0faf4', borderBottom: '1px solid #ccc', borderTop: '1px solid #ccc' }}>
                  <th style={thStyle}>S.No</th>
                  <th style={{...thStyle, textAlign: 'left'}}>Item Description</th>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Rate (₹)</th>
                  <th style={thStyle}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tdStyle}>{index + 1}</td>
                    <td style={{...tdStyle, textAlign: 'left'}}>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      {item.categories && <div style={{ fontSize: 10, color: '#888' }}>{item.categories.name}</div>}
                    </td>
                    <td style={tdStyle}>{item.quantity}</td>
                    <td style={tdStyle}>{item.price.toFixed(2)}</td>
                    <td style={tdStyle}>{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '300px', fontSize: 12 }}>
                <div style={flexRow}>
                  <span>Subtotal:</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div style={flexRow}>
                  <span>CGST (9%):</span>
                  <span>₹{cgst.toFixed(2)}</span>
                </div>
                <div style={flexRow}>
                  <span>SGST (9%):</span>
                  <span>₹{sgst.toFixed(2)}</span>
                </div>
                <div style={{...flexRow, borderTop: '2px solid #ccc', paddingTop: 8, marginTop: 8, fontWeight: 800, fontSize: 16, color: '#2d7a4f'}}>
                  <span>Grand Total:</span>
                  <span>₹{totals.grandTotal.toFixed(2)}</span>
                </div>
                <div style={{ textAlign: 'right', marginTop: 4, fontSize: 10, color: '#888' }}>
                  Total Items: {items.reduce((sum, i) => sum + i.quantity, 0)}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 60, borderTop: '1px solid #eee', paddingTop: 20, textAlign: 'center', fontSize: 10, color: '#666' }}>
              <p style={{ margin: '0 0 4px' }}>This is a computer-generated invoice and does not require a physical signature.</p>
              <p style={{ margin: 0 }}>Thank you for doing business with AGRODEALS.</p>
            </div>

          </div>
        </div>

      </main>
    </div>
  )
}

// --- Invoice CSS Styles for React ---
const invoiceStyle = {
  width: '210mm', // A4 width approx
  minHeight: '297mm',
  padding: '20mm',
  backgroundColor: 'white',
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  color: '#000',
  boxSizing: 'border-box'
}

const thStyle = {
  padding: '10px 8px',
  textAlign: 'right',
  fontWeight: 600,
  color: '#1a3a2a'
}

const tdStyle = {
  padding: '12px 8px',
  textAlign: 'right',
  verticalAlign: 'top'
}

const flexRow = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 6
}
