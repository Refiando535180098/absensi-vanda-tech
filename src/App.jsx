import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Clock, FileText, User, MapPin, Wifi, WifiOff, 
  CheckCircle, LogOut, ChevronRight, Camera, AlertCircle,
  LogIn, UserPlus, Save, Image as ImageIcon, Hash
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
  const [location, setLocation] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [reportData, setReportData] = useState([]);

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

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-blue-600 text-white font-bold animate-pulse">VANDA TECH</div>;

  if (!session) return <AuthPage showToast={showToast} />;

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 pb-10 rounded-b-[2.5rem] shadow-lg shrink-0 z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 overflow-hidden flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={24} />
                )}
              </div>
              <div>
                <p className="text-blue-100 text-[10px] font-bold tracking-widest uppercase">NIK: {profile?.nik || '-'}</p>
                <h1 className="text-lg font-bold truncate w-40">{profile?.full_name || 'User Vanda'}</h1>
              </div>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="p-2 bg-white/10 rounded-xl hover:bg-rose-500 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
          
          <div className="flex items-center justify-between text-xs bg-black/20 p-3 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 font-medium">
              <Clock size={14} className="text-blue-200" />
              <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto pb-24 px-6 -mt-6 pt-1 relative z-0">
          {toast && <Toast message={toast.message} type={toast.type} />}

          {activeTab === 'home' && (
            <HomeTab 
              hasAbsenMasuk={attendanceData.some(a => new Date(a.timestamp).toDateString() === new Date().toDateString() && a.jenis === 'Masuk')} 
              onAbsen={(j) => handleAbsen(j, session.user.id)} 
              location={location} 
            />
          )}
          
          {activeTab === 'history' && (
            <div className="animate-fade-in space-y-4">
              <div className="flex bg-slate-200 p-1 rounded-xl">
                <button onClick={() => setHistoryType('attendance')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${historyType === 'attendance' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>ABSENSI</button>
                <button onClick={() => setHistoryType('reports')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${historyType === 'reports' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>LAPORAN</button>
              </div>
              <div className="space-y-3">
                {historyType === 'attendance' ? (
                  attendanceData.length > 0 ? attendanceData.map(item => <HistoryCard key={item.id} title={`Absen ${item.jenis}`} subtitle={new Date(item.timestamp).toLocaleString('id-ID')} icon={<Clock size={16}/>} color={item.jenis === 'Masuk' ? 'blue' : 'rose'} />) : <p className="text-center text-slate-400 text-xs py-10">Belum ada riwayat absen</p>
                ) : (
                  reportData.length > 0 ? reportData.map(item => <HistoryCard key={item.id} title={item.judul} subtitle={item.deskripsi} icon={<FileText size={16}/>} color="indigo" />) : <p className="text-center text-slate-400 text-xs py-10">Belum ada riwayat laporan</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'report' && <ReportForm onSubmit={(d) => handleSaveData('reports', d, session.user.id)} />}
          
          {activeTab === 'profile' && <ProfileTab profile={profile} onUpdate={(p) => updateProfile(session.user.id, p)} />}
        </main>

        {/* NAV */}
        <nav className="absolute bottom-0 w-full bg-white border-t px-6 py-3 flex justify-between z-20 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
          <NavBtn icon={<Home size={22}/>} label="Beranda" active={activeTab==='home'} onClick={() => setActiveTab('home')} />
          <NavBtn icon={<Clock size={22}/>} label="Riwayat" active={activeTab==='history'} onClick={() => setActiveTab('history')} />
          <NavBtn icon={<FileText size={22}/>} label="Laporan" active={activeTab==='report'} onClick={() => setActiveTab('report')} />
          <NavBtn icon={<User size={22}/>} label="Profil" active={activeTab==='profile'} onClick={() => setActiveTab('profile')} />
        </nav>
      </div>
    </div>
  );

  async function handleAbsen(jenis, uid) {
    try {
      showToast("Mendapatkan GPS...", "info");
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, {enableHighAccuracy: true}));
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLocation(loc);
      await handleSaveData('attendance', { jenis, location: loc }, uid);
    } catch (err) {
      showToast("Lokasi gagal. Absen tanpa GPS.", "error");
      await handleSaveData('attendance', { jenis, location: { lat: 0, lng: 0 } }, uid);
    }
  }

  async function handleSaveData(table, payload, uid) {
    const data = { ...payload, user_id: uid, timestamp: Date.now() };
    const { error } = await supabase.from(table).insert([data]);
    if (!error) {
      showToast("Berhasil disimpan!", "success");
      fetchData(uid);
      if(table === 'reports') setActiveTab('home');
    }
  }

  async function updateProfile(uid, newProfile) {
    const { error } = await supabase.from('profiles').update(newProfile).eq('id', uid);
    if (!error) {
      setProfile({ ...profile, ...newProfile });
      showToast("Profil diperbarui!", "success");
    }
  }
}

// --- LOGIN PAGE DENGAN NIK ---
function AuthPage({ showToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [nik, setNik] = useState(''); // State NIK
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    // Trik: Ubah NIK menjadi format email bayangan agar Supabase Auth mau proses
    const shadowEmail = `${nik.trim().toLowerCase()}@vanda.tech`;

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email: shadowEmail, password });
      if (error) showToast("NIK atau Password salah!", "error");
    } else {
      const { error } = await supabase.auth.signUp({ 
        email: shadowEmail, 
        password, 
        options: { data: { full_name: name, nik: nik.trim() } } 
      });
      if (error) showToast(error.message, "error");
      else showToast("Daftar berhasil! Silakan Login.", "success");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-inner">
            <Hash size={40} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{isLogin ? 'VANDA LOGIN' : 'PENDAFTARAN'}</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Sistem Absensi Internal</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <input type="text" placeholder="Nama Lengkap" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium" value={name} onChange={e => setName(e.target.value)} required />
          )}
          <input 
            type="text" 
            placeholder="Masukkan NIK (Contoh: VND-001)" 
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-blue-600" 
            value={nik} 
            onChange={e => setNik(e.target.value)} 
            required 
          />
          <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
            {isLogin ? 'MASUK SEKARANG' : 'DAFTAR KARYAWAN'}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-8 text-xs font-black text-blue-600 tracking-widest uppercase opacity-70 hover:opacity-100">
          {isLogin ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login'}
        </button>
      </div>
    </div>
  );
}

