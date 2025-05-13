import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [messages, setMessages] = useState([{ role: 'system', content: 'You are a helpful assistant.' }]);
  const [input, setInput] = useState('');
  const [stealth, setStealth] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [analysis, setAnalysis] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = async (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('');
      const userMessage = { role: 'user', content: transcript };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);

      const prompt = [
        { role: 'system', content: 'You are a real-time coach. Suggest one improvement or counter-objection response for the following: ' + transcript }
      ];
      const resp = await window.electronAPI.sendPrompt(prompt);
      setSuggestions(prev => [...prev, resp.content]);
    };

    if (isListening) recognition.start(); else recognition.stop();
    return () => recognition.stop();
  }, [isListening, messages]);

  const sendMessage = async () => {
    if (!input) return;
    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    const response = await window.electronAPI.sendPrompt(newMessages);
    setMessages([...newMessages, response]);
  };

  const toggleStealth = () => {
    window.electronAPI.toggleStealth(!stealth);
    setStealth(!stealth);
  };

  const toggleListening = () => setIsListening(!isListening);

  const playSuggestion = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  const endSession = async () => {
    const prompt = [
      { role: 'system', content: 'Analyze the following call transcript for strengths, weaknesses, and personalized improvement recommendations.' },
      ...messages
    ];
    const resp = await window.electronAPI.sendPrompt(prompt);
    setAnalysis(resp.content);
  };

  return (
    <div className="app">
      <header>
        <h1>Cluely Stealth Assistant</h1>
        <button onClick={toggleStealth}>{stealth ? 'Exit Stealth' : 'Enter Stealth'}</button>
        <button onClick={toggleListening}>{isListening ? 'Stop Listening' : 'Start Listening'}</button>
        <button onClick={endSession}>End Session</button>
      </header>
      <div className="chat">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}> 
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="suggestions">
        <h2>Suggestions</h2>
        {suggestions.map((s, i) => (
          <div key={i} className="suggestion">
            {s}
            <button onClick={() => playSuggestion(s)}>🔊</button>
          </div>
        ))}
      </div>
      {analysis && (
        <div className="analysis">
          <h2>Session Analysis</h2>
          <p>{analysis}</p>
        </div>
      )}
      <footer>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </footer>
    </div>
  );
}

export default App;
