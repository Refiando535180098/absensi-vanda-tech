import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Clock, FileText, User, MapPin, Wifi, WifiOff, 
  CheckCircle, LogOut, ChevronRight, Camera, AlertCircle,
  LogIn, UserPlus, Save, Image as ImageIcon, Hash, Plus, Trash2, Loader
} from 'lucide-react';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'summary', 'profile'
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-blue-700 text-white font-black animate-pulse text-2xl tracking-tight">VANDA</div>;

  if (!session) return <AuthPage showToast={showToast} />;

  const todayAttendance = attendanceData.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString());
  const hasAbsenMasuk = todayAttendance.some(a => a.jenis === 'Masuk');
  const hasAbsenPulang = todayAttendance.some(a => a.jenis === 'Pulang');

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* Modern Modern Header - Fixed Overlapping */}
        <header className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white p-7 pb-12 rounded-b-[3rem] shadow-xl shrink-0 z-10 relative overflow-hidden">
          {/* Efek Latar Modern */}
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute left-10 bottom-10 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl"></div>
          
          <div className="flex justify-between items-center mb-8 relative z-20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-lg border-2 border-white/20 overflow-hidden flex items-center justify-center shadow-inner">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={28} className="text-white/70" />
                )}
              </div>
              <div>
                <p className="text-blue-100 text-[9px] font-black tracking-[0.2em] uppercase">SYNTEGRA Services</p>
                <h1 className="text-xl font-extrabold truncate w-44 tracking-tight">{profile?.full_name || 'User Vanda'}</h1>
                <p className="text-white/70 text-[10px] font-bold tracking-wider mt-0.5">NIK: {profile?.nik?.toUpperCase() || '-'}</p>
              </div>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 hover:bg-rose-600 transition-all active:scale-95 shadow">
              <LogOut size={18} />
            </button>
          </div>
          
          {/* Status Bar Modern - Floating Style */}
          <div className="flex items-center justify-between text-xs bg-black/20 p-4 rounded-3xl backdrop-blur-md border border-white/10 relative z-20 shadow-inner">
            <div className="flex items-center gap-2.5 font-bold text-white/90">
              <Clock size={16} className="text-blue-200" />
              <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-[9px] tracking-widest ${isOnline ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'} shadow`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA - Fixed Spacing */}
        <main className="flex-1 overflow-y-auto pb-28 px-6 -mt-8 pt-6 relative z-0">
          {toast && <Toast message={toast.message} type={toast.type} />}

          {activeTab === 'home' && (
            <div className="animate-fade-in space-y-6">
              {/* Ringkasan Dashboard */}
              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-50 border border-slate-50 flex items-center gap-20">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner ${hasAbsenMasuk ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                  {hasAbsenMasuk ? <CheckCircle size={32} /> : <Home size={32} />}
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase">Kehadiran Hari Ini</p>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">{hasAbsenMasuk ? (hasAbsenPulang ? 'Selesai Bekerja' : 'Hadir & Bekerja') : 'Belum Absen'}</h3>
                  {hasAbsenMasuk && (
                    <p className="text-xs font-bold text-emerald-600 mt-1">Masuk: {new Date(todayAttendance.find(a=>a.jenis==='Masuk')?.timestamp).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</p>
                  )}
                </div>
              </div>

              {/* FITUR UTAMA DASHBOARD */}
              <div className="space-y-4">
                <h2 className="font-black text-lg text-slate-800 tracking-tight ml-2">Fitur Utama</h2>
                <div className="grid grid-cols-2 gap-4">
                  {/* Absen Masuk */}
                  <button onClick={() => handleAbsen('Masuk', session.user.id)} disabled={hasAbsenMasuk} className={`p-6 rounded-3xl border transition-all ${hasAbsenMasuk ? 'bg-slate-50 border-slate-100 text-slate-300' : 'bg-white border-blue-100 text-blue-600 shadow-xl shadow-blue-50 active:scale-90 hover:border-blue-200'}`}>
                    <div className={`p-4 rounded-full ${hasAbsenMasuk ? 'bg-slate-100' : 'bg-blue-50'}`}><LogIn size={30} /></div>
                    <span className="font-black text-xs uppercase tracking-widest mt-4 block">Absen Masuk</span>
                  </button>
                  {/* Absen Pulang */}
                  <button onClick={() => handleAbsen('Pulang', session.user.id)} disabled={!hasAbsenMasuk || hasAbsenPulang} className={`p-6 rounded-3xl border bg-white transition-all disabled:opacity-30 ${!hasAbsenMasuk || hasAbsenPulang ? 'border-slate-100 text-slate-300' : 'border-rose-100 text-rose-600 shadow-xl shadow-rose-50 active:scale-90 hover:border-rose-200'}`}>
                    <div className={`p-4 rounded-full ${!hasAbsenMasuk || hasAbsenPulang ? 'bg-slate-100' : 'bg-rose-50'}`}><LogOut size={30} /></div>
                    <span className="font-black text-xs uppercase tracking-widest mt-4 block">Absen Pulang</span>
                  </button>
                  {/* Buat Laporan - New Action Card */}
                  <button onClick={() => setActiveTab('report')} className="p-6 rounded-3xl border-2 border-dashed border-indigo-100 bg-indigo-50 text-indigo-700 flex flex-col items-center justify-center hover:border-indigo-200 active:scale-95 col-span-2">
                    <div className="p-3 bg-white rounded-2xl shadow mb-3"><Plus size={20} /></div>
                    <span className="font-bold text-sm tracking-tight">Kirim Laporan Kegiatan</span>
                    <p className="text-[10px] text-indigo-500 mt-1">Buat laporan kerja atau kendala lapangan</p>
                  </button>
                </div>
              </div>

              {/* Info Lokasi Modern */}
              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex items-center gap-3 text-[10px] font-bold text-slate-500">
                <div className="p-2 bg-white rounded-xl shadow-sm"><MapPin size={16} className="text-blue-500" /></div>
                <span>{location ? `Titik GPS Terkunci: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Sistem menunggu sinyal GPS HP kamu...'}</span>
              </div>
            </div>
          )}
          
          {activeTab === 'summary' && <SummaryTab attendanceData={attendanceData} reportData={reportData} historyType={historyType} setHistoryType={setHistoryType} />}
          
          {activeTab === 'report' && <ReportForm onSubmit={(d) => handleSaveData('reports', d, session.user.id)} />}
          
          {activeTab === 'profile' && <ProfileTab profile={profile} onUpdate={(p) => updateProfile(session.user.id, p)} showToast={showToast} />}
        </main>

        {/* MODERN NAVBAR (BOTTOM) - 3 Items Only */}
        <nav className="absolute bottom-0 w-full bg-white/90 border-t px-6 py-4 flex justify-between z-20 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-lg">
          <NavBtn icon={<Home size={22}/>} label="MENU UTAMA" active={activeTab==='home'} onClick={() => setActiveTab('home')} />
          <NavBtn icon={<Clock size={22}/>} label="RINGKASAN" active={activeTab==='summary'} onClick={() => setActiveTab('summary')} />
          <NavBtn icon={<User size={22}/>} label="PROFIL SAYA" active={activeTab==='profile'} onClick={() => setActiveTab('profile')} />
        </nav>
      </div>
    </div>
  );

  // --- LOGIC FUNCTIONS (Fixed Data Refresh) ---
  async function handleAbsen(jenis, uid) {
    try {
      showToast("Mengunci GPS...", "info");
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, {enableHighAccuracy: true}));
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLocation(loc);
      await handleSaveData('attendance', { jenis, location: loc }, uid);
    } catch (err) {
      showToast("GPS Gagal. Absen tanpa GPS.", "error");
      await handleSaveData('attendance', { jenis, location: { lat: 0, lng: 0 } }, uid);
    }
  }

  async function handleSaveData(table, payload, uid) {
    const data = { ...payload, user_id: uid, timestamp: Date.now() };
    const { error } = await supabase.from(table).insert([data]);
    if (!error) {
      showToast("Berhasil!", "success");
      await fetchData(uid); // Refresh data
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

// --- SUB-COMPONENTS (With Modern Designs) ---

// --- TAB RINGKASAN (Combined History) ---
function SummaryTab({ attendanceData, reportData, historyType, setHistoryType }) {
  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="font-black text-2xl text-slate-800 tracking-tight">Ringkasan Aktivitas</h2>
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
        <button onClick={() => setHistoryType('attendance')} className={`flex-1 py-3 text-xs font-black tracking-wider rounded-xl transition-all ${historyType === 'attendance' ? 'bg-white text-blue-700 shadow shadow-blue-50' : 'text-slate-500'}`}>ABSENSI</button>
        <button onClick={() => setHistoryType('reports')} className={`flex-1 py-3 text-xs font-black tracking-wider rounded-xl transition-all ${historyType === 'reports' ? 'bg-white text-indigo-700 shadow shadow-indigo-50' : 'text-slate-500'}`}>LAPORAN</button>
      </div>
      <div className="space-y-3">
        {historyType === 'attendance' ? (
          attendanceData.length > 0 ? attendanceData.map(item => <HistoryCard key={item.id} title={`Absen ${item.jenis}`} subtitle={new Date(item.timestamp).toLocaleString('id-ID', {weekday:'long', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})} icon={<Clock size={16}/>} color={item.jenis === 'Masuk' ? 'blue' : 'rose'} />) : <p className="text-center text-slate-400 text-xs py-10 font-bold">Belum ada absen.</p>
        ) : (
          reportData.length > 0 ? reportData.map(item => <HistoryCard key={item.id} title={item.judul} subtitle={item.deskripsi} icon={<FileText size={16}/>} color="indigo" />) : <p className="text-center text-slate-400 text-xs py-10 font-bold">Belum ada laporan.</p>
        )}
      </div>
    </div>
  );
}

// --- TAB PROFIL (Fix File Manager Upload) ---
function ProfileTab({ profile, onUpdate, showToast }) {
  const [name, setName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Bersihkan: Hanya izinkan gambar
    if (!file.type.startsWith('image/')) {
      showToast("Wajib file gambar (JPG/PNG)!", "error");
      return;
    }

    try {
      setUploading(true);
      showToast("Membuka bungkusan foto...", "info");

      // Siapkan path unik di Supabase Storage (uid/waktu-namafile)
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`; // Taruh di folder ID user agar RLS jalan

      // 1. Upload ke Supabase Storage (Bucket 'avatars')
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true }); // Upsert: Tindih kalau ada konflik

      if (error) throw error;

      // 2. Ambil URL Publiknya
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Simpan URL barunya di database
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      setAvatarUrl(publicUrl);
      
      showToast("Foto profil terpasang!", "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal unggah foto.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      <h2 className="font-black text-2xl text-slate-800 tracking-tight">Profil & Pengaturan</h2>
      
      <div className="text-center">
        <div className="relative w-36 h-36 mx-auto mb-5">
          {/* Bingkai Modern */}
          <div className="w-full h-full rounded-[3rem] bg-slate-100 overflow-hidden flex items-center justify-center border-8 border-white shadow-2xl relative">
            {avatarUrl ? (
              <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
            ) : (
              <User size={60} className="text-slate-300" />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold gap-2">
                <Loader size={18} className="animate-spin" />
                <span>Nga-load...</span>
              </div>
            )}
          </div>
          
          {/* Tombol Kamera Sempurna - Pic from File Manager */}
          <button 
            onClick={() => fileInputRef.current?.click()} // Pancing input file tersembunyi
            className="absolute -bottom-2 -right-2 bg-gradient-to-br from-blue-600 to-blue-800 p-4 rounded-3xl text-white shadow-xl border-4 border-white active:scale-95 hover:from-blue-700 transition-all">
            <Camera size={22} />
          </button>
          {/* Input File Tersembunyi */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        <p className="text-blue-600 font-black text-[11px] tracking-[0.3em] mb-1.5">SYNTEGRA Services</p>
        <h3 className="font-black text-xl text-slate-800 tracking-tight">{profile?.full_name}</h3>
      </div>
      
      <div className="bg-white rounded-[2rem] border border-slate-100 p-7 space-y-6 shadow-xl shadow-blue-50/20">
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 opacity-70">
          <label className="text-[10px] font-black text-slate-400 mb-1.5 block uppercase tracking-wider">Nomor Induk Karyawan (NIK)</label>
          <p className="font-bold text-lg text-slate-800 uppercase tracking-wide">{profile?.nik || '-'}</p>
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 ml-2 mb-1.5 block uppercase tracking-wider">Nama Lengkap Kantor</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold focus:ring-2 ring-blue-500 transition-all" />
        </div>
        <button onClick={() => onUpdate({ full_name: name })} className="w-full py-4.5 bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-200 active:scale-95 transition-all">
          <Save size={20} /> SIMPAN PERUBAHAN NAMA
        </button>
      </div>
    </div>
  );
}

// --- TAB LAPORAN (Fixed CSS) ---
function ReportForm({ onSubmit }) {
  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="font-black text-2xl text-slate-800 tracking-tight">Kirim Laporan Baru</h2>
      <form onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ judul: new FormData(e.target).get('judul'), deskripsi: new FormData(e.target).get('deskripsi') });
      }} className="space-y-5 bg-white p-7 rounded-3xl border border-slate-100 shadow-xl shadow-indigo-50/30">
        <input name="judul" required placeholder="Judul Kegiatan atau Kendala" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:border-indigo-400 transition-all" />
        <textarea name="deskripsi" required rows="6" placeholder="Detail laporan teknis atau kendala lapangan..." className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm focus:border-indigo-400 transition-all"></textarea>
        <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 active:scale-95 transition-all">
          KIRIM LAPORAN SEKARANG
        </button>
      </form>
    </div>
  );
}

