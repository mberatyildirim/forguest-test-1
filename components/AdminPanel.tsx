
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Hotel, Plus, Trash2, Settings, X, 
  Loader2, ShieldCheck, Home, Activity, CheckCircle, Clock, ShoppingBag, Bell, User, FileText, CheckCircle2,
  Mail, Phone, MoreHorizontal, Globe, ExternalLink, Filter, Search, Wallet, TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Hotel as HotelType, PanelState, HotelApplication } from '../types';

interface AdminPanelProps {
  onNavigate: (mode: PanelState, path: string, hId?: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [hotels, setHotels] = useState<HotelType[]>([]);
  const [globalFeed, setGlobalFeed] = useState<any[]>([]);
  const [applications, setApplications] = useState<HotelApplication[]>([]);
  const [editingHotel, setEditingHotel] = useState<Partial<HotelType> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'hotels' | 'feed' | 'applications'>('dashboard');

  // Filtreleme State'leri
  const [filterHotel, setFilterHotel] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');

  const handleAdminLogin = () => {
    if (loginForm.user === 'admin' && loginForm.pass === 'admin123') setIsAuthenticated(true);
    else alert("Erişim yetkisi doğrulanamadı!");
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchHotels();
      fetchGlobalFeed();
      fetchApplications();
    }
  }, [isAuthenticated]);

  const fetchHotels = async () => {
    const { data } = await supabase.from('hotels').select('*').order('created_at', { ascending: false });
    if (data) setHotels(data);
  };

  const fetchApplications = async () => {
    const { data } = await supabase.from('hotel_applications').select('*').order('created_at', { ascending: false });
    if (data) setApplications(data);
  };

  const fetchGlobalFeed = async () => {
    const { data: orders } = await supabase.from('orders').select('*, hotels(name)').order('created_at', { ascending: false });
    const { data: services } = await supabase.from('service_requests').select('*, hotels(name)').order('created_at', { ascending: false });
    
    const combined = [
      ...(orders || []).map(o => ({ 
        ...o, 
        feedType: 'Sipariş', 
        amount: o.total_amount,
        dept: o.items?.[0]?.type || 'dining'
      })),
      ...(services || []).map(s => ({ 
        ...s, 
        feedType: 'Hizmet', 
        amount: 0,
        dept: 'concierge'
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setGlobalFeed(combined);
  };

  const saveHotel = async () => {
    if (!editingHotel?.name || !editingHotel?.username) return alert("Eksik alan!");
    setIsUploading(true);
    await supabase.from('hotels').upsert(editingHotel);
    setEditingHotel(null);
    fetchHotels();
    setIsUploading(false);
  };

  // Filtreleme Mantığı
  const filteredFeed = globalFeed.filter(item => {
    const hotelMatch = filterHotel === 'all' || item.hotel_id === filterHotel;
    const typeMatch = filterType === 'all' || item.feedType === filterType;
    const deptMatch = filterDept === 'all' || item.dept === filterDept;
    return hotelMatch && typeMatch && deptMatch;
  });

  const totalRevenue = filteredFeed.reduce((sum, item) => sum + (item.amount || 0), 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-inter">
        <div className="bg-white w-full max-w-sm p-10 rounded-3xl shadow-2xl text-center border border-white/10 animate-fade-in">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <ShieldCheck size={32} className="text-white"/>
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Master Console</h2>
          <div className="space-y-3 text-left">
             <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Admin ID</label>
               <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-orange-500 font-bold" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} />
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Secret Key</label>
               <input type="password" title="Key" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-orange-500 font-bold" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} />
             </div>
             <button onClick={handleAdminLogin} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg active:scale-95 mt-4">Sisteme Giriş Yap</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-inter text-[13px]">
      {/* Sidebar - Pro SaaS */}
      <aside className="w-60 bg-slate-900 flex flex-col sticky top-0 h-screen shadow-2xl z-50">
        <div className="p-6 flex items-center gap-2 border-b border-white/5 bg-slate-950/50">
          <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white font-black italic shadow-lg">m</div>
          <span className="font-bold text-white tracking-tight uppercase text-xs">Master <span className="text-orange-500">Suite</span></span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${view === 'dashboard' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><LayoutDashboard size={16}/> Dashboard</button>
          <button onClick={() => setView('hotels')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${view === 'hotels' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><Hotel size={16}/> Oteller</button>
          <button onClick={() => setView('applications')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${view === 'applications' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><FileText size={16}/> Başvurular</button>
          <button onClick={() => setView('feed')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${view === 'feed' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><Activity size={16}/> Global Akış</button>
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={() => onNavigate('landing', '/')} className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[10px]"><Home size={14}/> Siteye Dön</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="text-slate-400 font-semibold">Master / <span className="text-slate-900 capitalize">{view}</span></div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
               <TrendingUp size={14} className="text-green-500" />
               <span className="font-bold text-[11px] text-slate-600 uppercase">System Active</span>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-6 max-w-7xl mx-auto">
          {view === 'dashboard' && (
            <div className="grid grid-cols-4 gap-6">
               {[
                 { label: 'Aktif Partnerler', val: hotels.length, color: 'text-blue-600' },
                 { label: 'Bekleyen Başvuru', val: applications.filter(a=>a.status === 'pending').length, color: 'text-orange-600' },
                 { label: 'Toplam İşlem', val: globalFeed.length, color: 'text-emerald-600' },
                 { label: 'Network Durumu', val: 'Operational', color: 'text-slate-900' }
               ].map((stat, i) => (
                 <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
                 </div>
               ))}
            </div>
          )}

          {view === 'hotels' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <h2 className="text-base font-black tracking-tight uppercase">Partner Otel Portföyü</h2>
                  <button onClick={() => setEditingHotel({})} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg"><Plus size={14}/> Yeni Partner</button>
               </div>
               <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                       <tr>
                          <th className="px-6 py-4">Tesis Markası</th>
                          <th className="px-6 py-4">Sistem ID</th>
                          <th className="px-6 py-4">Giriş Anahtarı</th>
                          <th className="px-6 py-4 text-right">Aksiyonlar</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {hotels.map(h => (
                         <tr key={h.id} className="hover:bg-slate-50/50 group transition-colors">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shadow-sm">
                                     <img src={h.logo_url} className="w-full h-full object-contain" />
                                  </div>
                                  <p className="font-bold text-slate-900">{h.name}</p>
                               </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-[11px] text-slate-500">{h.username}</td>
                            <td className="px-6 py-4 font-mono text-[11px] text-slate-500">{h.password}</td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => onNavigate('hotel_dashboard', `/otel-admin/${h.id}`, h.id)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-md transition-colors" title="İzleme"><ExternalLink size={14}/></button>
                                  <button onClick={() => setEditingHotel(h)} className="p-2 hover:bg-slate-100 text-slate-400 rounded-md transition-colors"><Settings size={14}/></button>
                                  <button onClick={async () => { if(confirm('Sözleşmeyi sonlandır?')) { await supabase.from('hotels').delete().eq('id', h.id); fetchHotels(); } }} className="p-2 hover:bg-rose-50 text-rose-500 rounded-md transition-colors"><Trash2 size={14}/></button>
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {view === 'applications' && (
            <div className="space-y-4">
               <h2 className="text-base font-black tracking-tight uppercase">Yeni Tesis Başvuruları</h2>
               <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <tr>
                           <th className="px-6 py-4">Tesis Adı</th>
                           <th className="px-6 py-4">İletişim Detayları</th>
                           <th className="px-6 py-4">Durum</th>
                           <th className="px-6 py-4 text-right">Operasyon</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {applications.map(app => (
                          <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                             <td className="px-6 py-4"><p className="font-bold text-slate-900">{app.hotel_name}</p><p className="text-[10px] text-slate-400 font-medium">{new Date(app.created_at).toLocaleDateString()}</p></td>
                             <td className="px-6 py-4 text-[11px] font-semibold text-slate-500">
                                <div className="flex flex-col gap-0.5">
                                   <span className="flex items-center gap-2"><Mail size={12} className="text-slate-400"/> {app.email}</span>
                                   <span className="flex items-center gap-2"><Phone size={12} className="text-slate-400"/> {app.phone}</span>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${app.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>{app.status}</span>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <button onClick={() => { setEditingHotel({ name: app.hotel_name }); setView('hotels'); }} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black hover:bg-orange-600 transition-all uppercase tracking-widest">Entegrasyonu Başlat</button>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {view === 'feed' && (
            <div className="space-y-6">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div className="space-y-1">
                     <h2 className="text-base font-black tracking-tight uppercase">Global Servis Günlüğü</h2>
                     <p className="text-slate-400 text-xs">Ağdaki tüm canlı operasyonel veriler.</p>
                  </div>
                  
                  {/* Revenue Widget */}
                  <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl flex items-center gap-6 shadow-xl">
                     <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filtrelenmiş Ciro</p>
                        <p className="text-2xl font-black text-orange-500">₺{totalRevenue.toLocaleString()}</p>
                     </div>
                     <div className="w-px h-10 bg-white/10"></div>
                     <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">İşlem Sayısı</p>
                        <p className="text-2xl font-black">{filteredFeed.length}</p>
                     </div>
                  </div>
               </div>

               {/* Filtreleme Barı */}
               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                     <Hotel size={14} className="text-slate-400" />
                     <select className="bg-transparent outline-none font-bold text-xs text-slate-700" value={filterHotel} onChange={e => setFilterHotel(e.target.value)}>
                        <option value="all">Tüm Oteller</option>
                        {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                     </select>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                     <Activity size={14} className="text-slate-400" />
                     <select className="bg-transparent outline-none font-bold text-xs text-slate-700" value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="all">Tüm İşlemler</option>
                        <option value="Sipariş">Siparişler</option>
                        <option value="Hizmet">Hizmet Talepleri</option>
                     </select>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                     <Filter size={14} className="text-slate-400" />
                     <select className="bg-transparent outline-none font-bold text-xs text-slate-700" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                        <option value="all">Tüm Departmanlar</option>
                        <option value="food">Mutfak / Dining</option>
                        <option value="market">Market / Retail</option>
                        <option value="concierge">Concierge / Servis</option>
                     </select>
                  </div>

                  <button onClick={() => { setFilterHotel('all'); setFilterType('all'); setFilterDept('all'); }} className="text-slate-400 hover:text-orange-600 font-bold text-[10px] uppercase tracking-widest ml-auto px-4">Filtreleri Sıfırla</button>
               </div>

               <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <tr>
                           <th className="px-6 py-4">İş Ortağı</th>
                           <th className="px-6 py-4">Oda / Ünite</th>
                           <th className="px-6 py-4">İşlem Detayı</th>
                           <th className="px-6 py-4 text-right">Tutar</th>
                           <th className="px-6 py-4 text-right">Timestamp</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {filteredFeed.length === 0 ? (
                           <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-black uppercase tracking-[0.2em] italic">Eşleşen operasyonel kayıt bulunamadı</td></tr>
                        ) : filteredFeed.map((item: any, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                             <td className="px-6 py-4">
                                <p className="font-black text-orange-600">{item.hotels?.name || '---'}</p>
                             </td>
                             <td className="px-6 py-4 font-mono font-black text-slate-900">{item.room_number}</td>
                             <td className="px-6 py-4">
                                <div className="flex flex-col gap-0.5">
                                   <div className="flex items-center gap-2">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${item.feedType === 'Sipariş' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                         {item.feedType}
                                      </span>
                                      <span className="font-bold text-slate-600">{item.service_type || (item.items && item.items.length + ' Ürün')}</span>
                                   </div>
                                   {item.feedType === 'Sipariş' && (
                                      <p className="text-[10px] text-slate-400 font-medium truncate max-w-xs">{item.items?.map((i:any)=>`${i.name} x${i.quantity}`).join(', ')}</p>
                                   )}
                                </div>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <p className={`font-black text-sm ${item.amount > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                                   {item.amount > 0 ? `₺${item.amount.toLocaleString()}` : '-'}
                                </p>
                             </td>
                             <td className="px-6 py-4 text-right text-slate-400 text-[11px] font-medium font-mono">{new Date(item.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Partner Onboarding Modal */}
      {editingHotel && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 border border-slate-200 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-50 pb-4 mb-6">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Stratejik Partner Entegrasyonu</h3>
                <button onClick={() => setEditingHotel(null)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
              </div>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tesis Adı</label>
                    <input className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-bold" value={editingHotel.name || ''} onChange={e => setEditingHotel({...editingHotel, name: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">İstemci ID (Admin)</label>
                    <input className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-bold" value={editingHotel.username || ''} onChange={e => setEditingHotel({...editingHotel, username: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Güvenlik Tokeni</label>
                    <input className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-bold" value={editingHotel.password || ''} onChange={e => setEditingHotel({...editingHotel, password: e.target.value})} />
                 </div>
                 <button onClick={saveHotel} disabled={isUploading} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-xl shadow-slate-900/10 mt-4">
                    {isUploading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Konfigürasyonu Onayla'}
                 </button>
                 <button onClick={() => setEditingHotel(null)} className="w-full text-slate-400 font-bold text-[10px] py-1 uppercase tracking-widest hover:text-slate-600">İşlemi İptal Et</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
