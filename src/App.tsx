import React, { useState, useEffect } from 'react';
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
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
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
        ? "bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500" 
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
        <div className={cn("flex items-center text-xs font-medium", trend >= 0 ? "text-emerald-400" : "text-rose-400")}>
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

export default function App() {
  const [data, setData] = useState<EMSData | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<Alert[]>([]);
  const [selectedSite, setSelectedSite] = useState<'chiayi' | 'xinying'>('chiayi');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, historyRes] = await Promise.all([
          fetch(`/api/ems/status?site=${selectedSite}`),
          fetch(`/api/ems/history?site=${selectedSite}`)
        ]);
        const statusData = await statusRes.json();
        const historyData = await historyRes.json();
        
        setData(statusData);
        setHistory(historyData);

        // Handle new alerts
        if (statusData.alerts.length > 0) {
          setNotifications(prev => {
            const newAlerts = statusData.alerts.filter((a: Alert) => !prev.find(p => p.id === a.id));
            return [...newAlerts, ...prev].slice(0, 10);
          });
        }
      } catch (error) {
        console.error("Failed to fetch EMS data", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [selectedSite]);

  if (!data) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-emerald-500 font-mono text-sm animate-pulse">INITIALIZING EMS SYSTEM...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans selection:bg-emerald-500/30">
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-zinc-950 border-r border-zinc-800 transition-all duration-300 z-50",
        isSidebarOpen ? "w-64" : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-lg">
            <Zap size={20} className="text-black" />
          </div>
          {isSidebarOpen && <h1 className="font-bold text-xl text-white tracking-tight">EMS Pro</h1>}
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
            <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              <button 
                onClick={() => setSelectedSite('chiayi')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                  selectedSite === 'chiayi' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                盛大嘉義場
              </button>
              <button 
                onClick={() => setSelectedSite('xinying')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                  selectedSite === 'xinying' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                盛大新營場
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
              <div className={cn("w-2 h-2 rounded-full animate-pulse", data.system.connection === 'online' ? "bg-emerald-500" : "bg-rose-500")} />
              <span className="text-xs font-mono text-zinc-400 uppercase">{data.system.connection}</span>
            </div>
            
            <div className="relative">
              <Bell size={20} className="text-zinc-400 cursor-pointer hover:text-white transition-colors" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-zinc-950">
                  {notifications.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-zinc-800">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">維運工程師</p>
                <p className="text-xs text-zinc-500">ID: EMS-042</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-black font-bold">
                IT
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              label="電池電量 (SoC)" 
              value={data.battery.soc} 
              unit="%" 
              icon={Battery} 
              trend={2.4}
              color="bg-emerald-500"
            />
            <StatCard 
              label="系統頻率" 
              value={data.system.frequency} 
              unit="Hz" 
              icon={Activity} 
              color="bg-blue-500"
            />
            <StatCard 
              label="電池最高溫" 
              value={data.battery.max_temp.value} 
              unit="°C" 
              icon={Thermometer} 
              color="bg-rose-500"
            />
            <StatCard 
              label="系統健康度 (SoH)" 
              value={data.battery.soh} 
              unit="%" 
              icon={ShieldCheck} 
              color="bg-indigo-500"
            />
          </div>

          {/* Safety and System Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={cn(
              "p-4 rounded-xl border flex items-center gap-4",
              data.safety.fire_alarm ? "bg-rose-500/10 border-rose-500 text-rose-500" : "bg-zinc-900/50 border-zinc-800 text-zinc-400"
            )}>
              <div className={cn("p-2 rounded-lg", data.safety.fire_alarm ? "bg-rose-500 text-white" : "bg-zinc-800")}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase">火警監測狀態</p>
                <p className="text-lg font-bold">{data.safety.fire_alarm ? '!!! 火警告警 !!!' : '正常'}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-zinc-900/50 border-zinc-800 flex items-center gap-4">
              <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                <Thermometer size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium uppercase text-zinc-500">最低模組溫度</p>
                <div className="flex justify-between items-baseline">
                  <p className="text-lg font-bold text-white">{data.battery.min_temp.value.toFixed(1)} °C</p>
                  <p className="text-[10px] font-mono text-zinc-500">{data.battery.min_temp.position}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-zinc-900/50 border-zinc-800 flex items-center gap-4">
              <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-zinc-500">匯流排電壓</p>
                <p className="text-lg font-bold text-white">{data.system.bus_voltage.toFixed(1)} V</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Chart */}
            <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-white">{data.siteName} - 功率與電量趨勢</h3>
                  <p className="text-sm text-zinc-500">過去 24 小時運行數據</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-xs font-medium bg-zinc-800 text-zinc-300 rounded-md hover:bg-zinc-700 transition-colors">1H</button>
                  <button className="px-3 py-1 text-xs font-medium bg-emerald-500 text-black rounded-md">24H</button>
                  <button className="px-3 py-1 text-xs font-medium bg-zinc-800 text-zinc-300 rounded-md hover:bg-zinc-700 transition-colors">7D</button>
                </div>
              </div>
              
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorSoc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#4b5563" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#4b5563" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="soc" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorSoc)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Power Flow / Distribution */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-6">能量流向</h3>
              
              <div className="flex-1 flex flex-col justify-around">
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
                  <ArrowDownRight className="text-emerald-500" />
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
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Battery size={20} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-medium uppercase">儲能系統 (BESS)</p>
                      <p className="text-lg font-bold text-white">{data.power.battery_kw.toFixed(1)} kW</p>
                    </div>
                  </div>
                  <div className={cn("text-xs font-bold px-2 py-1 rounded", data.power.battery_kw > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400")}>
                    {data.power.battery_kw > 0 ? '放電中' : '充電中'}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">系統運行時間</span>
                  <span className="text-zinc-200 font-mono">{data.system.uptime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts Section */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-amber-500" size={20} />
                <h3 className="text-lg font-semibold text-white">即時告警與通知</h3>
              </div>
              <button className="text-sm text-emerald-500 hover:underline">查看全部歷史</button>
            </div>
            
            <div className="divide-y divide-zinc-800">
              <AnimatePresence mode="popLayout">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-zinc-500 text-sm">目前無任何異常告警，系統運行良好。</p>
                  </div>
                ) : (
                  notifications.map((alert) => (
                    <motion.div 
                      key={alert.id}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 flex items-start gap-4 hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className={cn(
                        "p-2 rounded-full mt-1",
                        alert.type === 'critical' ? "bg-rose-500/20 text-rose-500" : "bg-amber-500/20 text-amber-500"
                      )}>
                        <AlertTriangle size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-zinc-200">{alert.message}</p>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">{new Date(alert.time).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">設備 ID: BATT-ARRAY-03 | 模組: 電池管理單元 (BMU)</p>
                      </div>
                      <button className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider border border-zinc-700 rounded hover:bg-zinc-700 transition-colors">
                        確認處理
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
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
    </div>
  );
}
