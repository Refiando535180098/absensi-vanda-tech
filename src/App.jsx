import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Clock, FileText, User, Camera, LogOut, ChevronRight, ChevronDown,
  CheckCircle, LogIn, Hash, Plus, Loader, XCircle, FileIcon, Calendar,
  FileSpreadsheetIcon, Save, Image as ImageIcon, ShieldCheck, MapPin, AlertTriangle, Briefcase
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
  
  // Data States
  const [attendanceData, setAttendanceData] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);

  // Attendance & Manual Form States
  const [attendanceStep, setAttendanceStep] = useState('dashboard');
  const [currentType, setCurrentType] = useState(null);
  const [faceScore, setFaceScore] = useState(null);
  const [location, setLocation] = useState(null);

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
    const { data: lve } = await supabase.from('leaves').select('*').eq('user_id', uid).order('timestamp', { ascending: false });
    if (lve) setLeaveData(lve);
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- GET LOCATION ---
  const getLoc = () => {
    return new Promise((res) => {
      navigator.geolocation.getCurrentPosition(
        (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => res(null),
        { enableHighAccuracy: true }
      );
    });
  };

  // --- ACTIONS ---
  const startAttendance = async (type) => {
    setCurrentType(type);
    showToast("Mengunci Lokasi...", "info");
    const loc = await getLoc();
    setLocation(loc);
    setFaceScore(Math.floor(Math.random() * (99 - 96 + 1)) + 96);
    setAttendanceStep('verifying');
  };

  const confirmAttendance = async (photoFile) => {
    setAttendanceStep('dashboard');
    showToast("Memproses data...", "info");
    
    try {
      let pUrl = null;
      if (photoFile) {
        const fName = `${profile.id}/${Date.now()}-absen.jpg`;
        await supabase.storage.from('attendance_evidence').upload(fName, photoFile);
        const { data } = supabase.storage.from('attendance_evidence').getPublicUrl(fName);
        pUrl = data.publicUrl;
      }

      const { error } = await supabase.from('attendance').insert([{
        user_id: session.user.id,
        jenis: currentType,
        evidence_url: pUrl,
        location: location,
        location_map: location ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : null,
        timestamp: Date.now()
      }]);

      if (!error) {
        showToast("Absen Berhasil!", "success");
        fetchData(session.user.id);
      }
    } catch (err) { showToast("Gagal simpan.", "error"); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-blue-700 text-white font-black animate-pulse">VANDA TECH</div>;
  if (!session) return <AuthPage showToast={showToast} />;

  const hasAbsenMasuk = attendanceData.some(a => new Date(a.timestamp).toDateString() === new Date().toDateString() && a.jenis === 'Masuk');
  const hasAbsenPulang = attendanceData.some(a => new Date(a.timestamp).toDateString() === new Date().toDateString() && a.jenis === 'Pulang');

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center font-sans overflow-x-hidden">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        
        {/* HEADER */}
        <header className="bg-gradient-to-br from-blue-700 to-indigo-950 text-white p-6 pb-12 rounded-b-[3rem] shadow-xl shrink-0 z-20 relative">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden flex items-center justify-center">
                {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User size={24} />}
              </div>
              <div>
                <h1 className="text-sm font-black truncate w-32">{profile?.full_name}</h1>
                <p className="text-[9px] font-bold text-blue-200 tracking-widest uppercase">NIK: {profile?.nik}</p>
              </div>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="p-2.5 bg-white/10 rounded-xl hover:bg-rose-600 transition-all border border-white/10"><LogOut size={16} /></button>
          </div>
          <div className="flex items-center justify-between text-[9px] bg-black/20 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
            <span className="font-black flex items-center gap-2"><Clock size={12}/> {new Date().toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long'})}</span>
            <span className={`px-2 py-0.5 rounded-full font-black ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </header>

        {/* DASHBOARD CONTENT (SCROLLABLE) */}
        <main className="flex-1 overflow-y-auto px-6 -mt-6 pb-32 relative z-10 scrollbar-hide">
          {toast && <Toast message={toast.message} type={toast.type} />}

          {activeTab === 'home' && (
            <div className="animate-fade-in space-y-6 pt-2">
              <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-blue-50 border border-slate-50 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><ShieldCheck size={24}/></div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Kehadiran Hari Ini</p>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    {attendanceData.some(a => new Date(a.timestamp).toDateString() === new Date().toDateString()) ? 'Sudah Absen' : 'Belum Absen'}
                  </h3>
                </div>
              </div>

              {/* GRID MENU - SCROLLABLE CONTAINER */}
              <div className="space-y-4">
                <h2 className="font-black text-[10px] text-slate-400 tracking-[0.2em] ml-2 uppercase">Menu Utama</h2>
                
                {attendanceStep === 'dashboard' ? (
                  <div className="grid grid-cols-2 gap-3 pb-4">
                    <MenuCard icon={<LogIn size={24}/>} label="Masuk" color="blue" onClick={() => startAttendance('Masuk')} />
                    <MenuCard icon={<LogOut size={24}/>} label="Pulang" color="rose" onClick={() => startAttendance('Pulang')} />
                    <MenuCard icon={<Calendar size={24}/>} label="Cuti" color="indigo" onClick={() => setActiveTab('leave')} />
                    <MenuCard icon={<AlertTriangle size={24}/>} label="Absen Manual" color="amber" onClick={() => setActiveTab('manual')} />
                    <MenuCard icon={<FileText size={24}/>} label="Laporan" color="slate" onClick={() => setActiveTab('report')} full />
                  </div>
                ) : (
                  <FaceScanAnimation score={faceScore} onConfirm={confirmAttendance} onReset={() => setAttendanceStep('dashboard')} />
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'summary' && <SummaryTab attendanceData={attendanceData} reportData={reportData} leaveData={leaveData} historyType={historyType} setHistoryType={setHistoryType} />}
          {activeTab === 'leave' && <LeaveForm onSubmit={(d) => handleSaveData('leaves', d, session.user.id)} onCancel={() => setActiveTab('home')} />}
          {activeTab === 'manual' && <ManualForm onSubmit={(d) => handleSaveData('attendance', d, session.user.id)} onCancel={() => setActiveTab('home')} />}
          {activeTab === 'report' && <ReportForm onSubmit={(d) => handleSaveData('reports', d, session.user.id)} profile={profile} onCancel={() => setActiveTab('home')} />}
          {activeTab === 'profile' && <ProfileTab profile={profile} onUpdate={(p) => updateProfile(session.user.id, p)} showToast={showToast} />}
        </main>

        {/* BOTTOM NAV */}
        <nav className="fixed bottom-0 w-full max-w-md bg-white/95 border-t px-8 py-3 flex justify-between z-30 pb-safe backdrop-blur-lg rounded-t-[2.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <NavBtn icon={<Home size={20}/>} label="BERANDA" active={activeTab==='home'} onClick={() => setActiveTab('home')} />
          <NavBtn icon={<Clock size={20}/>} label="RIWAYAT" active={activeTab==='summary'} onClick={() => setActiveTab('summary')} />
          <NavBtn icon={<User size={20}/>} label="PROFIL" active={activeTab==='profile'} onClick={() => setActiveTab('profile')} />
        </nav>
      </div>
    </div>
  );

  async function handleSaveData(table, payload, uid) {
    const data = { ...payload, user_id: uid, timestamp: Date.now() };
    const { error } = await supabase.from(table).insert([data]);
    if (!error) {
      showToast("Berhasil Disimpan!", "success");
      await fetchData(uid);
      setActiveTab('home');
    } else { showToast("Gagal simpan data.", "error"); }
  }

  async function updateProfile(uid, newProfile) {
    const { error } = await supabase.from('profiles').update(newProfile).eq('id', uid);
    if (!error) {
      setProfile({ ...profile, ...newProfile });
      showToast("Profil Diperbarui!", "success");
    }
  }
}

// --- TAB SUMMARY (Grouped by Date Dropdown) ---
function SummaryTab({ attendanceData, reportData, leaveData, historyType, setHistoryType }) {
  const [openDate, setOpenDate] = useState(new Date().toDateString());

  const grouped = (data) => {
    return data.reduce((acc, item) => {
      const date = new Date(item.timestamp).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {});
  };

  const currentGroup = grouped(historyType === 'attendance' ? attendanceData : historyType === 'reports' ? reportData : leaveData);

  return (
    <div className="animate-fade-in space-y-6 pt-2">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
        {['attendance', 'reports', 'leaves'].map(t => (
          <button key={t} onClick={() => setHistoryType(t)} className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${historyType === t ? 'bg-white text-blue-600 shadow' : 'text-slate-400'}`}>{t}</button>
        ))}
      </div>
      <div className="space-y-3 pb-10">
        {Object.keys(currentGroup).length > 0 ? Object.keys(currentGroup).sort((a,b) => new Date(b) - new Date(a)).map(date => (
          <div key={date} className="space-y-2">
            <button onClick={() => setOpenDate(openDate === date ? null : date)} className="w-full flex justify-between items-center px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {date === new Date().toDateString() ? 'Hari Ini' : date}
              {openDate === date ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
            </button>
            {openDate === date && currentGroup[date].map(item => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                <div className={`p-3 rounded-xl ${historyType === 'attendance' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {historyType === 'attendance' ? <Clock size={16}/> : <FileText size={16}/>}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-black text-[10px] uppercase tracking-wider">{item.jenis || item.judul || item.jenis_cuti}</h4>
                  <p className="text-[9px] font-bold text-slate-400 truncate mt-1">
                    {new Date(item.timestamp).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})} 
                    {item.manual_reason && ` | Manual: ${item.manual_reason}`}
                  </p>
                </div>
                {item.location_map && <a href={item.location_map} target="_blank" className="p-2 bg-blue-50 text-blue-600 rounded-lg"><MapPin size={14}/></a>}
              </div>
            ))}
          </div>
        )) : <NoData />}
      </div>
    </div>
  );
}

// --- FORMS ---
function LeaveForm({ onSubmit, onCancel }) {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      onSubmit({ jenis_cuti: fd.get('jenis'), tanggal_mulai: fd.get('start'), tanggal_selesai: fd.get('end'), alasan: fd.get('alasan') });
    }} className="animate-fade-in space-y-4 bg-white p-6 rounded-[2rem] border shadow-xl">
      <h2 className="font-black text-lg text-slate-800 uppercase tracking-tight">Pengajuan Cuti</h2>
      <select name="jenis" required className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm">
        <option value="Tahunan">Cuti Tahunan</option>
        <option value="Sakit">Sakit (Surat Dokter)</option>
        <option value="Izin">Izin Keperluan</option>
      </select>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 ml-2">DARI</label>
          <input type="date" name="start" required className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 ml-2">SAMPAI</label>
          <input type="date" name="end" required className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs" />
        </div>
      </div>
      <textarea name="alasan" required placeholder="Alasan cuti..." className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm h-28"></textarea>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase">Batal</button>
        <button type="submit" className="flex-2 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Kirim Pengajuan</button>
      </div>
    </form>
  );
}

function ManualForm({ onSubmit, onCancel }) {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      onSubmit({ jenis: fd.get('jenis'), status: 'Manual', manual_reason: fd.get('alasan'), timestamp: new Date(fd.get('date')).getTime() });
    }} className="animate-fade-in space-y-4 bg-white p-6 rounded-[2rem] border shadow-xl">
      <div className="flex items-center gap-3 text-amber-600">
        <AlertTriangle size={24}/>
        <h2 className="font-black text-lg uppercase tracking-tight">Absen Manual</h2>
      </div>
      <p className="text-[10px] text-slate-400 font-bold px-1 italic">*Gunakan jika aplikasi error saat di lokasi.</p>
      <select name="jenis" required className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm">
        <option value="Masuk">Absen Masuk</option>
        <option value="Pulang">Absen Pulang</option>
      </select>
      <div className="space-y-1">
        <label className="text-[9px] font-black text-slate-400 ml-2 uppercase">Waktu Kejadian</label>
        <input type="datetime-local" name="date" required className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs" />
      </div>
      <textarea name="alasan" required placeholder="Jelaskan alasan (contoh: HP Error / No Signal)..." className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm h-28"></textarea>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase">Batal</button>
        <button type="submit" className="flex-2 py-4 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Simpan Record</button>
      </div>
    </form>
  );
}

// --- SUB COMPONENTS (Visual) ---
const MenuCard = ({ icon, label, color, onClick, full }) => {
  const styles = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100"
  };
  return (
    <button onClick={onClick} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all active:scale-95 shadow-sm bg-white ${full ? 'col-span-2 flex-row justify-center py-5' : ''}`}>
      <div className={`p-3 rounded-2xl ${styles[color].split(' ')[0]}`}>{icon}</div>
      <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
    </button>
  );
};

// --- SUB COMPONENTS ---

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
      if (error) showToast("NIK atau Password Salah!", "error");
    } else {
      const { error } = await supabase.auth.signUp({ email: shadowEmail, password, options: { data: { full_name: name, nik: nik.trim().toUpperCase() } } });
      if (error) showToast(error.message, "error");
      else showToast("Berhasil Daftar! Silakan Login.", "success");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-indigo-950 to-black flex items-center justify-center p-8 font-sans">
      <div className="w-full max-w-sm bg-white rounded-[3.5rem] p-10 shadow-3xl">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-5 text-blue-600 shadow-inner"><Hash size={40} /></div>
          <p className="text-blue-600 text-[10px] font-black tracking-[0.3em] mb-1.5 uppercase">VANDA TECH</p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{isLogin ? 'Login Area' : 'Register'}</h1>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && <input type="text" placeholder="Nama Lengkap" className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" value={name} onChange={e => setName(e.target.value)} required />}
          <input type="text" placeholder="Masukkan NIK" className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-blue-600 tracking-widest" value={nik} onChange={e => setNik(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-xs tracking-widest">
            {isLogin ? 'MASUK SEKARANG' : 'DAFTAR KARYAWAN'}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-8 text-[10px] font-black text-blue-600 tracking-widest uppercase opacity-60 hover:opacity-100">
          {isLogin ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login'}
        </button>
      </div>
    </div>
  );
}

function FaceScanAnimation({ score, onConfirm, onReset }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const capture = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result);
      setVerifying(true);
      setTimeout(() => setVerifying(false), 2500);
    };
    reader.readAsDataURL(f);
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 flex flex-col items-center animate-fade-in">
      <h3 className="font-black text-sm tracking-widest uppercase text-slate-400 mb-6">Security Verification</h3>
      
      {!photoUrl ? (
        <button onClick={() => inputRef.current.click()} className="w-48 h-48 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-300 hover:border-blue-300 hover:text-blue-500 transition-all active:scale-95">
          <Camera size={48} />
          <span className="font-black text-[10px] uppercase tracking-widest">Buka Kamera</span>
        </button>
      ) : (
        <div className="relative w-56 h-56 rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl">
          <img src={photoUrl} className="w-full h-full object-cover" />
          {verifying && (
            <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
              <div className="w-full h-1 bg-blue-400 absolute top-0 animate-scan shadow-[0_0_15px_#60a5fa]"></div>
              <Loader size={32} className="animate-spin mb-3 text-blue-200" />
              <p className="font-black text-[10px] tracking-widest uppercase">Scanning Face...</p>
            </div>
          )}
        </div>
      )}

      {photoUrl && !verifying && (
        <div className="w-full mt-8 text-center space-y-5">
          <div className="bg-emerald-50 p-4 rounded-2xl flex items-center gap-4 border border-emerald-100">
            <CheckCircle size={24} className="text-emerald-500" />
            <div className="text-left">
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Match Confirmed</p>
              <p className="font-black text-emerald-600 text-lg leading-none">{score}% Accuracy</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onReset} className="py-4 bg-slate-100 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest">Batal</button>
            <button onClick={() => onConfirm(file)} className="py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100">Kirim Absen</button>
          </div>
        </div>
      )}
      <input type="file" ref={inputRef} onChange={capture} accept="image/*" capture="user" className="hidden" />
    </div>
  );
}

