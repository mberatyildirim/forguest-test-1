
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Hotel, Plus, Trash2, Settings, X, 
  Loader2, ShieldCheck, Home, Activity, CheckCircle, Clock, ShoppingBag, Bell, User, FileText, CheckCircle2,
  // Added Mail and Phone icons to fix 'Cannot find name' errors
  Mail, Phone
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

  const handleAdminLogin = () => {
    if (loginForm.user === 'admin' && loginForm.pass === 'admin123') setIsAuthenticated(true);
    else alert("Super Admin erişim yetkisi doğrulanamadı!");
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchHotels();
      fetchGlobalFeed();
      fetchApplications();
      
      const ordersSub = supabase.channel('global-admin')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchGlobalFeed())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => fetchGlobalFeed())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'hotel_applications' }, () => fetchApplications())
        .subscribe();

      return () => { supabase.removeChannel(ordersSub); };
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
      ...(orders || []).map(o => ({ ...o, entryType: 'order' })),
      ...(services || []).map(s => ({ ...s, entryType: 'service' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setGlobalFeed(combined);
  };

  const updateAppStatus = async (id: string, status: string) => {
    await supabase.from('hotel_applications').update({ status }).eq('id', id);
    fetchApplications();
  };

  const saveHotel = async () => {
    if (!editingHotel?.name || !editingHotel?.username) return alert("Zorunlu alanlar eksik!");
    setIsUploading(true);
    const { error } = await supabase.from('hotels').upsert(editingHotel);
    if (!error) { 
      setEditingHotel(null); 
      fetchHotels(); 
    } else {
      alert("Hata oluştu: " + error.message);
    }
    setIsUploading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-inter">
        <div className="bg-[#0f111a] w-full max-w-md p-12 rounded-[3.5rem] border border-white/5 text-center shadow-3xl">
          <div className="w-24 h-24 bg-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-orange-900/40">
            <ShieldCheck size={48} className="text-white"/>
          </div>
          <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase leading-none">Master <br/> Portal</h2>
          <p className="text-slate-500 font-bold mb-10 text-[10px] tracking-[0.4em] uppercase">Global Suite Control</p>
          <div className="space-y-4 text-left">
            <div className="space-y-1">
               <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Authorized User</label>
               <input type="text" placeholder="Username" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white outline-none focus:border-orange-500 font-bold transition-all" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} />
            </div>
            <div className="space-y-1">
               <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Security Key</label>
               <input type="password" placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white outline-none focus:border-orange-500 font-bold transition-all" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} />
            </div>
            <button onClick={handleAdminLogin} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-orange-500 transition-all shadow-xl mt-6 active:scale-95">Access Terminal</button>
            <button onClick={() => onNavigate('landing', '/')} className="w-full text-slate-600 font-black text-[10px] uppercase tracking-widest mt-6 hover:text-white transition-colors">Exit Control Panel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080d] text-white flex font-inter selection:bg-orange-600">
      {/* SaaS Sidebar */}
      <aside className="w-80 bg-[#0c0e16] border-r border-white/5 p-12 flex flex-col gap-12 sticky top-0 h-screen shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center font-black">F</div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter">for<span className="text-orange-500">Guest</span></h1>
        </div>
        
        <nav className="flex-1 space-y-3">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-8 py-5 rounded-2xl font-black text-[10px] transition-all uppercase tracking-widest ${view === 'dashboard' ? 'bg-orange-600 shadow-xl shadow-orange-900/20' : 'text-slate-600 hover:bg-white/5'}`}><LayoutDashboard size={18}/> Overview</button>
          <button onClick={() => setView('feed')} className={`w-full flex items-center gap-4 px-8 py-5 rounded-2xl font-black text-[10px] transition-all uppercase tracking-widest ${view === 'feed' ? 'bg-orange-600 shadow-xl shadow-orange-900/20' : 'text-slate-600 hover:bg-white/5'}`}><Activity size={18}/> Live Stream</button>
          <button onClick={() => setView('hotels')} className={`w-full flex items-center gap-4 px-8 py-5 rounded-2xl font-black text-[10px] transition-all uppercase tracking-widest ${view === 'hotels' ? 'bg-orange-600 shadow-xl shadow-orange-900/20' : 'text-slate-600 hover:bg-white/5'}`}><Hotel size={18}/> Assets</button>
          <button onClick={() => setView('applications')} className={`w-full flex items-center gap-4 px-8 py-5 rounded-2xl font-black text-[10px] transition-all uppercase tracking-widest ${view === 'applications' ? 'bg-orange-600 shadow-xl shadow-orange-900/20' : 'text-slate-600 hover:bg-white/5'}`}><FileText size={18}/> Requests ({applications.filter(a=>a.status === 'pending').length})</button>
        </nav>
        
        <button onClick={() => onNavigate('landing', '/')} className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-[9px] text-slate-600 border border-white/5 hover:text-white transition-colors uppercase tracking-[0.3em]"><Home size={14}/> Exit Suite</button>
      </aside>

      <main className="flex-1 p-20 overflow-y-auto no-scrollbar">
        {view === 'dashboard' && (
          <div className="space-y-20 animate-fade-in">
            <div className="flex justify-between items-end">
               <div>
                  <p className="text-orange-500 font-black text-[10px] uppercase tracking-[0.5em] mb-4">Global Network</p>
                  <h2 className="text-8xl font-black tracking-tighter leading-none">Command Center.</h2>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-8">
               <div className="bg-[#0c0e16] p-16 rounded-[4rem] border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 blur-[60px]" />
                  <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] mb-6">Partner Hotels</p>
                  <p className="text-8xl font-black tracking-tighter">{hotels.length}</p>
               </div>
               <div className="bg-[#0c0e16] p-16 rounded-[4rem] border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px]" />
                  <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] mb-6">Total Operations</p>
                  <p className="text-8xl font-black tracking-tighter">{globalFeed.length}</p>
               </div>
               <div className="bg-[#0c0e16] p-16 rounded-[4rem] border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 blur-[60px]" />
                  <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] mb-6">Pending Requests</p>
                  <p className="text-8xl font-black tracking-tighter">{applications.filter(a => a.status === 'pending').length}</p>
               </div>
            </div>
          </div>
        )}

        {view === 'applications' && (
          <div className="space-y-12 animate-fade-in max-w-5xl">
            <h2 className="text-6xl font-black tracking-tighter">Partner Requests.</h2>
            <div className="space-y-4">
               {applications.length === 0 ? (
                 <div className="p-20 text-center text-slate-500 font-black uppercase tracking-widest">No applications found.</div>
               ) : applications.map(app => (
                 <div key={app.id} className={`bg-[#0c0e16] p-12 rounded-[3.5rem] border flex items-center justify-between transition-all ${app.status === 'pending' ? 'border-orange-500/50' : 'border-white/5 opacity-60'}`}>
                    <div>
                      <h4 className="text-3xl font-black tracking-tight mb-2">{app.hotel_name}</h4>
                      <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
                         <span className="flex items-center gap-2"><User size={12}/> {app.contact_name}</span>
                         <span className="flex items-center gap-2"><Mail size={12}/> {app.email}</span>
                         <span className="flex items-center gap-2"><Phone size={12}/> {app.phone}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                       {app.status === 'pending' ? (
                         <div className="flex gap-2">
                           <button onClick={() => updateAppStatus(app.id, 'reviewed')} className="bg-white/5 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-white/10">Mark as Seen</button>
                           <button onClick={() => { setEditingHotel({ name: app.hotel_name }); setView('hotels'); }} className="bg-orange-600 px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-orange-500">Integrate</button>
                         </div>
                       ) : (
                         <span className="text-emerald-500 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><CheckCircle2 size={16}/> Processed</span>
                       )}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {view === 'feed' && (
          <div className="space-y-12 animate-fade-in max-w-5xl">
            <h2 className="text-6xl font-black tracking-tighter">Live Stream.</h2>
            <div className="space-y-4">
               {globalFeed.map((o: any) => (
                 <div key={o.id} className="bg-[#0c0e16] p-12 rounded-[3.5rem] border border-white/5 flex items-center justify-between group hover:border-orange-500/30 transition-all">
                    <div className="flex items-center gap-12">
                       <div className="w-16 h-16 bg-white/5 rounded-2xl flex flex-col items-center justify-center border border-white/10 group-hover:bg-orange-600/10 transition-colors">
                          <span className="text-[8px] font-black text-slate-500 uppercase">Unit</span>
                          <span className="text-2xl font-black">{o.room_number}</span>
                       </div>
                       <div>
                          <p className="text-orange-600 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{o.hotels?.name || 'Tesis'}</p>
                          <h4 className="text-3xl font-black tracking-tight">{o.entryType === 'order' ? o.items.map((i:any)=>`${i.name}`).join(', ') : o.service_type}</h4>
                          <p className="text-xs text-slate-500 mt-3 font-bold flex items-center gap-2"><Clock size={12}/> {new Date(o.created_at).toLocaleTimeString()}</p>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {view === 'hotels' && (
          <div className="space-y-16 animate-fade-in">
            <div className="flex justify-between items-end">
               <h2 className="text-6xl font-black tracking-tighter">Global Assets</h2>
               <button onClick={() => setEditingHotel({})} className="bg-orange-600 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-3 shadow-2xl hover:scale-105 transition-all text-xs uppercase tracking-widest"><Plus size={20}/> New Partner</button>
            </div>
            <div className="grid grid-cols-1 gap-6">
               {hotels.map(h => (
                 <div key={h.id} className="bg-[#0c0e16] p-12 rounded-[4rem] border border-white/5 flex items-center justify-between group hover:border-orange-500/30 transition-all">
                    <div className="flex items-center gap-12">
                       <div className="w-24 h-24 bg-white rounded-3xl p-6 flex items-center justify-center shadow-inner overflow-hidden">
                          <img src={h.logo_url} className="w-full h-full object-contain" alt={h.name} />
                       </div>
                       <div>
                          <h4 className="text-4xl font-black tracking-tighter mb-2">{h.name}</h4>
                       </div>
                    </div>
                    <div className="flex gap-3">
                       <button onClick={() => onNavigate('hotel_dashboard', `/otel-admin/${h.id}`, h.id)} className="p-6 bg-white/5 rounded-[2rem] text-slate-500 hover:text-white hover:bg-white/10 transition-all" title="Master Login"><User size={28}/></button>
                       <button onClick={() => setEditingHotel(h)} className="p-6 bg-white/5 rounded-[2rem] text-slate-500 hover:text-orange-500 hover:bg-white/10 transition-all"><Settings size={28}/></button>
                       <button onClick={async () => { if(confirm(`${h.name} tesisini silmek istediğinize emin misiniz?`)) { await supabase.from('hotels').delete().eq('id', h.id); fetchHotels(); } }} className="p-6 bg-white/5 rounded-[2rem] text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all"><Trash2 size={28}/></button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </main>

      {editingHotel && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6">
           <div className="bg-[#0c0e16] p-16 rounded-[4rem] w-full max-w-2xl border border-white/10 shadow-3xl animate-fade-in">
              <div className="flex justify-between items-center mb-12">
                <h3 className="text-4xl font-black tracking-tighter">{editingHotel.id ? 'Edit Partner' : 'New Strategic Partner'}</h3>
                <button onClick={() => setEditingHotel(null)} className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition-all"><X size={28}/></button>
              </div>
              <div className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-6">Corporate Entity Name</label>
                    <input type="text" placeholder="Hotel Name" className="w-full p-8 bg-white/5 border border-white/10 rounded-[2.5rem] outline-none focus:border-orange-500 transition-all font-black text-2xl" value={editingHotel.name || ''} onChange={e => setEditingHotel({...editingHotel, name: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-6">Administrative ID</label>
                       <input type="text" placeholder="username" className="w-full p-8 bg-white/5 border border-white/10 rounded-[2.5rem] outline-none focus:border-orange-500 transition-all font-bold" value={editingHotel.username || ''} onChange={e => setEditingHotel({...editingHotel, username: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-6">Security Access Key</label>
                       <input type="text" placeholder="password" className="w-full p-8 bg-white/5 border border-white/10 rounded-[2.5rem] outline-none focus:border-orange-500 transition-all font-bold" value={editingHotel.password || ''} onChange={e => setEditingHotel({...editingHotel, password: e.target.value})} />
                    </div>
                 </div>
                 <button 
                  onClick={saveHotel} 
                  disabled={isUploading} 
                  className="w-full bg-orange-600 text-white py-8 rounded-[2.5rem] font-black text-2xl hover:bg-white hover:text-slate-900 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4 mt-6"
                >
                  {isUploading ? <Loader2 className="animate-spin" /> : 'Confirm Integration'}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
