export interface EMSData {
  timestamp: string;
  system: {
    status: 'normal' | 'warning' | 'critical';
    uptime: string;
    connection: 'online' | 'offline';
  };
  battery: {
    soc: number;
    soh: number;
    voltage: number;
    current: number;
    temp: number;
  };
  power: {
    pv_kw: number;
    load_kw: number;
    grid_kw: number;
    battery_kw: number;
  };
  alerts: Alert[];
}

export interface Alert {
  id: number;
  type: 'info' | 'warning' | 'critical';
  message: string;
  time: string;
}

export interface HistoryData {
  time: string;
  soc: number;
  power: number;
}