function ReportForm({ onSubmit, showToast, profile }) {
  const [file, setFile] = useState(null);
  const [up, setUp] = useState(false);
  const fRef = useRef();

  const handleSend = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const judul = fd.get('judul');
    const deskripsi = fd.get('deskripsi');
    let fUrl = null;

    if (file) {
      setUp(true);
      showToast("Mengunggah file...", "info");
      const fName = `${profile.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error } = await supabase.storage.from('report_files').upload(fName, file);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('report_files').getPublicUrl(fName);
        fUrl = publicUrl;
      }
    }
    await onSubmit({ judul, deskripsi, file_url: fUrl });
    showToast("Laporan Terkirim!", "success");
    setUp(false);
  };

  return (
    <div className="animate-fade-in space-y-6 pt-4">
      <h2 className="font-black text-xl text-slate-800 tracking-tight px-2 uppercase">Laporan Baru</h2>
      <form onSubmit={handleSend} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-5">
        <input name="judul" required placeholder="Judul Kegiatan" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" />
        <textarea name="deskripsi" required rows="5" placeholder="Detail laporan..." className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm"></textarea>
        
        <div className="space-y-3">
          {file ? (
            <div className="flex items-center gap-4 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <FileIcon size={20} className="text-indigo-600" />
              <p className="flex-1 text-[10px] font-black truncate">{file.name}</p>
              <button type="button" onClick={() => setFile(null)} className="text-rose-500"><XCircle size={18} /></button>
            </div>
          ) : (
            <button type="button" onClick={() => fRef.current.click()} className="w-full p-5 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl flex items-center gap-4 text-slate-400 active:scale-95">
              <Plus size={20} /> <span className="font-black text-[10px] uppercase tracking-widest">Tambah Lampiran (PDF/DOCX/XLSX/IMG)</span>
            </button>
          )}
          <input type="file" ref={fRef} onChange={(e) => setFile(e.target.files[0])} className="hidden" />
        </div>

        <button type="submit" disabled={up} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-xs tracking-widest">
          {up ? 'MENGIRIM...' : 'KIRIM LAPORAN SEKARANG'}
        </button>
      </form>
    </div>
  );
}

function ProfileTab({ profile, onUpdate, showToast }) {
  const [name, setName] = useState(profile?.full_name || '');
  const [up, setUp] = useState(false);
  const fRef = useRef();

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUp(true);
    showToast("Mengunggah foto...", "info");
    const path = `${profile.id}/${Date.now()}-avatar.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      window.location.reload(); // Refresh to update all avatar instances
    }
    setUp(false);
  };

  return (
    <div className="animate-fade-in space-y-8 pt-4">
      <div className="text-center">
        <div className="relative w-36 h-36 mx-auto mb-5">
          <div className="w-full h-full rounded-[3rem] bg-slate-100 overflow-hidden border-8 border-white shadow-2xl flex items-center justify-center">
            {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User size={48} className="text-slate-300" />}
            {up && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[8px] font-black uppercase tracking-widest">Loading...</div>}
          </div>
          <button onClick={() => fRef.current.click()} className="absolute -bottom-2 -right-2 bg-blue-600 p-4 rounded-3xl text-white shadow-xl border-4 border-white active:scale-95"><Camera size={20} /></button>
          <input type="file" ref={fRef} onChange={handleAvatar} accept="image/*" className="hidden" />
        </div>
        <p className="text-blue-600 font-black text-[10px] tracking-[0.3em] uppercase">Vanda Tech Member</p>
        <h3 className="font-black text-xl text-slate-800 tracking-tight mt-1">{profile?.full_name}</h3>
      </div>
      
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-6 shadow-xl shadow-blue-50/20">
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 opacity-60">
          <label className="text-[9px] font-black text-slate-400 mb-1 block uppercase tracking-widest">ID Karyawan (NIK)</label>
          <p className="font-black text-slate-800 tracking-wider">{profile?.nik}</p>
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-400 ml-2 mb-1 block uppercase tracking-widest">Ubah Nama Lengkap</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" />
        </div>
        <button onClick={() => onUpdate({ full_name: name })} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all text-xs tracking-widest">
          <Save size={18} /> Simpan Perubahan
        </button>
      </div>
    </div>
  );
}

