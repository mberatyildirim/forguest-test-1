
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
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200 transition-all duration-300 shadow-sm">
      <div className="px-4 h-16 flex items-center justify-between max-w-2xl mx-auto">
        
        <button 
          onClick={() => isHome ? {} : onNavigate('home')}
          className="flex items-center gap-2 group focus:outline-none"
        >
          {isHome ? (
            <span className="font-bold text-xl tracking-tight text-slate-900">
              for<span className="text-orange-500">Guest</span>
            </span>
          ) : (
            <div className="flex items-center gap-1 text-slate-600 group-hover:text-orange-600 transition-colors">
              <div className="bg-slate-100 p-1.5 rounded-full border border-slate-200">
                <ChevronLeft size={20} strokeWidth={1.5} className={lang === 'ar' ? 'rotate-180' : ''} />
              </div>
              <span className="font-medium text-sm tracking-wide">{t.back}</span>
            </div>
          )}
        </button>

        <div className="flex items-center gap-3">
           {isHome && (
             <div className="relative" ref={dropdownRef}>
               <button 
                 onClick={() => setIsLangOpen(!isLangOpen)}
                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors uppercase"
               >
                 <Globe size={14} strokeWidth={1.5} />
                 {LANG_LABELS[lang]}
                 <ChevronDown size={12} strokeWidth={2} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
               </button>

               {isLangOpen && (
                 <div className="absolute top-full right-0 mt-2 w-24 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-fade-in z-[60]">
                   {(Object.keys(LANG_LABELS) as Language[]).map((l) => (
                     <button
                       key={l}
                       onClick={() => changeLang(l)}
                       className={`w-full text-left px-4 py-3 text-xs font-semibold hover:bg-slate-50 transition-colors ${lang === l ? 'text-orange-600' : 'text-slate-700'}`}
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
              className="relative p-2.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 hover:bg-orange-500 hover:text-white transition-all active:scale-95 group shadow-sm"
            >
              <ShoppingBag size={20} strokeWidth={1.5} className="group-hover:scale-105 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
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
