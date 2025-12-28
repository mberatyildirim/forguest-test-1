
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MenuCard from './components/MenuCard';
import AdminPanel from './components/AdminPanel';
import HotelPanel from './components/HotelPanel';
import LandingPage from './components/LandingPage';
import { ViewState, PanelState, CartItem, MenuItem, Language, Hotel } from './types';
import { supabase } from './lib/supabase';
import { TRANSLATIONS, SERVICE_ICONS } from './constants';
import { 
  UtensilsCrossed, Store, Wifi, Clock, ShoppingBasket, ShieldCheck, 
  MapPin, Star, Home as HomeIcon, BellRing, Headphones, Loader2, 
  ChevronRight, Heart, Star as StarFilled
} from 'lucide-react';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    window.history.pushState({}, '', path);
  };

  useEffect(() => {
    const handleRoute = async () => {
      const pathParts = window.location.pathname.split('/').filter(p => p);
      if (pathParts.includes('super-admin')) setPanelMode('admin_dashboard');
      else if (pathParts.includes('otel-login')) setPanelMode('hotel_login');
      else if (pathParts.includes('otel-admin')) {
        const hId = pathParts[pathParts.indexOf('otel-admin') + 1];
        if (hId) { setActiveHotelId(hId); setPanelMode('hotel_dashboard'); }
      } 
      else if (pathParts.length >= 2) {
        setPanelMode('guest');
        loadHotelData(pathParts[0], pathParts[1]);
      } 
      else {
        setPanelMode('landing');
      }
    };
    handleRoute();
    window.addEventListener('popstate', handleRoute);
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
      }
    } catch (e) {}
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
    setIsLoggingIn(true);
    const { data } = await supabase.from('hotels').select('*').eq('username', loginForm.user).eq('password', loginForm.pass).single();
    if (data) navigateTo('hotel_dashboard', `/otel-admin/${data.id}`, data.id);
    else alert("Giriş başarısız.");
    setIsLoggingIn(false);
  };

  if (panelMode === 'landing') return <LandingPage onNavigate={navigateTo} />;
  if (panelMode === 'admin_dashboard') return <AdminPanel onNavigate={navigateTo} />;
  if (panelMode === 'hotel_dashboard' && activeHotelId) return <HotelPanel onNavigate={navigateTo} hotelIdProp={activeHotelId} />;
  if (panelMode === 'hotel_login') return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-white font-inter">
      <div className="bg-[#0f172a] w-full max-w-sm p-10 rounded-[2.5rem] shadow-2xl border border-white/5 text-center">
        <h2 className="text-2xl font-black mb-8 uppercase">Otel Girişi</h2>
        <div className="space-y-4">
          <input type="text" placeholder="Kullanıcı" className="w-full bg-[#1e293b] border border-white/5 text-white rounded-xl py-4 px-4 outline-none focus:border-orange-500 font-bold" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} />
          <input type="password" placeholder="Şifre" className="w-full bg-[#1e293b] border border-white/5 text-white rounded-xl py-4 px-4 outline-none focus:border-orange-500 font-bold" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleHotelLogin()} />
          <button onClick={handleHotelLogin} disabled={isLoggingIn} className="w-full bg-orange-600 text-white py-4 rounded-xl font-black text-xs uppercase shadow-xl">{isLoggingIn ? <Loader2 className="animate-spin mx-auto"/> : 'Sisteme Bağlan'}</button>
          <button onClick={() => navigateTo('landing', '/')} className="text-slate-500 font-bold text-[10px] uppercase mt-2">İptal</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-inter no-scrollbar">
      <Header currentView={currentView} onNavigate={setCurrentView} cartCount={cart.length} lang={lang} setLang={setLang} />
      
      <main className="max-w-xl mx-auto px-5 pt-4 pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40"><div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : hotel && (
          <div className="space-y-6 animate-fade-in">
             {currentView === 'home' && (
               <>
                 {/* Hero Section */}
                 <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0f172a] h-96 shadow-2xl">
                    <img src={hotel.banner_url || "https://images.unsplash.com/photo-1618773928121-c32242e63f39"} className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 p-8 w-full space-y-4">
                       <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                          <span className="text-white font-black uppercase text-[10px] tracking-widest">{hotel.name}</span>
                       </div>
                       <h2 className="text-4xl font-black text-white leading-tight">Hoşgeldiniz,<br/>Sayın Misafirimiz</h2>
                       <div className="inline-block bg-white/10 backdrop-blur-xl px-6 py-2 rounded-2xl border border-white/20">
                          <span className="text-white font-bold text-xs">Oda {roomNumber}</span>
                       </div>
                    </div>
                 </div>

                 {/* Quick Info Cards */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="action-card p-6 flex flex-col items-start gap-4">
                       <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center icon-glow-blue">
                          <Wifi size={20} className="text-blue-400" />
                       </div>
                       <div>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">{t.wifi}</p>
                          <p className="font-black text-white text-lg tracking-tight">{hotel.wifi_name}</p>
                       </div>
                    </div>
                    <div className="action-card p-6 flex flex-col items-start gap-4">
                       <div className="w-10 h-10 bg-rose-500/10 rounded-full flex items-center justify-center icon-glow-purple">
                          <Clock size={20} className="text-rose-400" />
                       </div>
                       <div>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">{t.checkout}</p>
                          <p className="font-black text-white text-lg tracking-tight">{hotel.checkout_time}</p>
                       </div>
                    </div>
                 </div>

                 {/* Main Action Grid */}
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => { setDiningMode('food'); setCurrentView('dining'); }} className="action-card p-8 flex flex-col items-start text-left gap-6 group">
                       <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center icon-glow-orange group-hover:scale-110 transition-transform">
                          <UtensilsCrossed size={28} className="text-orange-500" />
                       </div>
                       <div className="space-y-1">
                          <h3 className="font-black text-xl text-white">{t.food}</h3>
                          <p className="text-slate-500 text-[10px] font-bold leading-relaxed">{t.foodDesc}</p>
                          <p className="text-slate-600 text-[10px] font-black">{t.foodHours}</p>
                       </div>
                    </button>
                    <button onClick={() => { setDiningMode('market'); setCurrentView('dining'); }} className="action-card p-8 flex flex-col items-start text-left gap-6 group">
                       <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center icon-glow-teal group-hover:scale-110 transition-transform">
                          <Store size={28} className="text-teal-500" />
                       </div>
                       <div className="space-y-1">
                          <h3 className="font-black text-xl text-white">{t.market}</h3>
                          <p className="text-slate-500 text-[10px] font-bold leading-relaxed">{t.marketDesc}</p>
                          <p className="text-slate-600 text-[10px] font-black">{t.marketHours}</p>
                       </div>
                    </button>
                    <button onClick={() => setCurrentView('amenities')} className="action-card p-8 flex flex-col items-start text-left gap-6 group">
                       <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center icon-glow-blue group-hover:scale-110 transition-transform">
                          <BellRing size={28} className="text-blue-400" />
                       </div>
                       <div className="space-y-1">
                          <h3 className="font-black text-xl text-white">{t.services}</h3>
                          <p className="text-slate-500 text-[10px] font-bold leading-relaxed">{t.servicesDesc}</p>
                       </div>
                    </button>
                    <button onClick={() => window.open(`tel:${hotel.reception_phone}`)} className="action-card p-8 flex flex-col items-start text-left gap-6 group">
                       <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center icon-glow-purple group-hover:scale-110 transition-transform">
                          <Headphones size={28} className="text-purple-400" />
                       </div>
                       <div className="space-y-1">
                          <h3 className="font-black text-xl text-white">{t.reception}</h3>
                          <p className="text-slate-500 text-[10px] font-bold leading-relaxed">{t.receptionDesc}</p>
                       </div>
                    </button>
                 </div>

                 {/* Social Links Section */}
                 <div className="pt-8 space-y-6">
                    <div className="flex items-center gap-2 text-slate-500">
                       <Star size={12} className="text-orange-500 fill-orange-500" />
                       <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t.rateUs}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                       {hotel.airbnb_url && (
                         <a href={hotel.airbnb_url} target="_blank" rel="noopener noreferrer" className="action-card p-6 flex flex-col items-center gap-3 hover:bg-white/5">
                            <div className="w-10 h-10 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500">
                               <StarFilled size={20} fill="currentColor" />
                            </div>
                            <div className="text-center">
                               <p className="font-black text-white text-[11px]">Airbnb</p>
                               <p className="text-slate-500 text-[9px] mt-1">Deneyiminizi paylaşın</p>
                            </div>
                         </a>
                       )}
                       {hotel.google_maps_url && (
                         <a href={hotel.google_maps_url} target="_blank" rel="noopener noreferrer" className="action-card p-6 flex flex-col items-center gap-3 hover:bg-white/5">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                               <MapPin size={20} fill="currentColor" />
                            </div>
                            <div className="text-center">
                               <p className="font-black text-white text-[11px]">Google</p>
                               <p className="text-slate-500 text-[9px] mt-1">Deneyiminizi paylaşın</p>
                            </div>
                         </a>
                       )}
                       {hotel.booking_url && (
                         <a href={hotel.booking_url} target="_blank" rel="noopener noreferrer" className="action-card p-6 flex flex-col items-center gap-3 hover:bg-white/5">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                               <Heart size={20} fill="currentColor" />
                            </div>
                            <div className="text-center">
                               <p className="font-black text-white text-[11px]">Booking</p>
                               <p className="text-slate-500 text-[9px] mt-1">Deneyiminizi paylaşın</p>
                            </div>
                         </a>
                       )}
                    </div>
                 </div>
               </>
             )}

             {currentView === 'dining' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="bg-[#0f172a] p-1.5 rounded-3xl flex border border-white/5 shadow-2xl">
                     <button onClick={() => setDiningMode('food')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${diningMode === 'food' ? 'bg-orange-600 text-white shadow-xl' : 'text-slate-500'}`}>{t.food}</button>
                     <button onClick={() => setDiningMode('market')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black transition-all ${diningMode === 'market' ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-500'}`}>{t.market}</button>
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
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t.services}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {activeServices.map(service => (
                      <button key={service.id} onClick={() => handleServiceRequest(service)} className="action-card p-10 flex flex-col items-center gap-6 group">
                        <div className="text-orange-500 group-hover:scale-110 transition-transform icon-glow-orange">
                          {SERVICE_ICONS[service.name_key] || <BellRing size={28}/>}
                        </div>
                        <span className="font-black text-white text-[11px] uppercase tracking-widest">{t.serviceNames[service.name_key as keyof typeof t.serviceNames] || service.name_key}</span>
                      </button>
                    ))}
                  </div>
               </div>
             )}

             {currentView === 'cart' && (
               <div className="space-y-6 animate-fade-in">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Sepetim</h2>
                  {cart.length === 0 ? (
                    <div className="text-center py-20 action-card px-12 text-slate-600"><ShoppingBasket size={48} className="mx-auto mb-4 opacity-20" /><p className="font-black uppercase tracking-widest text-[10px]">{t.emptyCart}</p></div>
                  ) : (
                    <div className="action-card overflow-hidden shadow-2xl">
                       <div className="divide-y divide-white/5">
                          {cart.map(item => (
                            <div key={item.id} className="p-6 flex items-center gap-4">
                               <img src={item.image} className="w-20 h-20 rounded-2xl object-cover" />
                               <div className="flex-1"><h4 className="font-black text-white text-xs uppercase">{item.name}</h4><p className="text-orange-500 font-black text-sm mt-1">₺{item.price * item.quantity}</p></div>
                               <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl">
                                  <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: Math.max(0, i.quantity - 1)} : i).filter(i => i.quantity > 0))} className="font-black text-slate-500 text-lg">-</button>
                                  <span className="font-black text-white text-xs">{item.quantity}</span>
                                  <button onClick={() => addToCart(item)} className="font-black text-orange-600 text-lg">+</button>
                               </div>
                            </div>
                          ))}
                       </div>
                       <div className="p-10 bg-black/20 border-t border-white/5">
                          <div className="flex justify-between items-center mb-8">
                             <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest">{t.total}</span>
                             <p className="text-4xl font-black text-white tracking-tighter">₺{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</p>
                          </div>
                          <button onClick={() => setShowOrderConfirm(true)} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-sm uppercase shadow-2xl hover:bg-orange-500 transition-all">Siparişi Onayla</button>
                       </div>
                    </div>
                  )}
               </div>
             )}
          </div>
        )}
      </main>

      {/* Popups & Notifications */}
      {notification && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[80] bg-orange-600 text-white px-8 py-4 rounded-full shadow-3xl flex items-center gap-3 border border-orange-500/30 font-black text-[10px] uppercase tracking-widest">{notification}</div>}
      
      {showOrderConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-[3rem] p-12 text-center shadow-3xl border border-white/10">
             <div className="w-20 h-20 bg-orange-600/10 rounded-3xl flex items-center justify-center mx-auto mb-8 icon-glow-orange">
                <ShieldCheck size={44} className="text-orange-600" />
             </div>
             <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Onay Kodu</h3>
             <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-10">Resepsiyon tarafından verilen kodu girin</p>
             <input type="text" maxLength={4} value={authInput} onChange={e => setAuthInput(e.target.value)} className="w-full bg-[#1e293b] border-2 border-white/5 rounded-3xl p-6 text-center text-5xl font-black mb-10 outline-none text-white shadow-inner tracking-[0.2em]" placeholder="0000" />
             <div className="space-y-4">
                <button onClick={handleOrderSubmit} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-sm uppercase shadow-2xl">Doğrula ve Gönder</button>
                <button onClick={() => setShowOrderConfirm(false)} className="text-slate-500 font-black text-[10px] uppercase hover:text-white transition-colors">Vazgeç</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
