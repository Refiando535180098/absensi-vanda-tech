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

// ... (Gunakan FaceScanAnimation, ReportForm, ProfileTab, NavBtn, Toast, NoData dari kode sebelumnya)
// Pastikan FaceScanAnimation menggunakan input kamera dan animasi scanning seperti sebelumnya.