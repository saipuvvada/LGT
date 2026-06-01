import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Calendar, 
  ShieldCheck, 
  Scale, 
  Flame, 
  ArrowLeft,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import BottomNav from '../components/BottomNav';

// Fallback seed data in case Supabase table is not yet updated or migrated
const FALLBACK_RATES = [
  {
    id: 'chilli-teja',
    crop_name: 'Chilli (మిర్చి)',
    variety: 'Guntur Teja (S17)',
    price_per_quintal: 18500,
    price_change: 250,
    min_price: 18000,
    max_price: 18800,
    moisture_standard: '< 10%',
    market_status: 'Bullish',
    description: 'High export demand from China and Southeast Asia. Grade-A cold storage stocks are drawing premium rates in Guntur Yard.',
    emoji: '🌶️',
    historical_prices: [18100, 18200, 18150, 18300, 18350, 18250, 18500]
  },
  {
    id: 'cotton-bunny',
    crop_name: 'Cotton (పత్తి)',
    variety: 'Bunny / Brahma',
    price_per_quintal: 7600,
    price_change: -100,
    min_price: 7400,
    max_price: 7800,
    moisture_standard: '< 8%',
    market_status: 'Bearish',
    description: 'Staple length averaging 29-30mm. Price slightly soft due to high moisture arrivals in early morning transactions.',
    emoji: '🌾',
    historical_prices: [7800, 7750, 7700, 7650, 7700, 7700, 7600]
  },
  {
    id: 'paddy-sona',
    crop_name: 'Paddy (వరి)',
    variety: 'Sona Masuri (BPT 5204)',
    price_per_quintal: 2800,
    price_change: 50,
    min_price: 2700,
    max_price: 2900,
    moisture_standard: '< 14%',
    market_status: 'Stable',
    description: 'Superfine variety showing strong domestic consumption pull. Millers actively procuring dry, high-yield grain bags.',
    emoji: '🍚',
    historical_prices: [2750, 2760, 2750, 2780, 2790, 2780, 2800]
  }
];

// Helper to determine bag size in kg based on crop type
const getBagWeight = (cropName) => {
  const name = cropName.toLowerCase();
  if (name.includes('chilli') || name.includes('మిర్చి')) return 45;
  if (name.includes('cotton') || name.includes('పత్తి')) return 50;
  if (name.includes('paddy') || name.includes('వరి')) return 75;
  return 50; // standard bag default
};

