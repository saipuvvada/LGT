import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';

const SUGGESTIONS = [
  "Why are my cotton leaves turning yellow?",
  "What is the best NPK ratio for rice/paddy?",
  "Organic ways to control tomato pests?",
  "How to treat black spot on chilli leaves?"
];

const Consult = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm Dr. Agro, your personal AI Crop Consultant. 🌱 I'm here to help you diagnose plant diseases, choose fertilizers, and boost your crop yields. What are you cultivating today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input.trim();
    if (!query) return;

    if (!textToSend) {
      setInput('');
    }
    setError(null);

    // Add user message
    const userMsgId = Date.now().toString();
    const newUserMsg = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMsg]);
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error("OpenRouter API key is missing. Please configure VITE_OPENROUTER_API_KEY in your .env file.");
      }

      // Convert messages to OpenRouter format
      // Map system instruction + recent message history
      const openRouterMessages = [
        {
          role: "system",
          content: `You are Dr. Agro, a premium, empathetic, and highly expert AI Agronomist and Agricultural Consultant for farmers.
Your goal is to provide concise, scientifically accurate, and easy-to-understand solutions for farming challenges:
1. Identify crop diseases and pests.
2. Recommend optimized NPK fertilizer ratios, watering schedules, and soil care.
3. Suggest both Organic/Eco-friendly and chemical/standard options.
4. Highlight safety rules, dosage rates, and warnings clearly.
5. Use lists, bold text, and brief spacing to present advice clearly.
Keep responses concise, conversational, and highly structured with bullet points. Avoid dry explanations, and sound encouraging and warm!`
        },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: query }
      ];

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Agrodeals Dr Agro Consultant",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: openRouterMessages,
          temperature: 0.7,
          max_tokens: 800,
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `API server returned error status ${response.status}`);
      }

      const data = await response.json();
      const answer = data?.choices?.[0]?.message?.content || "Sorry, I couldn't process that response. Please try again.";

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer,
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Failed to fetch advice. Error: ${err.message}`,
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="consult-container">
      {/* Consult Header */}
      <header className="consult-header">
        <div className="consult-doctor-info">
          <div className="doctor-avatar-container">
            <span className="doctor-avatar-emoji">👨‍🌾</span>
            <span className="status-indicator online"></span>
          </div>
          <div>
            <h1 className="doctor-name">Dr. Agro</h1>
            <p className="doctor-sub">Expert AI Agronomist & Consultant</p>
          </div>
        </div>
        <div className="consult-badge">
          <Sparkles size={16} className="sparkle-icon" />
          <span>AI Powered</span>
        </div>
      </header>

      {/* Message Screen */}
      <div className="consult-messages-wrapper">
        <div className="consult-messages-list">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-bubble-row ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="chat-avatar-mini">🌱</div>
              )}
              <div className={`message-bubble ${msg.role} ${msg.isError ? 'error-bubble' : ''}`}>
                <div className="message-content">
                  {renderMarkdown(msg.content)}
                </div>
                <span className="message-time">
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-bubble-row assistant">
              <div className="chat-avatar-mini">🌱</div>
              <div className="message-bubble assistant loading-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && !loading && (
        <div className="consult-chips-container">
          <div className="consult-chips-scroll">
            {SUGGESTIONS.map((s, idx) => (
              <button key={idx} className="suggestion-chip" onClick={() => handleSend(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form Input Footer */}
      <footer className="consult-input-footer">
        <div className="consult-input-container">
          <textarea
            className="consult-textarea"
            placeholder="Ask Dr. Agro about diseases, soil health, NPK ratios..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={loading}
            rows={1}
          />
          <button 
            className="consult-send-btn"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
};

// ─── Markdown Renderer ───────────────────────────────────────────────────────
// Converts AI markdown output into clean structured JSX
function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    // Skip empty lines (add small gap)
    if (!line) {
      elements.push(<div key={i} style={{ height: '6px' }} />);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line) || /^\*\*\*+$/.test(line)) {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', margin: '8px 0' }} />);
      i++;
      continue;
    }

    // H1: # Heading
    if (line.startsWith('# ')) {
      elements.push(
        <div key={i} style={{ fontWeight: 800, fontSize: '15px', color: 'var(--green-dark)', marginBottom: '6px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {parseBold(line.slice(2))}
        </div>
      );
      i++;
      continue;
    }

    // H2: ## Heading
    if (line.startsWith('## ')) {
      elements.push(
        <div key={i} style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--green-primary)', marginBottom: '4px', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          {parseBold(line.slice(3))}
        </div>
      );
      i++;
      continue;
    }

    // H3: ### Heading
    if (line.startsWith('### ')) {
      elements.push(
        <div key={i} style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-dark)', marginBottom: '4px', marginTop: '8px' }}>
          {parseBold(line.slice(4))}
        </div>
      );
      i++;
      continue;
    }

    // Bullet list: -, *, •
    if (/^[-*•]\s/.test(line)) {
      // Collect consecutive bullet lines
      const bullets = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
        bullets.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: '6px 0', paddingLeft: '0', listStyle: 'none' }}>
          {bullets.map((b, bi) => (
            <li key={bi} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '5px', fontSize: '13.5px', lineHeight: 1.55 }}>
              <span style={{ color: 'var(--green-primary)', fontWeight: 800, fontSize: '16px', lineHeight: 1, marginTop: '1px', flexShrink: 0 }}>•</span>
              <span>{parseBold(b)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list: 1. 2. 3.
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ margin: '6px 0', paddingLeft: '0', listStyle: 'none' }}>
          {items.map((item, ii) => (
            <li key={ii} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '5px', fontSize: '13.5px', lineHeight: 1.55 }}>
              <span style={{
                background: 'var(--green-primary)', color: 'white',
                borderRadius: '50%', width: '18px', height: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 800, flexShrink: 0, marginTop: '2px'
              }}>
                {ii + 1}
              </span>
              <span>{parseBold(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} style={{ margin: '3px 0', fontSize: '13.5px', lineHeight: 1.6 }}>
        {parseBold(line)}
      </p>
    );
    i++;
  }

  return elements;
}

// Converts **bold** and *italic* inline markdown to JSX
function parseBold(text) {
  if (!text) return '';
  // Split by **bold** and *italic* patterns
  const parts = text.split(/(\*\*.*?\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 700, color: 'inherit' }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export default Consult;

