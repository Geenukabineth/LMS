import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, MessageCircle, X } from 'lucide-react';

function Chatbot() {
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your friend. How can I help you today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // URL points to the Django app + url path. 
  // If your main urls.py includes this file as 'chatbot/', the full path is:
  const API_URL = 'http://localhost:8000/chatbot/query/'; 

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (input.trim() === '') return;

    const userMessage = { text: input, sender: 'user' };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Match the key 'query' expected by views.py
        body: JSON.stringify({ query: input }), 
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage = {
          text: data.response, // Match the key 'response' returned by views.py
          sender: 'bot',
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        console.error('Error sending message');
        setMessages((prev) => [...prev, { text: "Error communicating with server.", sender: 'bot' }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, { text: "Network error. Please check connection.", sender: 'bot' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  };

  return (
    <div className="fixed z-50 bottom-6 right-6">
      {/* Toggle Button */}
      {!isOpen && (
        <button
          className="p-4 text-white transition-all duration-200 ease-in-out transform bg-orange-600 rounded-full shadow-lg hover:bg-orange-700 hover:shadow-xl hover:scale-105"
          onClick={toggleChat}
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="flex flex-col duration-300 bg-white border border-gray-200 shadow-2xl rounded-2xl w-96 h-96 animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 text-white bg-gradient-to-r from-orange-600 to-red-600 rounded-t-2xl">
            <h1 className="text-lg font-semibold uppercase">virtual assistant</h1>
            <button
              className="p-1 transition-colors duration-200 rounded-full hover:bg-white/20"
              onClick={toggleChat}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-end space-x-2 ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {message.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-orange-600 text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-end space-x-2">
                <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-gray-700 bg-gray-300 rounded-full">
                  <Bot size={16} />
                </div>
                <div className="px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-2xl rounded-bl-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button
                onClick={handleSubmit}
                disabled={input.trim() === ''}
                className="flex-shrink-0 p-2 text-white transition-colors duration-200 bg-orange-600 rounded-full hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chatbot;