import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Clock, FileText, User, MapPin, Wifi, WifiOff, 
  CheckCircle, LogOut, ChevronRight, Camera, AlertCircle,
  LogIn, UserPlus, Save, Image as ImageIcon
} from 'lucide-react';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [historyType, setHistoryType] = useState('attendance'); // 'attendance' or 'reports'
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [location, setLocation] = useState(null);

  // Data States
  const [attendanceData, setAttendanceData] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [offlineQueue, setOfflineQueue] = useState([]);

  useEffect(() => {
    // 1. Cek Sesi Login
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    // 2. Network Listeners
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-blue-600">VANDA TECH LOADING...</div>;

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
                <p className="text-blue-100 text-xs font-medium">SYNTEGRA SERVICES</p>
                <h1 className="text-lg font-bold truncate w-40">{profile?.full_name || 'User Vanda'}</h1>
              </div>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="p-2 bg-white/10 rounded-xl hover:bg-rose-500 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
          
          <div className="flex items-center justify-between text-xs bg-black/20 p-3 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-blue-200" />
              <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full font-bold ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />} {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto pb-24 px-6 -mt-6 pt-1 relative z-0">
          {toast && <Toast message={toast.message} type={toast.type} />}

          {activeTab === 'home' && <HomeTab hasAbsenMasuk={attendanceData.some(a => new Date(a.timestamp).toDateString() === new Date().toDateString() && a.jenis === 'Masuk')} onAbsen={(j) => handleAbsen(j, session.user.id)} location={location} />}
          
          {activeTab === 'history' && (
            <div className="animate-fade-in space-y-4">
              <div className="flex bg-slate-200 p-1 rounded-xl">
                <button onClick={() => setHistoryType('attendance')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${historyType === 'attendance' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>ABSENSI</button>
                <button onClick={() => setHistoryType('reports')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${historyType === 'reports' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>LAPORAN</button>
              </div>
              
              <div className="space-y-3">
                {historyType === 'attendance' ? (
                  attendanceData.map(item => <HistoryCard key={item.id} title={`Absen ${item.jenis}`} subtitle={new Date(item.timestamp).toLocaleString('id-ID')} icon={<Clock size={16}/>} color={item.jenis === 'Masuk' ? 'blue' : 'rose'} />)
                ) : (
                  reportData.map(item => <HistoryCard key={item.id} title={item.judul} subtitle={item.deskripsi} icon={<FileText size={16}/>} color="indigo" />)
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

  // --- LOGIC FUNCTIONS ---
  async function handleAbsen(jenis, uid) {
    try {
      showToast("Mengunci lokasi...", "info");
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, {enableHighAccuracy: true}));
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLocation(loc);
      await handleSaveData('attendance', { jenis, location: loc }, uid);
    } catch (err) {
      showToast("GPS Gagal. Tetap absen tanpa lokasi.", "error");
      await handleSaveData('attendance', { jenis, location: { lat: 0, lng: 0 } }, uid);
    }
  }

  async function handleSaveData(table, payload, uid) {
    const data = { ...payload, user_id: uid, timestamp: Date.now() };
    const { error } = await supabase.from(table).insert([data]);
    if (!error) {
      showToast("Data berhasil disimpan!", "success");
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

// --- SUB-COMPONENTS ---

function AuthPage({ showToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [nik, setNik] = useState(''); // Ganti email jadi NIK
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    
    // Trik: Ubah NIK menjadi format email internal (staf tidak tahu)
    const fakeEmail = `${nik}@vanda.id`;

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: fakeEmail, 
        password 
      });
      if (error) showToast("NIK atau Password Salah!", "error");
    } else {
      const { error } = await supabase.auth.signUp({ 
        email: fakeEmail, 
        password, 
        options: { 
          data: { 
            full_name: name,
            nik: nik // Simpan NIK asli ke metadata
          } 
        } 
      });
      if (error) showToast(error.message, "error");
      else showToast("Pendaftaran Berhasil! Silakan Login.", "success");
    }
  };

  return (
    <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <User size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{isLogin ? 'Login Staf' : 'Registrasi Staf'}</h1>
          <p className="text-slate-500 text-sm">SYNTEGRA SERVICES - VANDA TECH</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 ml-4 uppercase">Nama Lengkap</label>
              <input type="text" placeholder="Masukkan Nama" className="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:ring-2 ring-indigo-500 text-sm" value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 ml-4 uppercase">NIK (Nomor Induk Kependudukan)</label>
            <input 
              type="text" 
              placeholder="Contoh: 3201XXXXXXXX" 
              className="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:ring-2 ring-indigo-500 text-sm" 
              value={nik} 
              onChange={e => setNik(e.target.value.replace(/[^0-9]/g, ''))} // Hanya boleh angka
              required 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 ml-4 uppercase">Password</label>
            <input type="password" placeholder="Masukkan Password" className="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:ring-2 ring-indigo-500 text-sm" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 mt-4 active:scale-95 transition-all">
            {isLogin ? 'MASUK' : 'DAFTAR'}
          </button>
        </form>

        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-sm font-bold text-indigo-600">
          {isLogin ? 'Belum punya akun? Hubungi Admin / Daftar' : 'Sudah punya akun? Login'}
        </button>
      </div>
    </div>
  );
}

function HomeTab({ hasAbsenMasuk, onAbsen, location }) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>
        <p className="text-slate-400 text-xs mb-1">STATUS HARI INI</p>
        <h2 className="text-3xl font-bold mb-4">{hasAbsenMasuk ? 'Sudah Absen' : 'Belum Absen'}</h2>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <MapPin size={12} /> {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Menunggu GPS...'}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onAbsen('Masuk')} disabled={hasAbsenMasuk} className={`p-6 rounded-3xl border flex flex-col items-center gap-3 transition-all ${hasAbsenMasuk ? 'bg-slate-50 text-slate-400' : 'bg-white border-blue-100 text-blue-600 shadow-sm active:scale-95'}`}>
          <div className={`p-3 rounded-2xl ${hasAbsenMasuk ? 'bg-slate-200' : 'bg-blue-100'}`}><LogIn size={24} /></div>
          <span className="font-bold text-sm">Masuk</span>
        </button>
        <button onClick={() => onAbsen('Pulang')} disabled={!hasAbsenMasuk} className="p-6 rounded-3xl border bg-white border-rose-100 text-rose-600 flex flex-col items-center gap-3 shadow-sm active:scale-95 disabled:opacity-50">
          <div className="p-3 rounded-2xl bg-rose-100"><LogOut size={24} /></div>
          <span className="font-bold text-sm">Pulang</span>
        </button>
      </div>
    </div>
  );
}

function ProfileTab({ profile, onUpdate }) {
  const [name, setName] = useState(profile?.full_name || '');
  const [avatar, setAvatar] = useState(profile?.avatar_url || '');

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <div className="w-full h-full rounded-3xl bg-slate-200 overflow-hidden flex items-center justify-center border-4 border-white shadow-md">
            {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <User size={40} className="text-slate-400" />}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-xl text-white shadow-lg cursor-pointer"><Camera size={16} /></div>
        </div>
        <h3 className="font-bold text-lg">{profile?.full_name}</h3>
      </div>
      
      <div className="bg-white rounded-3xl border p-4 space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 ml-2 mb-1 block">NAMA LENGKAP</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 ml-2 mb-1 block">URL FOTO PROFIL</label>
          <input value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://..." className="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm" />
        </div>
        <button onClick={() => onUpdate({ full_name: name, avatar_url: avatar })} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
          <Save size={18} /> Simpan Perubahan
        </button>
      </div>
    </div>
  );
}

function ReportForm({ onSubmit }) {
  return (
    <div className="animate-fade-in space-y-4">
      <h2 className="font-bold text-lg">Buat Laporan</h2>
      <form onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ judul: new FormData(e.target).get('judul'), deskripsi: new FormData(e.target).get('deskripsi') });
      }} className="space-y-4">
        <input name="judul" required placeholder="Judul Laporan" className="w-full p-4 bg-white border rounded-2xl outline-none" />
        <textarea name="deskripsi" required rows="4" placeholder="Detail laporan..." className="w-full p-4 bg-white border rounded-2xl outline-none"></textarea>
        <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl">Kirim Sekarang</button>
      </form>
    </div>
  );
}

function HistoryCard({ title, subtitle, icon, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    rose: 'bg-rose-100 text-rose-600',
    indigo: 'bg-indigo-100 text-indigo-600'
  };
  return (
    <div className="bg-white p-4 rounded-2xl border flex items-center gap-4 shadow-sm">
      <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
      <div className="flex-1">
        <h4 className="font-bold text-sm text-slate-800">{title}</h4>
        <p className="text-xs text-slate-500 truncate w-48">{subtitle}</p>
      </div>
      <ChevronRight size={16} className="text-slate-300" />
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
      {icon} <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

function Toast({ message, type }) {
  return (
    <div className={`absolute top-0 left-0 right-0 p-3 rounded-xl shadow-lg flex items-center gap-3 text-xs font-bold z-50 animate-fade-in-down ${type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
      {message}
    </div>
  );
}