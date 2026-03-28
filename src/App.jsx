import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Clock, FileText, User, MapPin, Wifi, WifiOff, 
  CheckCircle, LogOut, ChevronRight, Camera, AlertCircle
} from 'lucide-react';

// --- INITIALIZE SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [userId] = useState(() => {
    let id = localStorage.getItem('vanda_user_id');
    if (!id) {
      id = 'user-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('vanda_user_id', id);
    }
    return id;
  });

  const [activeTab, setActiveTab] = useState('home');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [attendanceData, setAttendanceData] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [location, setLocation] = useState(null);

  // --- 1. NETWORK LISTENERS ---
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const savedQueue = localStorage.getItem(`sync_queue`);
    if (savedQueue) setOfflineQueue(JSON.parse(savedQueue));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- 2. DATA FETCHING (SUPABASE) ---
  const fetchData = async () => {
    if (!userId) return;
    
    const { data: attData } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
    if (attData) setAttendanceData(attData);

    const { data: repData } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
    if (repData) setReportData(repData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance' }, () => fetchData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel) };
  }, [userId]);

  // --- 3. GET LOCATION ---
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject(new Error("Geolocation tidak didukung browser"));
      else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
            setLocation(loc);
            resolve(loc);
          },
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    });
  };

  // --- 4. OFFLINE SYNC LOGIC ---
  useEffect(() => {
    const syncData = async () => {
      if (isOnline && offlineQueue.length > 0) {
        showToast("Menyinkronkan data offline...", "info");
        const currentQueue = [...offlineQueue];
        const failedItems = [];

        for (const item of currentQueue) {
          const { error } = await supabase.from(item.type).insert([item.data]);
          if (error) failedItems.push(item);
        }

        setOfflineQueue(failedItems);
        localStorage.setItem(`sync_queue`, JSON.stringify(failedItems));
        if (failedItems.length === 0) showToast("Semua data berhasil disinkronkan!", "success");
      }
    };
    syncData();
  }, [isOnline, offlineQueue]);

  // --- 5. ACTIONS ---
  const saveData = async (type, dataPayload) => {
    const fullData = {
      ...dataPayload,
      user_id: userId,
      timestamp: Date.now(),
    };

    if (isOnline) {
      const { error } = await supabase.from(type).insert([fullData]);
      if (error) {
        saveToOfflineQueue(type, fullData);
      } else {
        showToast(type === 'attendance' ? "Absensi Berhasil!" : "Laporan Terkirim!", "success");
        fetchData();
      }
    } else {
      saveToOfflineQueue(type, fullData);
    }
  };

  const saveToOfflineQueue = (type, data) => {
    const newItem = { id: `temp_${Date.now()}`, type, data };
    const newQueue = [...offlineQueue, newItem];
    setOfflineQueue(newQueue);
    localStorage.setItem(`sync_queue`, JSON.stringify(newQueue));
    showToast("Disimpan Offline. Akan dikirim saat online.", "warning");
  };

  const handleAbsen = async (jenis) => {
    try {
      showToast("Mendapatkan lokasi...", "info");
      const loc = await getCurrentLocation();
      await saveData('attendance', { jenis, location: loc });
    } catch (error) {
      showToast("Gagal mendapat lokasi, absensi tanpa GPS.", "error");
      await saveData('attendance', { jenis, location: { lat: 0, lng: 0 } });
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Memuat Aplikasi...</div>;

  const combinedAttendance = [
    ...attendanceData.map(d => ({ ...d, synced: true })),
    ...offlineQueue.filter(q => q.type === 'attendance').map(q => ({ ...q.data, id: q.id, synced: false }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  const combinedReports = [
    ...reportData.map(d => ({ ...d, synced: true })),
    ...offlineQueue.filter(q => q.type === 'reports').map(q => ({ ...q.data, id: q.id, synced: false }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  const todayAttendance = combinedAttendance.filter(a => {
    const date = new Date(a.timestamp);
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
  });

  const hasAbsenMasuk = todayAttendance.some(a => a.jenis === 'Masuk');
  const hasAbsenPulang = todayAttendance.some(a => a.jenis === 'Pulang');

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col overflow-hidden">
        
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 pb-8 rounded-b-[2.5rem] shadow-lg shrink-0 relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Selamat Datang daieaifj,</p>
              <h1 className="text-2xl font-bold flex items-center gap-2">{userId.substring(0,9)}</h1>
            </div>
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
              <User size={24} className="text-white" />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-200" />
              <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isOnline ? 'bg-emerald-500/80' : 'bg-rose-500/80'} text-white`}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 px-6 -mt-4 pt-8 relative z-0">
          {toast && (
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 w-11/12 p-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium z-50 animate-fade-in-down
              ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 
                toast.type === 'error' ? 'bg-rose-100 text-rose-800' : 
                'bg-blue-100 text-blue-800'}`}>
              {toast.message}
            </div>
          )}

          {activeTab === 'home' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <p className="text-slate-400 text-sm mb-1">Status Kehadiran Hari Ini</p>
                <div className="flex items-end justify-between mb-4">
                  <h2 className="text-3xl font-bold tracking-tight">{hasAbsenMasuk ? 'Hadir' : 'Belum Absen'}</h2>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin size={12} /> {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Lokasi siap'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleAbsen('Masuk')} disabled={hasAbsenMasuk}
                  className={`flex flex-col items-center justify-center p-5 rounded-3xl border transition-all 
                    ${hasAbsenMasuk ? 'bg-slate-50 text-slate-400' : 'bg-white border-blue-100 text-blue-700 shadow-sm'}`}
                >
                  <LogOut size={28} style={{ transform: 'rotate(180deg)' }} className="mb-2" />
                  <span className="font-bold text-sm">Absen Masuk</span>
                </button>
                <button 
                  onClick={() => handleAbsen('Pulang')} disabled={!hasAbsenMasuk || hasAbsenPulang}
                  className={`flex flex-col items-center justify-center p-5 rounded-3xl border transition-all 
                    ${(!hasAbsenMasuk || hasAbsenPulang) ? 'bg-slate-50 text-slate-400' : 'bg-white border-rose-100 text-rose-700 shadow-sm'}`}
                >
                  <LogOut size={28} className="mb-2" />
                  <span className="font-bold text-sm">Absen Pulang</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-fade-in space-y-4">
              <h2 className="font-bold text-lg text-slate-800 mb-2">Riwayat Absensi</h2>
              <div className="space-y-3">
                {combinedAttendance.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Absen {item.jenis}</p>
                      <p className="text-xs text-slate-500">{formatDate(item.timestamp)}</p>
                    </div>
                    {item.synced ? <CheckCircle size={16} className="text-emerald-500" /> : <Clock size={16} className="text-amber-500" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'report' && (
             <div className="animate-fade-in">
             <h2 className="font-bold text-lg text-slate-800 mb-4">Buat Laporan</h2>
             <form onSubmit={async (e) => {
                 e.preventDefault();
                 const formData = new FormData(e.target);
                 const data = { judul: formData.get('judul'), deskripsi: formData.get('deskripsi') };
                 e.target.reset();
                 try {
                   const loc = await getCurrentLocation();
                   await saveData('reports', { ...data, location: loc });
                 } catch(err) {
                   await saveData('reports', { ...data, location: { lat:0, lng:0 }});
                 }
                 setActiveTab('home');
               }}
               className="space-y-4"
             >
               <input name="judul" required type="text" placeholder="Judul Laporan" className="w-full border rounded-xl px-4 py-3" />
               <textarea name="deskripsi" required rows="4" placeholder="Deskripsi..." className="w-full border rounded-xl px-4 py-3"></textarea>
               <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">Kirim Laporan</button>
             </form>
           </div>
          )}
        </main>

        <nav className="absolute bottom-0 w-full bg-white border-t px-6 py-4 flex justify-between z-20 pb-safe">
          <NavButton icon={<Home size={22}/>} label="Home" isActive={activeTab==='home'} onClick={() => setActiveTab('home')} />
          <NavButton icon={<Clock size={22}/>} label="Riwayat" isActive={activeTab==='history'} onClick={() => setActiveTab('history')} />
          <NavButton icon={<FileText size={22}/>} label="Laporan" isActive={activeTab==='report'} onClick={() => setActiveTab('report')} />
        </nav>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInDown { from { opacity: 0; transform: translate(-50%, -10px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-fade-in-down { animation: fadeInDown 0.3s ease-out forwards; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1rem); }
      `}} />
    </div>
  );
}

const NavButton = ({ icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
    {icon}
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);