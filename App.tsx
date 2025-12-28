
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MenuCard from './components/MenuCard';
import AdminPanel from './components/AdminPanel';
import HotelPanel from './components/HotelPanel';
import LandingPage from './components/LandingPage';
import AIChat from './components/AIChat';
import { ViewState, PanelState, CartItem, MenuItem, Language, Hotel } from './types';
import { supabase } from './lib/supabase';
import { TRANSLATIONS, SERVICE_ICONS } from './constants';
import { 
  UtensilsCrossed, Store, Wifi, Clock, ShoppingBasket, ShieldCheck, 
  MapPin, Star, Home as HomeIcon, BellRing, Headphones, Loader2, 
  ChevronRight, ChevronLeft, Heart, Star as StarFilled, Sparkles, ArrowRight,
  Globe as GlobeIcon
} from 'lucide-react';

const App: React.FC = () => {
  const [panelMode, setPanelMode] = useState<PanelState>('landing');
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [lang, setLang] = useState<Language>('tr');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [diningMode, setDiningMode] = useState<'food' | 'market'>('food');
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
  const [authInput, setAuthInput] = useState('');
  
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeServices, setActiveServices] = useState<any[]>([]);
  const [roomNumber, setRoomNumber] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeHotelId, setActiveHotelId] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  const navigateTo = (mode: PanelState, path: string = '/', hId?: string) => {
    setPanelMode(mode);
    if (hId) setActiveHotelId(hId);
    
    try {
      const url = new URL(window.location.href);
      const newPath = path.startsWith('/') ? path : `/${path}`;
      window.history.pushState({}, '', newPath);
    } catch (e) {
      console.warn("URL update failed internally.");
    }
  };

  useEffect(() => {
    const handleRoute = async () => {
      const pathParts = window.location.pathname.split('/').filter(p => p);
      
      if (pathParts.length >= 2 && pathParts[0].length > 20) {
        setPanelMode('guest');
        loadHotelData(pathParts[0], pathParts[1]);
        return;
      }

      if (pathParts.includes('super-admin')) {
        setPanelMode('admin_dashboard');
        return;
      } 
      
      if (pathParts.includes('otel-login')) {
        setPanelMode('hotel_login');
        return;
      } 
      
      if (pathParts.includes('otel-admin')) {
        const hId = pathParts[pathParts.indexOf('otel-admin') + 1];
        if (hId) { 
          setActiveHotelId(hId); 
          setPanelMode('hotel_dashboard'); 
          return;
        }
      } 

      setPanelMode('landing');
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  const loadHotelData = async (hotelId: string, room: string) => {
    setLoading(true);
    setRoomNumber(room);
    try {
      const { data: hData } = await supabase.from('hotels').select('*').eq('id', hotelId).single();
      if (hData) {
        setHotel(hData);
        const { data: kData } = await supabase.from('menu_items').select('*').eq('hotel_id', hotelId);
        const { data: mSettings } = await supabase.from('hotel_market_settings').select('global_market_items(*)').eq('hotel_id', hotelId).eq('is_active', true);
        const marketItems = mSettings?.map((s: any) => ({ ...s.global_market_items, type: 'market' })) || [];
        setMenuItems([...(kData || []), ...marketItems]);
        const { data: sSettings } = await supabase.from('hotel_service_settings').select('global_services(*)').eq('hotel_id', hotelId).eq('is_active', true);
        setActiveServices(sSettings?.map((s: any) => s.global_services) || []);
      } else {
        setPanelMode('landing');
      }
    } catch (e) {
      setPanelMode('landing');
    }
    setLoading(false);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
    setNotification(`${item.name} ${t.added}`);
    setTimeout(() => setNotification(null), 2000);
  };

  const handleOrderSubmit = async () => {
    if (authInput.trim().length < 4 || !hotel) return;
    const { error } = await supabase.from('orders').insert({
      hotel_id: hotel.id, room_number: roomNumber,
      total_amount: cart.reduce((s, i) => s + (i.price * i.quantity), 0),
      items: cart, status: 'pending'
    });
    if (!error) { setCart([]); setShowOrderConfirm(false); setNotification(t.orderReceived); setCurrentView('home'); setAuthInput(''); }
  };

  const handleServiceRequest = async (service: any) => {
    if (!hotel) return;
    const serviceName = t.serviceNames[service.name_key as keyof typeof t.serviceNames] || service.name_key;
    const { error } = await supabase.from('service_requests').insert({
      hotel_id: hotel.id, room_number: roomNumber, service_type: serviceName, status: 'pending'
    });
    if (!error) {
      setNotification(`${serviceName} ${t.serviceSent}`);
      setTimeout(() => setNotification(null), 3000);
      setCurrentView('home');
    }
  };

  const handleHotelLogin = async () => {
    if (!loginForm.user || !loginForm.pass) return;
    setIsLoggingIn(true);
    try {
      const { data } = await supabase.from('hotels').select('id').eq('username', loginForm.user).eq('password', loginForm.pass).maybeSingle();
      if (data) navigateTo('hotel_dashboard', `/otel-admin/${data.id}`, data.id);
      else alert("Hata: Kullanıcı adı veya şifre yanlış.");
    } catch (e) { console.error(e); }
    finally { setIsLoggingIn(false); }
  };

  if (panelMode === 'landing') return <LandingPage onNavigate={navigateTo} />;
  if (panelMode === 'admin_dashboard') return <AdminPanel onNavigate={navigateTo} />;
  if (panelMode === 'hotel_dashboard' && activeHotelId) return <HotelPanel onNavigate={navigateTo} hotelIdProp={activeHotelId} />;
  if (panelMode === 'hotel_login') return (
    <div className="min-h-screen bg-[#050a18] flex items-center justify-center p-6 text-white font-inter text-center">
      <div className="bg-[#0f172a] w-full max-w-sm p-10 rounded-[2.5rem] shadow-2xl border border-white/5 relative">
        <button onClick={() => navigateTo('landing', '/')} className="absolute top-6 left-6 text-slate-500 hover:text-white flex items-center gap-1 text-[10px] font-bold uppercase transition-colors">
          <ChevronLeft size={16} /> Geri
        </button>
        <h2 className="text-2xl font-black mb-8 uppercase mt-6 tracking-tight italic">Otel Girişi</h2>
        <div className="space-y-4">
          <input type="text" placeholder="Kullanıcı" className="w-full bg-[#1e293b] border border-white/5 text-white rounded-xl py-4 px-4 outline-none focus:border-orange-500 font-bold" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} />
          <input type="password" placeholder="Şifre" className="w-full bg-[#1e293b] border border-white/5 text-white rounded-xl py-4 px-4 outline-none focus:border-orange-500 font-bold" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleHotelLogin()} />
          <button onClick={handleHotelLogin} disabled={isLoggingIn} className="w-full bg-orange-600 text-white py-4 rounded-xl font-black text-xs uppercase shadow-xl hover:bg-orange-500 transition-all">
            {isLoggingIn ? <Loader2 className="animate-spin mx-auto"/> : 'Sisteme Bağlan'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050a18] text-slate-100 font-inter no-scrollbar selection:bg-blue-600/30">
      <Header currentView={currentView} onNavigate={setCurrentView} cartCount={cart.length} lang={lang} setLang={setLang} />
      
      <main className="max-w-xl mx-auto px-5 pt-4 pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 animate-pulse">
            <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hazırlanıyor...</p>
          </div>
        ) : hotel && (
          <div className="space-y-6 animate-fade-in">
             {currentView === 'home' && (
               <>
                 {/* AI Assistant Banner - Exact Visual Match */}
                 <button 
                   onClick={() => setCurrentView('info')}
                   className="action-card w-full p-6 flex items-center gap-5 group border-white/5"
                 >
                    <div className="relative shrink-0">
                       <div className="absolute inset-0 aura-orange scale-150"></div>
                       <div className="relative w-16 h-16 bg-orange-600 rounded-[1.5rem] flex items-center justify-center text-white neon-glow-orange">
                          <Sparkles size={32} />
                       </div>
                    </div>
                    <div className="flex-1 text-left">
                       <h3 className="text-xl font-black text-white uppercase tracking-tight">AI Assistant</h3>
                       <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-0.5">Otel hakkında her şeyi sorun</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-white group-hover:bg-white/10 transition-all">
                       <ArrowRight size={20} />
                    </div>
                 </button>

                 {/* 2x2 Grid - Visual Match with Neon Aura */}
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => { setDiningMode('food'); setCurrentView('dining'); }} className="action-card aspect-square p-7 flex flex-col items-start justify-between text-left group">
                       <div className="relative">
                          <div className="absolute inset-0 aura-orange scale-150"></div>
                          <div className="relative w-16 h-16 bg-orange-600 rounded-[1.5rem] flex items-center justify-center text-white neon-glow-orange group-hover:scale-110 transition-transform">
                             <UtensilsCrossed size={32} />
                          </div>
                       </div>
                       <div className="space-y-1">
                          <h3 className="font-black text-xl text-white uppercase tracking-tight">{t.food}</h3>
                          <p className="text-slate-500 text-[10px] font-bold leading-tight">{t.foodDesc}</p>
                          <p className="text-slate-600 text-[9px] font-black uppercase mt-1 opacity-40">{t.foodHours}</p>
                       </div>
                    </button>

                    <button onClick={() => { setDiningMode('market'); setCurrentView('dining'); }} className="action-card aspect-square p-7 flex flex-col items-start justify-between text-left group">
                       <div className="relative">
                          <div className="absolute inset-0 aura-green scale-150"></div>
                          <div className="relative w-16 h-16 bg-[#10b981] rounded-[1.5rem] flex items-center justify-center text-white neon-glow-green group-hover:scale-110 transition-transform">
                             <Store size={32} />
                          </div>
                       </div>
                       <div className="space-y-1">
                          <h3 className="font-black text-xl text-white uppercase tracking-tight">{t.market}</h3>
                          <p className="text-slate-500 text-[10px] font-bold leading-tight">{t.marketDesc}</p>
                          <p className="text-slate-600 text-[9px] font-black uppercase mt-1 opacity-40">{t.marketHours}</p>
                       </div>
                    </button>

                    <button onClick={() => setCurrentView('amenities')} className="action-card aspect-square p-7 flex flex-col items-start justify-between text-left group">
                       <div className="relative">
                          <div className="absolute inset-0 aura-blue scale-150"></div>
                          <div className="relative w-16 h-16 bg-[#3b82f6] rounded-[1.5rem] flex items-center justify-center text-white neon-glow-blue group-hover:scale-110 transition-transform">
                             <BellRing size={32} />
                          </div>
                       </div>
                       <div className="space-y-1">
                          <h3 className="font-black text-xl text-white uppercase tracking-tight">{t.services}</h3>
                          <p className="text-slate-500 text-[10px] font-bold leading-tight">{t.servicesDesc}</p>
                          <p className="text-slate-600 text-[9px] font-black uppercase mt-1 opacity-40">Housekeeping & Teknik</p>
                       </div>
                    </button>

                    <button onClick={() => window.open(`tel:${hotel.reception_phone}`)} className="action-card aspect-square p-7 flex flex-col items-start justify-between text-left group">
                       <div className="relative">
                          <div className="absolute inset-0 aura-purple scale-150"></div>
                          <div className="relative w-16 h-16 bg-[#a855f7] rounded-[1.5rem] flex items-center justify-center text-white neon-glow-purple group-hover:scale-110 transition-transform">
                             <Headphones size={32} />
                          </div>
                       </div>
                       <div className="space-y-1">
                          <h3 className="font-black text-xl text-white uppercase tracking-tight">{t.reception}</h3>
                          <p className="text-slate-500 text-[10px] font-bold leading-tight">{t.receptionDesc}</p>
                          <p className="text-slate-600 text-[9px] font-black uppercase mt-1 opacity-40">7/24 Canlı Destek</p>
                       </div>
                    </button>
                 </div>

                 {/* Rate Us - Horizontal Layout Updated for 3 Items */}
                 <div className="pt-10 space-y-6">
                    <div className="flex items-center gap-2 text-slate-500 px-2">
                       <Star size={14} className="text-orange-500 fill-orange-500" />
                       <p className="text-[11px] font-black uppercase tracking-[0.3em]">{t.rateUs}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                       {hotel.airbnb_url && (
                         <a href={hotel.airbnb_url} target="_blank" rel="noopener noreferrer" className="action-card p-6 flex items-center gap-5 group hover:bg-rose-500/5 transition-all">
                            <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform shrink-0">
                               <StarFilled size={24} fill="currentColor" />
                            </div>
                            <div className="text-left">
                               <h4 className="font-black text-white text-base uppercase tracking-tight">Airbnb</h4>
                               <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5 leading-tight">Deneyiminizi paylaşın</p>
                            </div>
                         </a>
                       )}
                       {hotel.google_maps_url && (
                         <a href={hotel.google_maps_url} target="_blank" rel="noopener noreferrer" className="action-card p-6 flex items-center gap-5 group hover:bg-blue-500/5 transition-all">
                            <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform shrink-0">
                               <MapPin size={24} fill="currentColor" />
                            </div>
                            <div className="text-left">
                               <h4 className="font-black text-white text-base uppercase tracking-tight">Google</h4>
                               <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5 leading-tight">Deneyiminizi paylaşın</p>
                            </div>
                         </a>
                       )}
                       {hotel.booking_url && (
                         <a href={hotel.booking_url} target="_blank" rel="noopener noreferrer" className="action-card p-6 flex items-center gap-5 group hover:bg-blue-600/5 transition-all">
                            <div className="relative shrink-0">
                               <div className="absolute inset-0 aura-blue scale-125"></div>
                               <div className="relative w-14 h-14 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                  <GlobeIcon size={24} />
                               </div>
                            </div>
                            <div className="text-left">
                               <h4 className="font-black text-white text-base uppercase tracking-tight">Booking</h4>
                               <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5 leading-tight">Deneyiminizi paylaşın</p>
                            </div>
                         </a>
                       )}
                    </div>
                 </div>
               </>
             )}

             {currentView === 'info' && <AIChat hotelInfo={hotel} menuItems={menuItems} />}

             {currentView === 'dining' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="bg-[#0f172a] p-1.5 rounded-3xl flex border border-white/5 shadow-2xl">
                     <button onClick={() => setDiningMode('food')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${diningMode === 'food' ? 'bg-orange-600 text-white shadow-xl' : 'text-slate-500'}`}>{t.food}</button>
                     <button onClick={() => setDiningMode('market')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black transition-all ${diningMode === 'market' ? 'bg-[#10b981] text-white shadow-xl' : 'text-slate-500'}`}>{t.market}</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     {menuItems.filter(i => i.type === diningMode).map(item => (
                       <MenuCard key={item.id} item={item} onAdd={addToCart} onView={setSelectedProduct} />
                     ))}
                  </div>
               </div>
             )}

             {currentView === 'amenities' && (
               <div className="space-y-6 animate-fade-in">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">{t.services}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {activeServices.map(service => (
                      <button key={service.id} onClick={() => handleServiceRequest(service)} className="action-card aspect-square p-8 flex flex-col items-center justify-between group">
                        <div className="text-orange-500 group-hover:scale-110 transition-transform neon-glow-orange">
                          {SERVICE_ICONS[service.name_key] || <BellRing size={32}/>}
                        </div>
                        <span className="font-black text-white text-[11px] uppercase tracking-widest text-center">{t.serviceNames[service.name_key as keyof typeof t.serviceNames] || service.name_key}</span>
                      </button>
                    ))}
                  </div>
               </div>
             )}

             {currentView === 'cart' && (
               <div className="space-y-6 animate-fade-in">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Sepetim</h2>
                  {cart.length === 0 ? (
                    <div className="text-center py-24 action-card px-12 text-slate-600">
                      <ShoppingBasket size={48} className="mx-auto mb-6 opacity-20" />
                      <p className="font-black uppercase tracking-widest text-[11px]">{t.emptyCart}</p>
                    </div>
                  ) : (
                    <div className="action-card overflow-hidden shadow-2xl">
                       <div className="divide-y divide-white/5">
                          {cart.map(item => (
                            <div key={item.id} className="p-6 flex items-center gap-4">
                               <img src={item.image} className="w-20 h-20 rounded-2xl object-cover bg-black/40" />
                               <div className="flex-1">
                                 <h4 className="font-black text-white text-[11px] uppercase leading-tight line-clamp-1">{item.name}</h4>
                                 <p className="text-orange-500 font-black text-sm mt-1">₺{item.price * item.quantity}</p>
                               </div>
                               <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl">
                                  <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: Math.max(0, i.quantity - 1)} : i).filter(i => i.quantity > 0))} className="font-black text-slate-500 text-lg hover:text-white transition-colors">-</button>
                                  <span className="font-black text-white text-xs">{item.quantity}</span>
                                  <button onClick={() => addToCart(item)} className="font-black text-orange-600 text-lg hover:text-orange-500 transition-colors">+</button>
                               </div>
                            </div>
                          ))}
                       </div>
                       <div className="p-8 md:p-10 bg-black/20 border-t border-white/5">
                          <div className="flex justify-between items-center mb-8">
                             <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest">{t.total}</span>
                             <p className="text-4xl font-black text-white tracking-tighter">₺{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</p>
                          </div>
                          <button onClick={() => setShowOrderConfirm(true)} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-sm uppercase shadow-2xl hover:bg-orange-500 active:scale-95 transition-all">Siparişi Onayla</button>
                       </div>
                    </div>
                  )}
               </div>
             )}
          </div>
        )}
      </main>

      {/* Popups & Notifications */}
      {notification && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[80] bg-orange-600 text-white px-8 py-4 rounded-full shadow-3xl flex items-center gap-3 border border-orange-500/30 font-black text-[10px] uppercase tracking-widest animate-fade-in">{notification}</div>}
      
      {showOrderConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-[3rem] p-10 md:p-12 text-center shadow-3xl border border-white/10 animate-fade-in">
             <div className="w-20 h-20 bg-orange-600/10 rounded-3xl flex items-center justify-center mx-auto mb-8 neon-glow-orange">
                <ShieldCheck size={44} className="text-orange-600" />
             </div>
             <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight italic">Onay Kodu</h3>
             <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-10">Resepsiyon tarafından verilen kodu girin</p>
             <input type="text" maxLength={4} value={authInput} onChange={e => setAuthInput(e.target.value)} className="w-full bg-[#1e293b] border-2 border-white/5 rounded-3xl p-6 text-center text-5xl font-black mb-10 outline-none text-white shadow-inner tracking-[0.2em]" placeholder="0000" />
             <div className="space-y-4">
                <button onClick={handleOrderSubmit} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-sm uppercase shadow-2xl active:scale-95 transition-all hover:bg-orange-500">Doğrula ve Gönder</button>
                <button onClick={() => setShowOrderConfirm(false)} className="text-slate-500 font-black text-[10px] uppercase hover:text-white transition-colors">Vazgeç</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
