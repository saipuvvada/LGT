import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Mail, 
  MapPin, 
  Clock, 
  HelpCircle, 
  Send, 
  CheckCircle, 
  Map, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Navigation,
  ShieldAlert,
  Save
} from 'lucide-react';

const FAQS = [
  {
    q: 'How do I place an order on AGRODEALS?',
    a: '1. Browse our catalog on the Shop home page.\n2. Tap on any product and select your desired packaging size (e.g. 1 Unit, 2 Units).\n3. Click "ADD TO BAG" to append the items to your shopping bag.\n4. Go to your Bag/Cart, review your items, and click "PROCEED TO CHECK OUT".\n5. Enter your delivery address and contact information, and click "PLACE ORDER".'
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We strictly support Cash on Delivery (COD) only. This ensures that farmers can verify the quality and seal of physical insecticides, fertilizers, and hybrid seeds upon arrival before paying any money. We do not require any online credit card or pre-payment details.'
  },
  {
    q: 'How do I complete order verification via email?',
    a: 'After successfully placing your order, click the "Download Invoice" button to save your digital PDF receipt. Email this downloaded receipt or mention your Order Invoice No (e.g., INV-XXXXXX) directly to saipuvvada12@gmail.com. Our team will verify the details, and direct shipment communication will follow immediately!'
  },
  {
    q: 'Can I cancel or change my delivery address after placing an order?',
    a: 'Yes. To cancel or modify your shipment details, please send an email to saipuvvada12@gmail.com with your Invoice Number. Our support staff will update or cancel your order immediately if the package has not already left our Karempudi warehouse.'
  }
];

