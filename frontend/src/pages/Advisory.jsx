import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  HelpCircle, 
  Droplet, 
  AlertCircle, 
  Calculator, 
  Play, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  ShieldAlert
} from 'lucide-react';

const CROP_SUITABILITY = {
  paddy: {
    name: 'Rice (Paddy)',
    soil: 'Heavy Clayey Loam or Alluvial Soils',
    ph: '6.0 - 7.0',
    season: 'Kharif (June - Nov)',
    insecticide: 'Cartap Hydrochloride 4G',
    dosage: '10 kg per acre',
    treatment: 'Apply inside standing water at 25-30 days after transplanting to combat Stem Borer.',
    emoji: '🌾'
  },
  cotton: {
    name: 'Cotton',
    soil: 'Deep Black Cotton Soil or Well-drained Loam',
    ph: '6.0 - 8.0',
    season: 'Kharif (May - Oct)',
    insecticide: 'Imidacloprid 17.8% SL',
    dosage: '100 ml in 200 Liters of water per acre',
    treatment: 'Foliar spray when sucking pests (aphids, jassids) cross threshold counts (5 per leaf).',
    emoji: '🧴'
  },
  tomato: {
    name: 'Tomato',
    soil: 'Sandy Loam to Clayey Loam with rich organic matter',
    ph: '6.0 - 7.0',
    season: 'Year-round (Best in Autumn/Winter)',
    insecticide: 'Spinosad 45% SC',
    dosage: '75 ml in 200 Liters of water per acre',
    treatment: 'Spray at initial flowering stage to protect young buds from Fruit Borer.',
    emoji: '🍅'
  },
  chilli: {
    name: 'Chilli',
    soil: 'Well-aerated Sandy Loam with good drainage',
    ph: '6.5 - 7.5',
    season: 'Kharif & Rabi (Best in June & October)',
    insecticide: 'Fipronil 5% SC',
    dosage: '320 ml in 200 Liters of water per acre',
    treatment: 'Recommended for Thrips and Mites. Spray during cool evening hours.',
    emoji: '🌶️'
  },
  wheat: {
    name: 'Wheat',
    soil: 'Well-drained Fertile Clayey or Loamy Soils',
    ph: '6.5 - 7.8',
    season: 'Rabi (Nov - April)',
    insecticide: 'Propiconazole 25% EC (Fungicide)',
    dosage: '200 ml in 200 Liters of water per acre',
    treatment: 'Spray at early heading stage to arrest Yellow Rust disease spreading.',
    emoji: '🌾'
  }
};

const TUTORIALS = [
  {
    id: 1,
    title: 'NPK Fertilizer Application Secrets',
    category: 'Fertilizers',
    readTime: '5 min read',
    summary: 'Learn the exact ratio and split-dosage timing of Nitrogen (Urea), Phosphorus (DAP), and Potassium (MOP) to maximize grain weight.',
    icon: '🌿',
    steps: [
      'Basal Dosage: Apply 50% N, 100% P, and 50% K at the time of sowing.',
      'Active Tillering: Top-dress 25% Nitrogen at 21-25 days after transplanting.',
      'Panicle Initiation: Apply the remaining 25% N and 50% K at 45-50 days for strong grains.',
      'Pro-Tip: Always maintain slight soil moisture; never apply urea on bone-dry or heavily flooded fields.'
    ]
  },
  {
    id: 2,
    title: 'Managing Sucking Pests in Cotton',
    category: 'Insecticides',
    readTime: '6 min read',
    summary: 'A step-by-step diagnostic guide to identify Jassids, Thrips, and Whiteflies and apply target organic or systemic solutions.',
    icon: '🐛',
    steps: [
      'Inspection: Turn over 10 random leaves in a diagonal path across your field.',
      'Yellow Sticky Traps: Install 8-10 yellow traps per acre for early pest monitoring.',
      'Chemical Selection: For early stage, spray Neem oil 1500 PPM. For severe attack, select Acetamiprid or Diafenthiuron.',
      'Water Volume: Always use a minimum of 200 Liters of clean water per acre to ensure uniform leaf coverage.'
    ]
  },
  {
    id: 3,
    title: 'Soil pH Testing & Correction',
    category: 'Soil Care',
    readTime: '4 min read',
    summary: 'Is your soil too acidic or alkaline? Learn how to take proper soil samples and amend pH using gypsum or agricultural lime.',
    icon: '🧪',
    steps: [
      'Sampling: Dig V-shaped holes (15cm deep) at 5 random spots in your field. Mix the soil and dry in shade.',
      'Acidic Soil (pH < 6.0): Add Agricultural Lime (Calcium Carbonate) to raise the pH level.',
      'Alkaline Soil (pH > 8.0): Apply Gypsum or elemental sulfur to bring down the pH and reduce salt injury.',
      'Frequency: Test your soil once every two seasons before sowing Kharif/Rabi crops.'
    ]
  }
];

