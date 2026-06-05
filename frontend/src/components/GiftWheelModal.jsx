import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './GiftWheel.css';

// 8 Slices: Alternating between standard green values and premium gold values
const prizes = [
  { amount: 20, label: '₹20', color: '#1b5e20', textColor: '#ffffff' },      // Dark Forest Green
  { amount: 120, label: '₹120 🌟', color: '#ffd700', textColor: '#1a2e22' },  // Gold Premium
  { amount: 50, label: '₹50', color: '#2e7d32', textColor: '#ffffff' },       // Emerald Green
  { amount: 150, label: '₹150 🌟', color: '#ffd700', textColor: '#1a2e22' },  // Gold Premium
  { amount: 80, label: '₹80', color: '#4caf50', textColor: '#ffffff' },       // Medium Green
  { amount: 200, label: '₹200 🌟', color: '#ffb300', textColor: '#1a2e22' },  // Orange Gold
  { amount: 100, label: '₹100', color: '#81c784', textColor: '#ffffff' },     // Mint Green
  { amount: 250, label: '₹250 🌟', color: '#ff8f00', textColor: '#ffffff' }   // Flame Orange Gold
];

export default function GiftWheelModal({ user, onClose, onVoucherClaimed }) {
  const navigate = useNavigate();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);
  const rotationDegrees = useRef(0);

  // Draw the wheel using HTML5 Canvas on mount/render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;

    ctx.clearRect(0, 0, size, size);

    // Draw slices
    const sliceAngle = (2 * Math.PI) / prizes.length;
    prizes.forEach((prize, idx) => {
      const startAngle = idx * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();

      // Filled slice
      ctx.fillStyle = prize.color;
      ctx.fill();

      // Slice borders (subtle gold separator lines)
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.stroke();

      // Add text label
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      // Determine font style based on whether it is premium
      if (prize.amount > 100) {
        ctx.font = 'bold 13.5px "Outfit", "Inter", sans-serif';
        ctx.fillStyle = prize.textColor;
      } else {
        ctx.font = 'bold 12px "Inter", sans-serif';
        ctx.fillStyle = prize.textColor;
      }
      
      ctx.fillText(prize.label, radius - 16, 0);
      ctx.restore();
    });

    // Draw inner circle cap border
    ctx.beginPath();
    ctx.arc(center, center, 26, 0, 2 * Math.PI);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffd700';
    ctx.stroke();
  }, []);

  const handleSpin = async () => {
    if (spinning || result) return;
    setSpinning(true);
    setError(null);

    let voucherCode = '';
    let voucherAmount = 0;
    let isFallback = false;

    // 1. Attempt to claim voucher securely from Supabase
    if (user) {
      try {
        const { data, error: rpcError } = await supabase.rpc('claim_first_order_voucher', {
          user_uuid: user.id
        });

        if (rpcError) {
          const isMissingFunc = 
            rpcError.code === '42883' || 
            rpcError.code === 'PGRST202' ||
            rpcError.message?.toLowerCase().includes('does not exist') ||
            rpcError.message?.toLowerCase().includes('schema cache');

          if (isMissingFunc) {
            console.warn('claim_first_order_voucher RPC not found in database. Using client-side fallback simulation.');
            isFallback = true;
          } else {
            throw rpcError;
          }
        } else if (data && data.length > 0) {
          voucherCode = data[0].voucher_code;
          voucherAmount = data[0].voucher_amount;
        } else {
          throw new Error('Claim response is empty');
        }
      } catch (err) {
        console.error('Database claim error:', err);
        setError(err.message || 'An error occurred while claiming your voucher. Please try again.');
        setSpinning(false);
        return;
      }
    } else {
      // User is not logged in: we use fallback simulation for previewing
      isFallback = true;
    }

    // 2. Client-Side Fallback Simulation (Maintains strict 10% high-value probability)
    if (isFallback) {
      // 10% chance of > ₹100, 90% chance of <= ₹100
      const roll = Math.random();
      const isHighValue = roll < 0.10;
      
      if (isHighValue) {
        // High Value: select index 1 (₹120), 3 (₹150), 5 (₹200), or 7 (₹250)
        const premiumIndexes = [1, 3, 5, 7];
        const selectedIndex = premiumIndexes[Math.floor(Math.random() * premiumIndexes.length)];
        voucherAmount = prizes[selectedIndex].amount;
        voucherCode = `LUCKY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      } else {
        // Standard Value: select index 0 (₹20), 2 (₹50), 4 (₹80), or 6 (₹100)
        const standardIndexes = [0, 2, 4, 6];
        const selectedIndex = standardIndexes[Math.floor(Math.random() * standardIndexes.length)];
        voucherAmount = prizes[selectedIndex].amount;
        voucherCode = `WELCOME-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      }

      // Store in localStorage so user retains it
      localStorage.setItem('agrodeals-claimed-voucher-code', voucherCode);
      localStorage.setItem('agrodeals-claimed-voucher-amount', String(voucherAmount));
    }

    // 3. Match voucherAmount to target prize slice index
    const targetIdx = prizes.findIndex(p => p.amount === voucherAmount);
    if (targetIdx === -1) {
      setError('Invalid voucher amount matching slices.');
      setSpinning(false);
      return;
    }

    // 4. Calculate final rotation degrees (clockwise)
    // Formula: (5 full spins) + (align slice center to the 12 o'clock / 270 degree top indicator)
    const fullSpins = 6;
    const degPerSlice = 360 / prizes.length;
    const sliceCenter = targetIdx * degPerSlice + (degPerSlice / 2);
    const targetDegrees = (fullSpins * 360) + (270 - sliceCenter);

    rotationDegrees.current = targetDegrees;

    // 5. Spin visual wheel
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.transform = `rotate(${targetDegrees}deg)`;
    }

    // 6. Reveal code when animation finishes (4.5s matches CSS transition duration)
    setTimeout(() => {
      setResult({
        code: voucherCode,
        amount: voucherAmount,
        isFallback
      });
      setSpinning(false);
      
      // Update local storage status
      localStorage.setItem('agrodeals-voucher-claimed-status', 'true');
      
      // Fire callback to notify main App
      if (onVoucherClaimed) {
        onVoucherClaimed(voucherCode, voucherAmount);
      }
    }, 4500);
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="wheel-modal-overlay">
      <div className="wheel-modal-card">
        <button className="wheel-modal-close" onClick={onClose} disabled={spinning} aria-label="Close modal">
          ✕
        </button>

        {!user ? (
          <div style={{ padding: '20px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎡</div>
            <h3 style={{ margin: '0 0 10px', fontSize: '20px', fontWeight: '800', color: '#ffe082' }}>
              Lucky Spin Wheel
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: '13.5px', color: '#a5d6a7', lineHeight: '1.5' }}>
              Join AgroDeals to spin the lucky wheel and win up to **₹250 cash discount** stored directly in your wallet!
            </p>
            <button
              onClick={() => {
                onClose();
                navigate('/login');
              }}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #ffd54f 0%, #ffb300 100%)',
                color: '#1a2e22',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '900',
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(255, 179, 0, 0.3)',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              🔑 Login to Spin & Win
            </button>
          </div>
        ) : !result ? (
          <>
            <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800', color: '#ffe082' }}>
              🎡 Lucky Spin Wheel
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#a5d6a7' }}>
              Spin to win a cash voucher from <strong>₹20 to ₹250</strong> for your 1st order!
            </p>

            {/* 3D Wheel Stage */}
            <div className="wheel-stage">
              <div className="wheel-pointer"></div>
              <div className="wheel-3d-wrapper">
                <div className="wheel-outer-ring">
                  {/* Blinking Bulbs */}
                  <div className="bulb"></div><div className="bulb"></div>
                  <div className="bulb"></div><div className="bulb"></div>
                  <div className="bulb"></div><div className="bulb"></div>
                  <div className="bulb"></div><div className="bulb"></div>
                  <div className="bulb"></div><div className="bulb"></div>
                  <div className="bulb"></div><div className="bulb"></div>

                  <div className="wheel-spinner-container">
                    <canvas
                      ref={canvasRef}
                      width={252}
                      height={252}
                      className="wheel-canvas"
                    />
                    <div className="wheel-center-hub">WIN</div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div style={{ color: '#ef5350', fontSize: '12px', fontWeight: 'bold', margin: '8px 0' }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleSpin}
              disabled={spinning}
              style={{
                width: '100%',
                padding: '14px',
                background: spinning ? '#666' : 'linear-gradient(135deg, #ffd54f 0%, #ffb300 100%)',
                color: '#1a2e22',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '900',
                fontSize: '16px',
                cursor: spinning ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(255, 179, 0, 0.3)',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {spinning ? '🎰 Spinning...' : '🔮 Spin Now'}
            </button>
          </>
        ) : (
          <div style={{ padding: '10px 0' }}>
            <div style={{ fontSize: '56px', marginBottom: '8px' }}>🎉</div>
            <div className="wheel-result-title">You Won ₹{result.amount}!</div>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#a5d6a7' }}>
              Your lucky voucher code has been successfully generated. Use it at checkout to claim your discount.
            </p>

            <div className="wheel-coupon-card">
              <span style={{ fontSize: '11px', color: '#ffd700', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>
                Your Coupon Code
              </span>
              <div className="wheel-coupon-code">{result.code}</div>
              <button className="wheel-copy-btn" onClick={copyToClipboard}>
                {copied ? '✅ Copied!' : '📋 Copy Code'}
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2e7d32',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '14.5px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
