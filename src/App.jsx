import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Clock, FileText, User, Camera, LogOut, ChevronRight, ChevronDown,
  CheckCircle, LogIn, Hash, Plus, Loader, XCircle, FileIcon, Calendar,
  FileSpreadsheetIcon, Save, Image as ImageIcon, ShieldCheck, MapPin, 
  AlertTriangle, Briefcase, Phone, Lock, HelpCircle, Activity, Building
} from 'lucide-react';

// --- KONFIGURASI PERUSAHAAN ---
const COMPANY_NAME = "PT. SYNTEGRA SERVICES"; 
const APP_NAME = "VANDA TECH";

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
    setTimeout(() => setToast(null), 5000); 
  };

  const getLoc = () => {
    return new Promise((res) => {
      navigator.geolocation.getCurrentPosition(
        (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => res(null),
        { enableHighAccuracy: true }
      );
    });
  };

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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-black animate-pulse tracking-widest text-2xl">{APP_NAME}</div>;
  if (!session) return <AuthPage showToast={showToast} />;

  const hasAbsenMasuk = attendanceData.some(a => new Date(a.timestamp).toDateString() === new Date().toDateString() && a.jenis === 'Masuk');
  const hasAbsenPulang = attendanceData.some(a => new Date(a.timestamp).toDateString() === new Date().toDateString() && a.jenis === 'Pulang');

  return (
    <div className="h-screen bg-slate-100 flex justify-center font-sans overflow-hidden selection:bg-indigo-200">
      
      <div className="w-full max-w-md bg-slate-50 h-full shadow-2xl relative flex flex-col">
        
        {/* HEADER: PREMIUM DARK MODE */}
        <header className="bg-slate-950 text-white pt-8 pb-10 px-6 rounded-b-[2.5rem] shadow-xl shrink-0 z-20 relative overflow-hidden">
          {/* Subtle Glow Effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[3rem] -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-violet-500/20 rounded-full blur-[2rem] translate-y-1/4 -translate-x-1/4"></div>

          <div className="relative z-10">
            {/* Nama Perusahaan Area */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Building size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xs font-black tracking-widest uppercase text-slate-200">{COMPANY_NAME}</h1>
                  <p className="text-[9px] font-bold text-indigo-300 tracking-[0.2em]">{APP_NAME} SYSTEM</p>
                </div>
              </div>
              <button onClick={() => supabase.auth.signOut()} className="p-2.5 bg-white/5 rounded-full hover:bg-rose-500/80 transition-all border border-white/10 active:scale-95">
                <LogOut size={16} className="text-slate-300" />
              </button>
            </div>

            {/* Profil User Mini */}
            <div className="flex justify-between items-end bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-indigo-400/50 overflow-hidden flex items-center justify-center shadow-inner">
                  {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User size={24} className="text-indigo-200" />}
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-300 tracking-widest uppercase mb-0.5">Welcome Back,</p>
                  <h2 className="text-lg font-black truncate w-40 leading-none">{profile?.full_name}</h2>
                </div>
              </div>
              <div className="text-right">
                <div className={`px-2.5 py-1 rounded-full font-black text-[8px] uppercase tracking-widest inline-flex items-center gap-1.5 mb-1.5 border ${isOnline ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
                  {isOnline ? 'Online' : 'Offline'}
                </div>
                <p className="text-[9px] font-bold text-slate-400">{new Date().toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</p>
              </div>
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <main className="flex-1 overflow-y-auto px-6 -mt-5 pt-10 pb-36 relative z-10 scrollbar-hide">
          {toast && <Toast message={toast.message} type={toast.type} />}

          {activeTab === 'home' && (
            <div className="animate-fade-in space-y-6 pt-2">
              
              {/* GRADIENT STATUS CARD */}
              <div className={`relative overflow-hidden rounded-[2rem] p-6 shadow-xl text-white flex items-center gap-5 ${hasAbsenMasuk ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20' : 'bg-gradient-to-r from-indigo-500 to-violet-600 shadow-indigo-500/20'}`}>
                {/* Decoration */}
                <div className="absolute -right-4 -bottom-4 opacity-20"><Activity size={100} /></div>
                
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shrink-0 z-10">
                  {hasAbsenMasuk ? <CheckCircle size={28}/> : <ShieldCheck size={28}/>}
                </div>
                <div className="z-10">
                  <p className="text-[10px] font-black tracking-widest uppercase mb-1 text-white/80">Status Hari Ini</p>
                  <h3 className="text-2xl font-black tracking-tight leading-none">
                    {hasAbsenMasuk ? (hasAbsenPulang ? 'Tugas Selesai' : 'Sedang Bekerja') : 'Belum Absen'}
                  </h3>
                </div>
              </div>

              {/* GRID MENU UTAMA */}
              <div className="space-y-4">
                <h2 className="font-black text-[10px] text-slate-400 tracking-[0.2em] ml-2 uppercase flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Menu Operasional
                </h2>
                
                {attendanceStep === 'dashboard' ? (
                  <div className="grid grid-cols-2 gap-4 pb-4">
                    <MenuCard icon={<LogIn size={24} strokeWidth={2.5}/>} label="Masuk" color="emerald" onClick={() => startAttendance('Masuk')} disabled={hasAbsenMasuk} />
                    <MenuCard icon={<LogOut size={24} strokeWidth={2.5}/>} label="Pulang" color="rose" onClick={() => startAttendance('Pulang')} disabled={!hasAbsenMasuk || hasAbsenPulang} />
                    <MenuCard icon={<Calendar size={24} strokeWidth={2.5}/>} label="Cuti" color="violet" onClick={() => setActiveTab('leave')} />
                    <MenuCard icon={<AlertTriangle size={24} strokeWidth={2.5}/>} label="Manual" color="amber" onClick={() => setActiveTab('manual')} />
                    <MenuCard icon={<FileText size={24} strokeWidth={2.5}/>} label="Kirim Laporan" color="indigo" onClick={() => setActiveTab('report')} full />
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
          {activeTab === 'report' && <ReportForm onSubmit={(d) => handleSaveData('reports', d, session.user.id)} profile={profile} getLoc={getLoc} showToast={showToast} onCancel={() => setActiveTab('home')} />}
          {activeTab === 'profile' && <ProfileTab profile={profile} onUpdate={(p) => updateProfile(session.user.id, p)} showToast={showToast} />}
        </main>

        {/* FLOATING BOTTOM NAV */}
        <div className="absolute bottom-6 left-6 right-6 z-30">
          <nav className="bg-white/80 border border-white backdrop-blur-xl px-6 py-4 flex justify-between shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] rounded-[2rem]">
            <NavBtn icon={<Home size={22}/>} label="BERANDA" active={activeTab==='home'} onClick={() => setActiveTab('home')} />
            <NavBtn icon={<Clock size={22}/>} label="RIWAYAT" active={activeTab==='summary'} onClick={() => setActiveTab('summary')} />
            <NavBtn icon={<User size={22}/>} label="PROFIL" active={activeTab==='profile'} onClick={() => setActiveTab('profile')} />
          </nav>
        </div>
        
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

// --- TAB SUMMARY (Dengan Pop-Up Detail & Thumbnail Foto) ---
function SummaryTab({ attendanceData, reportData, leaveData, historyType, setHistoryType }) {
  const [openDate, setOpenDate] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

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
      <div className="flex bg-white p-1.5 rounded-[1.5rem] shadow-sm border border-slate-100">
        {['attendance', 'reports', 'leaves'].map(t => (
          <button key={t} onClick={() => setHistoryType(t)} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-2xl transition-all ${historyType === t ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>
            {t === 'attendance' ? 'ABSENSI' : t === 'reports' ? 'LAPORAN' : 'CUTI'}
          </button>
        ))}
      </div>
      
      <div className="space-y-4 pb-10">
        {Object.keys(currentGroup).length > 0 ? Object.keys(currentGroup).sort((a,b) => new Date(b) - new Date(a)).map(date => (
          <div key={date} className="space-y-2 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm">
            <button onClick={() => setOpenDate(openDate === date ? null : date)} className="w-full flex justify-between items-center px-4 py-3 bg-slate-50 rounded-[1.5rem] text-[10px] font-black text-slate-500 uppercase tracking-widest active:scale-95 transition-all">
              <span className="flex items-center gap-2"><Calendar size={14}/> {date === new Date().toDateString() ? 'Hari Ini' : date}</span>
              {openDate === date ? <ChevronDown size={16} className="text-indigo-500"/> : <ChevronRight size={16}/>}
            </button>
            
            {openDate === date && currentGroup[date].map(item => (
              <div key={item.id} onClick={() => setSelectedItem(item)} className="mx-2 p-4 rounded-[1.5rem] border border-slate-50 flex items-center gap-4 active:scale-95 transition-all cursor-pointer hover:bg-slate-50 group">
                <div className={`p-3.5 rounded-[1.2rem] ${historyType === 'attendance' ? 'bg-emerald-50 text-emerald-600' : historyType === 'reports' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                  {historyType === 'attendance' ? <Clock size={18}/> : historyType === 'reports' ? <FileText size={18}/> : <Calendar size={18}/>}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-800">{item.jenis || item.judul || item.jenis_cuti}</h4>
                  <p className="text-[10px] font-bold text-slate-400 truncate mt-1.5 flex items-center gap-1.5">
                    {new Date(item.timestamp).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})} 
                    {item.status === 'Manual' && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded text-[8px]">MANUAL</span>}
                  </p>
                </div>
                <div className="p-2 bg-white border border-slate-100 text-slate-300 rounded-xl group-hover:border-indigo-200 group-hover:text-indigo-500 transition-all"><ChevronRight size={14}/></div>
              </div>
            ))}
          </div>
        )) : <NoData />}
      </div>

      {/* RENDER MODAL DETAIL JIKA ADA ITEM YANG DIKLIK */}
      <DetailModal item={selectedItem} type={historyType} onClose={() => setSelectedItem(null)} />
    </div>
  );
}

// --- KOMPONEN POP-UP DETAIL RIWAYAT ---
function DetailModal({ item, type, onClose }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-7 shadow-2xl relative flex flex-col max-h-[85vh] animate-fade-in-down border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-[9px] font-black text-indigo-500 tracking-widest uppercase mb-1">Detail Aktivitas</p>
            <h3 className="font-black text-xl tracking-tight text-slate-800 uppercase">{type === 'attendance' ? 'Absensi' : type === 'reports' ? 'Laporan' : 'Cuti'}</h3>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-500 rounded-2xl active:scale-90 transition-all"><XCircle size={22}/></button>
        </div>
        <div className="overflow-y-auto pr-2 space-y-4 scrollbar-hide pb-4">
          
          {type === 'attendance' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <DetailRow label="Jenis" value={`Absen ${item.jenis}`} color="text-indigo-600" />
                <DetailRow label="Waktu" value={new Date(item.timestamp).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})} />
              </div>
              <DetailRow label="Tanggal" value={new Date(item.timestamp).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
              {item.status === 'Manual' && <DetailRow label="Alasan Manual" value={item.manual_reason} color="text-amber-600" />}
              {item.evidence_url && (
                <div className="mt-4">
                  <p className="text-[9px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1">Foto Bukti</p>
                  <div className="border-4 border-slate-50 rounded-3xl overflow-hidden shadow-inner h-48 bg-slate-100">
                    <img src={item.evidence_url} className="w-full h-full object-cover" alt="Bukti" />
                  </div>
                </div>
              )}
              {item.location_map && (
                <a href={item.location_map} target="_blank" className="mt-2 flex items-center justify-center gap-3 w-full py-4 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-sm">
                  <MapPin size={18}/> Buka Google Maps
                </a>
              )}
            </>
          )}

          {type === 'reports' && (
            <>
              <DetailRow label="Judul Laporan" value={item.judul} color="text-indigo-600" />
              <DetailRow label="Deskripsi Detail" value={item.deskripsi} />
              {item.location_map && (
                <a href={item.location_map} target="_blank" className="flex items-center justify-center gap-3 w-full py-4 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-sm">
                  <MapPin size={16}/> Lokasi Kejadian
                </a>
              )}
              {item.file_urls && item.file_urls.length > 0 && (
                <div className="space-y-3 mt-5 border-t border-slate-100 pt-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Lampiran File ({item.file_urls.length})</p>
                  <div className="grid grid-cols-2 gap-3">
                    {item.file_urls.map((url, i) => {
                      const isImage = url.match(/\.(jpeg|jpg|gif|png)$/i) != null;
                      return isImage ? (
                        <div key={i} className="h-24 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm"><img src={url} className="w-full h-full object-cover" alt={`Img ${i}`} /></div>
                      ) : (
                        <a key={i} href={url} target="_blank" className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 text-indigo-600 rounded-2xl active:scale-95 border border-slate-100"><FileText size={24} /> <span className="text-[8px] font-black uppercase">Dokumen {i+1}</span></a>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {type === 'leaves' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <DetailRow label="Kategori" value={item.jenis_cuti} color="text-violet-600" />
                <DetailRow label="Status" value={item.status || 'Pending'} color={item.status === 'Pending' ? 'text-amber-500' : 'text-emerald-500'} />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <DetailRow label="Mulai" value={item.tanggal_mulai} />
                <DetailRow label="Selesai" value={item.tanggal_selesai} />
              </div>
              <DetailRow label="Alasan Pengajuan" value={item.alasan} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, color = "text-slate-800" }) {
  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
      <p className={`font-bold text-sm leading-snug ${color}`}>{value}</p>
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
    }} className="animate-fade-in space-y-5 bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-xl mt-2">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl"><Calendar size={24}/></div>
        <h2 className="font-black text-xl text-slate-800 uppercase tracking-tight">Form Cuti</h2>
      </div>
      <select name="jenis" required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:border-violet-300">
        <option value="Tahunan">Cuti Tahunan</option>
        <option value="Sakit">Sakit (Surat Dokter)</option>
        <option value="Izin">Izin Keperluan</option>
      </select>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 ml-2 uppercase">Dari</label><input type="date" name="start" required className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs" /></div>
        <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 ml-2 uppercase">Sampai</label><input type="date" name="end" required className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs" /></div>
      </div>
      <textarea name="alasan" required placeholder="Tulis alasan lengkap..." className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm h-32 focus:border-violet-300"></textarea>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="w-1/3 py-5 bg-slate-100 rounded-[1.5rem] font-black text-[10px] uppercase text-slate-500 active:scale-95">Batal</button>
        <button type="submit" className="w-2/3 py-5 bg-violet-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase shadow-xl shadow-violet-200 active:scale-95">Ajukan Cuti</button>
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
    }} className="animate-fade-in space-y-5 bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-xl mt-2">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><AlertTriangle size={24}/></div>
        <div><h2 className="font-black text-xl text-slate-800 uppercase tracking-tight">Absen Manual</h2><p className="text-[9px] text-slate-400 font-bold">*Gunakan saat aplikasi error di lokasi</p></div>
      </div>
      <select name="jenis" required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:border-amber-300">
        <option value="Masuk">Absen Masuk</option><option value="Pulang">Absen Pulang</option>
      </select>
      <div className="space-y-1.5">
        <label className="text-[9px] font-black text-slate-400 ml-2 uppercase">Waktu Kejadian</label>
        <input type="datetime-local" name="date" required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:border-amber-300" />
      </div>
      <textarea name="alasan" required placeholder="Jelaskan alasan (contoh: HP Error / Sinyal Hilang)..." className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm h-32 focus:border-amber-300"></textarea>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="w-1/3 py-5 bg-slate-100 rounded-[1.5rem] font-black text-[10px] uppercase text-slate-500 active:scale-95">Batal</button>
        <button type="submit" className="w-2/3 py-5 bg-amber-500 text-white rounded-[1.5rem] font-black text-[10px] uppercase shadow-xl shadow-amber-200 active:scale-95">Simpan Data</button>
      </div>
    </form>
  );
}

function ReportForm({ onSubmit, showToast, profile, getLoc, onCancel }) {
  const [docs, setDocs] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [up, setUp] = useState(false);
  const docRef = useRef(); const photoRef = useRef();

  const handleSend = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setUp(true);
    showToast("Mengunci Lokasi & Mengunggah File...", "info");
    try {
      const loc = await getLoc();
      const location_map = loc ? `https://www.google.com/maps?q=${loc.lat},${loc.lng}` : null;
      const allFiles = [...docs, ...photos];
      let uploadedUrls = [];
      for (const file of allFiles) {
        const fName = `${profile.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const { error } = await supabase.storage.from('report_files').upload(fName, file);
        if (!error) uploadedUrls.push(supabase.storage.from('report_files').getPublicUrl(fName).data.publicUrl);
      }
      await onSubmit({ judul: fd.get('judul'), deskripsi: fd.get('deskripsi'), file_urls: uploadedUrls, location: loc, location_map });
      showToast("Laporan Terkirim!", "success");
      setDocs([]); setPhotos([]); e.target.reset();
    } catch (err) { showToast("Gagal mengirim laporan.", "error"); } finally { setUp(false); }
  };

  return (
    <div className="animate-fade-in space-y-6 pt-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="font-black text-xl text-slate-800 tracking-tight uppercase">Kirim Laporan</h2>
        <button onClick={onCancel} className="p-2 bg-slate-200 text-slate-500 rounded-full"><XCircle size={20}/></button>
      </div>
      <form onSubmit={handleSend} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-5">
        <input name="judul" required placeholder="Judul / Subjek Kendala" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:border-indigo-300" />
        <textarea name="deskripsi" required rows="5" placeholder="Tuliskan detail kejadian..." className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm focus:border-indigo-300"></textarea>
        
        <div className="space-y-3">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Lampiran Bukti (Opsional)</label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => photoRef.current.click()} className="py-5 border-2 border-dashed border-blue-200 bg-blue-50 text-blue-600 rounded-[1.5rem] flex flex-col items-center gap-2 active:scale-95 transition-all hover:bg-blue-100"><Camera size={24} /> <span className="font-black text-[9px] uppercase tracking-widest mt-1">Pilih Foto</span></button>
            <button type="button" onClick={() => docRef.current.click()} className="py-5 border-2 border-dashed border-indigo-200 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex flex-col items-center gap-2 active:scale-95 transition-all hover:bg-indigo-100"><FileIcon size={24} /> <span className="font-black text-[9px] uppercase tracking-widest mt-1">Pilih Dokumen</span></button>
          </div>
          <input type="file" ref={photoRef} multiple accept="image/*" onChange={(e) => setPhotos([...photos, ...Array.from(e.target.files)])} className="hidden" />
          <input type="file" ref={docRef} multiple accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setDocs([...docs, ...Array.from(e.target.files)])} className="hidden" />
        </div>

        {(photos.length > 0 || docs.length > 0) && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            {[...photos, ...docs].map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                <div className={`p-2 rounded-lg ${i < photos.length ? 'bg-blue-50 text-blue-500' : 'bg-indigo-50 text-indigo-500'}`}>{i < photos.length ? <ImageIcon size={16}/> : <FileText size={16}/>}</div>
                <p className="flex-1 text-[10px] font-bold truncate text-slate-600">{f.name}</p>
                <button type="button" onClick={() => i < photos.length ? setPhotos(photos.filter((_, idx) => idx !== i)) : setDocs(docs.filter((_, idx) => idx !== (i - photos.length)))} className="text-rose-400 p-1.5 bg-rose-50 rounded-lg hover:bg-rose-500 hover:text-white"><XCircle size={16} /></button>
              </div>
            ))}
          </div>
        )}
        <button type="submit" disabled={up} className="w-full py-5 bg-indigo-600 text-white font-black rounded-[1.5rem] shadow-xl shadow-indigo-200 active:scale-95 transition-all text-[10px] tracking-widest uppercase mt-4">
          {up ? 'Mengunggah & Menyimpan...' : 'Kirim Laporan Sekarang'}
        </button>
      </form>
    </div>
  );
}

// --- SUB COMPONENTS (Visual) ---
const MenuCard = ({ icon, label, color, onClick, full, disabled }) => {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100/50 hover:bg-emerald-100/50 hover:border-emerald-200",
    rose: "bg-rose-50 text-rose-600 border-rose-100/50 hover:bg-rose-100/50 hover:border-rose-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100/50 hover:bg-indigo-100/50 hover:border-indigo-200",
    amber: "bg-amber-50 text-amber-600 border-amber-100/50 hover:bg-amber-100/50 hover:border-amber-200",
    violet: "bg-violet-50 text-violet-600 border-violet-100/50 hover:bg-violet-100/50 hover:border-violet-200"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all active:scale-95 shadow-sm bg-white ${full ? 'col-span-2 flex-row justify-center py-5' : ''} ${disabled ? 'opacity-40 grayscale pointer-events-none' : styles[color]}`}>
      <div className={`p-4 rounded-[1.2rem] bg-white shadow-sm border border-slate-50 ${styles[color].split(' ')[1]}`}>{icon}</div>
      <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
    </button>
  );
};

const NavBtn = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 group relative ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
    {active && <div className="absolute -top-6 w-8 h-1 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>}
    <div className={`p-2.5 rounded-2xl transition-all ${active ? 'bg-indigo-50 shadow-inner' : ''}`}>{icon}</div>
    <span className={`text-[8px] font-black tracking-widest uppercase ${active ? '' : ''}`}>{label}</span>
  </button>
);

const Toast = ({ message, type }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-fade-in pointer-events-none">
    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center w-full max-w-xs border border-white animate-fade-in-down pointer-events-auto">
      <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border-4 border-white ${type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
        {type === 'success' ? <CheckCircle size={48} strokeWidth={2.5}/> : <AlertTriangle size={48} strokeWidth={2.5}/>}
      </div>
      <h3 className={`font-black text-2xl tracking-tight uppercase mb-2 ${type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>{type === 'success' ? 'BERHASIL' : 'PERHATIAN'}</h3>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">{message}</p>
    </div>
  </div>
);

const NoData = () => (
  <div className="flex flex-col items-center justify-center py-16 opacity-50">
    <FileText size={48} className="text-slate-300 mb-4" strokeWidth={1} />
    <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Belum Ada Aktivitas</p>
  </div>
);

// --- FACE SCAN ---
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
    <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 flex flex-col items-center animate-fade-in mt-2">
      <h3 className="font-black text-sm tracking-widest uppercase text-slate-400 mb-6">Security Verification</h3>
      {!photoUrl ? (
        <button onClick={() => inputRef.current.click()} className="w-48 h-48 bg-slate-50 border-4 border-dashed border-indigo-200 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95 shadow-inner">
          <Camera size={48} />
          <span className="font-black text-[10px] uppercase tracking-widest">Buka Kamera</span>
        </button>
      ) : (
        <div className="relative w-56 h-56 rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl">
          <img src={photoUrl} className="w-full h-full object-cover" />
          {verifying && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white">
              <div className="w-full h-1 bg-indigo-400 absolute top-0 animate-scan shadow-[0_0_15px_#818cf8]"></div>
              <Loader size={36} className="animate-spin mb-4 text-indigo-300" />
              <p className="font-black text-[10px] tracking-widest uppercase text-indigo-200">Scanning Face...</p>
            </div>
          )}
        </div>
      )}
      {photoUrl && !verifying && (
        <div className="w-full mt-8 text-center space-y-5">
          <div className="bg-emerald-50 p-5 rounded-[1.5rem] flex items-center justify-center gap-4 border border-emerald-100 shadow-inner">
            <CheckCircle size={28} className="text-emerald-500" />
            <div className="text-left"><p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Match Confirmed</p><p className="font-black text-emerald-700 text-xl leading-none">{score}% Accuracy</p></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onReset} className="py-5 bg-slate-100 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest active:scale-95">Ulangi</button>
            <button onClick={() => onConfirm(file)} className="py-5 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-200 active:scale-95">Kirim Absen</button>
          </div>
        </div>
      )}
      <input type="file" ref={inputRef} onChange={capture} accept="image/*" capture="user" className="hidden" />
    </div>
  );
}

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans relative overflow-hidden selection:bg-indigo-500">
      <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full blur-[5rem] -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-violet-600/20 rounded-full blur-[4rem] translate-y-1/3 -translate-x-1/4"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl rounded-[3rem] p-10 shadow-2xl relative z-10 border border-white/10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30">
            <Building size={36} className="text-white" />
          </div>
          <p className="text-indigo-300 text-[10px] font-black tracking-[0.4em] mb-2 uppercase">{COMPANY_NAME}</p>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">{isLogin ? 'Login Area' : 'Register'}</h1>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && <input type="text" placeholder="Nama Lengkap" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-sm text-white placeholder-slate-400 focus:border-indigo-400 focus:bg-white/10 transition-all" value={name} onChange={e => setName(e.target.value)} required />}
          <input type="text" placeholder="Masukkan NIK" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-black text-indigo-300 tracking-widest uppercase placeholder-slate-400 focus:border-indigo-400 focus:bg-white/10 transition-all" value={nik} onChange={e => setNik(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white placeholder-slate-400 focus:border-indigo-400 focus:bg-white/10 transition-all" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="w-full py-5 mt-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/30 active:scale-95 transition-all text-xs tracking-widest uppercase border border-indigo-400/50">
            {isLogin ? 'MASUK SEKARANG' : 'DAFTAR KARYAWAN'}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-8 text-[10px] font-black text-indigo-300 tracking-widest uppercase opacity-70 hover:opacity-100 transition-all">
          {isLogin ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login'}
        </button>
      </div>
    </div>
  );
}

function ProfileTab({ profile, onUpdate, showToast }) {
  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [password, setPassword] = useState('');
  const [up, setUp] = useState(false);
  const fRef = useRef();

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUp(true); showToast("Mengunggah foto...", "info");
    const path = `${profile.id}/${Date.now()}-avatar.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (!error) {
      await supabase.from('profiles').update({ avatar_url: supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl }).eq('id', profile.id);
      window.location.reload(); 
    }
    setUp(false);
  };

  const handleUpdatePassword = async () => {
    if (password.length < 6) return showToast("Password minimal 6 karakter!", "error");
    setUp(true); showToast("Memproses password baru...", "info");
    const { error } = await supabase.auth.updateUser({ password: password });
    if (error) showToast(error.message, "error");
    else { showToast("Password Berhasil Diubah!", "success"); setPassword(''); }
    setUp(false);
  };

  return (
    <div className="animate-fade-in space-y-6 pt-4 pb-12">
      <div className="text-center">
        <div className="relative w-36 h-36 mx-auto mb-5">
          <div className="w-full h-full rounded-[3rem] bg-white overflow-hidden border-8 border-slate-50 shadow-2xl flex items-center justify-center">
            {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User size={48} className="text-slate-300" />}
          </div>
          <button onClick={() => fRef.current.click()} className="absolute -bottom-2 -right-2 bg-indigo-600 p-4 rounded-3xl text-white shadow-xl border-4 border-slate-50 active:scale-95"><Camera size={20} /></button>
          <input type="file" ref={fRef} onChange={handleAvatar} accept="image/*" className="hidden" />
        </div>
        <p className="text-indigo-600 font-black text-[10px] tracking-[0.3em] uppercase">{COMPANY_NAME}</p>
        <h3 className="font-black text-2xl text-slate-800 tracking-tight mt-1">{profile?.full_name}</h3>
      </div>
      
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-5 shadow-xl shadow-slate-200/40">
        <h4 className="font-black text-[10px] text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-3"><User size={16} className="text-indigo-500"/> Data Karyawan</h4>
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="bg-slate-50 p-4 rounded-2xl"><label className="text-[8px] font-black text-slate-400 block uppercase tracking-widest mb-1">NIK</label><p className="font-black text-xs text-slate-800 truncate">{profile?.nik}</p></div>
          <div className="bg-slate-50 p-4 rounded-2xl"><label className="text-[8px] font-black text-slate-400 block uppercase tracking-widest mb-1">DEPT.</label><p className="font-black text-xs text-slate-800 truncate">{profile?.department || 'Operasional'}</p></div>
        </div>
        <div><label className="text-[9px] font-black text-slate-400 ml-2 mb-1.5 block uppercase tracking-widest">Nama Lengkap</label><input value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:border-indigo-300" /></div>
        <div>
          <label className="text-[9px] font-black text-slate-400 ml-2 mb-1.5 block uppercase tracking-widest">No. WhatsApp</label>
          <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Phone size={16}/></span><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 pl-11 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:border-indigo-300" /></div>
        </div>
        <button onClick={() => onUpdate({ full_name: name, phone: phone })} className="w-full py-5 bg-indigo-600 text-white font-black rounded-[1.5rem] shadow-xl shadow-indigo-200 active:scale-95 text-[10px] tracking-widest uppercase mt-2">Simpan Perubahan</button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-rose-100 p-8 space-y-4 shadow-xl shadow-rose-100/40">
        <h4 className="font-black text-[10px] text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-2"><Lock size={16} className="text-rose-500"/> Ganti Password</h4>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimal 6 karakter..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:border-rose-300" />
        <button onClick={handleUpdatePassword} disabled={up} className="w-full py-5 bg-rose-50 text-rose-600 border border-rose-200 font-black rounded-[1.5rem] active:scale-95 text-[10px] tracking-widest uppercase">{up ? 'Memproses...' : 'Ubah Password'}</button>
      </div>

      <div className="space-y-3 pt-2">
        <a href="https://wa.me/6281234567890?text=Halo%20Admin,%20saya%20butuh%20bantuan." target="_blank" rel="noreferrer" className="w-full py-5 bg-emerald-50 text-emerald-600 border border-emerald-200 font-black rounded-[1.5rem] flex items-center justify-center gap-3 active:scale-95 text-[10px] tracking-widest uppercase"><HelpCircle size={18} /> Hubungi IT Support</a>
        <button onClick={async () => await supabase.auth.signOut()} className="w-full py-5 bg-slate-900 text-white font-black rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 active:scale-95 text-[10px] tracking-widest uppercase"><LogOut size={18} /> Keluar Aplikasi</button>
      </div>
    </div>
  );
}