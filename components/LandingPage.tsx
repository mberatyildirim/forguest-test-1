
import React from 'react';
import { 
  Sparkles, 
  QrCode, 
  Utensils, 
  MessageSquare, 
  ArrowRight
} from 'lucide-react';
import { PanelState } from '../types';

interface LandingPageProps {
  onNavigate: (mode: PanelState, path: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-inter selection:bg-orange-200">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-slate-200/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing', '/')}>
            <span className="font-black text-2xl tracking-tighter">for<span className="text-orange-600">Guest</span></span>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => onNavigate('hotel_login', '/otel-login')}
              className="px-6 py-2.5 rounded-full font-black text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Otel Girişi
            </button>
            <button 
              onClick={() => onNavigate('admin_dashboard', '/super-admin')}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-black text-sm hover:bg-orange-600 transition-all shadow-xl"
            >
              Yönetim
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-400/10 blur-[120px] -z-10 rounded-full"></div>
          
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase mb-8 animate-fade-in">
            <Sparkles size={14} /> Yeni Nesil Konaklama Deneyimi
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.95] mb-8 animate-fade-in">
            Misafirlerinizin <br/> <span className="text-orange-600">Kalbinde</span> Yer Edinin.
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-slate-500 font-medium leading-relaxed mb-12 animate-fade-in">
            Sipariş yönetimi, yapay zeka asistanı ve akıllı servis talepleriyle otel operasyonlarınızı dijitalleştirin. Uygulama indirmeye gerek kalmadan, sadece bir QR kodla.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <button className="bg-orange-600 text-white px-10 py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-orange-900/20 hover:scale-105 transition-all">
              Hemen Başlayın <ArrowRight size={20} />
            </button>
            <button className="bg-white border-2 border-slate-200 px-10 py-5 rounded-3xl font-black text-lg hover:border-orange-600 transition-all">
              Özellikleri Keşfet
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-12 rounded-[3rem] bg-slate-50 border border-slate-100 group hover:border-orange-500/30 transition-all">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-orange-600 group-hover:text-white transition-all">
                <Utensils size={32} />
              </div>
              <h3 className="text-2xl font-black mb-4">Dijital Oda Servisi</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Misafirleriniz menüye anında ulaşır, ödemelerini yapar ve siparişlerini gerçek zamanlı takip eder.</p>
            </div>

            <div className="p-12 rounded-[3rem] bg-slate-50 border border-slate-100 group hover:border-orange-500/30 transition-all">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-2xl font-black mb-4">AI Konuk Asistanı</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Gemini destekli asistan, misafirlerinizin tüm sorularını 7/24 profesyonelce yanıtlar.</p>
            </div>

            <div className="p-12 rounded-[3rem] bg-slate-50 border border-slate-100 group hover:border-orange-500/30 transition-all">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <QrCode size={32} />
              </div>
              <h3 className="text-2xl font-black mb-4">Akıllı QR Yönetimi</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Her oda için özel üretilen QR kodlar sayesinde oda numarası manuel girilmeden otomatik tanımlanır.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
             <span className="font-black text-2xl tracking-tighter">for<span className="text-orange-600">Guest</span></span>
             <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Premium Guest Experience Suite © 2025</p>
          </div>
          <div className="flex gap-8 text-slate-500 font-black text-xs uppercase tracking-widest">
            <a href="#" className="hover:text-orange-600">Kurumsal</a>
            <a href="#" className="hover:text-orange-600">Güvenlik</a>
            <a href="#" className="hover:text-orange-600">İletişim</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
