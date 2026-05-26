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
                  {msg.content.split('\n').map((line, idx) => {
                    // Quick styling parser for lists and bold elements
                    let rendered = line;
                    if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
                      return (
                        <li key={idx} className="parsed-list-item">
                          {parseBoldMarkdown(line.replace(/^[\*\-\s]+/, ''))}
                        </li>
                      );
                    }
                    return <p key={idx} className="parsed-paragraph">{parseBoldMarkdown(line)}</p>;
                  })}
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

// Helper utility to parse simple **bold** Markdown strings in-app
function parseBoldMarkdown(text) {
  if (!text) return "";
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default Consult;
