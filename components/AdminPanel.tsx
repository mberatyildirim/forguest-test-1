
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Hotel, Activity, Plus, Trash2, ExternalLink, Settings, Save, X, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Hotel as HotelType } from '../types';

const AdminPanel: React.FC = () => {
  const [hotels, setHotels] = useState<HotelType[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newHotel, setNewHotel] = useState<Partial<HotelType>>({
    name: '',
    logo_url: '',
    wifi_name: '',
    wifi_pass: '',
    checkout_time: '11:00',
    reception_phone: ''
  });

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    const { data } = await supabase.from('hotels').select('*').order('created_at', { ascending: false });
    if (data) setHotels(data);
  };

  const handleAddHotel = async () => {
    if (!newHotel.name) return;
    const { error } = await supabase.from('hotels').insert([newHotel]);
    if (!error) {
      setIsAdding(false);
      setNewHotel({ name: '', logo_url: '', wifi_name: '', wifi_pass: '', checkout_time: '11:00', reception_phone: '' });
      fetchHotels();
    }
  };

  const deleteHotel = async (id: string) => {
    if (confirm("DİKKAT! Bu oteli ve bağlı tüm verileri (odalar, menüler) silmek üzeresiniz. Onaylıyor musunuz?")) {
      await supabase.from('hotels').delete().eq('id', id);
      fetchHotels();
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex">
      {/* SaaS Sidebar */}
      <div className="w-80 bg-[#16191f] border-r border-white/5 p-10 flex flex-col gap-12">
        <div>
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">forGuest <span className="text-white text-[10px] block opacity-30 uppercase tracking-[0.5em] mt-1 font-bold">PLATFORM ADMIN</span></h1>
        </div>
        
        <nav className="space-y-4">
          <button className="w-full flex items-center gap-4 px-6 py-4 bg-white/5 border border-white/5 rounded-2xl font-black text-sm transition-all shadow-xl text-orange-500">
            <LayoutDashboard size={22} /> Genel Durum
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 rounded-2xl font-black text-sm text-slate-400 transition-all">
            <Hotel size={22} /> Otel Listesi
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 rounded-2xl font-black text-sm text-slate-400 transition-all">
            <Activity size={22} /> Sistem Logları
          </button>
        </nav>

        <div className="mt-auto bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-8 border border-white/5 shadow-2xl">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Sistem Sağlığı</p>
           <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold">
                 <span>API</span>
                 <span className="text-emerald-500">ON</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                 <span>DB</span>
                 <span className="text-emerald-500">ON</span>
              </div>
           </div>
        </div>
      </div>

      {/* SaaS Content */}
      <div className="flex-1 p-20 overflow-y-auto no-scrollbar">
        <header className="flex justify-between items-end mb-16">
          <div>
            <h2 className="text-6xl font-black tracking-tight mb-4">Ağ Yönetimi</h2>
            <p className="text-slate-400 font-medium text-xl">Platformunuzdaki tüm tesislerin kontrolü sizde.</p>
          </div>
          <button onClick={() => setIsAdding(true)} className="bg-orange-600 text-white px-10 py-5 rounded-[1.5rem] font-black flex items-center gap-3 hover:bg-orange-500 transition-all shadow-2xl shadow-orange-900/20 active:scale-95">
            <Plus size={24} /> Yeni Tesis Ekle
          </button>
        </header>

        <div className="grid grid-cols-3 gap-8 mb-16">
          <div className="bg-[#1a1d23] border border-white/5 p-10 rounded-[3rem] shadow-2xl group hover:border-orange-500/50 transition-all">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Toplam Tesis</p>
            <p className="text-6xl font-black group-hover:text-orange-500 transition-colors">{hotels.length}</p>
          </div>
          <div className="bg-[#1a1d23] border border-white/5 p-10 rounded-[3rem] shadow-2xl">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Aylık İstek</p>
            <p className="text-6xl font-black">---</p>
          </div>
        </div>

        <div className="bg-[#16191f] rounded-[3.5rem] border border-white/5 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.4)]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/20 text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">
                <th className="px-12 py-8">TESİS ADI & LOGO</th>
                <th className="px-12 py-8">ALTYAPI BİLGİSİ</th>
                <th className="px-12 py-8">DURUM</th>
                <th className="px-12 py-8">KONTROLLER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {hotels.map(hotel => (
                <tr key={hotel.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-12 py-10 font-black text-lg flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.2rem] overflow-hidden bg-slate-800 border border-white/10 group-hover:scale-110 transition-transform">
                      <img src={hotel.logo_url} className="w-full h-full object-cover" />
                    </div>
                    {hotel.name}
                  </td>
                  <td className="px-12 py-10 text-slate-400 font-mono text-xs opacity-60">
                    ID: {hotel.id}<br/>
                    WF: {hotel.wifi_name}
                  </td>
                  <td className="px-12 py-10">
                    <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-full uppercase tracking-widest border border-emerald-500/20">AKtif</span>
                  </td>
                  <td className="px-12 py-10">
                    <div className="flex gap-3">
                      <button onClick={() => window.open(`?h=${hotel.id}`, '_blank')} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all" title="Canlı İzle"><ExternalLink size={20} /></button>
                      <button onClick={() => deleteHotel(hotel.id)} className="p-4 bg-rose-500/10 hover:bg-rose-500 rounded-2xl text-rose-500 hover:text-white transition-all" title="Tesis Sil"><Trash2 size={20} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isAdding && (
          <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-8 backdrop-blur-3xl">
            <div className="bg-[#1a1d23] border border-white/10 rounded-[4rem] p-16 w-full max-w-2xl shadow-[0_0_150px_rgba(0,0,0,0.6)] animate-fade-in">
              <h3 className="text-4xl font-black mb-12">Tesis Entegrasyonu</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Otel Marka Adı</label>
                   <input type="text" placeholder="Hilton, Marriott vb." className="w-full p-6 bg-black/40 border-2 border-white/5 rounded-3xl outline-none focus:border-orange-500 font-bold transition-all" value={newHotel.name} onChange={e => setNewHotel({...newHotel, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Marka Logo URL</label>
                   <input type="text" className="w-full p-6 bg-black/40 border-2 border-white/5 rounded-3xl outline-none focus:border-orange-500 font-bold transition-all" value={newHotel.logo_url} onChange={e => setNewHotel({...newHotel, logo_url: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">WiFi ID</label>
                    <input type="text" className="w-full p-6 bg-black/40 border-2 border-white/5 rounded-3xl" value={newHotel.wifi_name} onChange={e => setNewHotel({...newHotel, wifi_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">WiFi Key</label>
                    <input type="text" className="w-full p-6 bg-black/40 border-2 border-white/5 rounded-3xl" value={newHotel.wifi_pass} onChange={e => setNewHotel({...newHotel, wifi_pass: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="flex gap-6 mt-16">
                <button onClick={() => setIsAdding(false)} className="flex-1 py-6 font-black text-slate-500 hover:text-white transition-colors">Vazgeç</button>
                <button onClick={handleAddHotel} className="flex-[2] bg-orange-600 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-orange-900/30 hover:bg-orange-500 transition-all">Sisteme Kaydet</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