// --- AUTH & MISC COMPONENTS ---

function AuthPage({ showToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [nik, setNik] = useState(''); 
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    const cleanNik = nik.trim().toLowerCase();
    const shadowEmail = `${cleanNik}@vanda.tech`;

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email: shadowEmail, password });
      if (error) showToast("NIK atau Password salah!", "error");
    } else {
      const { error } = await supabase.auth.signUp({ 
        email: shadowEmail, password, options: { data: { full_name: name, nik: nik.trim() } } 
      });
      if (error) showToast(error.message, "error");
      else showToast("Daftar berhasil! Silakan Login.", "success");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-indigo-900 to-black flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Efek Keren Latar */}
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -left-10 bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl"></div>
      
      <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-3xl relative z-10 border border-white/10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-5 text-blue-600 shadow-inner">
            <Hash size={40} />
          </div>
          <p className="text-blue-600 text-xs font-black tracking-[0.3em] mb-1.5 uppercase">VANDA TECH</p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{isLogin ? 'MASUK KE AKUN' : 'DAFTAR KARYAWAN'}</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1.5">Aplikasi Internal Kehadiran</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <input type="text" placeholder="Nama Lengkap Sesuai ID Kantor" className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-medium" value={name} onChange={e => setName(e.target.value)} required />
          )}
          <input 
            type="text" 
            placeholder="Masukkan NIK (Bebas Huruf Besar/Kecil)" 
            className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-blue-600 tracking-wide" 
            value={nik} 
            onChange={e => setNik(e.target.value)} 
            required 
          />
          <input type="password" placeholder="Password Akun" className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-medium" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="w-full py-5 bg-gradient-to-br from-blue-600 to-blue-800 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:from-blue-700 active:scale-95 transition-all tracking-wide">
            {isLogin ? 'MASUK SEKARANG' : 'DAFTAR KARYAWAN'}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-8 text-xs font-black text-blue-600 tracking-widest uppercase opacity-70 hover:opacity-100 transition-opacity">
          {isLogin ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login'}
        </button>
      </div>
    </div>
  );
}

function HistoryCard({ title, subtitle, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border border-blue-100',
    rose: 'bg-rose-50 text-rose-600 border border-rose-100',
    indigo: 'bg-indigo-50 text-indigo-600 border border-indigo-100'
  };
  return (
    <div className="bg-white p-5 rounded-[1.5rem] border border-slate-50 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-2xl ${colors[color]}`}>{icon}</div>
      <div className="flex-1">
        <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider">{title}</h4>
        <p className="text-[10px] font-medium text-slate-500 mt-1 line-clamp-1 leading-relaxed">{subtitle}</p>
      </div>
      <ChevronRight size={16} className="text-slate-300" />
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-2 transition-all group ${active ? 'scale-110' : 'text-slate-300 hover:text-slate-500'}`}>
      <div className={active ? 'bg-blue-50 text-blue-600 p-3 rounded-2xl shadow-inner border border-blue-100' : 'p-3 rounded-2xl group-hover:bg-slate-50'}>{icon}</div>
      <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${active ? 'text-blue-700' : ''}`}>{label}</span>
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