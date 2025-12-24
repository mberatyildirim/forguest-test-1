
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MenuCard from './components/MenuCard';
import AdminPanel from './components/AdminPanel';
import HotelPanel from './components/HotelPanel';
import AIChat from './components/AIChat';
import LandingPage from './components/LandingPage';
import { ViewState, PanelState, CartItem, MenuItem, ServiceItem, Language, Hotel } from './types';
import { supabase } from './lib/supabase';
import { SERVICE_ITEMS, TRANSLATIONS } from './constants';
import { UtensilsCrossed, BellRing, Store, Wifi, Clock, CheckCircle2, ShoppingBasket, Info, Sparkles, User, Lock, Loader2, ShieldCheck } from 'lucide-react';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
      window.history.pushState({}, '', path);
    } catch (e) {
      console.warn("URL update failed (Sandbox limitation), but state changed.", e);
    }
  };

  useEffect(() => {
    const handleRoute = async () => {
      const fullPath = window.location.href;
      const url = new URL(fullPath);
      const pathParts = url.pathname.split('/').filter(p => p && p !== 'index.html');
      
      if (pathParts.includes('super-admin')) {
        setPanelMode('admin_dashboard');
      } 
      else if (pathParts.includes('otel-login')) {
        setPanelMode('hotel_login');
      } 
      else if (pathParts.includes('otel-admin')) {
        const hId = pathParts[pathParts.indexOf('otel-admin') + 1];
        if (hId) {
          setActiveHotelId(hId);
          setPanelMode('hotel_dashboard');
        }
      } 
      else if (pathParts.length >= 2) {
        const lastPart = pathParts[pathParts.length - 1];
        const secondLastPart = pathParts[pathParts.length - 2];

        if (UUID_REGEX.test(secondLastPart)) {
          setPanelMode('guest');
          loadHotelData(secondLastPart, lastPart);
        } else {
          setPanelMode('landing');
        }
      } 
      else {
        setPanelMode('landing');
      }
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  const loadHotelData = async (hotelId: string, room: string) => {
    setLoading(true);
    setRoomNumber(room);
    try {
      const { data: hotelData } = await supabase.from('hotels').select('*').eq('id', hotelId).single();
      if (hotelData) {
        setHotel(hotelData);
        const { data: menuData } = await supabase.from('menu_items').select('*').eq('hotel_id', hotelId).eq('is_available', true);
        if (menuData) setMenuItems(menuData);
      } else {
        setHotel(null);
      }
    } catch (e) {
      setHotel(null);
    }
    setLoading(false);
  };

  const handleHotelLogin = async () => {
    if (!loginForm.user || !loginForm.pass) return;
    setIsLoggingIn(true);
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('username', loginForm.user)
      .eq('password', loginForm.pass)
      .single();
    
    if (data && !error) {
      navigateTo('hotel_dashboard', `/otel-admin/${data.id}`, data.id);
    } else {
      alert("Hatalı bilgiler!");
    }
    setIsLoggingIn(false);
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
      hotel_id: hotel.id,
      room_number: roomNumber,
      total_amount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      items: cart,
      status: 'pending'
    });
    if (!error) {
      setCart([]);
      setShowOrderConfirm(false);
      setNotification(t.orderReceived);
      setCurrentView('home');
      setAuthInput('');
    }
  };

  const handleServiceRequest = async (service: ServiceItem) => {
    if (!hotel) return;
    const { error } = await supabase.from('service_requests').insert({
      hotel_id: hotel.id,
      room_number: roomNumber,
      service_type: service.id,
      status: 'pending'
    });
    if (!error) {
      setNotification(`${t.serviceNames[service.nameKey as keyof typeof t.serviceNames]} ${t.serviceSent}`);
      setTimeout(() => setNotification(null), 2000);
    }
  };

  if (panelMode === 'landing') return <LandingPage onNavigate={navigateTo} />;
  if (panelMode === 'admin_dashboard') return <AdminPanel onNavigate={navigateTo} />;
  if (panelMode === 'hotel_dashboard' && activeHotelId) return <HotelPanel onNavigate={navigateTo} hotelIdProp={activeHotelId} />;
  
  if (panelMode === 'hotel_login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-inter text-slate-900">
        <div className="bg-white w-full max-w-md p-12 rounded-[3.5rem] shadow-2xl text-center">
           <h2 className="text-3xl font-black mb-10 tracking-tight">Otel Yönetim Girişi</h2>
           <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Kullanıcı Adı" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-5 pl-14 pr-6 outline-none focus:border-orange-500 font-bold"
                  value={loginForm.user}
                  onChange={e => setLoginForm({...loginForm, user: e.target.value})}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  placeholder="Şifre" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-5 pl-14 pr-6 outline-none focus:border-orange-500 font-bold"
                  value={loginForm.pass}
                  onChange={e => setLoginForm({...loginForm, pass: e.target.value})}
                  onKeyDown={e => e.key === 'Enter' && handleHotelLogin()}
                />
              </div>
              <button 
                onClick={handleHotelLogin}
                disabled={isLoggingIn}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl hover:bg-orange-600 transition-all shadow-xl active:scale-95 mt-6 flex items-center justify-center"
              >
                {isLoggingIn ? <Loader2 className="animate-spin" /> : 'Giriş Yap'}
              </button>
              <button 
                onClick={() => navigateTo('landing', '/')}
                className="text-slate-400 font-bold text-sm mt-4 hover:text-slate-600 transition-colors"
              >
                Ana Sayfaya Dön
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 selection:bg-orange-200">
      <Header currentView={currentView} onNavigate={setCurrentView} cartCount={cart.length} lang={lang} setLang={setLang} />
      <main className="max-w-2xl mx-auto px-4 pt-10 pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-6 font-black text-slate-400 animate-pulse uppercase tracking-widest text-xs">forGuest Yükleniyor</p>
          </div>
        ) : !hotel && currentView === 'home' ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-200 shadow-xl px-10 animate-fade-in">
            <Info className="mx-auto text-slate-300 mb-6" size={64} />
            <h2 className="text-3xl font-black mb-2">Tesis Bulunamadı</h2>
            <p className="text-slate-500 leading-relaxed mb-8">Bağlantınız geçersiz görünüyor veya bu tesis artık platformumuzda yer almıyor.</p>
            <button 
              onClick={() => navigateTo('landing', '/')}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm"
            >
              Ana Sayfaya Git
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
             {currentView === 'home' && hotel && (
               <>
                 <div className="relative overflow-hidden rounded-[3rem] border border-slate-200 shadow-2xl group bg-white">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />
                   <img src={hotel?.banner_url || hotel?.logo_url || "https://images.unsplash.com/photo-1618773928121-c32242e63f39"} className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-1000" />
                   <div className="absolute bottom-0 left-0 p-10 z-20 w-full">
                     <p className="text-orange-400 font-black uppercase tracking-[0.3em] text-[10px] mb-2">{hotel?.name}</p>
                     <h2 className="text-5xl font-black text-white mb-6 leading-tight">{t.welcome},<br/>Misafirimiz</h2>
                     <div className="flex items-center gap-2">
                        <span className="bg-orange-600 text-white px-6 py-2 rounded-full text-xs font-black shadow-lg shadow-orange-900/40">{t.room} {roomNumber}</span>
                        <span className="bg-white/10 backdrop-blur-md text-white/80 px-4 py-2 rounded-full text-xs font-bold border border-white/20">Aktif Konaklama</span>
                     </div>
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg">
                     <Wifi className="text-blue-500 mb-4" size={28} />
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{t.wifi}</p>
                     <p className="font-black text-slate-900 text-lg">{hotel?.wifi_name}</p>
                     <p className="text-xs text-slate-400 font-bold mt-1">Sifre: {hotel?.wifi_pass}</p>
                   </div>
                   <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg">
                     <Clock className="text-rose-500 mb-4" size={28} />
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{t.checkout}</p>
                     <p className="font-black text-slate-900 text-lg">{hotel?.checkout_time}</p>
                     <p className="text-xs text-slate-400 font-bold mt-1">Öğle Vakti</p>
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => { setDiningMode('food'); setCurrentView('dining'); }} className="bg-white p-8 rounded-[3rem] text-left flex flex-col gap-6 border border-slate-200 shadow-lg hover:shadow-2xl transition-all group">
                     <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all"><UtensilsCrossed size={32} /></div>
                     <div><h3 className="font-black text-2xl mb-1 text-slate-900">{t.food}</h3><p className="text-slate-500 text-xs leading-relaxed font-medium">{t.foodDesc}</p></div>
                   </button>
                   <button onClick={() => { setDiningMode('market'); setCurrentView('dining'); }} className="bg-white p-8 rounded-[3rem] text-left flex flex-col gap-6 border border-slate-200 shadow-lg hover:shadow-2xl transition-all group">
                     <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all"><Store size={32} /></div>
                     <div><h3 className="font-black text-2xl mb-1 text-slate-900">{t.market}</h3><p className="text-slate-500 text-xs leading-relaxed font-medium">{t.marketDesc}</p></div>
                   </button>
                   <button onClick={() => setCurrentView('amenities')} className="bg-white p-8 rounded-[3rem] text-left flex flex-col gap-6 border border-slate-200 shadow-lg hover:shadow-2xl transition-all group">
                     <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><BellRing size={32} /></div>
                     <div><h3 className="font-black text-2xl mb-1 text-slate-900">{t.services}</h3><p className="text-slate-500 text-xs leading-relaxed font-medium">{t.servicesDesc}</p></div>
                   </button>
                   <button onClick={() => setCurrentView('chat')} className="bg-slate-900 p-8 rounded-[3rem] text-left flex flex-col gap-6 border border-slate-800 shadow-2xl hover:shadow-orange-500/10 transition-all group">
                     <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center bg-orange-500 text-white shadow-lg shadow-orange-900/20"><Sparkles size={32} /></div>
                     <div><h3 className="font-black text-2xl mb-1 text-white">AI Asistan</h3><p className="text-slate-400 text-xs leading-relaxed font-medium">Size özel rehberlik</p></div>
                   </button>
                 </div>
               </>
             )}
             {currentView === 'dining' && (
               <div className="space-y-8 animate-fade-in">
                  <div className="bg-slate-200/50 p-2 rounded-full flex border border-slate-300 shadow-inner mb-6 backdrop-blur-sm">
                     <button onClick={() => setDiningMode('food')} className={`flex-1 py-4 px-8 rounded-full text-sm font-black transition-all ${diningMode === 'food' ? 'bg-white text-orange-600 shadow-xl' : 'text-slate-500'}`}>{t.food}</button>
                     <button onClick={() => setDiningMode('market')} className={`flex-1 py-4 px-8 rounded-full text-sm font-black transition-all ${diningMode === 'market' ? 'bg-white text-emerald-600 shadow-xl' : 'text-slate-500'}`}>{t.market}</button>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                     {menuItems.filter(i => i.type === diningMode).map(item => (
                       <MenuCard key={item.id} item={item} onAdd={addToCart} onView={setSelectedProduct} />
                     ))}
                  </div>
               </div>
             )}
             {currentView === 'amenities' && (
               <div className="space-y-8 animate-fade-in">
                 <h2 className="text-4xl font-black text-slate-900">{t.serviceRequest}</h2>
                 <div className="grid grid-cols-2 gap-5">
                   {SERVICE_ITEMS.map(item => (
                     <button key={item.id} onClick={() => handleServiceRequest(item)} className="bg-white p-10 rounded-[3rem] flex flex-col items-center gap-5 border border-slate-200 shadow-lg hover:shadow-2xl transition-all text-center">
                       <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center shadow-inner">{item.icon}</div>
                       <span className="font-black text-slate-900 text-lg leading-tight">{t.serviceNames[item.nameKey as keyof typeof t.serviceNames]}</span>
                     </button>
                   ))}
                 </div>
               </div>
             )}
             {currentView === 'chat' && <AIChat hotelInfo={hotel} menuItems={menuItems} />}
             {currentView === 'cart' && (
               <div className="space-y-8 animate-fade-in">
                 <h2 className="text-4xl font-black text-slate-900">{t.total}</h2>
                 {cart.length === 0 ? (
                   <div className="text-center py-32 bg-white rounded-[4rem] border border-slate-200 shadow-xl px-12">
                     <ShoppingBasket size={48} className="text-slate-200 mx-auto mb-8" /><p className="text-slate-400 font-black text-xl">{t.emptyCart}</p>
                   </div>
                 ) : (
                   <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
                     <div className="divide-y divide-slate-100">
                       {cart.map(item => (
                         <div key={item.id} className="p-6 flex items-center gap-6">
                           <img src={item.image} className="w-24 h-24 rounded-3xl object-cover shadow-md" />
                           <div className="flex-1"><h4 className="font-black text-lg text-slate-900">{item.name}</h4><p className="text-orange-600 font-black">₺{item.price * item.quantity}</p></div>
                           <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-2xl">
                              <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: Math.max(0, i.quantity - 1)} : i).filter(i => i.quantity > 0))} className="w-8 h-8 font-black text-slate-400">-</button>
                              <span className="font-black text-slate-900">{item.quantity}</span>
                              <button onClick={() => addToCart(item)} className="w-8 h-8 font-black text-orange-600">+</button>
                           </div>
                         </div>
                       ))}
                     </div>
                     <div className="p-10 bg-slate-50 border-t border-slate-100">
                        <p className="text-5xl font-black text-slate-900 mb-10">₺{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</p>
                        <button onClick={() => setShowOrderConfirm(true)} className="w-full bg-orange-600 text-white py-6 rounded-[2rem] font-black text-2xl shadow-2xl shadow-orange-900/20 active:scale-95 transition-all">{t.confirmOrder}</button>
                     </div>
                   </div>
                 )}
               </div>
             )}
          </div>
        )}
      </main>

      {/* Popups */}
      {notification && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[80] bg-slate-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-5 animate-fade-in-up">
          <CheckCircle2 size={24} className="text-emerald-500" /><span className="font-black">{notification}</span>
        </div>
      )}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xl p-4" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white w-full max-w-lg rounded-[4rem] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={selectedProduct.image} className="w-full h-80 object-cover" />
            <div className="p-12">
              <h3 className="text-4xl font-black text-slate-900 mb-6">{selectedProduct.name}</h3>
              <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10">{selectedProduct.description}</p>
              <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl">{t.addToCart} - ₺{selectedProduct.price}</button>
            </div>
          </div>
        </div>
      )}
      {showOrderConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-2xl p-4">
          <div className="bg-white w-full max-sm:w-[95%] rounded-[4rem] p-12 text-center shadow-2xl text-slate-900">
             <ShieldCheck size={48} className="text-orange-600 mx-auto mb-8" />
             <h3 className="text-3xl font-black mb-4">{t.confirmOrder}</h3>
             <input type="text" maxLength={4} value={authInput} onChange={e => setAuthInput(e.target.value)} className="w-full bg-slate-50 border-4 border-slate-100 rounded-[2rem] p-6 text-center text-5xl font-black mb-10 outline-none focus:border-orange-500" placeholder="0000" />
             <button onClick={handleOrderSubmit} className="w-full bg-orange-600 text-white py-6 rounded-2xl font-black text-xl mb-4">Onayla</button>
             <button onClick={() => setShowOrderConfirm(false)} className="w-full py-4 font-black text-slate-400">Vazgeç</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
