import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, Leaf, Truck, HeartHandshake, Phone, MapPin, Star } from 'lucide-react';

// ─── Animated counter hook ─────────────────────────────────────────────────
const useCounter = (target, duration = 1800, inView) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return count;
};

// ─── Intersection Observer hook ────────────────────────────────────────────
const useInView = () => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
};

// ─── Stats Section ─────────────────────────────────────────────────────────
const StatCard = ({ value, suffix, label, icon }) => {
  const [ref, inView] = useInView();
  const count = useCounter(value, 1800, inView);
  return (
    <div ref={ref} className="about-stat-card">
      <div className="about-stat-icon">{icon}</div>
      <div className="about-stat-number">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="about-stat-label">{label}</div>
    </div>
  );
};

// ─── Value proposition data ────────────────────────────────────────────────
const VALUES = [
  {
    icon: <ShieldCheck size={28} />,
    emoji: '🛡️',
    title: 'Genuine Products Only',
    color: '#059669',
    bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
    border: '#a7f3d0',
    desc: 'Every product we stock — from insecticides to hybrid seeds — is sourced directly from registered manufacturers with valid license numbers. No counterfeits, no diluted packs, no shortcuts. What you see is exactly what you get, sealed and certified.'
  },
  {
    icon: <Leaf size={28} />,
    emoji: '💰',
    title: 'Lowest Market Prices',
    color: '#2563eb',
    bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    border: '#93c5fd',
    desc: 'We cut out multiple middlemen and work directly with distributors, passing the savings straight to you. Compare our prices with any local agri shop — we consistently offer 15–30% lower rates on the same quality products.'
  },
  {
    icon: <HeartHandshake size={28} />,
    emoji: '🤝',
    title: 'Farmer-First Support',
    color: '#7c3aed',
    bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    border: '#c4b5fd',
    desc: 'Not sure which pesticide to use? Worried about dosage? Our team is one call or message away. We believe in building long-term relationships with every farmer, not just making one-time sales. Your crop success is our success.'
  },
  {
    icon: <Truck size={28} />,
    emoji: '🚚',
    title: 'Cash on Delivery',
    color: '#b45309',
    bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    border: '#fcd34d',
    desc: 'We only accept Cash on Delivery — because we believe you should inspect the product in person before paying a single rupee. Open the parcel, verify the seal and batch number, then pay. That\'s our trust guarantee to every customer.'
  },
];

// ─── Product categories we sell ───────────────────────────────────────────
const PRODUCTS = [
  { emoji: '🧴', name: 'Insecticides', desc: 'Imidacloprid, Fipronil, Chlorpyrifos' },
  { emoji: '🌿', name: 'Pesticides', desc: 'Mancozeb, Propiconazole, Tricyclazole' },
  { emoji: '⚗️',  name: 'Fungicides', desc: 'Carbendazim, Copper Hydroxide' },
  { emoji: '🌱', name: 'Fertilizers', desc: 'Urea, DAP, NPK Blends, Micronutrients' },
  { emoji: '🌾', name: 'Hybrid Seeds', desc: 'Paddy, Cotton, Chilli, Tomato, Wheat' },
  { emoji: '🧪', name: 'Soil Amendments', desc: 'Gypsum, Lime, Organic Manure' },
];

// ─── Testimonials ─────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Ramu Reddy',
    location: 'Karempudi, AP',
    crop: 'Cotton Farmer',
    text: 'Earlier I was paying ₹850 for Imidacloprid elsewhere. Same 100ml pack was ₹620 at AgroDeals. Saved ₹230 per bottle and got genuine product on delivery — unbelievable!',
    stars: 5,
  },
  {
    name: 'Lakshmi Prasad',
    location: 'Narasaraopet, AP',
    crop: 'Paddy & Chilli Grower',
    text: 'Called them about stem borer problem in my paddy field. They guided me which medicine to buy and proper dosage. Never expected this level of support from an online store.',
    stars: 5,
  },
  {
    name: 'Venkat Rao',
    location: 'Macherla, AP',
    crop: 'Vegetable Grower',
    text: 'COD delivery is the best feature. I open the parcel, check the seal and manufacturing date, and then pay. Full trust. Other online stores don\'t do this.',
    stars: 5,
  },
];

