import { useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import html2pdf from 'html2pdf.js'

/* ─── Store Constants ──────────────────────────────────────────────── */
const STORE = {
  name:    'Lakshmi Ganapathi Traders',
  tagline: 'Licensed Agri Input Dealer',
  address: 'Main Road, Karempudi',
  agl:     'PLND/43/DAO/2023/15',
  sl:      'GUN/18/JDA/SD/2016/11909',
  pl:      '77/09-10',
  gst:     '37ANKPD0775A1ZC',
}

export default function OrderSuccess() {
  const { state } = useLocation()
  const navigate  = useNavigate()
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
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const downloadInvoice = () => {
    const element = invoiceRef.current
    const opt = {
      margin: 8,
      filename: `Invoice_LGT_${orderId.substring(0, 8).toUpperCase()}.pdf`,
      image:    { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
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
          Thank you for shopping with Lakshmi Ganapathi Traders. Your order will be delivered soon via Cash on Delivery.
        </p>

        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 400 }}>
          <button className="btn-shop-now" style={{ flex: 1, background: '#fff', color: '#2d7a4f', border: '1px solid #2d7a4f' }} onClick={() => navigate('/')}>
            Continue Shopping
          </button>
          <button className="btn-shop-now" style={{ flex: 1 }} onClick={downloadInvoice}>
            📄 Download Invoice
          </button>
        </div>

        {/* ── HIDDEN INVOICE FOR PDF ────────────────────────────────── */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div ref={invoiceRef} style={invoiceStyle}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #1a3a2a', paddingBottom: 16, marginBottom: 16 }}>
              {/* Left – Store info */}
              <div>
                <h1 style={{ margin: 0, fontSize: 22, color: '#1a3a2a', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                  Lakshmi Ganapathi Traders
                </h1>
                <p style={{ margin: '3px 0 0', fontSize: 10.5, color: '#2d7a4f', fontWeight: 600 }}>
                  Licensed Agri Input Dealer
                </p>
                <div style={{ marginTop: 10, fontSize: 10, color: '#333', lineHeight: 1.7 }}>
                  <div>Main Road, Karempudi</div>
                  <div><strong>AGL.NO:</strong> {STORE.agl}</div>
                  <div><strong>SL.NO:</strong>  {STORE.sl}</div>
                  <div><strong>PL.NO:</strong>  {STORE.pl}</div>
                  <div><strong>GST.NO:</strong> {STORE.gst}</div>
                </div>
              </div>

              {/* Right – Invoice meta */}
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0, fontSize: 20, color: '#1a3a2a', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Tax Invoice
                </h2>
                <div style={{ marginTop: 10, fontSize: 10, color: '#333', lineHeight: 1.7 }}>
                  <div><strong>Invoice No:</strong> INV-{orderId.substring(0, 8).toUpperCase()}</div>
                  <div><strong>Date:</strong> {date}</div>
                  <div><strong>Payment:</strong> Cash on Delivery</div>
                </div>
              </div>
            </div>

            {/* ── Billed To ── */}
            <div style={{ marginBottom: 20, background: '#f8fdf9', padding: '10px 14px', borderRadius: 6, border: '1px solid #d4edda' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#2d7a4f', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>Billed To</div>
              <div style={{ fontSize: 11, color: '#222', lineHeight: 1.6 }}>
                <strong>{customerDetails.fullName}</strong><br/>
                {customerDetails.address}<br/>
                {customerDetails.city} – {customerDetails.pincode}<br/>
                Phone: +91 {customerDetails.phone}
              </div>
            </div>

            {/* ── Item Table ── */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 10.5 }}>
              <thead>
                <tr style={{ backgroundColor: '#1a3a2a', color: 'white' }}>
                  <th style={th('center', 28)}>S.No</th>
                  <th style={th('left',   'auto')}>Item Description</th>
                  <th style={th('center', 56)}>HSN Code</th>
                  <th style={th('center', 38)}>Qty</th>
                  <th style={th('right',  60)}>Rate (₹)</th>
                  <th style={th('center', 42)}>GST%</th>
                  <th style={th('right',  60)}>GST (₹)</th>
                  <th style={th('right',  70)}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const base    = item.price * item.quantity
                  const gstAmt  = item.gstAmount ?? parseFloat((base * (item.gstRate ?? 18) / 100).toFixed(2))
                  const total   = parseFloat((base + gstAmt).toFixed(2))
                  const isEven  = index % 2 === 0
                  return (
                    <tr key={item.id} style={{ backgroundColor: isEven ? '#ffffff' : '#f7fdf9', borderBottom: '1px solid #e0e0e0' }}>
                      <td style={td('center')}>{index + 1}</td>
                      <td style={td('left')}>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        {item.categories && <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>{item.categories.name}</div>}
                        {item.quantity_vol && <div style={{ fontSize: 9, color: '#888' }}>Size: {item.quantity_vol}</div>}
                      </td>
                      <td style={{ ...td('center'), fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.5px' }}>
                        {item.hsn_code || '—'}
                      </td>
                      <td style={td('center')}>{item.quantity}</td>
                      <td style={td('right')}>{item.price.toFixed(2)}</td>
                      <td style={td('center')}>{item.gstRate ?? item.gst_rate ?? 18}%</td>
                      <td style={td('right')}>{gstAmt.toFixed(2)}</td>
                      <td style={{ ...td('right'), fontWeight: 600 }}>{total.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* ── Totals ── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
              <div style={{ width: 260, fontSize: 11 }}>
                <Row label="Subtotal (excl. GST)" value={`₹${totals.subtotal.toFixed(2)}`} />
                {(() => {
                  const effRate = totals.subtotal > 0
                    ? ((totals.totalGst / totals.subtotal) * 100).toFixed(0)
                    : 18
                  const halfRate = (Number(effRate) / 2).toFixed(1)
                  return (
                    <>
                      <Row label={`CGST (${halfRate}%)`} value={`₹${totals.cgst.toFixed(2)}`} />
                      <Row label={`SGST (${halfRate}%)`} value={`₹${totals.sgst.toFixed(2)}`} />
                    </>
                  )
                })()}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1a3a2a', paddingTop: 8, marginTop: 8, fontWeight: 800, fontSize: 14, color: '#1a3a2a' }}>
                  <span>Grand Total</span>
                  <span>₹{totals.grandTotal.toFixed(2)}</span>
                </div>
                <div style={{ textAlign: 'right', marginTop: 4, fontSize: 9, color: '#888' }}>
                  Total Items: {items.reduce((s, i) => s + i.quantity, 0)} | GST Inclusive Amount
                </div>
              </div>
            </div>

            {/* ── Signature + Footer ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
              <div style={{ fontSize: 9, color: '#777', maxWidth: 300, lineHeight: 1.6 }}>
                <strong style={{ color: '#333' }}>Terms &amp; Conditions:</strong><br/>
                • All disputes subject to Karempudi jurisdiction only.<br/>
                • Goods once sold will not be taken back.<br/>
                • Subject to availability of stock.
              </div>
              <div style={{ textAlign: 'center', minWidth: 140 }}>
                <div style={{ borderBottom: '1px solid #999', width: 140, marginBottom: 6 }}></div>
                <div style={{ fontSize: 9, color: '#555' }}>Authorised Signatory</div>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: '#1a3a2a', marginTop: 2 }}>Lakshmi Ganapathi Traders</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: 10, textAlign: 'center', fontSize: 9, color: '#999' }}>
              <p style={{ margin: '0 0 3px' }}>This is a computer-generated invoice and does not require a physical signature.</p>
              <p style={{ margin: 0 }}>Thank you for your business — Lakshmi Ganapathi Traders, Karempudi</p>
            </div>

          </div>
        </div>
        {/* ── end hidden invoice ── */}

      </main>
    </div>
  )
}

/* ── Helper Components ─────────────────────────────────────────── */
function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, color: '#444' }}>
      <span>{label}</span><span>{value}</span>
    </div>
  )
}

/* ── Invoice Style Helpers ─────────────────────────────────────── */
const invoiceStyle = {
  width: '210mm',
  minHeight: '297mm',
  padding: '14mm 16mm',
  backgroundColor: 'white',
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  color: '#111',
  boxSizing: 'border-box',
}

function th(align, width) {
  return {
    padding: '9px 8px',
    textAlign: align,
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: '0.3px',
    width: width !== 'auto' ? width : undefined,
  }
}

function td(align) {
  return {
    padding: '9px 8px',
    textAlign: align,
    verticalAlign: 'top',
  }
}
