import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

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
    const isChiayi = site === 'chiayi';
    const isXinying = site === 'xinying';
    const isWanxing = site === 'wanxing';
    const isBeimen = site === 'beimen';
    const isDalian = site === 'dalian';

    let baseSoc = 50.0;
    let baseSoh = 95.0;
    let siteName = "未知案場";
    let deviceId = `MOCK-${site.toUpperCase()}-01`;
    let realPower = 100.0;
    let reactivePower = -10.0;
    let freq = 60.000;

    if (isChiayi) {
      baseSoc = 58.4;
      baseSoh = 89.0;
      siteName = "盛大嘉義場";
      realPower = 93.6;
      reactivePower = -13.4;
      freq = 59.980;
    } else if (isXinying) {
      baseSoc = 30.6;
      baseSoh = 98.5;
      siteName = "盛大新營場";
      realPower = 960.7;
      reactivePower = -5.0;
      freq = 60.020;
    } else if (isWanxing) {
      baseSoc = 45.2;
      baseSoh = 97.2;
      siteName = "高雄灣興";
      realPower = 450.5;
      reactivePower = -8.2;
      freq = 60.005;
    } else if (isBeimen) {
      baseSoc = 0.0;
      baseSoh = 93.0;
      siteName = "鳳山北門";
      realPower = -42.6;
      reactivePower = 75.6;
      freq = 60.005;
    } else if (isDalian) {
      baseSoc = 33.28;
      baseSoh = 99.1;
      siteName = "屏東大連";
      realPower = -88.2;
      reactivePower = 168.0;
      freq = 60.030;
    }
    
    // Generate individual devices based on site - Consistent logic for all
    const devices = (isChiayi || isWanxing || isBeimen)
      ? Array.from({ length: isChiayi ? 10 : (isBeimen ? 20 : 6) }).map((_, i) => {
          let soc = baseSoc + (Math.random() - 0.5) * 5;
          let temp = 19.0 + (Math.random() - 0.5) * 2;
          let name = `電池模組 ${i+1}`;
          
          if (isBeimen) {
            const beimenSocs = [
              46.2, 46.5, 48.0, 44.0, 46.9, 44.6, 45.8, 46.4, 47.8, 46.8,
              36.7, 44.7, 44.6, 45.5, 46.1, 46.9, 43.7, 43.3, 46.3, 42.2
            ];
            soc = beimenSocs[i] || 45.0;
            temp = 30.0;
            name = i < 10 ? `ESS1-MOD ${i+1}` : `ESS2-MOD ${i-9}`;
          }
          
          return {
            id: `MOD-${i+1}`,
            name,
            status: Math.random() > 0.98 ? "warning" : "normal",
            soc: Math.max(0, Math.min(100, soc)),
            temp,
            voltage: (isBeimen || isChiayi) ? 1200 + (Math.random() - 0.5) * 10 : 480 + (Math.random() - 0.5) * 5
          };
        })
      : Array.from({ length: isDalian ? 5 : 6 }).map((_, i) => {
          const dalianSoc = [36.0, 36.0, 36.5, 37.0, 36.0];
          const dalianTemp = [34.0, 31.0, 29.7, 34.5, 30.2];
          return {
            id: `MP-0${i+1}`,
            name: `Megapack #${i+1}`,
            status: Math.random() > 0.98 ? "warning" : "normal",
            soc: isDalian ? dalianSoc[i] : (baseSoc + (Math.random() - 0.5) * 10),
            temp: isDalian ? dalianTemp[i] : (30.0 + (Math.random() - 0.5) * 5),
            voltage: 91.6 + (Math.random() - 0.5) * 0.1
          };
        });

    const currentSoc = baseSoc + (Math.random() - 0.5) * 0.2;
    const currentTemp = (isChiayi || isWanxing) ? (19.0 + Math.random() * 2) : (25.7 + Math.random() * 2);
    const fireAlarm = Math.random() > 0.9995; // Rare fire alarm possible for ALL sites

    // Threshold-based alerts
    const alerts = [];
    
    // 1. 系統級告警
    if (currentSoc < 20) {
      alerts.push({ id: `soc-low-sys-${Date.now()}`, type: "warning", message: "系統電能低水平 (low_state_of_energy)", time: now.toISOString() });
    }
    
    // 2. 設備級告警
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

    if (currentTemp > 35) alerts.push({ id: `temp-high-${Date.now()}`, type: "critical", message: "電池溫度異常過高", time: now.toISOString() });
    if (fireAlarm) alerts.push({ id: `fire-${Date.now()}`, type: "critical", message: "!!! 偵測到火警訊號 !!!", time: now.toISOString() });
    
    return {
      siteName,
      deviceId,
      timestamp: now.toISOString(),
      system: {
        status: alerts.length > 0 ? (alerts.some(a => a.type === 'critical') ? "critical" : "warning") : "normal",
        uptime: isChiayi ? "156d 08h 45m" : "89d 12h 10m",
        connection: "online",
        frequency: freq + (Math.random() - 0.5) * 0.01,
        bus_voltage: (isChiayi || isBeimen || isDalian) ? (isDalian ? 23093.0 : (isBeimen ? 23059.5 : 1261.8)) + (Math.random() - 0.5) * 10 : 480.0 + (Math.random() - 0.5) * 5,
        real_power_kw: realPower + (Math.random() - 0.5) * 2,
        reactive_power_kvar: reactivePower + (Math.random() - 0.5) * 0.5,
        execution_rate: 100.0,
      },
      battery: {
        soc: currentSoc,
        soh: baseSoh,
        voltage: isChiayi ? (1261.8 + Math.random() * 5) : (91.6 + Math.random() * 2),
        current: isChiayi ? (41.0 + (Math.random() - 0.5) * 2) : (41.0 + (Math.random() - 0.5) * 1),
        temp: currentTemp,
        max_temp: {
          value: isChiayi ? 19.0 : 32.5,
          position: isChiayi ? "Module-04-Cell-02" : "Megapack-01"
        },
        min_temp: {
          value: isChiayi ? 15.0 : 25.3,
          position: isChiayi ? "Module-01-Cell-08" : "Megapack-01-Ambient"
        }
      },
      devices,
      safety: {
        fire_alarm: fireAlarm,
        door_status: "closed",
        emergency_stop: false
      },
      power: {
        pv_kw: (isWanxing || isBeimen) ? 150.0 + Math.random() * 20 : 27.7 + Math.random() * 5,
        load_kw: realPower + Math.random() * 3,
        grid_kw: -2.5 + Math.random() * 1,
        battery_kw: 5.0 + Math.random() * 2,
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

        const response = await fetch(`${baseUrl}/device/${deviceId}/history?range=24h`, {
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
      // ONLY use mock if NO API is configured at all (for initial demo/dev)
      let baseSoc = 50;
      let basePower = 100;
      let baseFreq = 60.0;
      
      if (site === 'chiayi') { baseSoc = 70; basePower = 90; baseFreq = 59.98; }
      else if (site === 'xinying') { baseSoc = 50; basePower = 900; baseFreq = 60.02; }
      else if (site === 'wanxing') { baseSoc = 45; basePower = 450; baseFreq = 60.00; }
      else if (site === 'beimen') { baseSoc = 0.0; basePower = -42.6; baseFreq = 60.005; }
      else if (site === 'dalian') { baseSoc = 33.28; basePower = -88.2; baseFreq = 60.03; }

      history = Array.from({ length: 48 }).map((_, i) => {
        const hour = Math.floor(i / 2);
        const min = (i % 2) * 30;
        return {
          time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
          soc: baseSoc + (Math.sin(i / 5) * 5) + (Math.random() * 2),
          power: basePower + (Math.random() - 0.5) * 150, // More fluctuation
          frequency: baseFreq + (Math.random() - 0.5) * 0.08, // More fluctuation
          execution_rate: 100.0 - (Math.random() * 0.1), // Very stable near 100%
          reactive_power: (basePower * 0.2) + (Math.random() - 0.5) * 20,
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
