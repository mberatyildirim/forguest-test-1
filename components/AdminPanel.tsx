
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Hotel, 
  Activity, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Settings, 
  Save, 
  X, 
  Building2, 
  Upload, 
  Loader2, 
  CheckCircle,
  TrendingUp,
  Clock,
  Globe,
  DollarSign
} from 'lucide-react';
import { supabase, uploadFile } from '../lib/supabase';
import { Hotel as HotelType } from '../types';

const AdminPanel: React.FC = () => {
  const [hotels, setHotels] = useState<HotelType[]>([]);
  const [globalOrders, setGlobalOrders] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Partial<HotelType> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'hotels'>('dashboard');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchHotels();
    fetchGlobalOrders();

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchGlobalOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchHotels = async () => {
    const { data } = await supabase.from('hotels').select('*').order('created_at', { ascending: false });
    if (data) setHotels(data);
  };

  const fetchGlobalOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        hotels (name)
      `)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) setGlobalOrders(data);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      const path = `system/hotels/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const url = await uploadFile('resimler', file, path);
      setEditingHotel(prev => ({ ...prev, [type === 'logo' ? 'logo_url' : 'banner_url']: url }));
    } catch (err) {
      alert("Resim yükleme hatası!");
    } finally {
      setIsUploading(false);
    }
  };

  const saveHotel = async () => {
    if (!editingHotel?.name) return;
    
    setIsUploading(true);
    const { error } = await supabase.from('hotels').upsert(editingHotel);
    
    if (!error) {
      setIsModalOpen(false);
      setEditingHotel(null);
      fetchHotels();
    } else {
      alert("Hata: " + error.message);
    }
    setIsUploading(false);
  };

  const deleteHotel = async (id: string) => {
    if (confirm("Bu tesisi silmek istediğinize emin misiniz?")) {
      await supabase.from('hotels').delete().eq('id', id);
      fetchHotels();
    }
  };

  const openEdit = (hotel?: HotelType) => {
    setEditingHotel(hotel || {
      name: '',
      logo_url: '',
      banner_url: '',
      wifi_name: '',
      wifi_pass: '',
      checkout_time: '11:00',
      reception_phone: '',
      whatsapp_number: ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white flex font-inter">
      {/* Sidebar */}
      <div className="w-80 bg-[#11141b] border-r border-white/5 p-10 flex flex-col gap-12 sticky top-0 h-screen">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">forGuest</h1>
          <span className="text-[10px] opacity-30 uppercase tracking-[0.4em] font-bold">GLOBAL ADMIN</span>
        </div>
        
        <nav className="space-y-4">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${view === 'dashboard' ? 'bg-orange-600 text-white shadow-xl' : 'text-slate-500 hover:bg-white/5'}`}>
            <LayoutDashboard size={20} /> Canlı Akış
          </button>
          <button onClick={() => setView('hotels')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${view === 'hotels' ? 'bg-orange-600 text-white shadow-xl' : 'text-slate-500 hover:bg-white/5'}`}>
            <Hotel size={20} /> Tesis Ağı
          </button>
        </nav>
      </div>

      <div className="flex-1 p-16 overflow-y-auto no-scrollbar">
        {view === 'dashboard' ? (
          <div className="animate-fade-in">
             <header className="mb-12">
                <h2 className="text-5xl font-black tracking-tight mb-2">Canlı Platform Akışı</h2>
                <p className="text-slate-500 font-medium">Global ağdaki tüm aktif siparişler.</p>
             </header>

             <div className="bg-[#11141b] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                   <h3 className="text-lg font-black flex items-center gap-3">Son Hareketler</h3>
                </div>
                <div className="divide-y divide-white/5">
                   {globalOrders.map(order => (
                     <div key={order.id} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-8">
                           <div className="w-14 h-14 bg-white/5 rounded-2xl flex flex-col items-center justify-center border border-white/10">
                              <span className="text-[8px] opacity-40 font-black">ODA</span>
                              <span className="text-xl font-black">{order.room_number}</span>
                           </div>
                           <div>
                              <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-1">{order.hotels?.name || 'Yükleniyor...'}</p>
                              <p className="text-base font-bold text-slate-200">{order.items?.length || 0} Ürün</p>
                           </div>
                        </div>
                        <p className="text-2xl font-black text-white">₺{order.total_amount?.toLocaleString()}</p>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        ) : (
          <div className="animate-fade-in">
             <header className="flex justify-between items-end mb-12">
                <div>
                   <h2 className="text-5xl font-black tracking-tight mb-2">Tesis Yönetimi</h2>
                </div>
                <button onClick={() => openEdit()} className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-orange-500 transition-all shadow-xl">
                   <Plus size={20} /> Yeni Tesis
                </button>
             </header>

             <div className="grid grid-cols-1 gap-4">
                {hotels.map(hotel => (
                  <div key={hotel.id} className="bg-[#11141b] border border-white/5 rounded-[2.5rem] p-6 flex items-center justify-between group hover:border-orange-500/30 transition-all">
                     <div className="flex items-center gap-8">
                        <div className="w-16 h-16 bg-slate-800 rounded-2xl overflow-hidden border border-white/10 p-2">
                           <img src={hotel.logo_url || "https://via.placeholder.com/150"} className="w-full h-full object-contain" />
                        </div>
                        <h4 className="text-xl font-black">{hotel.name}</h4>
                     </div>
                     <div className="flex gap-3">
                        {/* OTEL ADMİN PANELİNE GÖNDEREN BUTON */}
                        <button 
                          onClick={() => window.open(`/otel-admin/${hotel.id}`, '_blank')} 
                          className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all" 
                          title="Otel Yönetim Panelini Aç"
                        >
                          <ExternalLink size={20} />
                        </button>
                        <button onClick={() => openEdit(hotel)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-orange-500 transition-all"><Settings size={20} /></button>
                        <button onClick={() => deleteHotel(hotel.id)} className="p-4 bg-rose-500/10 hover:bg-rose-500 rounded-2xl text-rose-500 hover:text-white transition-all"><Trash2 size={20} /></button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-8 backdrop-blur-3xl overflow-y-auto">
          <div className="bg-[#11141b] border border-white/10 rounded-[3.5rem] p-12 w-full max-w-2xl shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-3xl font-black">{editingHotel?.id ? 'Tesis Düzenle' : 'Yeni Tesis'}</h3>
               <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 rounded-full"><X/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 md:col-span-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Tesis Adı</label>
                 <input type="text" className="w-full p-5 bg-black/40 border-2 border-white/5 rounded-2xl outline-none focus:border-orange-500 font-bold" value={editingHotel?.name} onChange={e => setEditingHotel({...editingHotel, name: e.target.value})} />
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Logo</label>
                 <div onClick={() => logoInputRef.current?.click()} className="w-full aspect-video bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition-all relative overflow-hidden">
                    {editingHotel?.logo_url ? <img src={editingHotel.logo_url} className="w-full h-full object-contain p-4" /> : <Upload className="opacity-20" />}
                 </div>
                 <input type="file" ref={logoInputRef} className="hidden" onChange={e => handleImageUpload(e, 'logo')} />
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">WhatsApp Numarası</label>
                 <input type="text" placeholder="905551234567" className="w-full p-4 bg-black/40 border-2 border-white/5 rounded-2xl" value={editingHotel?.whatsapp_number} onChange={e => setEditingHotel({...editingHotel, whatsapp_number: e.target.value})} />
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">WiFi Şifre</label>
                 <input type="text" className="w-full p-4 bg-black/40 border-2 border-white/5 rounded-2xl" value={editingHotel?.wifi_pass} onChange={e => setEditingHotel({...editingHotel, wifi_pass: e.target.value})} />
              </div>

              <div className="space-y-4 md:col-span-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Banner Görseli (URL veya Yükle)</label>
                 <div onClick={() => bannerInputRef.current?.click()} className="w-full h-32 bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition-all relative overflow-hidden">
                    {editingHotel?.banner_url ? <img src={editingHotel.banner_url} className="w-full h-full object-cover" /> : <Upload className="opacity-20" />}
                 </div>
                 <input type="file" ref={bannerInputRef} className="hidden" onChange={e => handleImageUpload(e, 'banner')} />
              </div>
            </div>

            <div className="flex gap-4 mt-12">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 font-black text-slate-500">Kapat</button>
              <button onClick={saveHotel} disabled={isUploading} className="flex-[2] bg-orange-600 text-white py-5 rounded-2xl font-black text-xl shadow-2xl hover:bg-orange-500 transition-all disabled:opacity-50">
                {isUploading ? <Loader2 className="animate-spin mx-auto" /> : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
