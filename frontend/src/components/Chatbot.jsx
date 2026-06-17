import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';

const Chatbot = () => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([
    {
      role: 'assistant',
      content: 'Greetings! I am your Travel Consultant. Ask me details, request cheap route alternatives, best times to walk through hidden gems, or customize parts of your trip plan!'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('English');
  const [isListening, setIsListening] = useState(false);
  
  const chatThreadEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom of chatbot thread
  useEffect(() => {
    chatThreadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  // Configure SpeechRecognition voice input API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN'; // Standard English (India)

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setQuery(text);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const startVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please use Chrome or Safari.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Map recognition locale to selected language
      const localeMap = {
        'English': 'en-IN',
        'Hindi': 'hi-IN',
        'Bengali': 'bn-IN',
        'Telugu': 'te-IN',
        'Marathi': 'mr-IN',
        'Tamil': 'ta-IN',
        'Gujarati': 'gu-IN',
        'Kannada': 'kn-IN',
        'Malayalam': 'ml-IN',
        'Odia': 'or-IN',
        'Punjabi': 'pa-IN',
        'Urdu': 'ur-IN'
      };
      recognitionRef.current.lang = localeMap[language] || 'en-IN';
      recognitionRef.current.start();
    }
  };

  const handleSend = async () => {
    if (!query.trim() || loading) return;

    const userMessage = { role: 'user', content: query.trim() };
    const currentQuery = query.trim();
    setHistory(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    // Formulate localized prompt injection if language is not English
    let enhancedQuery = currentQuery;
    if (language !== 'English') {
      enhancedQuery = `${currentQuery} (IMPORTANT: Respond completely in the language: ${language})`;
    }

    try {
      const key = localStorage.getItem('GEMINI_API_KEY') || '';
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: enhancedQuery,
          history: history,
          api_key: key
        })
      });

      if (res.ok) {
        const data = await res.json();
        setHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        const err = await res.json();
        setHistory(prev => [...prev, { role: 'assistant', content: `### ❌ Chat Error\nCould not query LLM backend: ${err.detail || "Server error"}` }]);
      }
    } catch (err) {
      setHistory(prev => [...prev, { role: 'assistant', content: '### ❌ Connection Error\nServer offline or request timeout.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="border-t border-[rgba(255,255,255,0.05)] pt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
          <i className="fa-regular fa-comments text-sunsetCoral"></i> Dynamic RAG Conversational Assistant
        </h4>
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider pl-7">get an instant reply</p>
      </div>
      
      {/* Chat Thread Container */}
      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto p-3 bg-slate-950/35 border border-[rgba(255,255,255,0.03)] rounded-xl min-h-[120px]">
        {history.map((msg, i) => (
          <div 
            key={i} 
            className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}
            dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}
          />
        ))}
        {loading && (
          <div className="chat-bubble chat-bubble-assistant flex items-center gap-1.5 text-slate-500 font-bold py-3.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            <span>Consulting Knowledge Store...</span>
          </div>
        )}
        <div ref={chatThreadEndRef} />
      </div>
      
      {/* Inputs Strip */}
      <div className="flex gap-2">
        <button 
          onClick={startVoiceInput} 
          className={`w-11 h-11 ${isListening ? 'bg-rose-500/25 border-rose-500 text-rose-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'} border border-[rgba(255,255,255,0.08)] rounded-xl flex items-center justify-center transition active:scale-95`}
          title="Speech to text (Voice Input)"
        >
          <i className={`fa-solid ${isListening ? 'fa-microphone-lines animate-pulse' : 'fa-microphone'}`}></i>
        </button>
        
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="glass-input p-3 text-xs flex-grow" 
          placeholder="Ask a follow up question (e.g. cheapest way to travel Rajasthan, local homestay prices...)"
        />
        
        <button 
          onClick={handleSend}
          className="px-5 bg-gradient-to-r from-sunsetCoral to-marigoldGold text-white font-semibold rounded-xl text-xs hover:brightness-110 transition active:scale-95 flex items-center gap-2"
        >
          <span>Send</span>
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </div>
      
      {/* Localized Details Bar */}
      <div className="flex justify-between items-center text-[10px] text-slate-500 px-1">
        <div className="flex items-center gap-1.5">
          <i className="fa-solid fa-language text-slate-400"></i>
          <span>Language:</span>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-slate-400 border border-slate-800 rounded px-1 outline-none"
          >
            <option value="English">English</option>
            <option value="Hindi">हिन्दी (Hindi)</option>
            <option value="Bengali">বাংলা (Bengali)</option>
            <option value="Telugu">తెలుగు (Telugu)</option>
            <option value="Marathi">मराठी (Marathi)</option>
            <option value="Tamil">தமிழ் (Tamil)</option>
            <option value="Gujarati">ગુજરાતી (Gujarati)</option>
            <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
            <option value="Malayalam">മലയാളം (Malayalam)</option>
            <option value="Odia">ଓଡ଼ିଆ (Odia)</option>
            <option value="Punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
            <option value="Urdu">اردو (Urdu)</option>
          </select>
        </div>
        {isListening && (
          <div className="text-rose-500 font-bold flex items-center">
            <span className="voice-indicator"></span>Listening... speak clearly into mic
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