const Advisory = () => {
  const [selectedCrop, setSelectedCrop] = useState('paddy');
  const [expandedTutorial, setExpandedTutorial] = useState(null);
  
  // Dosage Calculator States
  const [calcCrop, setCalcCrop] = useState('paddy');
  const [calcArea, setCalcArea] = useState(1);
  const [calcResult, setCalcResult] = useState(null);

  const handleCalculate = (e) => {
    e.preventDefault();
    const area = parseFloat(calcArea);
    if (isNaN(area) || area <= 0) return;

    let medicineName = '';
    let dosageText = '';
    let waterText = `${Math.round(area * 200)} Liters`;
    let safetyNotes = 'Wear a protective face mask, safety goggles, and rubber gloves. Never spray against the wind direction. Wash hands thoroughly with soap afterward.';

    switch (calcCrop) {
      case 'paddy':
        medicineName = 'Cartap Hydrochloride 4G (Stem Borer control)';
        dosageText = `${(area * 10).toFixed(1)} kg`;
        break;
      case 'cotton':
        medicineName = 'Imidacloprid 17.8% SL (Sucking pest control)';
        dosageText = `${(area * 100).toFixed(0)} ml`;
        break;
      case 'tomato':
        medicineName = 'Spinosad 45% SC (Fruit Borer control)';
        dosageText = `${(area * 75).toFixed(0)} ml`;
        break;
      case 'chilli':
        medicineName = 'Fipronil 5% SC (Thrips & Mites control)';
        dosageText = `${(area * 320).toFixed(0)} ml`;
        break;
      case 'wheat':
        medicineName = 'Propiconazole 25% EC (Yellow Rust control)';
        dosageText = `${(area * 200).toFixed(0)} ml`;
        break;
      default:
        medicineName = 'General Organic Neem Oil';
        dosageText = `${(area * 1.5).toFixed(1)} Liters`;
    }

    setCalcResult({
      crop: CROP_SUITABILITY[calcCrop].name,
      area,
      medicine: medicineName,
      dosage: dosageText,
      water: waterText,
      safety: safetyNotes
    });
  };

  return (
    <div className="myfarm-container">
      {/* Page Header */}
      <header className="myfarm-header">
        <div>
          <h1 className="myfarm-title">Agri Advisory & Tutorials</h1>
          <p className="myfarm-subtitle">Expert crop medicine dosages, soil guides, and agricultural calculators</p>
        </div>
        <div className="consult-badge">
          <Sparkles size={16} className="sparkle-icon" />
          <span>Scientific Advisory</span>
        </div>
      </header>

      {/* Calculator Widget & Crop Suitability Index Side-by-Side */}
      <div className="dashboard-grid">
        
        {/* Left Column: Interactive Dosage Calculator */}
        <section className="dashboard-section">
          <div className="section-header-title">
            <Calculator size={20} className="section-icon text-green" />
            <h2>Medicine Dosage Calculator</h2>
          </div>

          <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label>Select Your Crop</label>
              <select 
                value={calcCrop}
                onChange={(e) => {
                  setCalcCrop(e.target.value);
                  setCalcResult(null);
                }}
                style={{ backgroundColor: 'white' }}
              >
                <option value="paddy">Rice / Paddy</option>
                <option value="cotton">Cotton</option>
                <option value="tomato">Tomato</option>
                <option value="chilli">Chilli</option>
                <option value="wheat">Wheat</option>
              </select>
            </div>

            <div className="form-group">
              <label>Land Area (in Acres)</label>
              <input 
                type="number" 
                step="0.1" 
                min="0.1"
                value={calcArea}
                onChange={(e) => {
                  setCalcArea(e.target.value);
                  setCalcResult(null);
                }}
                placeholder="e.g. 2.5"
                style={{ backgroundColor: 'white' }}
                required
              />
            </div>

            <button type="submit" className="add-crop-btn" style={{ justifyContent: 'center', width: '100%', marginTop: '8px' }}>
              Calculate Recommended Dosage
            </button>
          </form>

          {/* Calculator Output Display */}
          {calcResult && (
            <div className="crop-dashboard-card" style={{ marginTop: '20px', border: '1.5px solid #a7f3d0', backgroundColor: '#f0faf4' }}>
              <h4 style={{ color: 'var(--green-dark)', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🎯 Recommended Dosage for {calcResult.area} Acres of {calcResult.crop}
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#1e3a1e' }}>
                <div>🌿 <strong>Medicine:</strong> {calcResult.medicine}</div>
                <div>⚖️ <strong>Required Dosage Quantity:</strong> <span style={{ fontSize: '15px', color: 'var(--green-primary)', fontWeight: 'bold' }}>{calcResult.dosage}</span></div>
                <div>💧 <strong>Water Dilution Volume:</strong> {calcResult.water}</div>
              </div>

              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #d1fae5', display: 'flex', gap: '8px', fontSize: '12px', color: '#b45309' }}>
                <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                <p style={{ margin: 0 }}><strong>Safety Warning:</strong> {calcResult.safety}</p>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Crop & Soil Database */}
        <section className="dashboard-section">
          <div className="section-header-title">
            <Droplet size={20} className="section-icon text-teal" />
            <h2>Crop Soil & Suitability Index</h2>
          </div>

          <div className="filter-row" style={{ padding: '0 0 12px 0', borderBottom: '1px solid #f0f0f0' }}>
            {Object.keys(CROP_SUITABILITY).map((key) => (
              <button
                key={key}
                className={`filter-chip ${selectedCrop === key ? 'active' : ''}`}
                onClick={() => setSelectedCrop(key)}
              >
                {CROP_SUITABILITY[key].emoji} {CROP_SUITABILITY[key].name}
              </button>
            ))}
          </div>

          {/* Selected Crop Suitability Card */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '32px' }}>{CROP_SUITABILITY[selectedCrop].emoji}</span>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800 }}>{CROP_SUITABILITY[selectedCrop].name} Guidelines</h3>
                <span style={{ fontSize: '11px', color: 'var(--green-primary)', background: '#e8f5e9', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                  Optimal Season: {CROP_SUITABILITY[selectedCrop].season}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div>🗺️ <strong>Soil Recommendation:</strong> {CROP_SUITABILITY[selectedCrop].soil}</div>
              <div>🧪 <strong>Optimal pH Range:</strong> {CROP_SUITABILITY[selectedCrop].ph}</div>
              <div>🦠 <strong>Suggested Medicine:</strong> {CROP_SUITABILITY[selectedCrop].insecticide}</div>
              <div>⚖️ <strong>Standard Dosage Rate:</strong> {CROP_SUITABILITY[selectedCrop].dosage}</div>
            </div>

            <div className="crop-card-notes" style={{ marginTop: '14px', backgroundColor: '#f0f9ff', borderLeftColor: '#0ea5e9' }}>
              <span className="notes-label" style={{ color: '#0369a1' }}>Field Treatment Instruction:</span>
              <p className="notes-content" style={{ color: '#0c4a6e' }}>{CROP_SUITABILITY[selectedCrop].treatment}</p>
            </div>
          </div>
        </section>

      </div>

      {/* Interactive Guides & Video Tutorials Grid */}
      <section className="dashboard-section" style={{ marginTop: '10px' }}>
        <div className="section-header-title">
          <BookOpen size={20} className="section-icon text-amber" />
          <h2>Agricultural Tutorials & Best Practices</h2>
          <span className="live-status-pill" style={{ backgroundColor: '#fffbeb', color: '#b45309' }}>Self Learning</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {TUTORIALS.map((t) => {
            const isExpanded = expandedTutorial === t.id;
            return (
              <div key={t.id} className="crop-dashboard-card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setExpandedTutorial(isExpanded ? null : t.id)}>
                  <div style={{ display: 'flex', gap: '14px' }}>
                    <span style={{ fontSize: '28px', backgroundColor: '#faf5ff', padding: '8px', borderRadius: '12px', height: 'fit-content' }}>{t.icon}</span>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)' }}>{t.title}</h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>{t.category}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>• {t.readTime}</span>
                      </div>
                    </div>
                  </div>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-mid)', margin: '12px 0 0 0', lineHeight: 1.5 }}>
                  {t.summary}
                </p>

                {isExpanded && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
                    <h4 style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '10px' }}>📘 Detailed Action Steps:</h4>
                    <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-mid)' }}>
                      {t.steps.map((step, idx) => (
                        <li key={idx} style={{ listStyleType: 'decimal', lineHeight: '1.45' }}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Advisory;