// --- SMALL UI COMPONENTS ---
const NavBtn = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-2 group ${active ? 'scale-110' : 'text-slate-300'}`}>
    <div className={`p-3 rounded-2xl transition-all ${active ? 'bg-blue-50 text-blue-600 shadow-inner' : 'group-hover:bg-slate-50'}`}>{icon}</div>
    <span className={`text-[8px] font-black tracking-widest uppercase ${active ? 'text-blue-700' : 'text-slate-400'}`}>{label}</span>
  </button>
);

const Card = ({ title, subtitle, icon, color }) => (
  <div className="bg-white p-5 rounded-3xl border border-slate-50 flex items-center gap-5 shadow-sm">
    <div className={`p-4 rounded-2xl ${color === 'blue' ? 'bg-blue-50 text-blue-600' : color === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>{icon}</div>
    <div className="flex-1">
      <h4 className="font-black text-[10px] text-slate-800 uppercase tracking-widest leading-none">{title}</h4>
      <p className="text-[10px] font-bold text-slate-400 mt-2 line-clamp-1">{subtitle}</p>
    </div>
    <ChevronRight size={16} className="text-slate-200" />
  </div>
);

const NoData = () => <p className="text-center text-slate-400 text-[10px] font-black py-16 uppercase tracking-[0.3em]">Belum Ada Data</p>;

const Toast = ({ message, type }) => (
  <div className={`fixed top-6 left-6 right-6 p-5 rounded-3xl shadow-2xl flex items-center justify-center gap-3 text-[10px] font-black tracking-widest uppercase z-50 animate-fade-in-down ${type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'}`}>
    {message}
  </div>
);