import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

const SITE_CONFIGS: Record<string, {
  siteName: string;
  baseSoc: number;
  baseSoh: number;
  basePower: number;
  baseFreq: number;
  reactivePower: number;
  isOperational: boolean;
  deviceCount: number;
  devicePrefix: string;
  baseTemp: number;
  baseVoltage: number;
  busVoltage: number;
  uptime: string;
  serviceType: number;
}> = {
  'chiayi': {
    siteName: "盛大嘉義場",
    baseSoc: 58.4,
    baseSoh: 89.0,
    basePower: 93.6,
    baseFreq: 59.980,
    reactivePower: -13.4,
    isOperational: true,
    deviceCount: 10,
    devicePrefix: "電池模組",
    baseTemp: 19.0,
    baseVoltage: 1200,
    busVoltage: 1261.8,
    uptime: "156d 08h 45m",
    serviceType: 1
  },
  'xinying': {
    siteName: "盛大新營場",
    baseSoc: 30.6,
    baseSoh: 98.5,
    basePower: 960.7,
    baseFreq: 60.020,
    reactivePower: -5.0,
    isOperational: true,
    deviceCount: 6,
    devicePrefix: "Megapack",
    baseTemp: 25.7,
    baseVoltage: 480,
    busVoltage: 480.0,
    uptime: "89d 12h 10m",
    serviceType: 2
  },
  'wanxing': {
    siteName: "高雄灣興",
    baseSoc: 45.2,
    baseSoh: 97.2,
    basePower: 0,
    baseFreq: 60.005,
    reactivePower: -8.2,
    isOperational: false,
    deviceCount: 6,
    devicePrefix: "電池模組",
    baseTemp: 19.0,
    baseVoltage: 480,
    busVoltage: 480.0,
    uptime: "45d 06h 20m",
    serviceType: 3
  },
  'beimen': {
    siteName: "鳳山北門",
    baseSoc: 45.0,
    baseSoh: 93.0,
    basePower: -42.6,
    baseFreq: 60.005,
    reactivePower: 75.6,
    isOperational: true,
    deviceCount: 20,
    devicePrefix: "ESS-MOD",
    baseTemp: 30.0,
    baseVoltage: 1200,
    busVoltage: 23059.5,
    uptime: "120d 14h 30m",
    serviceType: 6
  },
  'dalian': {
    siteName: "屏東大連",
    baseSoc: 33.28,
    baseSoh: 99.1,
    basePower: -88.2,
    baseFreq: 60.030,
    reactivePower: 168.0,
    isOperational: true,
    deviceCount: 5,
    devicePrefix: "Megapack",
    baseTemp: 30.0,
    baseVoltage: 91.6,
    busVoltage: 23093.0,
    uptime: "210d 02h 15m",
    serviceType: 6
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Request logger for API routes
  app.use("/api", (req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
  });

  // Mock EMS Data Generator
  const getMockEMSData = (site: string) => {
    const now = new Date();
    const config = SITE_CONFIGS[site] || {
      siteName: "未知案場",
      baseSoc: 50.0,
      baseSoh: 95.0,
      basePower: 100.0,
      baseFreq: 60.0,
      reactivePower: 0,
      isOperational: true,
      deviceCount: 6,
      devicePrefix: "設備",
      baseTemp: 25.0,
      baseVoltage: 480,
      busVoltage: 480,
      uptime: "0d",
      serviceType: 1
    };

    const deviceId = `MOCK-${site.toUpperCase()}-01`;
    
    // Generate individual devices based on site config
    const devices = Array.from({ length: config.deviceCount }).map((_, i) => {
      const soc = config.baseSoc + (Math.random() - 0.5) * 5;
      const temp = config.baseTemp + (Math.random() - 0.5) * 2;
      const name = `${config.devicePrefix} ${i + 1}`;
      
      return {
        id: `MOD-${i + 1}`,
        name,
        status: Math.random() > 0.98 ? "warning" : "normal",
        soc: Math.max(0, Math.min(100, soc)),
        temp,
        voltage: config.baseVoltage + (Math.random() - 0.5) * 10
      };
    });

    const currentSoc = config.baseSoc + (Math.random() - 0.5) * 0.2;
    const currentTemp = config.baseTemp + (Math.random() - 0.5) * 2;
    const fireAlarm = Math.random() > 0.9999; // Extremely rare

    // Threshold-based alerts
    const alerts = [];
    if (currentSoc < 20) {
      alerts.push({ id: `soc-low-sys-${Date.now()}`, type: "warning", message: "系統電能低水平 (low_state_of_energy)", time: now.toISOString() });
    }
    
    devices.forEach(dev => {
      if (dev.soc < 20) {
        alerts.push({ 
          id: `soc-low-${dev.id}-${Date.now()}`, 
          type: "warning", 
          message: `${dev.name}: 電能低水平 (low_state_of_energy)`, 
          time: now.toISOString() 
        });
      }
    });

    if (currentTemp > 45) alerts.push({ id: `temp-high-${Date.now()}`, type: "critical", message: "電池溫度異常過高", time: now.toISOString() });
    if (fireAlarm) alerts.push({ id: `fire-${Date.now()}`, type: "critical", message: "!!! 偵測到火警訊號 !!!", time: now.toISOString() });
    
    return {
      siteName: config.siteName,
      deviceId,
      timestamp: now.toISOString(),
      system: {
        status: alerts.length > 0 ? (alerts.some(a => a.type === 'critical') ? "critical" : "warning") : "normal",
        uptime: config.uptime,
        connection: "online",
        frequency: config.baseFreq + (Math.random() - 0.5) * 0.01,
        bus_voltage: config.busVoltage + (Math.random() - 0.5) * 10,
        real_power_kw: config.isOperational ? (config.basePower + (Math.random() - 0.5) * 2) : (Math.random() * 0.1),
        reactive_power_kvar: config.isOperational ? (config.reactivePower + (Math.random() - 0.5) * 0.5) : 0,
        execution_rate: config.isOperational ? 100.0 : 0,
        service_type: config.serviceType,
      },
      battery: {
        soc: currentSoc,
        soh: config.baseSoh,
        voltage: config.busVoltage + (Math.random() - 0.5) * 5,
        current: config.isOperational ? (41.0 + (Math.random() - 0.5) * 2) : 0,
        temp: currentTemp,
        max_temp: {
          value: currentTemp + 2,
          position: "Module-04-Cell-02"
        },
        min_temp: {
          value: currentTemp - 2,
          position: "Module-01-Cell-08"
        }
      },
      devices,
      safety: {
        fire_alarm: fireAlarm,
        door_status: "closed",
        emergency_stop: false
      },
      power: {
        pv_kw: config.isOperational ? (150.0 + Math.random() * 20) : (Math.random() * 5),
        load_kw: config.isOperational ? (config.basePower + Math.random() * 3) : 0,
        grid_kw: config.isOperational ? (-2.5 + Math.random() * 1) : 0,
        battery_kw: config.isOperational ? (5.0 + Math.random() * 2) : 0,
      },
      alerts
    };
  };

  // Real API Fetcher
  const fetchEMSData = async (site: string) => {
    let deviceId = "";
    let siteName = "";
    
    switch(site) {
      case 'chiayi':
        deviceId = process.env.EMS_CHIAYI_DEVICE_ID || "";
        siteName = "盛大嘉義場";
        break;
      case 'xinying':
        deviceId = process.env.EMS_XINYING_DEVICE_ID || "";
        siteName = "盛大新營場";
        break;
      case 'wanxing':
        deviceId = process.env.EMS_WANXING_DEVICE_ID || "";
        siteName = "高雄灣興";
        break;
      case 'beimen':
        deviceId = process.env.EMS_BEIMEN_DEVICE_ID || "";
        siteName = "鳳山北門";
        break;
      case 'dalian':
        deviceId = process.env.EMS_DALIAN_DEVICE_ID || "";
        siteName = "屏東大連";
        break;
      default:
        deviceId = "";
        siteName = "未知案場";
    }
    
    const baseUrl = process.env.EMS_API_BASE_URL;
    const apiKey = process.env.EMS_API_KEY;

    if (!baseUrl || !apiKey || apiKey === 'YOUR_API_KEY_HERE' || baseUrl.includes('172.16.') || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      // Don't log as error if it's a local/unreachable IP from the cloud
      if (baseUrl && (baseUrl.includes('172.16.') || baseUrl.includes('localhost'))) {
        // Silent fallback for local IPs as they are handled by the client-side fetch
        return getMockEMSData(site);
      }
      console.log(`Using mock data for ${site} (API not configured or local IP)`);
      return getMockEMSData(site);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Increase to 10 seconds

      const response = await fetch(`${baseUrl}/device/${deviceId}/status`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`API responded with ${response.status}`);
      
      const apiData = await response.json();
      
      // Map API data to our frontend format
      return {
        siteName,
        deviceId: deviceId,
        timestamp: apiData.timestamp || new Date().toISOString(),
        system: {
          status: apiData.system_status || 'normal',
          uptime: apiData.uptime || 'N/A',
          connection: apiData.online ? 'online' : 'offline',
          frequency: apiData.freq || 60.0,
          bus_voltage: apiData.bus_v || 480,
          real_power_kw: apiData.real_p || 0,
          reactive_power_kvar: apiData.reactive_p || 0,
          execution_rate: apiData.exec_rate || 100.0,
          service_type: apiData.service_type || 1,
        },
        battery: {
          soc: apiData.soc || 0,
          soh: apiData.soh || 0,
          voltage: apiData.batt_v || 0,
          current: apiData.batt_a || 0,
          temp: apiData.temp_avg || 0,
          max_temp: {
            value: apiData.temp_max || 0,
            position: apiData.temp_max_pos || 'N/A'
          },
          min_temp: {
            value: apiData.temp_min || 0,
            position: apiData.temp_min_pos || 'N/A'
          }
        },
        safety: {
          fire_alarm: !!apiData.fire_alarm,
          door_status: apiData.door || 'closed',
          emergency_stop: !!apiData.ems_stop
        },
        power: {
          pv_kw: apiData.pv_p || 0,
          load_kw: apiData.load_p || 0,
          grid_kw: apiData.grid_p || 0,
          battery_kw: apiData.batt_p || 0,
        },
        alerts: apiData.alerts || []
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log(`Fetch timeout for ${site} - using mock data.`);
      } else {
        console.error(`Error fetching real API for ${site}:`, error.message || error);
      }
      return getMockEMSData(site); // Fallback to mock on error
    }
  };

  // API Endpoints
  app.get("/api/ems/status", async (req, res) => {
    const site = (req.query.site as string) || 'chiayi';
    const data = await fetchEMSData(site);
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
  });

  app.get("/api/ems/history", async (req, res) => {
    const site = (req.query.site as string) || 'chiayi';
    const start = req.query.start as string;
    const end = req.query.end as string;
    
    let deviceId = "";
    switch(site) {
      case 'chiayi': deviceId = process.env.EMS_CHIAYI_DEVICE_ID || ""; break;
      case 'xinying': deviceId = process.env.EMS_XINYING_DEVICE_ID || ""; break;
      case 'wanxing': deviceId = process.env.EMS_WANXING_DEVICE_ID || ""; break;
      case 'beimen': deviceId = process.env.EMS_BEIMEN_DEVICE_ID || ""; break;
      case 'dalian': deviceId = process.env.EMS_DALIAN_DEVICE_ID || ""; break;
    }
    
    const baseUrl = process.env.EMS_API_BASE_URL;
    const apiKey = process.env.EMS_API_KEY;

    const isLocalOrUnconfigured = !baseUrl || !apiKey || apiKey === 'YOUR_API_KEY_HERE' || 
                                 baseUrl.includes('172.16.') || baseUrl.includes('localhost') || 
                                 baseUrl.includes('127.0.0.1');

    let history = null;
    if (!isLocalOrUnconfigured && deviceId) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        let url = `${baseUrl}/device/${deviceId}/history`;
        const params = new URLSearchParams();
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        if (!start && !end) params.append('range', '24h');
        
        url += `?${params.toString()}`;

        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const rawData = await response.json();
          // Map API data to our internal format
          if (Array.isArray(rawData)) {
            history = rawData.map((item: any) => ({
              time: item.time || item.timestamp || item.ts || "",
              soc: item.soc ?? item.SOC ?? item.battery_soc ?? 0,
              power: item.power ?? item.p ?? item.real_power ?? item.active_power ?? 0,
              frequency: item.frequency ?? item.f ?? item.freq ?? item.freq_hz ?? 0,
              execution_rate: item.execution_rate ?? item.exec_rate ?? item.rate ?? 100,
              reactive_power: item.reactive_power ?? item.q ?? item.reactive ?? 0,
            }));
          }
        } else {
          console.error(`API History Error [${site}]:`, response.status, response.statusText);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log(`History fetch timeout for ${site}`);
        } else {
          console.error("History API error:", error.message || error);
        }
      }
    }

    // If API is configured but failed/returned no data, return empty to avoid showing fake data
    if (!history && !isLocalOrUnconfigured) {
      history = []; 
    }

    if (!history) {
      const config = SITE_CONFIGS[site] || {
        siteName: "未知案場",
        baseSoc: 50.0,
        baseSoh: 95.0,
        basePower: 100.0,
        baseFreq: 60.0,
        reactivePower: 0,
        isOperational: true,
        deviceCount: 6,
        devicePrefix: "設備",
        baseTemp: 25.0,
        baseVoltage: 480,
        busVoltage: 480,
        uptime: "0d",
        serviceType: 1
      };

      const startTime = start ? new Date(start) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endTime = end ? new Date(end) : new Date();
      const durationMs = endTime.getTime() - startTime.getTime();
      const points = 48;
      const stepMs = durationMs / points;

      history = Array.from({ length: points }).map((_, i) => {
        const time = new Date(startTime.getTime() + i * stepMs);
        
        return {
          time: time.toISOString(),
          soc: config.baseSoc + (Math.sin(i / 5) * 5) + (Math.random() * 2),
          power: config.isOperational ? (config.basePower + (Math.random() - 0.5) * 150) : (Math.random() * 0.1),
          frequency: config.baseFreq + (Math.random() - 0.5) * 0.08,
          execution_rate: config.isOperational ? (100.0 - (Math.random() * 0.1)) : 0,
          reactive_power: config.isOperational ? ((config.basePower * 0.2) + (Math.random() - 0.5) * 20) : 0,
        };
      });
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.json(history);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EMS Server running on http://localhost:${PORT}`);
  });
}

startServer();
