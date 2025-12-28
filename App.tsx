
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MenuCard from './components/MenuCard';
import AdminPanel from './components/AdminPanel';
import HotelPanel from './components/HotelPanel';
import LandingPage from './components/LandingPage';
import { ViewState, PanelState, CartItem, MenuItem, ServiceItem, Language, Hotel } from './types';
import { supabase } from './lib/supabase';
import { TRANSLATIONS } from './constants';
import { UtensilsCrossed, BellRing, Store, Wifi, Clock, CheckCircle2, ShoppingBasket, Info, User, Lock, Loader2, ShieldCheck, MapPin, Star, Home as HomeIcon, BedDouble, Shirt, Car, Bath, Wind, Pill, Luggage, Bell, Ban, Wrench, SprayCan } from 'lucide-react';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SERVICE_ICONS: Record<string, any> = {
  clean: <SprayCan size={24}/>, towel: <Bath size={24}/>, pillow: <BedDouble size={24}/>, soap: <Pill size={24}/>,
  laundry: <Shirt size={24}/>, luggage: <Luggage size={24}/>, taxi: <Car size={24}/>, ac: <Wind size={24}/>,
  tech: <Wrench size={24}/>, wakeup: <Bell size={24}/>, dnd: <Ban size={24}/>
};

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
      else if (pathParts.length >= 2 && UUID_REGEX.test(pathParts[0])) {
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
        // Kitchen
        const { data: kData } = await supabase.from('menu_items').select('*').eq('hotel_id', hotelId).eq('type', 'food');
        // Market (Active Global)
        const { data: mSettings } = await supabase.from('hotel_market_settings').select('global_market_items(*)').eq('hotel_id', hotelId).eq('is_active', true);
        const marketItems = mSettings?.map((s: any) => ({ ...s.global_market_items, type: 'market' })) || [];
        setMenuItems([...(kData || []), ...marketItems]);
        // Services (Active Global)
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

  // Fix: Implemented missing handleServiceRequest function
  const handleServiceRequest = async (service: any) => {
    if (!hotel) return;
    const serviceName = t.serviceNames[service.name_key as keyof typeof t.serviceNames] || service.name_key;
    const { error } = await supabase.from('service_requests').insert({
      hotel_id: hotel.id,
      room_number: roomNumber,
      service_type: serviceName,
      status: 'pending'
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
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <div className="bg-[#0f172a] w-full max-w-sm p-10 rounded-[2.5rem] shadow-2xl border border-white/5 text-center">
        <h2 className="text-2xl font-black text-white mb-8 uppercase">Otel Girişi</h2>
        <div className="space-y-4">
          <input type="text" placeholder="Kullanıcı" className="w-full bg-[#1e293b] border border-white/5 text-white rounded-xl py-3 px-4 outline-none focus:border-orange-500 font-bold" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} />
          <input type="password" placeholder="Şifre" className="w-full bg-[#1e293b] border border-white/5 text-white rounded-xl py-3 px-4 outline-none focus:border-orange-500 font-bold" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleHotelLogin()} />
          <button onClick={handleHotelLogin} disabled={isLoggingIn} className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-black text-xs uppercase shadow-xl">{isLoggingIn ? <Loader2 className="animate-spin mx-auto"/> : 'Sisteme Bağlan'}</button>
          <button onClick={() => navigateTo('landing', '/')} className="text-slate-500 font-bold text-[10px] uppercase mt-2">İptal</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-inter">
      <Header currentView={currentView} onNavigate={setCurrentView} cartCount={cart.length} lang={lang} setLang={setLang} />
      <main className="max-w-xl mx-auto px-4 pt-8 pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40"><div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : hotel && (
          <div className="space-y-6 animate-fade-in">
             {currentView === 'home' && (
               <>
                 <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0f172a] h-72">
                    <img src={hotel.banner_url || "https://images.unsplash.com/photo-1618773928121-c32242e63f39"} className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] to-transparent" />
                    <div className="absolute bottom-0 left-0 p-8 w-full">
                       <p className="text-orange-500 font-black uppercase text-[9px] mb-1">{hotel.name}</p>
                       <h2 className="text-3xl font-black text-white leading-tight mb-4">{t.welcome}, Misafirimiz</h2>
                       <span className="bg-orange-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black">{t.room} {roomNumber}</span>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#0f172a] p-6 rounded-3xl border border-white/5 shadow-xl"><Wifi className="text-blue-500 mb-3" size={20} /><p className="text-[9px] text-slate-500 font-black uppercase mb-1">{t.wifi}</p><p className="font-black text-white text-sm">{hotel.wifi_name}</p></div>
                    <div className="bg-[#0f172a] p-6 rounded-3xl border border-white/5 shadow-xl"><Clock className="text-rose-500 mb-3" size={20} /><p className="text-[9px] text-slate-500 font-black uppercase mb-1">{t.checkout}</p><p className="font-black text-white text-sm">{hotel.checkout_time}</p></div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button onClick={() => { setDiningMode('food'); setCurrentView('dining'); }} className="bg-[#0f172a] p-6 rounded-3xl border border-white/5 shadow-xl hover:bg-[#1e293b] text-left">
                       <UtensilsCrossed size={20} className="text-orange-500 mb-4" /><h3 className="font-black text-sm text-white mb-1">{t.food}</h3><p className="text-slate-500 text-[9px] uppercase font-bold">{t.foodDesc}</p>
                    </button>
                    <button onClick={() => { setDiningMode('market'); setCurrentView('dining'); }} className="bg-[#0f172a] p-6 rounded-3xl border border-white/5 shadow-xl hover:bg-[#1e293b] text-left">
                       <Store size={20} className="text-emerald-500 mb-4" /><h3 className="font-black text-sm text-white mb-1">{t.market}</h3><p className="text-slate-500 text-[9px] uppercase font-bold">{t.marketDesc}</p>
                    </button>
                    <button onClick={() => setCurrentView('amenities')} className="bg-[#0f172a] p-6 rounded-3xl border border-white/5 shadow-xl hover:bg-[#1e293b] text-left">
                       <BellRing size={20} className="text-indigo-400 mb-4" /><h3 className="font-black text-sm text-white mb-1">{t.services}</h3><p className="text-slate-500 text-[9px] uppercase font-bold">{t.servicesDesc}</p>
                    </button>
                 </div>
                 <div className="pt-8 flex flex-wrap justify-center gap-2">
                    {hotel.google_maps_url && <a href={hotel.google_maps_url} target="_blank" className="flex items-center gap-2 bg-[#1e293b] px-4 py-2.5 rounded-2xl border border-white/5 text-[10px] font-black uppercase text-white hover:bg-blue-600/20"><MapPin size={14} className="text-blue-500" /> Maps</a>}
                    {hotel.airbnb_url && <a href={hotel.airbnb_url} target="_blank" className="flex items-center gap-2 bg-[#1e293b] px-4 py-2.5 rounded-2xl border border-white/5 text-[10px] font-black uppercase text-white hover:bg-rose-600/20"><HomeIcon size={14} className="text-rose-500" /> Airbnb</a>}
                    {hotel.booking_url && <a href={hotel.booking_url} target="_blank" className="flex items-center gap-2 bg-[#1e293b] px-4 py-2.5 rounded-2xl border border-white/5 text-[10px] font-black uppercase text-white hover:bg-blue-400/20"><Star size={14} className="text-blue-400" /> Booking</a>}
                 </div>
               </>
             )}
             {currentView === 'dining' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="bg-[#0f172a] p-1.5 rounded-2xl flex border border-white/5 shadow-2xl">
                     <button onClick={() => setDiningMode('food')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${diningMode === 'food' ? 'bg-orange-600 text-white shadow-xl' : 'text-slate-500'}`}>{t.food}</button>
                     <button onClick={() => setDiningMode('market')} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${diningMode === 'market' ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-500'}`}>{t.market}</button>
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
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t.serviceRequest}</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {activeServices.map(service => (
                      <button key={service.id} onClick={() => handleServiceRequest(service)} className="bg-[#0f172a] p-8 rounded-3xl flex flex-col items-center gap-4 border border-white/5 hover:bg-[#1e293b] transition-all group">
                        <div className="text-orange-500 group-hover:scale-110 transition-transform">
                          {SERVICE_ICONS[service.name_key] || <BellRing size={24}/>}
                        </div>
                        <span className="font-black text-white text-xs uppercase tracking-tight">{t.serviceNames[service.name_key as keyof typeof t.serviceNames] || service.name_key}</span>
                      </button>
                    ))}
                  </div>
               </div>
             )}
             {currentView === 'cart' && (
               <div className="space-y-6 animate-fade-in">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t.total}</h2>
                  {cart.length === 0 ? (
                    <div className="text-center py-20 bg-[#0f172a] rounded-[2.5rem] border border-white/5 shadow-2xl px-12 text-slate-600"><ShoppingBasket size={48} className="mx-auto mb-4 opacity-20" /><p className="font-black uppercase tracking-widest text-[10px]">{t.emptyCart}</p></div>
                  ) : (
                    <div className="bg-[#0f172a] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
                       <div className="divide-y divide-white/5">
                          {cart.map(item => (
                            <div key={item.id} className="p-5 flex items-center gap-4">
                               <img src={item.image} className="w-16 h-16 rounded-xl object-cover" />
                               <div className="flex-1"><h4 className="font-black text-white text-xs">{item.name}</h4><p className="text-orange-500 font-black text-xs">₺{item.price * item.quantity}</p></div>
                               <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-xl">
                                  <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: Math.max(0, i.quantity - 1)} : i).filter(i => i.quantity > 0))} className="font-black text-slate-500">-</button>
                                  <span className="font-black text-white text-xs">{item.quantity}</span>
                                  <button onClick={() => addToCart(item)} className="font-black text-orange-600">+</button>
                               </div>
                            </div>
                          ))}
                       </div>
                       <div className="p-8 bg-black/20 border-t border-white/5">
                          <p className="text-3xl font-black text-white text-right mb-6">₺{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</p>
                          <button onClick={() => setShowOrderConfirm(true)} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black text-sm uppercase shadow-2xl">Onayla</button>
                       </div>
                    </div>
                  )}
               </div>
             )}
          </div>
        )}
      </main>
      {notification && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[80] bg-orange-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-orange-500 font-black text-[10px] uppercase tracking-widest">{notification}</div>}
      {showOrderConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
          <div className="bg-[#0f172a] w-full max-w-xs rounded-[2.5rem] p-10 text-center shadow-2xl border border-white/10">
             <ShieldCheck size={40} className="text-orange-600 mx-auto mb-6" />
             <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">Resepsiyon Onay Kodu</p>
             <input type="text" maxLength={4} value={authInput} onChange={e => setAuthInput(e.target.value)} className="w-full bg-[#1e293b] border-2 border-white/5 rounded-2xl p-4 text-center text-4xl font-black mb-8 outline-none text-white shadow-inner" placeholder="0000" />
             <button onClick={handleOrderSubmit} className="w-full bg-orange-600 text-white py-4 rounded-xl font-black text-sm uppercase mb-3 shadow-xl">Onayla</button>
             <button onClick={() => setShowOrderConfirm(false)} className="text-slate-500 font-black text-[10px] uppercase">İptal</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
