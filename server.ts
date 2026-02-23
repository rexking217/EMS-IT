import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock EMS Data Generator
  const getMockEMSData = (site: string) => {
    const now = new Date();
    const isChiayi = site === 'chiayi';
    const baseSoc = isChiayi ? 80 : 65;
    const basePv = isChiayi ? 25 : 18;
    
    return {
      siteName: isChiayi ? "盛大嘉義場" : "盛大新營場",
      deviceId: isChiayi ? "SD-CHIAYI-BESS-01" : "SD-XINYING-BESS-01",
      timestamp: now.toISOString(),
      system: {
        status: Math.random() > 0.98 ? "warning" : "normal",
        uptime: isChiayi ? "156d 08h 45m" : "89d 12h 10m",
        connection: "online",
        frequency: 60.0 + (Math.random() - 0.5) * 0.1,
        bus_voltage: 480 + (Math.random() - 0.5) * 5,
      },
      battery: {
        soc: baseSoc + Math.sin(now.getTime() / 10000) * 15,
        soh: isChiayi ? 99.1 : 97.5,
        voltage: 480 + Math.random() * 10,
        current: (Math.random() - 0.5) * 100,
        temp: 24 + Math.random() * 6,
        max_temp: {
          value: 32 + Math.random() * 2,
          position: "Module-04-Cell-02"
        },
        min_temp: {
          value: 22 + Math.random() * 2,
          position: "Module-01-Cell-08"
        }
      },
      safety: {
        fire_alarm: isChiayi ? (Math.random() > 0.99) : false, // Only Chiayi has fire alarm in V3.0
        door_status: "closed",
        emergency_stop: false
      },
      power: {
        pv_kw: basePv + Math.random() * 5,
        load_kw: (isChiayi ? 15 : 10) + Math.random() * 3,
        grid_kw: -2.5 + Math.random() * 1,
        battery_kw: 5.0 + Math.random() * 2,
      },
      alerts: Math.random() > 0.95 ? [
        { id: Date.now(), type: "warning", message: `${isChiayi ? "嘉義" : "新營"}場：系統級點位偏移校準中`, time: now.toISOString() }
      ] : []
    };
  };

  // API Endpoints
  app.get("/api/ems/status", (req, res) => {
    const site = (req.query.site as string) || 'chiayi';
    res.json(getMockEMSData(site));
  });

  app.get("/api/ems/history", (req, res) => {
    const site = (req.query.site as string) || 'chiayi';
    const isChiayi = site === 'chiayi';
    // Generate last 24 hours of data
    const history = Array.from({ length: 24 }).map((_, i) => ({
      time: `${i}:00`,
      soc: (isChiayi ? 70 : 50) + Math.random() * 25,
      power: (Math.random() - 0.5) * 50,
    }));
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
