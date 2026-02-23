export interface EMSData {
  siteName: string;
  deviceId: string;
  timestamp: string;
  system: {
    status: 'normal' | 'warning' | 'critical';
    uptime: string;
    connection: 'online' | 'offline';
    frequency: number;
    bus_voltage: number;
  };
  battery: {
    soc: number;
    soh: number;
    voltage: number;
    current: number;
    temp: number;
    max_temp: {
      value: number;
      position: string;
    };
    min_temp: {
      value: number;
      position: string;
    };
  };
  safety: {
    fire_alarm: boolean;
    door_status: string;
    emergency_stop: boolean;
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
