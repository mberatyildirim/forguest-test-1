
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MenuCard from './components/MenuCard';
import AdminPanel from './components/AdminPanel';
import HotelPanel from './components/HotelPanel';
import AIChat from './components/AIChat';
import { ViewState, PanelState, CartItem, MenuItem, ServiceItem, Language, Hotel } from './types';
import { supabase } from './lib/supabase';
import { 
  SERVICE_ITEMS, 
  TRANSLATIONS 
} from './constants';
import { 
  UtensilsCrossed, 
  BellRing, 
  Store, 
  Wifi, 
  Clock, 
  CheckCircle2, 
  ShoppingBasket,
  Star,
  ShieldCheck,
  Building,
  Sparkles,
  Info
} from 'lucide-react';

const App: React.FC = () => {
  const [panelMode, setPanelMode] = useState<PanelState>('guest');
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
  const [roomNumber, setRoomNumber] = useState<string>("6");
  const [loading, setLoading] = useState(true);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hotelId = params.get('h') || '59ffd86b-6ade-4782-8ec1-4d4fa78aefda';
    const room = params.get('r');
    
    if (room) setRoomNumber(room);

    const fetchData = async () => {
      setLoading(true);
      
      const { data: hotelData, error: hotelError } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', hotelId)
        .single();
      
      if (hotelData) {
        setHotel(hotelData);
      } else {
        console.error("Hotel not found", hotelError);
      }

      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('is_available', true);
      
      if (menuData) setMenuItems(menuData);
      
      setLoading(false);
    };

    fetchData();
  }, []);

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

  if (panelMode === 'admin_dashboard') return <AdminPanel />;
  if (panelMode === 'hotel_dashboard') return <HotelPanel />;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 selection:bg-orange-200">
      {/* Dev Navigation Controls */}
      <div className="fixed top-24 left-4 z-[200] flex flex-col gap-2 opacity-30 hover:opacity-100 transition-opacity">
         <button onClick={() => setPanelMode('guest')} title="Guest App" className={`p-3 rounded-2xl shadow-xl border transition-all ${panelMode === 'guest' ? 'bg-orange-600 text-white border-orange-700' : 'bg-white text-slate-400 hover:text-orange-600 border-slate-200'}`}><Star size={20}/></button>
         <button onClick={() => setPanelMode('hotel_dashboard')} title="Hotel Admin" className="p-3 bg-white rounded-2xl shadow-xl border border-slate-200 text-slate-400 hover:text-emerald-600 transition-all"><Building size={20}/></button>
         <button onClick={() => setPanelMode('admin_dashboard')} title="Super Admin" className="p-3 bg-white rounded-2xl shadow-xl border border-slate-200 text-slate-400 hover:text-blue-600 transition-all"><ShieldCheck size={20}/></button>
      </div>

      <Header currentView={currentView} onNavigate={setCurrentView} cartCount={cart.length} lang={lang} setLang={setLang} />
      
      <main className="max-w-2xl mx-auto px-4 pt-10 pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-6 font-black text-slate-400 animate-pulse uppercase tracking-widest text-xs">forGuest Yükleniyor</p>
          </div>
        ) : !hotel && currentView === 'home' ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-200 shadow-xl px-10">
            <Info className="mx-auto text-slate-300 mb-6" size={64} />
            <h2 className="text-3xl font-black mb-2">QR Kod Bulunamadı</h2>
            <p className="text-slate-500 leading-relaxed">Lütfen odanızdaki geçerli bir QR kodu taratarak sisteme giriş yapın.</p>
          </div>
        ) : (
          <>
            {currentView === 'home' && (
              <div className="space-y-8 animate-fade-in">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-[3rem] border border-slate-200 shadow-2xl group bg-white">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />
                  <img src={hotel?.logo_url || "https://images.unsplash.com/photo-1618773928121-c32242e63f39"} className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-1000" />
                  <div className="absolute bottom-0 left-0 p-10 z-20 w-full">
                    <p className="text-orange-400 font-black uppercase tracking-[0.3em] text-[10px] mb-2">{hotel?.name}</p>
                    <h2 className="text-5xl font-black text-white mb-6 leading-tight">{t.welcome},<br/>Misafirimiz</h2>
                    <div className="flex items-center gap-2">
                       <span className="bg-orange-600 text-white px-6 py-2 rounded-full text-xs font-black shadow-lg shadow-orange-900/40">{t.room} {roomNumber}</span>
                       <span className="bg-white/10 backdrop-blur-md text-white/80 px-4 py-2 rounded-full text-xs font-bold border border-white/20">Aktif Konaklama</span>
                    </div>
                  </div>
                </div>

                {/* Hotel Quick Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg group hover:border-blue-200 transition-colors">
                    <Wifi className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" size={28} />
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{t.wifi}</p>
                    <p className="font-black text-slate-900 text-lg">{hotel?.wifi_name}</p>
                    <p className="text-xs text-slate-400 font-bold mt-1">Sifre: {hotel?.wifi_pass}</p>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg group hover:border-rose-200 transition-colors">
                    <Clock className="text-rose-500 mb-4 group-hover:scale-110 transition-transform" size={28} />
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{t.checkout}</p>
                    <p className="font-black text-slate-900 text-lg">{hotel?.checkout_time}</p>
                    <p className="text-xs text-slate-400 font-bold mt-1">Öğle Vakti</p>
                  </div>
                </div>

                {/* Navigation Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => { setDiningMode('food'); setCurrentView('dining'); }} className="bg-white p-8 rounded-[3rem] text-left flex flex-col gap-6 border border-slate-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all group">
                    <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-inner"><UtensilsCrossed size={32} /></div>
                    <div>
                      <h3 className="font-black text-2xl mb-1 text-slate-900">{t.food}</h3>
                      <p className="text-slate-500 text-xs leading-relaxed font-medium">{t.foodDesc}</p>
                    </div>
                  </button>
                  <button onClick={() => { setDiningMode('market'); setCurrentView('dining'); }} className="bg-white p-8 rounded-[3rem] text-left flex flex-col gap-6 border border-slate-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all group">
                    <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner"><Store size={32} /></div>
                    <div>
                      <h3 className="font-black text-2xl mb-1 text-slate-900">{t.market}</h3>
                      <p className="text-slate-500 text-xs leading-relaxed font-medium">{t.marketDesc}</p>
                    </div>
                  </button>
                  <button onClick={() => setCurrentView('amenities')} className="bg-white p-8 rounded-[3rem] text-left flex flex-col gap-6 border border-slate-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all group">
                    <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner"><BellRing size={32} /></div>
                    <div>
                      <h3 className="font-black text-2xl mb-1 text-slate-900">{t.services}</h3>
                      <p className="text-slate-500 text-xs leading-relaxed font-medium">{t.servicesDesc}</p>
                    </div>
                  </button>
                  <button onClick={() => setCurrentView('chat')} className="bg-slate-900 p-8 rounded-[3rem] text-left flex flex-col gap-6 border border-slate-800 shadow-2xl hover:-translate-y-1 transition-all group">
                    <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center bg-orange-500 text-white group-hover:scale-110 transition-all shadow-lg shadow-orange-900/20"><Sparkles size={32} /></div>
                    <div>
                      <h3 className="font-black text-2xl mb-1 text-white">AI Asistan</h3>
                      <p className="text-slate-400 text-xs leading-relaxed font-medium">Size özel rehberlik</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
            
            {currentView === 'dining' && (
              <div className="space-y-8 animate-fade-in">
                 <div className="bg-slate-200/50 p-2 rounded-full flex border border-slate-300 shadow-inner mb-6 backdrop-blur-sm">
                    <button onClick={() => setDiningMode('food')} className={`flex-1 py-4 px-8 rounded-full text-sm font-black transition-all ${diningMode === 'food' ? 'bg-white text-orange-600 shadow-xl scale-[1.02]' : 'text-slate-500'}`}>{t.food}</button>
                    <button onClick={() => setDiningMode('market')} className={`flex-1 py-4 px-8 rounded-full text-sm font-black transition-all ${diningMode === 'market' ? 'bg-white text-emerald-600 shadow-xl scale-[1.02]' : 'text-slate-500'}`}>{t.market}</button>
                 </div>
                 <div className="flex items-center justify-between mb-4">
                    <h2 className="text-4xl font-black text-slate-900">{diningMode === 'food' ? t.diningTitle : t.marketTitle}</h2>
                    <span className="text-[10px] font-black bg-slate-200 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest">{menuItems.filter(i => i.type === diningMode).length} Çeşit</span>
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
                    <button key={item.id} onClick={() => handleServiceRequest(item)} className="bg-white p-10 rounded-[3rem] flex flex-col items-center gap-5 border border-slate-200 shadow-lg hover:shadow-2xl transition-all group active:scale-95 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center group-hover:bg-orange-50 group-hover:scale-110 transition-all shadow-inner">{item.icon}</div>
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
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <ShoppingBasket size={48} className="text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-black text-xl mb-4">{t.emptyCart}</p>
                    <button onClick={() => setCurrentView('dining')} className="bg-orange-600 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-orange-500 transition-all">Menüye Göz At</button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
                      <div className="divide-y divide-slate-100">
                        {cart.map(item => (
                          <div key={item.id} className="p-6 flex items-center gap-6 hover:bg-slate-50 transition-colors">
                            <img src={item.image} className="w-24 h-24 rounded-3xl object-cover shadow-md" />
                            <div className="flex-1">
                              <h4 className="font-black text-lg text-slate-900 mb-1">{item.name}</h4>
                              <p className="text-orange-600 font-black text-xl">₺{item.price * item.quantity}</p>
                            </div>
                            <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-2xl">
                               <button onClick={() => {
                                 setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: Math.max(0, i.quantity - 1)} : i).filter(i => i.quantity > 0));
                               }} className="w-8 h-8 flex items-center justify-center font-black text-slate-400">-</button>
                               <span className="font-black text-slate-900 min-w-[1.5rem] text-center">{item.quantity}</span>
                               <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center font-black text-orange-600">+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-10 bg-slate-50 border-t border-slate-100">
                         <div className="flex justify-between items-center mb-10">
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Toplam Ödeme</p>
                            <p className="text-5xl font-black text-slate-900">₺{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</p>
                         </div>
                         <button onClick={() => setShowOrderConfirm(true)} className="w-full bg-orange-600 text-white py-6 rounded-[2rem] font-black text-2xl shadow-2xl shadow-orange-900/20 active:scale-95 transition-all hover:bg-orange-500">
                           {t.confirmOrder}
                         </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modern Notification Toast */}
      {notification && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[80] bg-slate-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-5 animate-fade-in-up border border-slate-700 backdrop-blur-md">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
          <span className="font-black text-base">{notification}</span>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xl p-4" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white w-full max-w-lg rounded-[4rem] overflow-hidden animate-fade-in shadow-[0_0_100px_rgba(0,0,0,0.5)]" onClick={e => e.stopPropagation()}>
            <div className="relative">
              <img src={selectedProduct.image} className="w-full h-80 object-cover" />
              <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">✕</button>
            </div>
            <div className="p-12">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-4xl font-black text-slate-900 mb-2">{selectedProduct.name}</h3>
                  <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{selectedProduct.category}</span>
                </div>
                <span className="text-3xl font-black text-orange-600">₺{selectedProduct.price}</span>
              </div>
              <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10">{selectedProduct.description}</p>
              <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-slate-800 transition-all active:scale-95">
                {t.addToCart}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation Screen */}
      {showOrderConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-2xl p-4">
          <div className="bg-white w-full max-w-sm rounded-[4rem] p-12 animate-fade-in text-center shadow-2xl">
             <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-8">
               <ShieldCheck size={48} />
             </div>
             <h3 className="text-3xl font-black mb-4 text-slate-900">{t.confirmOrder}</h3>
             <p className="text-slate-500 font-medium mb-10 text-sm">Siparişi onaylamak için lütfen oda doğrulama kodunuzu girin.</p>
             <input type="text" maxLength={4} value={authInput} onChange={e => setAuthInput(e.target.value)} className="w-full bg-slate-50 border-4 border-slate-100 rounded-[2rem] p-6 text-center text-5xl font-black mb-10 outline-none focus:border-orange-500 focus:bg-white transition-all tracking-[0.2em] placeholder:text-slate-200" placeholder="0000" />
             <div className="flex flex-col gap-4">
               <button onClick={handleOrderSubmit} className="w-full bg-orange-600 text-white py-6 rounded-2xl font-black text-xl shadow-xl hover:bg-orange-500 transition-all">Siparişi Tamamla</button>
               <button onClick={() => setShowOrderConfirm(false)} className="w-full py-4 font-black text-slate-400 hover:text-slate-600 transition-colors">Vazgeç</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
