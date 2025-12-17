
import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardList, 
  ChefHat, 
  QrCode, 
  Settings, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Package, 
  Bell,
  Clock,
  Save,
  Download,
  Plus,
  Trash2,
  Image as ImageIcon,
  MoreVertical,
  LogOut,
  X,
  Loader2,
  Upload
} from 'lucide-react';
import { supabase, uploadFile, uploadBlob } from '../lib/supabase';
import { MenuItem, Order, Room } from '../types';

const HotelPanel: React.FC = () => {
  const [view, setView] = useState<'orders' | 'menu' | 'rooms'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hotelId, setHotelId] = useState<string | null>(null);
  
  // Modal States
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form States
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({ 
    name: '', 
    description: '', 
    price: 0, 
    type: 'food', 
    popular: false, 
    is_available: true,
    image: '',
    category: 'mains'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      let hId = params.get('h');
      
      if (!hId) {
        const { data: hotels } = await supabase.from('hotels').select('id').limit(1);
        if (hotels && hotels[0]) {
          hId = hotels[0].id;
        } else {
          hId = '59ffd86b-6ade-4782-8ec1-4d4fa78aefda';
        }
      }

      setHotelId(hId);
      if (hId) {
        fetchOrders(hId);
        fetchMenu(hId);
        fetchRooms(hId);
      }
    };
    init();

    const orderSub = supabase
      .channel('orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        if (hotelId) fetchOrders(hotelId);
      })
      .subscribe();

    return () => { supabase.removeChannel(orderSub); };
  }, [hotelId]);

  const fetchOrders = async (hId: string) => {
    const { data } = await supabase.from('orders').select('*').eq('hotel_id', hId).order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const fetchMenu = async (hId: string) => {
    const { data } = await supabase.from('menu_items').select('*').eq('hotel_id', hId).order('created_at', { ascending: false });
    if (data) setMenuItems(data);
  };

  const fetchRooms = async (hId: string) => {
    const { data } = await supabase.from('rooms').select('*').eq('hotel_id', hId).order('room_number', { ascending: true });
    if (data) setRooms(data);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !hotelId) return;

    try {
      setIsUploading(true);
      const fileName = `${hotelId}/products/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const publicUrl = await uploadFile('resimler', file, fileName);
      setNewItem(prev => ({ ...prev, image: publicUrl }));
    } catch (err) {
      alert("Görsel yüklenemedi!");
    } finally {
      setIsUploading(false);
    }
  };

  const saveMenuItem = async () => {
    if (!hotelId || !newItem.name || !newItem.image) {
      alert("Lütfen ürün ismi ve görselini eksiksiz girin.");
      return;
    }
    
    try {
      setIsUploading(true);
      const payload = { 
        ...newItem, 
        hotel_id: hotelId,
        price: Number(newItem.price) || 0
      };

      const { error } = await supabase.from('menu_items').upsert(payload);
      
      if (!error) {
        setIsEditingMenu(false);
        setNewItem({ name: '', description: '', price: 0, type: 'food', popular: false, is_available: true, image: '', category: 'mains' });
        fetchMenu(hotelId);
      } else {
        throw error;
      }
    } catch (err: any) {
      alert("Menü kaydedilemedi: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteMenuItem = async (id: string) => {
    if (window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (!error && hotelId) fetchMenu(hotelId);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoomNumber || !hotelId) {
      alert("Oda numarası veya otel bilgisi eksik!");
      return;
    }

    try {
      setIsUploading(true);
      
      // YENİ LINK YAPISI: forguest.io/hotel_id/room_number
      const qrContent = `https://forguest.io/${hotelId}/${newRoomNumber}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrContent)}`;
      
      const response = await fetch(qrApiUrl);
      if (!response.ok) throw new Error("QR API hatası");
      const blob = await response.blob();
      
      const qrFileName = `${hotelId}/qr/room-${newRoomNumber}-${Date.now()}.png`;
      const qrPublicUrl = await uploadBlob('qr', blob, qrFileName);

      const { error } = await supabase.from('rooms').insert({ 
        hotel_id: hotelId, 
        room_number: newRoomNumber,
        qr_url: qrPublicUrl
      });

      if (!error) {
        setIsAddingRoom(false);
        setNewRoomNumber('');
        fetchRooms(hotelId);
      } else {
        throw error;
      }
    } catch (err: any) {
      alert("Oda oluşturulamadı: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    if (hotelId) fetchOrders(hotelId);
  };

  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + o.total_amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-inter">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 p-8 flex flex-col gap-10 shadow-sm z-20 sticky top-0 h-screen">
        <div className="flex items-center gap-4 px-2">
           <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl"><ChefHat size={28} /></div>
           <div>
              <h1 className="text-xl font-black tracking-tight">Otel Paneli</h1>
              <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">YÖNETİCİ MODU</span>
           </div>
        </div>
        
        <nav className="space-y-2">
          <button onClick={() => setView('orders')} className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold text-sm transition-all ${view === 'orders' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <div className="flex items-center gap-3"><ClipboardList size={20} /> Canlı Siparişler</div>
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <span className="bg-white text-orange-600 px-2 py-0.5 rounded-lg text-[10px] animate-pulse">{orders.filter(o => o.status === 'pending').length}</span>
            )}
          </button>
          <button onClick={() => setView('menu')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${view === 'menu' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}><Package size={20} /> Menü Yönetimi</button>
          <button onClick={() => setView('rooms')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${view === 'rooms' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}><QrCode size={20} /> Odalar & QR</button>
        </nav>

        <div className="mt-auto bg-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group">
           <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Toplam Ciro</p>
           <p className="text-3xl font-black mb-3">₺{totalRevenue.toLocaleString()}</p>
           <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              <TrendingUp size={14} /> Canlı Sistem
           </div>
        </div>

        <button onClick={() => window.location.reload()} className="flex items-center gap-3 px-6 py-4 text-slate-400 font-bold hover:text-slate-900 transition-colors">
          <LogOut size={18} /> Çıkış Yap
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-12 overflow-y-auto no-scrollbar">
        {view === 'orders' && (
          <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-center">
               <h2 className="text-4xl font-black text-slate-900">Sipariş Talepleri</h2>
               <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sistem Aktif
               </div>
            </div>

            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="py-24 text-center bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
                   <p className="text-slate-400 font-bold text-lg">Bekleyen sipariş yok.</p>
                </div>
              ) : orders.map(order => (
                <div key={order.id} className={`bg-white border-2 rounded-[2.5rem] p-8 shadow-sm flex items-center justify-between transition-all ${order.status === 'pending' ? 'border-orange-500 shadow-lg shadow-orange-50' : 'border-slate-100 opacity-90'}`}>
                  <div className="flex items-center gap-10">
                     <div className="bg-slate-50 w-20 h-20 rounded-2xl flex flex-col items-center justify-center border border-slate-100 shadow-inner">
                        <span className="text-[9px] text-slate-400 font-black uppercase">ODA</span>
                        <span className="text-3xl font-black text-slate-900">{order.room_number}</span>
                     </div>
                     <div>
                        <p className="text-lg font-black text-slate-900 mb-1">
                          {order.items.map((i: any) => `${i.name} x${i.quantity}`).join(', ')}
                        </p>
                        <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                          <Clock size={12} /> {new Date(order.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                     </div>
                  </div>

                  <div className="flex items-center gap-8">
                     <p className="text-2xl font-black text-slate-900">₺{order.total_amount}</p>
                     <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[11px] shadow-lg hover:bg-orange-600 transition-all uppercase tracking-wider">Hazırla</button>
                        )}
                        {order.status === 'preparing' && (
                          <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-[11px] shadow-lg hover:bg-emerald-700 transition-all uppercase tracking-wider">Teslim Et</button>
                        )}
                        <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-500 hover:bg-rose-50 transition-all"><XCircle size={22} /></button>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'menu' && (
          <div className="animate-fade-in space-y-8">
             <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black text-slate-900">Ürün Yönetimi</h2>
                <button onClick={() => { setNewItem({ type: 'food', popular: false, is_available: true, category: 'mains', name: '', description: '', price: 0, image: '' }); setIsEditingMenu(true); }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-orange-600 transition-all active:scale-95"><Plus size={20} /> Yeni Ürün</button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map(item => (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                    <div className="relative h-48 overflow-hidden">
                      <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">{item.type === 'food' ? 'MUTFAK' : 'MARKET'}</span>
                        {item.popular && <span className="bg-orange-600 text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">POPÜLER</span>}
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="font-black text-xl text-slate-900 mb-2">{item.name}</h4>
                      <p className="text-slate-400 text-xs font-medium line-clamp-2 mb-6">{item.description}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <p className="text-2xl font-black text-orange-600">₺{item.price}</p>
                        <div className="flex gap-2">
                          <button onClick={() => { setNewItem(item); setIsEditingMenu(true); }} className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all"><Settings size={18} /></button>
                          <button onClick={() => deleteMenuItem(item.id)} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {view === 'rooms' && (
          <div className="animate-fade-in space-y-8">
             <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black text-slate-900">Oda & QR Kodları</h2>
                <button onClick={() => setIsAddingRoom(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-orange-600 transition-all active:scale-95">
                   <Plus size={20} /> Yeni Oda Ekle
                </button>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {rooms.map(room => (
                  <div key={room.id} className="bg-white border border-slate-200 p-8 rounded-[2.5rem] text-center shadow-sm hover:shadow-xl transition-all group relative">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">ODA {room.room_number}</p>
                     <div className="bg-slate-50 p-6 rounded-3xl mb-6 border border-slate-100 flex items-center justify-center aspect-square shadow-inner">
                        <img 
                          src={room.qr_url} 
                          alt="QR" 
                          className="w-full h-auto" 
                        />
                     </div>
                     <button onClick={() => window.open(room.qr_url, '_blank')} className="w-full py-3 bg-slate-50 text-slate-900 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all">
                        <Download size={16} /> QR İNDİR (HD)
                     </button>
                     <p className="mt-3 text-[8px] text-slate-300 font-mono truncate">{`forguest.io/${hotelId}/${room.room_number}`}</p>
                     <button onClick={async () => { if(confirm("Odayı silmek istediğinize emin misiniz?")) { await supabase.from('rooms').delete().eq('id', room.id); fetchRooms(hotelId!); } }} className="absolute -top-2 -right-2 p-3 bg-rose-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg"><Trash2 size={16} /></button>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* Ürün Modal */}
      {isEditingMenu && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[3rem] p-8 md:p-12 w-full max-w-xl shadow-2xl animate-fade-in relative my-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black text-slate-900">Ürün Kartı</h3>
              <button onClick={() => setIsEditingMenu(false)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Ürün Adı</label>
                 <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-orange-500 font-bold transition-all" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Fiyat (₺)</label>
                   <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-orange-500 font-black" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Kategori</label>
                   <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value as any})}>
                     <option value="food">Mutfak (In-Room Dining)</option>
                     <option value="market">Market (Ürünler)</option>
                   </select>
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Ürün Görseli</label>
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative group"
                 >
                   {newItem.image ? (
                     <img src={newItem.image} className="w-full h-full object-cover" />
                   ) : (
                     <>
                       {isUploading ? <Loader2 size={32} className="animate-spin text-orange-500" /> : <Upload size={32} className="text-slate-300 mb-2" />}
                       <span className="text-xs font-bold text-slate-400">Görsel Seç / Yükle</span>
                     </>
                   )}
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>

              <div className="flex items-center gap-4 py-4 px-6 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer select-none" onClick={() => setNewItem({...newItem, popular: !newItem.popular})}>
                 <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${newItem.popular ? 'bg-orange-600 border-orange-600 text-white' : 'border-slate-300 bg-white'}`}>
                   {newItem.popular && <CheckCircle size={14} />}
                 </div>
                 <span className="font-bold text-slate-600 text-sm">Öne Çıkar (Popüler)</span>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setIsEditingMenu(false)} className="flex-1 py-4 font-bold text-slate-400">İptal</button>
              <button onClick={saveMenuItem} disabled={isUploading} className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-orange-600 transition-all disabled:opacity-50">
                {isUploading ? 'Yükleniyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Oda Modal */}
      {isAddingRoom && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl animate-fade-in text-center">
              <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <QrCode size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Yeni Oda</h3>
              <p className="text-slate-400 text-sm mb-8">QR Link: forguest.io/{hotelId}/...</p>
              
              <input 
                type="text" 
                placeholder="Oda No (Örn: 501)" 
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-3xl font-black mb-8 focus:border-orange-500 outline-none transition-all"
                value={newRoomNumber}
                onChange={e => setNewRoomNumber(e.target.value)}
              />

              <div className="flex flex-col gap-3">
                <button onClick={handleAddRoom} disabled={isUploading || !newRoomNumber} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-orange-600 transition-all disabled:opacity-50">
                  {isUploading ? 'Oluşturuluyor...' : 'Odayı Onayla'}
                </button>
                <button onClick={() => setIsAddingRoom(false)} className="w-full py-3 font-bold text-slate-400">Vazgeç</button>
              </div>
           </div>
        </div>
      )}

      {/* Global Loading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-[200] bg-white/40 backdrop-blur-md flex items-center justify-center">
           <div className="flex flex-col items-center">
              <Loader2 size={48} className="animate-spin text-orange-600 mb-4" />
              <span className="font-black text-slate-900 text-[10px] uppercase tracking-widest">Sistem İşlemde...</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default HotelPanel;
