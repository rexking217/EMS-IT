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
    real_power_kw: number;
    reactive_power_kvar: number;
    execution_rate: number;
    service_type?: number;
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
  devices: Device[];
}

export interface Device {
  id: string;
  name: string;
  status: 'normal' | 'warning' | 'critical';
  soc: number;
  temp: number;
  voltage: number;
}

export interface Alert {
  id: string | number;
  type: 'info' | 'warning' | 'critical';
  message: string;
  time: string;
}

export interface HistoryData {
  time: string;
  soc: number;
  power: number;
  frequency: number;
  execution_rate: number;
  reactive_power: number;
}
