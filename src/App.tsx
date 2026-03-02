import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Battery, 
  Zap, 
  AlertTriangle, 
  Settings, 
  LayoutDashboard, 
  History, 
  Bell,
  Thermometer,
  CloudSun,
  Home,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { EMSData, HistoryData, Alert } from './types';
import { cn } from './lib/utils';

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 w-full text-left transition-all duration-200 rounded-lg",
      active 
        ? "bg-emerald-600/10 text-emerald-500 border-l-4 border-emerald-600" 
        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
    )}
  >
    <Icon size={20} />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const StatCard = ({ label, value, unit, icon: Icon, trend, color }: { label: string, value: string | number, unit?: string, icon: any, trend?: number, color: string }) => (
  <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl hover:border-zinc-700 transition-colors">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon size={20} className="text-white" />
      </div>
      {trend !== undefined && (
        <div className={cn("flex items-center text-xs font-medium", trend >= 0 ? "text-emerald-500" : "text-rose-400")}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-1">
        <h3 className="text-2xl font-bold text-zinc-100">{typeof value === 'number' ? value.toFixed(1) : value}</h3>
        {unit && <span className="text-zinc-500 text-sm font-medium">{unit}</span>}
      </div>
    </div>
  </div>
);

const DeviceModal = ({ device, onClose }: { device: any; onClose: () => void }) => {
  if (!device) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-3 h-3 rounded-full animate-pulse",
              device.status === 'normal' ? "bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.5)]" : 
              device.status === 'warning' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : 
              "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
            )} />
            <h3 className="text-xl font-bold text-white">{device.name}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">電能狀態 (SOC)</p>
              <p className="text-2xl font-mono text-white">{device.soc.toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">模組溫度</p>
              <p className="text-2xl font-mono text-white">{device.temp.toFixed(1)}°C</p>
            </div>
            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">直流電壓</p>
              <p className="text-2xl font-mono text-white">{device.voltage.toFixed(1)}V</p>
            </div>
            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">通訊狀態</p>
              <p className="text-lg font-bold text-emerald-500">連線中</p>
            </div>
          </div>
          
          {device.status === 'warning' && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
              <AlertTriangle className="text-amber-500 shrink-0" size={20} />
              <div>
                <p className="text-sm font-bold text-amber-500">設備警報</p>
                <p className="text-xs text-amber-500/80 mt-1">偵測到參數異常：電能水平或溫度接近臨界點，請持續監控。</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs font-bold text-zinc-500 uppercase">詳細資訊</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">設備 ID</span>
                <span className="text-zinc-300 font-mono">{device.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">最後更新時間</span>
                <span className="text-zinc-300 font-mono">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-zinc-900/50 border-t border-zinc-800">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
          >
            確認並關閉
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const NotificationDropdown = ({ notifications, onClose }: { notifications: Alert[]; onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute right-0 mt-4 w-80 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-[60] overflow-hidden"
    >
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Bell size={16} className="text-emerald-500" />
          系統告警通報
        </h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto no-scrollbar">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <ShieldCheck size={32} className="text-zinc-800 mx-auto mb-3" />
            <p className="text-xs text-zinc-500">目前無任何未處理告警</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {notifications.map((alert) => (
              <div key={alert.id} className="p-4 hover:bg-zinc-900/50 transition-colors group">
                <div className="flex gap-3">
                  <div className={cn(
                    "mt-1 w-2 h-2 rounded-full shrink-0",
                    alert.type === 'critical' ? "bg-rose-500 animate-pulse" : "bg-amber-500"
                  )} />
                  <div className="space-y-1">
                    <p className={cn(
                      "text-xs font-medium leading-tight",
                      alert.type === 'critical' ? "text-rose-400" : "text-amber-400"
                    )}>
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-600 font-mono">
                        {new Date(alert.time).toLocaleTimeString()}
                      </span>
                      <span className="text-[10px] text-zinc-700">•</span>
                      <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider">
                        {alert.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-3 bg-zinc-900/50 border-t border-zinc-800 text-center">
        <button className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest">
          查看所有歷史紀錄
        </button>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [data, setData] = useState<EMSData | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<Alert[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('chiayi');
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // History analysis states
  const [historyRange, setHistoryRange] = useState({
    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    end: new Date().toISOString().slice(0, 16)
  });

  const fetchHistoryData = async (site: string, start?: string, end?: string) => {
    const API_BASE = "http://172.16.100.4:5050";
    let url = `/api/ems/history?site=${site}`;
    let localUrl = `${API_BASE}/api/ems/history?site=${site}`;
    
    if (start) {
      url += `&start=${start}`;
      localUrl += `&start=${start}`;
    }
    if (end) {
      url += `&end=${end}`;
      localUrl += `&end=${end}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(localUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const historyData = await res.json();
        setHistory(historyData);
        return;
      }
    } catch (e) {
      console.warn("Local history API failed, falling back to server API");
    }

    try {
      const res = await fetch(url);
      if (res.ok) {
        const historyData = await res.json();
        setHistory(historyData);
      }
    } catch (e) {
      console.error("Failed to fetch history data", e);
    }
  };

  const handleAnalyze = () => {
    fetchHistoryData(selectedSite, historyRange.start, historyRange.end);
  };

  const historyStats = useMemo(() => {
    if (!history || history.length === 0) return {
      avgFreq: 0,
      maxPower: 0,
      peakTime: 'N/A',
      stability: 0,
      lowExecCount: 0,
      stdDevFreq: 0
    };

    const freqs = history.map(h => h.frequency).filter(f => f > 0);
    const powers = history.map(h => h.power);
    const execRates = history.map(h => h.execution_rate);

    const avgFreq = freqs.length > 0 ? freqs.reduce((a, b) => a + b, 0) / freqs.length : 0;
    const maxPower = Math.max(...powers);
    const peakIndex = powers.indexOf(maxPower);
    
    // Format peak time
    let peakTime = 'N/A';
    const rawPeakTime = history[peakIndex]?.time;
    if (rawPeakTime) {
      try {
        const date = new Date(rawPeakTime);
        peakTime = isNaN(date.getTime()) ? rawPeakTime : date.toLocaleString();
      } catch (e) {
        peakTime = rawPeakTime;
      }
    }

    const stability = execRates.length > 0 ? execRates.reduce((a, b) => a + b, 0) / execRates.length : 0;
    const lowExecCount = execRates.filter(r => r < 95).length;

    // Standard deviation for frequency
    const squareDiffs = freqs.map(f => Math.pow(f - avgFreq, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    const stdDevFreq = Math.sqrt(avgSquareDiff);

    return {
      avgFreq,
      maxPower,
      peakTime,
      stability,
      lowExecCount,
      stdDevFreq
    };
  }, [history]);

  useEffect(() => {
    setNotifications([]); // Clear notifications when site changes
    const fetchData = async () => {
      const API_BASE = "http://172.16.100.4:5050"; // 您的本機 API 位址
      
      // Mapping internal site IDs to API site names
      const siteMapping: Record<string, string> = {
        'chiayi': 'Shanda_Chiayi',
        'xinying': 'Shanda_Xinying',
        'wanxing': 'Kaohsiung_Wanxing',
        'beimen': 'Fengshan_Beimen',
        'dalian': 'Pingtung_Dalian'
      };
      
      const apiSiteName = siteMapping[selectedSite] || selectedSite;

      try {
        // 嘗試直接從瀏覽器連線到本機 API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const statusRes = await fetch(`${API_BASE}/get_plant_EquipData/satus?${apiSiteName}`, { signal: controller.signal });

        clearTimeout(timeoutId);

        if (statusRes.ok) {
          const statusContentType = statusRes.headers.get("content-type");
          
          if (statusContentType?.includes("application/json")) {
            const statusData = await statusRes.json();
            setData(statusData);
            
            // 更新告警
            if (statusData.alerts?.length > 0) {
              setNotifications(prev => {
                const newAlerts = statusData.alerts.filter((a: Alert) => !prev.find(p => p.id === a.id));
                return [...newAlerts, ...prev].slice(0, 20);
              });
            }
            return;
          }
        }
      } catch (e) {
        // 如果本機 API 連線失敗（例如不在辦公室或未開機），則回退到伺服器端的 Mock 資料
        console.warn("Local API direct connect failed, falling back to mock data.");
      }

      // Fallback: 呼叫原本的伺服器端 API (會回傳 Mock 資料)
      try {
        const statusRes = await fetch(`/api/ems/status?site=${selectedSite}`);

        if (statusRes.ok) {
          const statusContentType = statusRes.headers.get("content-type");

          if (statusContentType?.includes("application/json")) {
            const statusData = await statusRes.json();
            setData(statusData);

            // 補上模擬模式下的告警更新邏輯
            if (statusData.alerts?.length > 0) {
              setNotifications(prev => {
                const newAlerts = statusData.alerts.filter((a: Alert) => !prev.find(p => p.id === a.id));
                return [...newAlerts, ...prev].slice(0, 20);
              });
            }
          } else {
            console.warn("Fallback API returned non-JSON response", { statusContentType });
          }
        } else {
          console.warn("Fallback API returned non-ok status", { status: statusRes.status });
        }
      } catch (error) {
        console.error("Failed to fetch fallback data", error);
      }
    };

    fetchData();
    fetchHistoryData(selectedSite);
    
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [selectedSite]);

  const getServiceTypeLabel = (type: number) => {
    const mapping: Record<number, string> = {
      1: 'AFC',
      2: 'dReg',
      3: 'sReg',
      4: '即時備轉',
      5: '補充備轉',
      6: 'E-dReg'
    };
    return mapping[type] || '未知';
  };

  if (!data) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-emerald-600 font-mono text-sm animate-pulse">INITIALIZING EMS SYSTEM...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans selection:bg-emerald-600/30">
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-zinc-950 border-r border-zinc-800 transition-all duration-300 z-50",
        isSidebarOpen ? "w-64" : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg shadow-lg shadow-emerald-600/20 flex-shrink-0">
              <Zap size={20} className="text-white" />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-lg text-white tracking-tight leading-none truncate">三地能源</span>
                <span className="text-[10px] text-emerald-500 font-bold tracking-[0.1em] mt-1 truncate">SANTI RENEWABLE</span>
              </div>
            )}
          </div>
        </div>

        <nav className="px-3 mt-6 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label={isSidebarOpen ? "儀表板" : ""} 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
          />
          <SidebarItem 
            icon={Activity} 
            label={isSidebarOpen ? "即時監控" : ""} 
            active={activeTab === 'monitor'} 
            onClick={() => setActiveTab('monitor')}
          />
          <SidebarItem 
            icon={History} 
            label={isSidebarOpen ? "歷史數據" : ""} 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
          />
          <SidebarItem 
            icon={Bell} 
            label={isSidebarOpen ? "告警通報" : ""} 
            active={activeTab === 'alerts'} 
            onClick={() => setActiveTab('alerts')}
          />
          <div className="pt-4 mt-4 border-t border-zinc-800">
            <SidebarItem 
              icon={Settings} 
              label={isSidebarOpen ? "系統設定" : ""} 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')}
            />
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 min-h-screen",
        isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800 overflow-x-auto max-w-[500px] no-scrollbar">
              <button 
                onClick={() => setSelectedSite('chiayi')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                  selectedSite === 'chiayi' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                盛大嘉義場
              </button>
              <button 
                onClick={() => setSelectedSite('xinying')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                  selectedSite === 'xinying' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                盛大新營場
              </button>
              <button 
                onClick={() => setSelectedSite('wanxing')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                  selectedSite === 'wanxing' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                高雄灣興
              </button>
              <button 
                onClick={() => setSelectedSite('beimen')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                  selectedSite === 'beimen' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                鳳山北門
              </button>
              <button 
                onClick={() => setSelectedSite('dalian')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                  selectedSite === 'dalian' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                屏東大連
              </button>
            </div>
            <h2 className="text-lg font-semibold text-white ml-4">
              {activeTab === 'dashboard' && '系統概覽'}
              {activeTab === 'monitor' && '即時運行狀態'}
              {activeTab === 'history' && '歷史趨勢分析'}
              {activeTab === 'alerts' && '告警管理中心'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", data.system.connection === 'online' ? "bg-emerald-600" : "bg-rose-500")} />
              <span className="text-xs font-mono text-zinc-400 uppercase">{data.system.connection}</span>
              <span className="mx-1 text-zinc-700">|</span>
              <span className="text-[10px] font-mono text-zinc-500">
                {data.deviceId.startsWith('SD-') ? 'REAL-TIME (LOCAL)' : 'SIMULATED (MOCK)'}
              </span>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 hover:bg-zinc-800 rounded-lg transition-colors group"
              >
                <Bell 
                  size={20} 
                  className={cn(
                    "transition-colors",
                    isNotificationsOpen ? "text-white" : "text-zinc-400 group-hover:text-white"
                  )} 
                />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-zinc-950">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-50" 
                      onClick={() => setIsNotificationsOpen(false)} 
                    />
                    <NotificationDropdown 
                      notifications={notifications} 
                      onClose={() => setIsNotificationsOpen(false)} 
                    />
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-zinc-800">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">維運工程師</p>
                <p className="text-xs text-zinc-500">ID: EMS-042</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-600/20">
                IT
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {activeTab === 'dashboard' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Top Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <StatCard 
                  label="電池電量 (SoC)" 
                  value={data.battery.soc} 
                  unit="%" 
                  icon={Battery} 
                  trend={2.4}
                  color="bg-emerald-600"
                />
                <StatCard 
                  label="系統頻率" 
                  value={data.system.frequency.toFixed(3)} 
                  unit="Hz" 
                  icon={Zap} 
                  color="bg-blue-500"
                />
                <StatCard 
                  label="系統實功" 
                  value={data.system.real_power_kw} 
                  unit="kW" 
                  icon={Activity} 
                  color="bg-amber-500"
                />
                <StatCard 
                  label="系統虛功" 
                  value={data.system.reactive_power_kvar} 
                  unit="kVAR" 
                  icon={ShieldCheck} 
                  color="bg-indigo-500"
                />
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-rose-500/10 rounded-lg">
                      <Settings size={20} className="text-rose-500" />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Service Type</span>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 font-medium uppercase mb-1">服務樣態</p>
                    <p className="text-2xl font-bold text-white tracking-tight">
                      {getServiceTypeLabel(data.system.service_type || 1)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Power Flow / Distribution */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col">
                  <h3 className="text-lg font-semibold text-white mb-6">能量流向</h3>
                  
                  <div className="flex-1 flex flex-col justify-around gap-4">
                    <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                          <CloudSun size={20} className="text-amber-500" />
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 font-medium uppercase">光伏發電 (PV)</p>
                          <p className="text-lg font-bold text-white">{data.power.pv_kw.toFixed(1)} kW</p>
                        </div>
                      </div>
                      <ArrowDownRight className="text-emerald-600" />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Home size={20} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 font-medium uppercase">負載消耗 (Load)</p>
                          <p className="text-lg font-bold text-white">{data.power.load_kw.toFixed(1)} kW</p>
                        </div>
                      </div>
                      <ArrowUpRight className="text-rose-500" />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-600/10 rounded-lg">
                          <Battery size={20} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 font-medium uppercase">儲能系統 (BESS)</p>
                          <p className="text-lg font-bold text-white">{data.power.battery_kw.toFixed(1)} kW</p>
                        </div>
                      </div>
                      <div className={cn("text-xs font-bold px-2 py-1 rounded", data.power.battery_kw > 0 ? "bg-emerald-600/20 text-emerald-500" : "bg-blue-500/20 text-blue-400")}>
                        {data.power.battery_kw > 0 ? '放電中' : '充電中'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Alerts Summary */}
                <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">最新告警摘要</h3>
                    <button onClick={() => setActiveTab('alerts')} className="text-xs text-emerald-500 hover:underline">查看全部</button>
                  </div>
                  <div className="space-y-4">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center">
                        <ShieldCheck size={40} className="text-zinc-800 mx-auto mb-3" />
                        <p className="text-zinc-500 text-sm">目前系統運行良好，無異常告警</p>
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((alert) => (
                        <div key={alert.id} className="flex items-center gap-4 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            alert.type === 'critical' ? "bg-rose-500 animate-pulse" : "bg-amber-500"
                          )} />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-zinc-200">{alert.message}</p>
                            <p className="text-[10px] text-zinc-500">{new Date(alert.time).toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'monitor' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Secondary Stats for Monitor */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  label="電池最高溫" 
                  value={data.battery.max_temp.value} 
                  unit="°C" 
                  icon={Thermometer} 
                  color="bg-orange-500"
                />
                <StatCard 
                  label="系統健康度 (SoH)" 
                  value={data.battery.soh} 
                  unit="%" 
                  icon={ShieldCheck} 
                  color="bg-teal-500"
                />
                <StatCard 
                  label="匯流排電壓" 
                  value={data.system.bus_voltage} 
                  unit="V" 
                  icon={Zap} 
                  color="bg-zinc-500"
                />
                <StatCard 
                  label="平均執行率" 
                  value={data.system.execution_rate} 
                  unit="%" 
                  icon={Activity} 
                  color="bg-rose-500"
                />
              </div>

              {/* Device Status Grid */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                      <Activity size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-white">案場設備運行狀況</h3>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono uppercase">
                    Total Devices: {data.devices.length}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {data.devices.map((device) => (
                    <div 
                      key={device.id}
                      onClick={() => setSelectedDevice(device)}
                      className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-emerald-600/50 hover:bg-zinc-800/50 transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-xs font-bold text-zinc-400 truncate">{device.name}</p>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          device.status === 'normal' ? "bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.5)]" : 
                          device.status === 'warning' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : 
                          "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                        )} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-zinc-500 uppercase">SOC</span>
                          <span className="text-xs font-mono text-white">{device.soc.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-500",
                              device.soc > 20 ? "bg-emerald-600" : "bg-rose-500"
                            )}
                            style={{ width: `${device.soc}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[10px] text-zinc-500 uppercase">Temp</span>
                          <span className="text-xs font-mono text-zinc-300">{device.temp.toFixed(1)}°C</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-time Trends Chart */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                    <History size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white">即時運行趨勢 (最近 24 小時)</h3>
                </div>
                
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis 
                        dataKey="time" 
                        stroke="#4b5563" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => {
                          try {
                            const date = new Date(value);
                            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                          } catch (e) {
                            return value;
                          }
                        }}
                      />
                      <YAxis 
                        yAxisId="left"
                        stroke="#4b5563" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        domain={['auto', 'auto']}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        stroke="#4b5563" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        domain={[59.8, 60.2]}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                      />
                      <Legend verticalAlign="top" height={36}/>
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="execution_rate" 
                        name="執行率 (%)"
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="frequency" 
                        name="頻率 (Hz)"
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="power" 
                        name="有效功率 (kW)"
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* History Analysis Header with Date Picker */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">歷史趨勢分析</h3>
                    <p className="text-sm text-zinc-500">請選擇分析時段以查看詳細運行數據</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">從</span>
                      <input 
                        type="datetime-local" 
                        value={historyRange.start}
                        onChange={(e) => setHistoryRange(prev => ({ ...prev, start: e.target.value }))}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">至</span>
                      <input 
                        type="datetime-local" 
                        value={historyRange.end}
                        onChange={(e) => setHistoryRange(prev => ({ ...prev, end: e.target.value }))}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <button 
                      onClick={handleAnalyze}
                      className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 transition-colors"
                    >
                      執行分析
                    </button>
                  </div>
                </div>
              </div>

              {/* Detailed Statistics for History */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 mb-1 uppercase font-bold tracking-wider">平均頻率</p>
                  <p className="text-2xl font-mono text-blue-400">{historyStats.avgFreq.toFixed(3)} <span className="text-sm">Hz</span></p>
                  <div className="mt-2 text-[10px] text-zinc-600">標準差: {historyStats.stdDevFreq.toFixed(4)} Hz</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 mb-1 uppercase font-bold tracking-wider">最大輸出功率</p>
                  <p className="text-2xl font-mono text-amber-400">{historyStats.maxPower.toLocaleString()} <span className="text-sm">kW</span></p>
                  <div className="mt-2 text-[10px] text-zinc-600">峰值時間: {historyStats.peakTime}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 mb-1 uppercase font-bold tracking-wider">執行率穩定度</p>
                  <p className="text-2xl font-mono text-emerald-400">{historyStats.stability.toFixed(2)} <span className="text-sm">%</span></p>
                  <div className="mt-2 text-[10px] text-zinc-600">低於 95% 次數: {historyStats.lowExecCount}</div>
                </div>
              </div>

              {/* Full Width Main Chart */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis 
                        dataKey="time" 
                        stroke="#4b5563" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => {
                          try {
                            const date = new Date(value);
                            if (isNaN(date.getTime())) return value;
                            
                            const start = new Date(historyRange.start);
                            const end = new Date(historyRange.end);
                            const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                            
                            if (diffHours <= 24) {
                              return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                            }
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                          } catch (e) {
                            return value;
                          }
                        }}
                      />
                      <YAxis 
                        yAxisId="left"
                        stroke="#4b5563" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        domain={['auto', 'auto']}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        stroke="#4b5563" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        domain={[59.8, 60.2]}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                      />
                      <Legend verticalAlign="top" height={36}/>
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="execution_rate" 
                        name="執行率 (%)"
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="frequency" 
                        name="頻率 (Hz)"
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="power" 
                        name="有效功率 (kW)"
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'alerts' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Alerts Section */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="text-amber-500" size={20} />
                    <h3 className="text-lg font-semibold text-white">告警管理中心</h3>
                  </div>
                  <button className="text-sm text-emerald-600 hover:underline font-medium">匯出報表</button>
                </div>
                
                <div className="divide-y divide-zinc-800">
                  <AnimatePresence mode="popLayout">
                    {notifications.length === 0 ? (
                      <div className="p-24 text-center">
                        <ShieldCheck size={48} className="text-zinc-800 mx-auto mb-4" />
                        <p className="text-zinc-500 text-sm">目前無任何異常告警，系統運行良好。</p>
                      </div>
                    ) : (
                      notifications.map((alert) => (
                        <motion.div 
                          key={alert.id}
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-6 flex items-start gap-4 hover:bg-zinc-800/30 transition-colors"
                        >
                          <div className={cn(
                            "p-2 rounded-full mt-1",
                            alert.type === 'critical' ? "bg-rose-500/20 text-rose-500" : "bg-amber-500/20 text-amber-500"
                          )}>
                            <AlertTriangle size={16} />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-zinc-200">{alert.message}</p>
                                <p className="text-xs text-zinc-500 mt-1">設備 ID: {data.deviceId} | 場域: {data.siteName}</p>
                              </div>
                              <span className="text-xs font-mono text-zinc-500 uppercase">{new Date(alert.time).toLocaleString()}</span>
                            </div>
                          </div>
                          <button className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors">
                            確認處理
                          </button>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Toast Notification for Critical Alerts */}
      <AnimatePresence>
        {notifications.some(n => n.type === 'critical') && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-8 right-8 z-[100] bg-rose-600 text-white p-4 rounded-xl shadow-2xl flex items-center gap-4 border border-rose-500"
          >
            <div className="bg-white/20 p-2 rounded-lg">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="font-bold">緊急系統告警!</p>
              <p className="text-sm opacity-90">檢測到關鍵組件異常，請立即檢查維運日誌。</p>
            </div>
            <button 
              onClick={() => setNotifications(prev => prev.filter(n => n.type !== 'critical'))}
              className="ml-4 p-1 hover:bg-white/10 rounded"
            >
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Device Detail Modal */}
      <AnimatePresence>
        {selectedDevice && (
          <DeviceModal 
            device={data.devices.find(d => d.id === selectedDevice.id) || selectedDevice} 
            onClose={() => setSelectedDevice(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