// ─── Main Component ────────────────────────────────────────────────────────
const AboutUs = () => {
  const navigate = useNavigate();
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(i => (i + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="about-shell">

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header className="header" style={{ position: 'relative' }}>
        <div className="header-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}
              aria-label="Go home"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <span style={{ fontSize: 18, fontWeight: 700 }}>About Us</span>
          </div>
          <div className="consult-badge" style={{ fontSize: '12px' }}>
            <Sparkles size={14} className="sparkle-icon" />
            <span>Since 2020</span>
          </div>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="about-hero">
        <div className="about-hero-bg-blob blob1" />
        <div className="about-hero-bg-blob blob2" />
        <div className="about-hero-content">
          <div className="about-hero-badge">
            <span>🌾</span> Rooted in Agriculture
          </div>
          <h1 className="about-hero-title">
            Your Most Trusted<br />
            <span className="about-hero-highlight">Agri Input Store</span>
          </h1>
          <p className="about-hero-sub">
            From the heart of Karempudi, Andhra Pradesh — we deliver genuine pesticides,
            insecticides, fertilizers, and hybrid seeds directly to farmers at the lowest
            market prices, with Cash on Delivery and expert crop support.
          </p>
          <div className="about-hero-actions">
            <button className="about-hero-btn primary" onClick={() => navigate('/')}>
              🛒 Shop Now
            </button>
            <button className="about-hero-btn secondary" onClick={() => navigate('/consult')}>
              🌿 Ask Dr. Agro
            </button>
          </div>
        </div>

        {/* Floating product emojis animation */}
        <div className="about-float-emojis" aria-hidden="true">
          {['🌾','🧴','🌿','🌶️','🧪','🌱','🍅','⚗️'].map((e, i) => (
            <span key={i} className={`float-emoji fe-${i}`}>{e}</span>
          ))}
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────── */}
      <section className="about-stats-bar">
        <StatCard value={500}  suffix="+"  label="Happy Farmers Served"  icon="👨‍🌾" />
        <StatCard value={200}  suffix="+"  label="Products In Stock"      icon="📦" />
        <StatCard value={15}   suffix="%"  label="Avg Savings vs Market"  icon="💸" />
        <StatCard value={4}    suffix="+"  label="Years of Trusted Service" icon="🏆" />
      </section>

      {/* ── WHO WE ARE ────────────────────────────────────────────────── */}
      <section className="about-section">
        <div className="about-section-inner">
          <div className="about-label">Our Story</div>
          <h2 className="about-section-title">
            Born From the Fields of <span style={{ color: 'var(--green-primary)' }}>Andhra Pradesh</span>
          </h2>
          <p className="about-section-body">
            <strong>Lakshmi Ganapathi Traders</strong>, operating under the brand <strong>AGRODEALS</strong>,
            was founded with a single belief — that every farmer deserves access to <em>genuine, affordable</em> agricultural inputs
            without being exploited by inflated retail markups or counterfeit products.
          </p>
          <p className="about-section-body">
            Situated at our warehouse in Karempudi, Andhra Pradesh, we serve farmers across the Krishna and Guntur districts.
            Our founder spent years watching farmers overpay for the same products they could get cheaper directly. AGRODEALS was
            born to solve this — creating a direct, transparent bridge between quality manufacturers and the people who actually work the land.
          </p>

          <div className="about-origin-card">
            <MapPin size={18} style={{ color: 'var(--green-primary)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Official Warehouse</strong><br />
              <span style={{ color: 'var(--text-mid)', fontSize: '13px' }}>Main Road, Karempudi, Guntur District, Andhra Pradesh — 522614</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUE PROPOSITIONS ────────────────────────────────────────── */}
      <section className="about-section about-section-tinted">
        <div className="about-section-inner">
          <div className="about-label">Why Choose Us</div>
          <h2 className="about-section-title">
            What Makes <span style={{ color: 'var(--green-primary)' }}>AgroDeals</span> Different
          </h2>
          <div className="about-values-grid">
            {VALUES.map((v, i) => (
              <div
                key={i}
                className="about-value-card"
                style={{
                  background: v.bg,
                  borderColor: v.border,
                }}
              >
                <div className="about-value-top">
                  <div className="about-value-emoji">{v.emoji}</div>
                  <div className="about-value-icon" style={{ color: v.color }}>
                    {v.icon}
                  </div>
                </div>
                <h3 className="about-value-title" style={{ color: v.color }}>{v.title}</h3>
                <p className="about-value-desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT WE SELL ──────────────────────────────────────────────── */}
      <section className="about-section">
        <div className="about-section-inner">
          <div className="about-label">Our Products</div>
          <h2 className="about-section-title">
            Everything Your Crop Needs, <span style={{ color: 'var(--green-primary)' }}>Under One Roof</span>
          </h2>
          <p className="about-section-body">
            We stock a curated catalogue of over 200 agricultural products — all sourced from registered manufacturers with
            valid CIB licenses and FSSAI approvals.
          </p>
          <div className="about-products-grid">
            {PRODUCTS.map((p, i) => (
              <div key={i} className="about-product-chip">
                <span className="about-product-emoji">{p.emoji}</span>
                <div>
                  <div className="about-product-name">{p.name}</div>
                  <div className="about-product-desc">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="about-shop-link"
            onClick={() => navigate('/')}
          >
            Browse Full Catalogue →
          </button>
        </div>
      </section>

      {/* ── PROMISE BANNER ────────────────────────────────────────────── */}
      <section className="about-promise-banner">
        <div className="about-promise-inner">
          <div className="about-promise-icon">🤝</div>
          <h2 className="about-promise-title">The AgroDeals Promise</h2>
          <div className="about-promise-grid">
            {[
              { icon: '✅', text: 'Every product is 100% genuine and sealed' },
              { icon: '💰', text: 'Prices 15–30% lower than local retail shops' },
              { icon: '📦', text: 'Cash on Delivery — pay only after you inspect' },
              { icon: '📞', text: 'Expert crop advisory support at every step' },
              { icon: '🚚', text: 'Fast delivery directly to your doorstep' },
              { icon: '🌾', text: 'Locally rooted, farmer-first philosophy' },
            ].map((item, i) => (
              <div key={i} className="about-promise-item">
                <span className="about-promise-check">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
      <section className="about-section">
        <div className="about-section-inner">
          <div className="about-label">Farmer Reviews</div>
          <h2 className="about-section-title">
            Real Words from <span style={{ color: 'var(--green-primary)' }}>Real Farmers</span>
          </h2>

          <div className="about-testimonial-slider">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className={`about-testimonial-card ${i === activeTestimonial ? 'active' : ''}`}
              >
                <div className="about-testimonial-stars">
                  {Array(t.stars).fill(0).map((_, s) => (
                    <Star key={s} size={14} fill="#fbbf24" stroke="#fbbf24" />
                  ))}
                </div>
                <p className="about-testimonial-text">"{t.text}"</p>
                <div className="about-testimonial-author">
                  <div className="about-testimonial-avatar">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="about-testimonial-name">{t.name}</div>
                    <div className="about-testimonial-meta">{t.crop} · {t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="about-testimonial-dots">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                className={`about-dot ${i === activeTestimonial ? 'active' : ''}`}
                onClick={() => setActiveTestimonial(i)}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER ────────────────────────────────────────────────── */}
      <section className="about-cta">
        <div className="about-cta-inner">
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🌱</span>
          <h2 className="about-cta-title">Ready to Shop Smart?</h2>
          <p className="about-cta-sub">
            Join hundreds of farmers who save money, get genuine products, and grow with confidence.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
            <button className="about-hero-btn primary" onClick={() => navigate('/')}>
              🛒 Start Shopping
            </button>
            <button className="about-hero-btn secondary" onClick={() => navigate('/support')}>
              🎧 Contact Support
            </button>
          </div>
          <div className="about-cta-contact">
            <Phone size={14} />
            <a href="mailto:saipuvvada12@gmail.com">saipuvvada12@gmail.com</a>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutUs;
