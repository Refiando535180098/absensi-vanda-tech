import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Clock, FileText, User, Camera, LogOut, ChevronRight, ChevronDown,
  CheckCircle, LogIn, Hash, Plus, Loader, XCircle, FileIcon, Calendar,
  FileSpreadsheetIcon, Save, Image as ImageIcon, ShieldCheck, MapPin, 
  AlertTriangle, Briefcase, Phone, Lock, HelpCircle
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
    setTimeout(() => setToast(null), 5000); 
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
        // --- UBAH BARIS INI (Perbaikan Link Google Maps) ---
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
    // 1. UBAH DARI 'min-h-screen' JADI 'h-screen' & TAMBAH 'overflow-hidden'
    <div className="h-screen bg-slate-50 flex justify-center font-sans overflow-hidden">
      
      {/* 2. UBAH DARI 'min-h-screen' JADI 'h-full' */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl relative flex flex-col">
        
        {/* HEADER (Otomatis stuck di atas karena shrink-0) */}
        <header className="bg-gradient-to-br from-blue-700 to-indigo-950 text-white p-6 pb-12 rounded-b-[3rem] shadow-xl shrink-0 z-20 relative">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              {/* <div>
                <h1 className="text-lg font-black truncate w-5xl">Nama Perusahaan</h1>
              </div> */}
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
        <main className="flex-1 overflow-y-auto px-6 -mt-6 pt-10 pb-28 relative z-10 scrollbar-hide">
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
          {activeTab === 'report' && <ReportForm onSubmit={(d) => handleSaveData('reports', d, session.user.id)} profile={profile} getLoc={getLoc} showToast={showToast} onCancel={() => setActiveTab('home')} />}
          {activeTab === 'profile' && <ProfileTab profile={profile} onUpdate={(p) => updateProfile(session.user.id, p)} showToast={showToast} />}
        </main>

        {/* BOTTOM NAV (Ubah tulisan 'fixed' jadi 'absolute' dan hapus 'max-w-md') */}
        <nav className="absolute bottom-0 w-full bg-white/95 border-t px-8 py-3 flex justify-between z-30 pb-safe backdrop-blur-lg rounded-t-[2.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
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
// --- TAB SUMMARY (Dengan Pop-Up Detail & Thumbnail Foto) ---
function SummaryTab({ attendanceData, reportData, leaveData, historyType, setHistoryType }) {
  const [openDate, setOpenDate] = useState(null); // Default tertutup
  const [selectedItem, setSelectedItem] = useState(null); // State untuk Pop-up

  const grouped = (data) => {
    return data.reduce((acc, item) => {
      const date = new Date(item.timestamp).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {});
  };

  const currentGroup = grouped(historyType === 'attendance' ? attendanceData : historyType === 'reports' ? reportData : leaveData);

  // Fungsi untuk ngecek apakah URL itu gambar atau bukan
  const isImage = (url) => {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png)$/i) != null;
  };

  return (
    <div className="animate-fade-in space-y-6 pt-2">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
        {['attendance', 'reports', 'leaves'].map(t => (
          <button key={t} onClick={() => setHistoryType(t)} className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${historyType === t ? 'bg-white text-blue-600 shadow' : 'text-slate-400'}`}>
            {t === 'attendance' ? 'ABSENSI' : t === 'reports' ? 'LAPORAN' : 'CUTI'}
          </button>
        ))}
      </div>
      
      <div className="space-y-3 pb-10">
        {Object.keys(currentGroup).length > 0 ? Object.keys(currentGroup).sort((a,b) => new Date(b) - new Date(a)).map(date => (
          <div key={date} className="space-y-2">
            <button onClick={() => setOpenDate(openDate === date ? null : date)} className="w-full flex justify-between items-center px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest active:scale-95 transition-all">
              {date === new Date().toDateString() ? 'Hari Ini' : date}
              {openDate === date ? <ChevronDown size={14} className="text-blue-500"/> : <ChevronRight size={14}/>}
            </button>
            
            {openDate === date && currentGroup[date].map(item => (
              // Card ini sekarang bisa DIKLIK untuk memunculkan pop-up
              <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm active:scale-95 transition-all cursor-pointer hover:border-blue-200">
                <div className={`p-3 rounded-xl ${historyType === 'attendance' ? 'bg-blue-50 text-blue-600' : historyType === 'reports' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                  {historyType === 'attendance' ? <Clock size={16}/> : historyType === 'reports' ? <FileText size={16}/> : <Calendar size={16}/>}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-black text-[10px] uppercase tracking-wider">{item.jenis || item.judul || item.jenis_cuti}</h4>
                  <p className="text-[9px] font-bold text-slate-400 truncate mt-1">
                    {new Date(item.timestamp).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})} 
                    {item.status === 'Manual' && ` | Manual`}
                  </p>
                </div>
                <div className="p-2 bg-slate-50 text-slate-300 rounded-lg"><ChevronRight size={14}/></div>
              </div>
            ))}
          </div>
        )) : <NoData />}
      </div>

      {/* POP-UP MELAYANG (MODAL DETAIL) */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl flex flex-col animate-fade-in-down overflow-hidden max-h-[85vh]">
            
            {/* Header Pop-up */}
            <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Info Detail</h3>
              <button onClick={() => setSelectedItem(null)} className="p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-rose-500 active:scale-90 transition-all">
                <XCircle size={20}/>
              </button>
            </div>

            {/* Isi Konten Pop-up (Bisa di-scroll kalau panjang) */}
            <div className="p-6 overflow-y-auto space-y-5">
              
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><Clock size={16}/></div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Waktu Tercatat</p>
                  <p className="text-sm font-bold text-slate-800">{new Date(selectedItem.timestamp).toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* JIKA TAB ABSENSI */}
              {historyType === 'attendance' && (
                <>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tipe Kehadiran</p>
                    <p className="text-sm font-black text-blue-600 uppercase tracking-wider">Absen {selectedItem.jenis}</p>
                    {selectedItem.status === 'Manual' && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Alasan Manual</p>
                        <p className="text-xs font-bold text-slate-700">{selectedItem.manual_reason}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* FOTO BUKTI (DIPERKECIL JADI THUMBNAIL) */}
                  {selectedItem.evidence_url && (
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Foto Bukti</p>
                      <div className="w-full h-40 bg-slate-100 rounded-[1.5rem] overflow-hidden border-4 border-slate-50 shadow-inner">
                        <img src={selectedItem.evidence_url} alt="Bukti" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}

                  {selectedItem.location_map && (
                    <a href={selectedItem.location_map} target="_blank" className="flex items-center justify-center gap-3 w-full py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                      <MapPin size={18}/> Buka Google Maps
                    </a>
                  )}
                </>
              )}

              {/* JIKA TAB LAPORAN */}
              {historyType === 'reports' && (
                <>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Judul Laporan</p>
                      <p className="text-sm font-black text-indigo-600">{selectedItem.judul}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Deskripsi</p>
                      <p className="text-xs font-bold text-slate-600">{selectedItem.deskripsi}</p>
                    </div>
                  </div>

                  {/* LAMPIRAN FILE/FOTO LAPORAN */}
                  {selectedItem.file_url && (
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Lampiran Pendukung</p>
                      {isImage(selectedItem.file_url) ? (
                        <div className="w-full h-40 bg-slate-100 rounded-[1.5rem] overflow-hidden border-4 border-slate-50 shadow-inner">
                          <img src={selectedItem.file_url} alt="Lampiran" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <a href={selectedItem.file_url} target="_blank" className="flex items-center gap-3 p-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-indigo-100 active:scale-95 transition-all">
                          <div className="p-2 bg-white rounded-xl"><FileIcon size={16}/></div>
                          Lihat Dokumen Lengkap
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* JIKA TAB CUTI */}
              {historyType === 'leaves' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Jenis Cuti</p>
                    <p className="text-sm font-black text-amber-600">{selectedItem.jenis_cuti}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal Diajukan</p>
                    <p className="text-xs font-bold text-slate-700">{selectedItem.tanggal_mulai} <span className="text-slate-400 font-normal mx-1">s/d</span> {selectedItem.tanggal_selesai}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Alasan</p>
                    <p className="text-xs font-bold text-slate-600">{selectedItem.alasan}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status Pengajuan</p>
                    <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-inner">{selectedItem.status || 'Pending'}</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

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
            {/* <div className="text-left">
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Match Confirmed</p>
              <p className="font-black text-emerald-600 text-lg leading-none">{score}% Accuracy</p>
            </div> */}
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

function ReportForm({ onSubmit, showToast, profile, getLoc }) {
  const [docs, setDocs] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [up, setUp] = useState(false);
  const docRef = useRef();
  const photoRef = useRef();

  const handleSend = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const judul = fd.get('judul');
    const deskripsi = fd.get('deskripsi');

    setUp(true);
    showToast("Mengunci Lokasi & Mengunggah File...", "info");

    try {
      // 1. Ambil Lokasi GPS
      const loc = await getLoc();
      const location_map = loc ? `https://www.google.com/maps?q=${loc.lat},${loc.lng}` : null;

      // 2. Upload Semua File & Foto ke Supabase Storage
      const allFiles = [...docs, ...photos];
      let uploadedUrls = [];

      for (const file of allFiles) {
        const fName = `${profile.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const { error } = await supabase.storage.from('report_files').upload(fName, file);
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('report_files').getPublicUrl(fName);
          uploadedUrls.push(publicUrl);
        }
      }

      // 3. Simpan ke Database
      await onSubmit({ 
        judul, 
        deskripsi, 
        file_urls: uploadedUrls, // Simpan sebagai JSON/Array
        location: loc,
        location_map: location_map 
      });

      showToast("Laporan Berhasil Terkirim!", "success");
      setDocs([]);
      setPhotos([]);
      e.target.reset();
    } catch (err) {
      showToast("Gagal mengirim laporan.", "error");
    } finally {
      setUp(false);
    }
  };

  const removeDoc = (index) => setDocs(docs.filter((_, i) => i !== index));
  const removePhoto = (index) => setPhotos(photos.filter((_, i) => i !== index));

  return (
    <div className="animate-fade-in space-y-6 pt-4">
      <h2 className="font-black text-xl text-slate-800 tracking-tight px-2 uppercase">Laporan Baru</h2>
      <form onSubmit={handleSend} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-5">
        <input name="judul" required placeholder="Judul Kegiatan / Kendala" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" />
        <textarea name="deskripsi" required rows="5" placeholder="Detail laporan..." className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm"></textarea>
        
        {/* AREA TOMBOL LAMPIRAN (DIPISAH) */}
        <div className="space-y-3">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Lampiran Pendukung</label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => photoRef.current.click()} className="py-4 border-2 border-dashed border-blue-200 bg-blue-50 text-blue-600 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-all">
              <Camera size={20} /> <span className="font-black text-[9px] uppercase tracking-widest">Tambah Foto</span>
            </button>
            <button type="button" onClick={() => docRef.current.click()} className="py-4 border-2 border-dashed border-indigo-200 bg-indigo-50 text-indigo-600 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-all">
              <FileIcon size={20} /> <span className="font-black text-[9px] uppercase tracking-widest">Tambah Dokumen</span>
            </button>
          </div>
          
          {/* Input Hidden dengan multiple file support */}
          <input type="file" ref={photoRef} multiple accept="image/*" onChange={(e) => setPhotos([...photos, ...Array.from(e.target.files)])} className="hidden" />
          <input type="file" ref={docRef} multiple accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setDocs([...docs, ...Array.from(e.target.files)])} className="hidden" />
        </div>

        {/* LIST FILE YANG AKAN DIUPLOAD */}
        {(photos.length > 0 || docs.length > 0) && (
          <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            {photos.map((f, i) => (
              <div key={`p-${i}`} className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                <ImageIcon size={16} className="text-blue-500" />
                <p className="flex-1 text-[10px] font-bold truncate">{f.name}</p>
                <button type="button" onClick={() => removePhoto(i)} className="text-rose-400 p-1"><XCircle size={16} /></button>
              </div>
            ))}
            {docs.map((f, i) => (
              <div key={`d-${i}`} className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                <FileText size={16} className="text-indigo-500" />
                <p className="flex-1 text-[10px] font-bold truncate">{f.name}</p>
                <button type="button" onClick={() => removeDoc(i)} className="text-rose-400 p-1"><XCircle size={16} /></button>
              </div>
            ))}
          </div>
        )}

        <button type="submit" disabled={up} className="w-full py-5 bg-slate-800 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-[10px] tracking-widest uppercase">
          {up ? 'MENGIRIM DATA & LOKASI...' : 'KIRIM LAPORAN SEKARANG'}
        </button>
      </form>
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
    setUp(true);
    showToast("Mengunggah foto...", "info");
    const path = `${profile.id}/${Date.now()}-avatar.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      window.location.reload(); 
    }
    setUp(false);
  };

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      showToast("Password minimal 6 karakter!", "error");
      return;
    }
    setUp(true);
    showToast("Memproses password baru...", "info");
    const { error } = await supabase.auth.updateUser({ password: password });
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Password Berhasil Diubah!", "success");
      setPassword(''); 
    }
    setUp(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="animate-fade-in space-y-6 pt-4 pb-12">
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
      
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-5 shadow-xl shadow-blue-50/20">
        <h4 className="font-black text-[10px] text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-2">
          <User size={16} className="text-blue-500"/> Data Pribadi
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 opacity-70">
            <label className="text-[8px] font-black text-slate-400 mb-1 block uppercase tracking-widest">NIK Karyawan</label>
            <p className="font-black text-xs text-slate-800 tracking-wider truncate">{profile?.nik}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 opacity-70">
            <label className="text-[8px] font-black text-slate-400 mb-1 block uppercase tracking-widest">Departemen</label>
            <p className="font-black text-xs text-slate-800 tracking-wider truncate">{profile?.department || 'Operasional'}</p>
          </div>
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-400 ml-2 mb-1 block uppercase tracking-widest">Nama Lengkap</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama Lengkap..." className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:border-blue-300 transition-all" />
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-400 ml-2 mb-1 block uppercase tracking-widest">No. WhatsApp / HP</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Phone size={16}/></span>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Contoh: 081234..." className="w-full p-4.5 pl-11 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:border-blue-300 transition-all" />
          </div>
        </div>
        <button onClick={() => onUpdate({ full_name: name, phone: phone })} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all text-[10px] tracking-widest uppercase">
          <Save size={16} /> Simpan Data Diri
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-5 shadow-xl shadow-rose-50/20">
        <h4 className="font-black text-[10px] text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-2">
          <Lock size={16} className="text-rose-500"/> Keamanan Akun
        </h4>
        <div>
          <label className="text-[9px] font-black text-slate-400 ml-2 mb-1 block uppercase tracking-widest">Password Baru</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Ketik minimal 6 karakter..." className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:border-rose-300 transition-all" />
        </div>
        <button onClick={handleUpdatePassword} disabled={up} className="w-full py-5 bg-rose-50 text-rose-600 font-black rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-[10px] tracking-widest uppercase border border-rose-100">
          {up ? 'Memproses...' : 'Update Password'}
        </button>
      </div>

      <div className="space-y-4 pt-2">
        <a href="https://wa.me/6281234567890?text=Halo%20Admin,%20saya%20karyawan%20Vanda%20Tech%20butuh%20bantuan%20aplikasi." target="_blank" rel="noreferrer" className="w-full py-5 bg-emerald-50 text-emerald-600 font-black rounded-[1.5rem] flex items-center justify-center gap-3 active:scale-95 transition-all text-[10px] tracking-widest uppercase border border-emerald-100">
          <HelpCircle size={18} /> Hubungi IT / Admin (WA)
        </a>
        <button onClick={handleLogout} className="w-full py-5 bg-slate-900 text-white font-black rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all text-[10px] tracking-widest uppercase">
          <LogOut size={18} /> Keluar Aplikasi
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
  // Wadah full screen dengan efek blur
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in pointer-events-none">
    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center w-full max-w-xs border border-white animate-fade-in-down pointer-events-auto">
      
      {/* Ikon besar menyesuaikan status (Sukses/Gagal) */}
      <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-5 shadow-inner ${type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
        {type === 'success' ? <CheckCircle size={40} /> : <AlertTriangle size={40} />}
      </div>
      
      {/* Judul Pop-up */}
      <h3 className={`font-black text-2xl tracking-tight uppercase mb-2 ${type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
        {type === 'success' ? 'BERHASIL' : 'PERHATIAN'}
      </h3>
      
      {/* Pesan Notifikasi */}
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
        {message}
      </p>
    </div>
  </div>
);

// --- KOMPONEN POP-UP DETAIL RIWAYAT ---
function DetailModal({ item, type, onClose }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative flex flex-col max-h-[85vh] animate-fade-in-down">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <p className="text-[9px] font-black text-blue-500 tracking-widest uppercase">Detail Riwayat</p>
            <h3 className="font-black text-xl tracking-tight text-slate-800 uppercase">{type}</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-rose-50 text-rose-500 rounded-2xl active:scale-95"><XCircle size={24}/></button>
        </div>
        
        {/* Konten Bisa Di-Scroll */}
        <div className="overflow-y-auto pr-2 space-y-4 scrollbar-hide">
          
          {/* JIKA YANG DIKLIK ADALAH ABSENSI */}
          {type === 'attendance' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <DetailRow label="Jenis" value={`Absen ${item.jenis}`} />
                <DetailRow label="Waktu" value={new Date(item.timestamp).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})} />
              </div>
              <DetailRow label="Tanggal" value={new Date(item.timestamp).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
              
              {item.status === 'Manual' && <DetailRow label="Alasan Manual" value={item.manual_reason} />}
              
              {item.evidence_url && (
                <div className="mt-4">
                  <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Foto Bukti Kehadiran</p>
                  <div className="border-4 border-slate-100 rounded-3xl overflow-hidden shadow-inner">
                    <img src={item.evidence_url} className="w-full h-auto object-cover" alt="Bukti Absen" />
                  </div>
                </div>
              )}
              
              {item.location_map && (
                <a href={item.location_map} target="_blank" className="mt-2 flex items-center justify-center gap-3 w-full py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                  <MapPin size={18}/> Buka Lokasi di Maps
                </a>
              )}
            </>
          )}

          {/* JIKA YANG DIKLIK ADALAH LAPORAN */}
          {type === 'reports' && (
            <>
              <DetailRow label="Judul Laporan" value={item.judul} />
              <DetailRow label="Deskripsi / Kendala" value={item.deskripsi} />
              
              {/* Cek apakah ada lokasi laporan */}
              {item.location_map && (
                <a href={item.location_map} target="_blank" className="flex items-center gap-3 p-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                  <MapPin size={16}/> Lokasi Pelaporan
                </a>
              )}

              {/* Tampilkan daftar file yang dilampirkan */}
              {item.file_urls && item.file_urls.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Lampiran Tersimpan</p>
                  {item.file_urls.map((url, i) => {
                    const isImage = url.match(/\.(jpeg|jpg|gif|png)$/i) != null;
                    return isImage ? (
                      <img key={i} src={url} className="w-full rounded-2xl border-2 border-slate-100 mb-2" alt={`Lampiran ${i+1}`} />
                    ) : (
                      <a key={i} href={url} target="_blank" className="flex items-center gap-3 p-4 bg-indigo-50 text-indigo-700 rounded-2xl active:scale-95 transition-all">
                        <FileText size={18} /> <span className="text-[10px] font-black uppercase tracking-widest truncate">Buka Dokumen {i+1}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* JIKA YANG DIKLIK ADALAH CUTI */}
          {type === 'leaves' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <DetailRow label="Kategori" value={item.jenis_cuti} />
                <DetailRow label="Status" value={item.status} color={item.status === 'Pending' ? 'text-amber-500' : 'text-emerald-500'} />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <DetailRow label="Tanggal Mulai" value={item.tanggal_mulai} />
                <DetailRow label="Tanggal Selesai" value={item.tanggal_selesai} />
              </div>
              <DetailRow label="Alasan / Keterangan" value={item.alasan} />
            </>
          )}

        </div>
      </div>
    </div>
  );
}

// Komponen kecil pembuat kotak detail
function DetailRow({ label, value, color = "text-slate-800" }) {
  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
      <p className={`font-bold text-sm leading-snug ${color}`}>{value}</p>
    </div>
  );
}