const Support = () => {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState(null);
  
  // Statically fixed official warehouse parameters globally
  const WAREHOUSE_MAP_URL = "https://maps.google.com/maps?q=16.426546,79.724139&t=&z=16&ie=UTF8&iwloc=&output=embed";
  const WAREHOUSE_LABEL = "Official Warehouse Location (16.426546, 79.724139)";

  // Ticket Form States
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', subject: 'order', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ticketPayload, setTicketPayload] = useState({ subject: '', body: '', rawText: '' });

  // Submit ticket construction and dispatch to saipuvvada12@gmail.com and database
  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const subjectText = `AGRODEALS Ticket: [${formData.subject.toUpperCase()}] from ${formData.name}`;
    const bodyText = 
      `=========================================\n` +
      ` AGRODEALS - CUSTOMER SUPPORT INQUIRY \n` +
      `=========================================\n\n` +
      `👤 Customer Name: ${formData.name}\n` +
      `📞 Phone Number: ${formData.phone}\n` +
      `✉️ Email Address: ${formData.email || 'Not Provided'}\n` +
      `📌 Subject Category: ${formData.subject.toUpperCase()}\n\n` +
      `📝 Customer Message Detail:\n` +
      `"${formData.message}"\n\n` +
      `-----------------------------------------\n` +
      `Communication will follow from saipuvvada12@gmail.com\n` +
      `=========================================`;

    const payload = {
      subject: subjectText,
      body: bodyText,
      rawText: `To: saipuvvada12@gmail.com\nSubject: ${subjectText}\n\n${bodyText}`
    };
    setTicketPayload(payload);

    let emailSent = false;

    // 1. Try to save to Supabase support_tickets table if it exists
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert([
          {
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null,
            subject: formData.subject,
            message: formData.message,
            created_at: new Date().toISOString()
          }
        ]);
      if (!error) {
        console.log("Ticket successfully saved to Supabase!");
      } else {
        console.warn("Supabase support_tickets save error (might not exist yet):", error);
      }
    } catch (err) {
      console.warn("Graceful catch - Supabase support_tickets table may not exist:", err);
    }

    // 2. Send via FormSubmit AJAX API
    try {
      const endpoint = import.meta.env.DEV
        ? 'https://formsubmit.co/ajax/6a38a6ee72ec681f80d25d32e01c4d44'
        : '/api/send-email'

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: subjectText,
          Name: formData.name,
          Phone: formData.phone,
          Email: formData.email || 'Not Provided',
          Category: formData.subject.toUpperCase(),
          Message: formData.message,
          _honey: "", // Honeypot field
          _template: "box"
        })
      });

      const resData = await response.json();
      if (response.ok && (resData.success === true || resData.success === "true")) {
        emailSent = true;
      }
    } catch (err) {
      console.error("Failed to post to FormSubmit API:", err);
    }

    // Fall back to opening mailto client if AJAX fails
    if (!emailSent) {
      const mailtoUrl = `mailto:saipuvvada12@gmail.com?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText)}`;
      window.location.href = mailtoUrl;
    }

    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="header" style={{ position: 'relative' }}>
        <div className="header-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }} aria-label="Go home">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <span style={{ fontSize: 18, fontWeight: 700 }}>Customer Support</span>
          </div>
        </div>
      </header>

      <main className="page-content" style={{ padding: '20px 16px', paddingBottom: '90px', maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Contact Grid Info Cards */}
        <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
          
          {/* Left Column: Direct Support Channels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <section className="dashboard-section" style={{ margin: 0 }}>
              <div className="section-header-title">
                <Mail size={20} className="section-icon text-green" />
                <h2>Direct Channels</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13.5px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '24px', backgroundColor: '#ecfdf5', padding: '10px', borderRadius: '12px' }}>✉️</span>
                  <div>
                    <strong>Support Email</strong>
                    <div style={{ color: 'var(--green-primary)', fontWeight: 'bold', marginTop: '2px' }}>
                      <a href="mailto:saipuvvada12@gmail.com">saipuvvada12@gmail.com</a>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '24px', backgroundColor: '#ecfdf5', padding: '10px', borderRadius: '12px' }}>📍</span>
                  <div>
                    <strong>Store Address</strong>
                    <div style={{ color: 'var(--text-mid)', marginTop: '2px' }}>
                      Lakshmi Ganapathi Traders,<br />Main Road, Karempudi, AP
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '24px', backgroundColor: '#ecfdf5', padding: '10px', borderRadius: '12px' }}>⏰</span>
                  <div>
                    <strong>Working Hours</strong>
                    <div style={{ color: 'var(--text-mid)', marginTop: '2px' }}>
                      Mon - Sat: 8:00 AM - 8:00 PM<br />Sunday: Closed
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Email Verification Box */}
            <section className="crop-dashboard-card" style={{ border: '1.5px solid #a7f3d0', backgroundColor: '#f0faf4' }}>
              <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--green-dark)', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 8px 0' }}>
                📧 Order Verification Guide
              </h3>
              <p style={{ fontSize: '12.5px', color: '#1e3a1e', margin: 0, lineHeight: '1.5' }}>
                After downloading your invoice PDF receipt, please email a copy or send your Invoice No to <strong>saipuvvada12@gmail.com</strong>. Our billing desk will verify your details and initiate Cash on Delivery delivery routing immediately.
              </p>
            </section>
          </div>

          {/* Right Column: Google Maps Warehouse Location */}
          <section className="dashboard-section" style={{ margin: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="section-header-title">
              <Map size={20} className="section-icon text-teal" />
              <h2 style={{ flex: 1 }}>Warehouse Map</h2>
              <span className="live-status-pill" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>Verified Pin</span>
            </div>
            
            <div style={{ flex: 1, minHeight: '220px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <iframe 
                title="Google Maps Warehouse Coordinates"
                width="100%" 
                height="100%" 
                style={{ border: 0, minHeight: '220px' }}
                loading="lazy" 
                allowFullScreen
                src={WAREHOUSE_MAP_URL}
              ></iframe>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-dark)', marginTop: '8px', textAlign: 'center', fontWeight: '700' }}>
              📍 {WAREHOUSE_LABEL}
            </div>
          </section>

        </div>

        {/* FAQs Accordion */}
        <section className="dashboard-section" style={{ marginBottom: '24px' }}>
          <div className="section-header-title">
            <HelpCircle size={20} className="section-icon text-amber" />
            <h2>Frequently Asked Questions (FAQ)</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {FAQS.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div key={idx} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <div 
                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '6px 0' }}
                  >
                    <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                      {faq.q}
                    </h3>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                  {isExpanded && (
                    <p style={{ fontSize: '13px', color: 'var(--text-mid)', margin: '8px 0 0 0', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact/Support Request Form */}
        <section className="dashboard-section">
          <div className="section-header-title">
            <Send size={20} className="section-icon text-green" />
            <h2>Send Support Inquiry</h2>
          </div>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#f0faf4', border: '1.5px solid #a7f3d0', borderRadius: '12px' }}>
              <span style={{ fontSize: '44px', display: 'block', marginBottom: '8px' }}>🚀</span>
              <h3 style={{ color: 'var(--green-dark)', margin: '0 0 6px 0' }}>Ticket Routed Automatically!</h3>
              
              <p style={{ color: '#1e3a1e', fontSize: '13.5px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Your customer support ticket has been compiled and **automatically routed** to the support inbox for <strong>saipuvvada12@gmail.com</strong>!
              </p>

              <div className="crop-dashboard-card" style={{ border: '1.5px solid #fed7aa', backgroundColor: '#fffbeb', textAlign: 'left', padding: '16px', margin: '16px auto', maxWidth: '520px', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#c2410c', fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📢 Store Owner / Admin Warning: Activation Required
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#9a3412', lineHeight: 1.5 }}>
                  Because this is an automated submission system, the **very first time** you submit a ticket, FormSubmit will send a verification email to your inbox (**saipuvvada12@gmail.com**).
                  <br /><br />
                  <strong>Please check your email (and spam/promotions folder) for an activation email from FormSubmit and click the link.</strong> Once you activate it once, all future customer inquiry tickets will land directly in your inbox instantly without any extra steps!
                </p>
              </div>

              <p style={{ color: 'var(--text-mid)', fontSize: '12.5px', margin: '16px 0', lineHeight: 1.5 }}>
                If you didn't receive the automated submission or want to use a direct channel, you can still launch Gmail or copy the formatted text below:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '340px', margin: '0 auto 16px' }}>
                <a 
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=saipuvvada12@gmail.com&su=${encodeURIComponent(ticketPayload.subject)}&body=${encodeURIComponent(ticketPayload.body)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="add-crop-btn"
                  style={{ justifyContent: 'center', background: '#ea4335', fontSize: '12.5px', padding: '10px 14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 700 }}
                >
                  ✉️ Open Compose in browser Gmail
                </a>

                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(ticketPayload.rawText);
                    alert("📋 Ticket details copied to clipboard!\nYou can now paste it directly into any email compose window addressed to saipuvvada12@gmail.com.");
                  }}
                  className="add-crop-btn"
                  style={{ justifyContent: 'center', background: '#2563eb', fontSize: '12.5px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 700 }}
                >
                  📋 Copy Ticket Text to Clipboard
                </button>
              </div>

              <p style={{ color: 'var(--text-light)', fontSize: '11px', margin: '12px 0 0 0', lineHeight: 1.4 }}>
                Send the details directly to <strong>saipuvvada12@gmail.com</strong>.
              </p>

              <button onClick={() => setSubmitted(false)} className="btn-shop-now" style={{ marginTop: '20px', padding: '8px 20px', fontSize: '12.5px' }}>
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div className="crop-dashboard-card" style={{ border: '1.5px solid #fed7aa', backgroundColor: '#fffbeb', display: 'flex', gap: '10px', padding: '12px' }}>
                <ShieldAlert size={20} style={{ color: '#d97706', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '12px', color: '#92400e', lineHeight: 1.4 }}>
                  <strong>How resolving works:</strong> Submitting this ticket will immediately open your device's email client (Gmail, Outlook, etc.) with a fully pre-filled support email addressed to <strong>saipuvvada12@gmail.com</strong>. Simply hit <strong>Send</strong> in your mail app, and direct verification communication will follow!
                </p>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input 
                    type="text" 
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input 
                    type="tel" 
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Inquiry Type</label>
                  <select 
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  >
                    <option value="order">Order Verification / Status</option>
                    <option value="pesticide">Pesticide / Medicine Dosages</option>
                    <option value="delivery">COD Delivery Issue</option>
                    <option value="seed">Hybrid Seeds Query</option>
                    <option value="other">Other Inquiry</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Inquiry Message *</label>
                <textarea 
                  placeholder="Tell us what you need help with. Please include your INV-XXXXXX order number if inquiring about an active order..."
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="add-crop-btn" style={{ justifyContent: 'center', width: '100%', marginTop: '8px' }}>
                {loading ? 'Constructing Email Payload...' : 'Submit Support Ticket'}
              </button>
            </form>
          )}
        </section>

      </main>
    </div>
  );
};

export default Support;