export default function MandiRates() {
  const navigate = useNavigate();
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState('quintal'); // 'quintal' (100kg), 'ton' (1000kg), 'bag' (crop-specific kg)
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    fetchMandiRates();
  }, []);

  async function fetchMandiRates() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mandi_rates')
        .select('*')
        .order('crop_name', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Map historical prices safety parsing if text
        const parsedData = data.map(item => {
          let history = item.historical_prices;
          if (typeof history === 'string') {
            try { history = JSON.parse(history); } catch (e) { history = []; }
          }
          return { ...item, historical_prices: Array.isArray(history) ? history : [] };
        });
        setRates(parsedData);
      } else {
        // Fall back to seed data
        setRates(FALLBACK_RATES);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.warn("Using fallback local seed rates due to database connection:", err.message);
      setRates(FALLBACK_RATES);
    } finally {
      setLoading(false);
    }
  }

  // Draw sparkline trends using HTML5 Canvas directly in react loop
  const Sparkline = ({ prices, bullish }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !prices || prices.length < 2) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const maxVal = Math.max(...prices);
      const minVal = Math.min(...prices);
      const range = maxVal - minVal || 1;

      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = bullish ? '#10b981' : '#ef4444';

      const paddingY = 4;
      const height = canvas.height - (paddingY * 2);
      const width = canvas.width;

      prices.forEach((price, idx) => {
        const x = (idx / (prices.length - 1)) * width;
        const normalizedY = (price - minVal) / range;
        // invert y axis because canvas 0 is top
        const y = paddingY + (height - (normalizedY * height));
        
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Create gradient fill below sparkline
      ctx.lineTo(width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, bullish ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fill();

    }, [prices, bullish]);

    return <canvas ref={canvasRef} width={90} height={34} style={{ display: 'block' }} />;
  };

  const convertPrice = (pricePerQuintal, cropName) => {
    const price = parseFloat(pricePerQuintal);
    if (unit === 'quintal') {
      return `₹${price.toLocaleString('en-IN')}`;
    }
    if (unit === 'ton') {
      const tonPrice = price * 10;
      return `₹${tonPrice.toLocaleString('en-IN')}`;
    }
    if (unit === 'bag') {
      const bagWeight = getBagWeight(cropName);
      const bagPrice = Math.round((price / 100) * bagWeight);
      return `₹${bagPrice.toLocaleString('en-IN')}`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const getPriceLabel = (cropName) => {
    if (unit === 'quintal') return 'Per Quintal (100 kg)';
    if (unit === 'ton') return 'Per Metric Ton (1000 kg)';
    if (unit === 'bag') return `Per Bag (${getBagWeight(cropName)} kg)`;
    return 'Per Quintal';
  };

  const dateStr = lastUpdated.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  return (
    <div className="myfarm-container" style={{ paddingBottom: '90px' }}>
      
      {/* Header */}
      <header className="myfarm-header" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ background: 'none', border: 'none', color: 'var(--text-dark)', cursor: 'pointer', display: 'flex', padding: 0 }} 
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="myfarm-title" style={{ fontSize: '20px', fontWeight: 800 }}>Guntur Mandi Board</h1>
            <p className="myfarm-subtitle" style={{ fontSize: '11px', margin: '2px 0 0' }}>గంటూరు మిర్చి యార్డ్ లైవ్ ధరలు</p>
          </div>
        </div>
        <button 
          onClick={fetchMandiRates} 
          disabled={loading}
          style={{ background: 'var(--green-light)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-primary)', cursor: 'pointer', transition: 'transform 0.2s' }}
          className={loading ? 'spinning' : ''}
          title="Refresh prices"
        >
          <RefreshCw size={16} />
        </button>
      </header>

      {/* Marquee Ticker */}
      <div className="mandi-ticker-wrap" style={{ 
        background: 'linear-gradient(90deg, #1b5e20 0%, #2e7d32 100%)', 
        color: 'white', 
        padding: '10px 14px', 
        borderRadius: '12px', 
        marginBottom: '20px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 4px 15px rgba(46, 125, 50, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.2)', 
          padding: '2px 8px', 
          borderRadius: '4px', 
          fontSize: '11px', 
          fontWeight: 800, 
          zIndex: 2, 
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          🔴 Live Ticker
        </div>
        <div className="marquee" style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', position: 'relative' }}>
          <div style={{ display: 'inline-block', animation: 'marqueeScroll 22s linear infinite', fontSize: '13px', fontWeight: 700 }}>
            {rates.map((item, idx) => {
              const change = parseFloat(item.price_change || 0);
              const sign = change >= 0 ? '▲' : '▼';
              return (
                <span key={item.id || idx} style={{ marginRight: '30px' }}>
                  {item.emoji} {item.crop_name} - {item.variety}:{' '}
                  <strong style={{ color: '#fff' }}>₹{parseFloat(item.price_per_quintal).toLocaleString('en-IN')}</strong>/Qt{' '}
                  <span style={{ color: change >= 0 ? '#80e27e' : '#ff7961', fontSize: '11px', marginLeft: '3px' }}>
                    {sign} {change >= 0 ? '+' : ''}{change}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Controller Area */}
      <div className="mandi-controller" style={{ 
        background: 'white', 
        padding: '18px', 
        borderRadius: '16px', 
        boxShadow: 'var(--shadow-sm)', 
        border: '1px solid var(--border)', 
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-light)', fontWeight: 600 }}>
            <Calendar size={15} style={{ color: 'var(--green-primary)' }} />
            <span>Updated: Today, {dateStr}</span>
          </div>
          <span style={{ fontSize: '11px', background: '#e8f5e9', color: 'var(--green-primary)', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
            Active APMC Market
          </span>
        </div>

        {/* Dynamic Unit Selector Toggle */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-light)', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📊 Standard Display Unit
          </label>
          <div style={{ 
            display: 'flex', 
            background: '#f1f5f9', 
            padding: '3px', 
            borderRadius: '10px', 
            border: '1px solid #e2e8f0' 
          }}>
            {[
              { id: 'quintal', label: 'Quintal (100 kg)', icon: <Scale size={13} /> },
              { id: 'ton', label: 'Metric Ton (1000 kg)', icon: <Scale size={13} /> },
              { id: 'bag', label: 'Jute Bag (Pack Size)', icon: <Scale size={13} /> },
            ].map((opt) => {
              const active = unit === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setUnit(opt.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    border: 'none',
                    borderRadius: '8px',
                    background: active ? 'white' : 'transparent',
                    color: active ? 'var(--green-primary)' : 'var(--text-mid)',
                    fontWeight: active ? 800 : 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: active ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid List */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <div className="typing-indicator" style={{ justifyContent: 'center', marginBottom: '14px' }}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p style={{ color: 'var(--text-light)', fontSize: '13px', fontWeight: 600 }}>Syncing yard registers...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {rates.map((item, idx) => {
            const isBullish = item.market_status?.toLowerCase() === 'bullish';
            const isBearish = item.market_status?.toLowerCase() === 'bearish';
            const active = activeCard === item.id;
            const change = parseFloat(item.price_change || 0);

            return (
              <div 
                key={item.id || idx} 
                className="cart-item" 
                style={{ 
                  margin: 0, 
                  padding: '18px', 
                  position: 'relative', 
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: active ? '2px solid var(--green-primary)' : '1px solid var(--border)',
                  boxShadow: active ? '0 6px 20px rgba(0,0,0,0.08)' : 'var(--shadow-sm)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onClick={() => setActiveCard(active ? null : item.id)}
              >
                
                {/* Visual Accent Tag */}
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '4px', 
                  height: '100%', 
                  backgroundColor: isBullish ? '#10b981' : isBearish ? '#ef4444' : '#64748b'
                }} />

                {/* Top Info Layout */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ 
                      fontSize: '28px', 
                      backgroundColor: '#f8fafc', 
                      width: '46px', 
                      height: '46px', 
                      borderRadius: '10px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      {item.emoji}
                    </span>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 850, color: 'var(--text-dark)' }}>{item.crop_name}</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 600, marginTop: '2px' }}>
                        Variety: <span style={{ color: 'var(--text-dark)' }}>{item.variety}</span>
                      </p>
                    </div>
                  </div>

                  {/* Sparkline & Status */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <Sparkline prices={item.historical_prices || []} bullish={change >= 0} />
                    <span style={{ 
                      fontSize: '9px', 
                      fontWeight: 800, 
                      letterSpacing: '0.4px',
                      textTransform: 'uppercase',
                      color: isBullish ? '#065f46' : isBearish ? '#991b1b' : '#334155',
                      background: isBullish ? '#d1fae5' : isBearish ? '#fee2e2' : '#f1f5f9',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {item.market_status}
                    </span>
                  </div>
                </div>

                {/* Dynamic Price Display */}
                <div style={{ 
                  background: '#f8fafc', 
                  borderRadius: '12px', 
                  padding: '12px 14px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  border: '1px solid #f1f5f9'
                }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>
                      {getPriceLabel(item.crop_name)}
                    </span>
                    <span style={{ fontSize: '22px', fontWeight: 900, color: 'var(--green-primary)' }}>
                      {convertPrice(item.price_per_quintal, item.crop_name)}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 800, 
                      color: change >= 0 ? '#10b981' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {change >= 0 ? '+' : ''}{change}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', marginTop: '4px' }}>
                      Range: ₹{item.min_price}–₹{item.max_price}
                    </span>
                  </div>
                </div>

                {/* Specifications Bar */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', padding: '0 4px' }}>
                  <div>
                    <span style={{ color: 'var(--text-light)' }}>Moisture Standard:</span>{' '}
                    <strong style={{ color: 'var(--text-dark)' }}>{item.moisture_standard || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-light)' }}>Region:</span>{' '}
                    <strong style={{ color: 'var(--text-dark)' }}>Guntur Yard</strong>
                  </div>
                </div>

                {/* Expanded Creative Description Cards */}
                {active && (
                  <div style={{ 
                    marginTop: '16px', 
                    paddingTop: '16px', 
                    borderTop: '1px dashed #e2e8f0',
                    animation: 'slideUp 0.25s cubic-bezier(0, 0, 0.2, 1)'
                  }}>
                    <h4 style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Flame size={15} style={{ color: '#e65100' }} />
                      Market Outlook & Grade Quality:
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-mid)', lineHeight: '1.5', margin: 0 }}>
                      {item.description}
                    </p>

                    {/* Direct E-Commerce Cross-sell Redirect */}
                    <div style={{ 
                      marginTop: '14px', 
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
                      borderRadius: '10px', 
                      padding: '12px', 
                      border: '1.5px solid #bbf7d0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '20px' }}>🛡️</span>
                        <div>
                          <strong style={{ fontSize: '12.5px', color: 'var(--green-primary)', display: 'block' }}>Protect Crop Quality Standards</strong>
                          <span style={{ fontSize: '11px', color: '#1e3a1e' }}>Get direct recommendations to lower moisture or control insects.</span>
                        </div>
                      </div>
                      <Link 
                        to={item.crop_name.includes('Chilli') ? '/category/pesticides' : '/category/fertilizers'}
                        style={{ 
                          backgroundColor: 'var(--green-primary)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '20px', 
                          padding: '6px 14px', 
                          fontSize: '11px', 
                          fontWeight: 700, 
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        Shop Now <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                )}
                
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Cross-Sell Advisory card */}
      <section style={{ 
        marginTop: '20px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
        borderRadius: '16px', 
        padding: '20px', 
        color: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <span style={{ fontSize: '40px' }}>👨‍🌾</span>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Not happy with your crop grading?</h4>
            <p style={{ fontSize: '12px', opacity: 0.8, margin: '4px 0 12px 0', lineHeight: 1.4 }}>
              Get detailed scientific solutions directly from Dr. Agro to achieve premium moisture levels and export quality grades.
            </p>
            <Link 
              to="/consult" 
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.15)', 
                color: 'white', 
                border: '1px solid rgba(255,255,255,0.3)', 
                borderRadius: '20px', 
                padding: '6px 16px', 
                fontSize: '12px', 
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Consult Dr. Agro →
            </Link>
          </div>
        </div>
      </section>

      {/* Navigation menu */}
      <BottomNav />
      
      {/* Dynamic Keyframe Injection for marquee animation */}
      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
