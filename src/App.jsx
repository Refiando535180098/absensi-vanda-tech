import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Clock, FileText, User, MapPin, Wifi, WifiOff, 
  CheckCircle, LogOut, ChevronRight, Camera, Loader, Plus, Hash, Save, XCircle, FileIcon
} from 'lucide-react';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); 
  const [historyType, setHistoryType] = useState('attendance'); 
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false); // Loading saat upload

  const fileInputRef = useRef(null);
  const [currentAbsenType, setCurrentAbsenType] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) setProfile(data);
    fetchData(uid);
  };

  const fetchData = async (uid) => {
    const { data: att } = await supabase.from('attendance').select('*').eq('user_id', uid).order('timestamp', { ascending: false });
    if (att) setAttendanceData(att);
    const { data: rep } = await supabase.from('reports').select('*').eq('user_id', uid).order('timestamp', { ascending: false });
    if (rep) setReportData(rep);
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- FUNGSI ABSENSI SIMPEL ---
  const handleAbsenClick = (jenis) => {
    setCurrentAbsenType(jenis);
    fileInputRef.current.click(); // Langsung buka kamera
  };

  const processAbsen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    showToast(`Memproses Absen ${currentAbsenType}...`, "info");

    try {
      // 1. Ambil Lokasi (di belakang layar)
      let loc = { lat: 0, lng: 0 };
      try {
        const pos = await new Promise((res, rej) => 
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (err) {
        console.warn("GPS gagal, lanjut tanpa lokasi.");
      }

      // 2. Upload Foto ke Storage
      const fileName = `${session.user.id}/${Date.now()}-absen.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('attendance_evidence')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('attendance_evidence')
        .getPublicUrl(fileName);

      // 3. Simpan ke Database
      const { error: dbError } = await supabase.from('attendance').insert([{
        user_id: session.user.id,
        jenis: currentAbsenType,
        location: loc,
        evidence_url: publicUrl,
        timestamp: Date.now()
      }]);

      if (dbError) throw dbError;

      showToast(`Berhasil Absen ${currentAbsenType}!`, "success");
      fetchData(session.user.id);
    } catch (err) {
      showToast("Gagal absen, coba lagi.", "error");
    } finally {
      setIsProcessing(false);
      e.target.value = null; // Reset input
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-blue-700 text-white font-black animate-pulse text-2xl uppercase">VANDA</div>;
  if (!session) return <AuthPage showToast={showToast} />;

  const hasAbsenMasuk = attendanceData.some(a => new Date(a.timestamp).toDateString() === new Date().toDateString() && a.jenis === 'Masuk');
  const hasAbsenPulang = attendanceData.some(a => new Date(a.timestamp).toDateString() === new Date().toDateString() && a.jenis === 'Pulang');

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="bg-gradient-to-br from-blue-700 to-indigo-900 text-white p-6 pb-12 rounded-b-[3rem] shadow-xl shrink-0 z-10 relative">
          <div className="flex justify-between items-center mb-6 relative z-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 overflow-hidden flex items-center justify-center shadow-inner">
                {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User size={20} />}
              </div>
              <div>
                <p className="text-blue-100 text-[9px] font-black tracking-widest uppercase">SYNTEGRA Services</p>
                <h1 className="text-lg font-bold truncate w-40 tracking-tight">{profile?.full_name || 'User'}</h1>
              </div>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="p-2.5 bg-white/10 rounded-xl border border-white/20 hover:bg-rose-600 transition-all"><LogOut size={18} /></button>
          </div>
          <div className="bg-black/20 p-4 rounded-[2rem] backdrop-blur-md border border-white/10 flex justify-between items-center text-xs font-bold">
            <div className="flex items-center gap-2"><Clock size={14} className="text-blue-200" /> {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
            <div className={`px-3 py-1 rounded-full text-[9px] ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}>{isOnline ? 'ONLINE' : 'OFFLINE'}</div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto pb-28 px-6 -mt-8 pt-10 relative z-0">
          {toast && <Toast message={toast.message} type={toast.type} />}

          {activeTab === 'home' && (
            <div className="animate-fade-in space-y-6">
              {/* Absen Card */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-50 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${hasAbsenMasuk ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                  {isProcessing ? <Loader className="animate-spin" /> : (hasAbsenMasuk ? <CheckCircle size={28}/> : <Home size={28}/>)}
                </div>
                <div className="flex-1">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Status Hari Ini</p>
                  <h3 className="text-xl font-black text-slate-800">{hasAbsenMasuk ? (hasAbsenPulang ? 'Selesai' : 'Hadir') : 'Belum Absen'}</h3>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleAbsenClick('Masuk')} disabled={hasAbsenMasuk || isProcessing} className={`p-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all ${hasAbsenMasuk ? 'bg-slate-50 border-slate-100 text-slate-300' : 'bg-white border-blue-100 text-blue-600 shadow-xl shadow-blue-50 active:scale-95'}`}>
                  <div className={`p-4 rounded-3xl ${hasAbsenMasuk ? 'bg-slate-100' : 'bg-blue-50'}`}><Camera size={32} /></div>
                  <span className="font-black text-[10px] uppercase tracking-widest">Absen Masuk</span>
                </button>
                <button onClick={() => handleAbsenClick('Pulang')} disabled={!hasAbsenMasuk || hasAbsenPulang || isProcessing} className={`p-8 rounded-[2rem] border-2 transition-all ${!hasAbsenMasuk || hasAbsenPulang ? 'bg-slate-50 border-slate-100 text-slate-300' : 'bg-white border-rose-100 text-rose-600 shadow-xl shadow-rose-50 active:scale-95'}`}>
                  <div className={`p-4 rounded-3xl ${!hasAbsenMasuk || hasAbsenPulang ? 'bg-slate-100' : 'bg-rose-50'}`}><Camera size={32} /></div>
                  <span className="font-black text-[10px] uppercase tracking-widest">Absen Pulang</span>
                </button>
                
                <button onClick={() => setActiveTab('report')} className="p-7 rounded-3xl border-2 border-dashed border-indigo-100 bg-indigo-50 text-indigo-700 flex flex-col items-center justify-center col-span-2 active:scale-95">
                  <div className="p-3 bg-white rounded-full shadow mb-2"><Plus size={20} /></div>
                  <span className="font-bold text-sm">Kirim Laporan Kegiatan</span>
                </button>
              </div>
              
              {/* Hidden Input Kamera */}
              <input type="file" ref={fileInputRef} onChange={processAbsen} capture="user" accept="image/*" className="hidden" />
            </div>
          )}

          {activeTab === 'summary' && <SummaryTab attendanceData={attendanceData} reportData={reportData} historyType={historyType} setHistoryType={setHistoryType} />}
          {activeTab === 'profile' && <ProfileTab profile={profile} onUpdate={(p) => updateProfile(session.user.id, p)} showToast={showToast} />}
        </main>

        {/* NAVBAR */}
        <nav className="absolute bottom-0 w-full bg-white/90 border-t px-6 py-4 flex justify-between z-20 pb-safe shadow-2xl backdrop-blur-lg">
          <NavBtn icon={<Home size={22}/>} label="BERANDA" active={activeTab==='home'} onClick={() => setActiveTab('home')} />
          <NavBtn icon={<Clock size={22}/>} label="RINGKASAN" active={activeTab==='summary'} onClick={() => setActiveTab('summary')} />
          <NavBtn icon={<User size={22}/>} label="PROFIL" active={activeTab==='profile'} onClick={() => setActiveTab('profile')} />
        </nav>
      </div>
    </div>
  );

  async function updateProfile(uid, newProfile) {
    const { error } = await supabase.from('profiles').update(newProfile).eq('id', uid);
    if (!error) { setProfile({ ...profile, ...newProfile }); showToast("Profil diperbarui!", "success"); }
  }
}

// --- SUB KOMPONEN (Login, History, Profile) ---
// (Mas Joss bisa pakai komponen HistoryCard, ReportForm, dan AuthPage dari kode sebelumnya yang sudah keren)
// Pastikan tidak ada duplikasi fungsi agar tidak error.

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
      <div className={active ? 'bg-blue-50 p-2.5 rounded-2xl shadow-inner border border-blue-100' : 'p-2.5'}>{icon}</div>
      <span className="text-[8px] font-black tracking-widest uppercase">{label}</span>
    </button>
  );
}

function Toast({ message, type }) {
  return (
    <div className={`fixed top-4 left-4 right-4 p-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 text-[10px] font-black tracking-widest uppercase z-[100] animate-fade-in-down ${type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'}`}>
      {message}
    </div>
  );
}

// Tambahkan komponen SummaryTab dan ProfileTab di bawah sini agar kode lengkap...