// --- TAB KOMPONEN LAINNYA ---
function HomeTab({ hasAbsenMasuk, onAbsen, location }) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600/30 rounded-full blur-3xl"></div>
        <p className="text-slate-500 text-[10px] font-black tracking-widest mb-2 uppercase">STATUS KEHADIRAN</p>
        <h2 className="text-4xl font-black mb-6">{hasAbsenMasuk ? 'Hadir' : 'Belum Absen'}</h2>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-white/5 w-fit px-3 py-1.5 rounded-full">
          <MapPin size={12} className="text-blue-500" /> {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Mencari lokasi...'}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onAbsen('Masuk')} disabled={hasAbsenMasuk} className={`p-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all ${hasAbsenMasuk ? 'bg-slate-50 border-slate-100 text-slate-300' : 'bg-white border-blue-50 text-blue-600 shadow-xl shadow-blue-50 active:scale-90'}`}>
          <div className={`p-4 rounded-2xl ${hasAbsenMasuk ? 'bg-slate-100' : 'bg-blue-50'}`}><LogIn size={32} /></div>
          <span className="font-black text-xs uppercase tracking-widest">Masuk</span>
        </button>
        <button onClick={() => onAbsen('Pulang')} disabled={!hasAbsenMasuk} className="p-8 rounded-[2rem] border-2 bg-white border-rose-50 text-rose-600 flex flex-col items-center gap-4 shadow-xl shadow-rose-50 active:scale-90 disabled:opacity-30">
          <div className="p-4 rounded-2xl bg-rose-50"><LogOut size={32} /></div>
          <span className="font-black text-xs uppercase tracking-widest">Pulang</span>
        </button>
      </div>
    </div>
  );
}

function ProfileTab({ profile, onUpdate }) {
  const [name, setName] = useState(profile?.full_name || '');
  const [avatar, setAvatar] = useState(profile?.avatar_url || '');

  return (
    <div className="animate-fade-in space-y-8">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-4">
          <div className="w-full h-full rounded-[2.5rem] bg-slate-100 overflow-hidden flex items-center justify-center border-8 border-white shadow-2xl">
            {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <User size={48} className="text-slate-300" />}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-blue-600 p-3 rounded-2xl text-white shadow-xl border-4 border-white"><Camera size={20} /></div>
        </div>
        <p className="text-blue-600 font-black text-xs tracking-[0.2em] mb-1">KARYAWAN</p>
        <h3 className="font-black text-xl text-slate-800">{profile?.full_name}</h3>
      </div>
      
      <div className="bg-white rounded-[2rem] border border-slate-100 p-6 space-y-5 shadow-sm">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 opacity-60">
          <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase">Nomor Induk Karyawan (NIK)</label>
          <p className="font-bold text-slate-700">{profile?.nik}</p>
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 ml-2 mb-1 block uppercase">Nama Lengkap</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold" />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 ml-2 mb-1 block uppercase">URL Foto Profil</label>
          <input value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm" />
        </div>
        <button onClick={() => onUpdate({ full_name: name, avatar_url: avatar })} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-100 active:scale-95 transition-all">
          <Save size={20} /> SIMPAN PROFIL
        </button>
      </div>
    </div>
  );
}

function ReportForm({ onSubmit }) {
  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="font-black text-xl text-slate-800 tracking-tight">BUAT LAPORAN</h2>
      <form onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ judul: new FormData(e.target).get('judul'), deskripsi: new FormData(e.target).get('deskripsi') });
      }} className="space-y-4">
        <input name="judul" required placeholder="Judul Kegiatan" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" />
        <textarea name="deskripsi" required rows="5" placeholder="Detail laporan atau kendala di lapangan..." className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm"></textarea>
        <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all">
          KIRIM LAPORAN SEKARANG
        </button>
      </form>
    </div>
  );
}

function HistoryCard({ title, subtitle, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    rose: 'bg-rose-50 text-rose-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  };
  return (
    <div className="bg-white p-5 rounded-[1.5rem] border border-slate-50 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-2xl ${colors[color]}`}>{icon}</div>
      <div className="flex-1">
        <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">{title}</h4>
        <p className="text-[10px] font-bold text-slate-400 mt-1 line-clamp-1">{subtitle}</p>
      </div>
      <ChevronRight size={16} className="text-slate-200" />
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-blue-600 scale-110' : 'text-slate-300 hover:text-slate-500'}`}>
      <div className={active ? 'bg-blue-50 p-2 rounded-xl' : 'p-2'}>{icon}</div>
      <span className="text-[8px] font-black uppercase tracking-[0.1em]">{label}</span>
    </button>
  );
}

function Toast({ message, type }) {
  return (
    <div className={`absolute top-0 left-0 right-0 p-4 rounded-b-2xl shadow-xl flex items-center justify-center gap-3 text-[10px] font-black tracking-widest uppercase z-50 animate-fade-in-down ${type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'}`}>
      {message}
    </div>
  );
}