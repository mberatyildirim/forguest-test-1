
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User } from 'lucide-react';
import { ChatMessage, MenuItem, Hotel } from '../types';
import { sendMessageToGemini } from '../services/geminiService';

interface AIChatProps {
  hotelInfo: Hotel | null;
  menuItems: MenuItem[];
}

const AIChat: React.FC<AIChatProps> = ({ hotelInfo, menuItems }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Merhaba! ${hotelInfo?.name || 'forGuest'} Asistanıyım. Size nasıl yardımcı olabilirim?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !hotelInfo) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(input, hotelInfo, menuItems);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 animate-fade-in">
      <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
          <Sparkles size={24} />
        </div>
        <div>
          <h3 className="font-black text-slate-900 text-lg">forGuest Asistan</h3>
          <p className="text-[10px] text-green-600 flex items-center gap-1 font-black uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Çevrimiçi
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-orange-500 text-white'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[85%] px-5 py-4 rounded-[1.5rem] text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-orange-600 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none shadow-sm'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && <div className="flex items-center gap-2 text-slate-400 text-xs font-black ml-12 uppercase tracking-widest animate-pulse">Düşünüyor...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white border-t border-slate-100">
        <div className="flex gap-3">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Otel hakkında bir şey sorun..." className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500 focus:bg-white transition-all" disabled={isLoading} />
          <button onClick={handleSend} disabled={isLoading || !input.trim()} className="w-14 h-14 bg-orange-600 text-white rounded-2xl flex items-center justify-center hover:bg-orange-500 disabled:opacity-50 shadow-xl active:scale-90 transition-all"><Send size={22} /></button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
