
import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, ChevronLeft, Globe, ChevronDown } from 'lucide-react';
import { ViewState, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface HeaderProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  cartCount: number;
  lang: Language;
  setLang: (lang: Language) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, cartCount, lang, setLang }) => {
  const isHome = currentView === 'home';
  const showCart = currentView === 'dining' || currentView === 'cart';
  const t = TRANSLATIONS[lang];
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLang = (l: Language) => {
    setLang(l);
    setIsLangOpen(false);
  };

  const LANG_LABELS = {
    tr: 'TR',
    en: 'EN',
    ar: 'AR'
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/5 transition-all duration-300 shadow-2xl">
      <div className="px-6 h-16 flex items-center justify-between max-w-2xl mx-auto">
        
        <button 
          onClick={() => isHome ? {} : onNavigate('home')}
          className="flex items-center gap-2 group focus:outline-none"
        >
          {isHome ? (
            <span className="font-black text-xl tracking-tight text-white uppercase italic">
              for<span className="text-orange-500">Guest</span>
            </span>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 group-hover:text-white transition-colors">
              <div className="bg-white/5 p-1.5 rounded-xl border border-white/10 group-hover:bg-white/10">
                <ChevronLeft size={20} strokeWidth={1.5} className={lang === 'ar' ? 'rotate-180' : ''} />
              </div>
              <span className="font-black text-[10px] uppercase tracking-[0.2em]">{t.back}</span>
            </div>
          )}
        </button>

        <div className="flex items-center gap-3">
           {isHome && (
             <div className="relative" ref={dropdownRef}>
               <button 
                 onClick={() => setIsLangOpen(!isLangOpen)}
                 className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-300 hover:bg-white/10 transition-all uppercase tracking-widest"
               >
                 <Globe size={14} strokeWidth={1.5} className="text-orange-500" />
                 {LANG_LABELS[lang]}
                 <ChevronDown size={12} strokeWidth={2} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
               </button>

               {isLangOpen && (
                 <div className="absolute top-full right-0 mt-3 w-28 bg-[#0f172a] border border-white/10 rounded-2xl shadow-3xl overflow-hidden animate-fade-in z-[60]">
                   {(Object.keys(LANG_LABELS) as Language[]).map((l) => (
                     <button
                       key={l}
                       onClick={() => changeLang(l)}
                       className={`w-full text-left px-5 py-4 text-[10px] font-black tracking-widest hover:bg-white/5 transition-colors uppercase ${lang === l ? 'text-orange-500' : 'text-slate-400'}`}
                     >
                       {LANG_LABELS[l]}
                     </button>
                   ))}
                 </div>
               )}
             </div>
           )}

           {showCart && (
             <button 
              onClick={() => onNavigate('cart')}
              className="relative p-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-orange-600 hover:text-white transition-all active:scale-95 group shadow-xl"
            >
              <ShoppingBag size={20} strokeWidth={1.5} className="group-hover:scale-105 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#0f172a] shadow-2xl">
                  {cartCount}
                </span>
              )}
            </button>
           )}
        </div>
      </div>
    </header>
  );
};

export default Header;
