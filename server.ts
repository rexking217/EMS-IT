import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock EMS Data Generator
  const getMockEMSData = () => {
    const now = new Date();
    return {
      timestamp: now.toISOString(),
      system: {
        status: Math.random() > 0.95 ? "warning" : "normal",
        uptime: "124d 14h 22m",
        connection: "online",
      },
      battery: {
        soc: 75 + Math.sin(now.getTime() / 10000) * 20, // Fluctuating SoC
        soh: 98.2,
        voltage: 480 + Math.random() * 10,
        current: (Math.random() - 0.5) * 100,
        temp: 25 + Math.random() * 5,
      },
      power: {
        pv_kw: 15.5 + Math.random() * 2,
        load_kw: 12.0 + Math.random() * 3,
        grid_kw: -2.5 + Math.random() * 1,
        battery_kw: 5.0 + Math.random() * 2,
      },
      alerts: Math.random() > 0.9 ? [
        { id: Date.now(), type: "warning", message: "電池組 3 溫度略高", time: now.toISOString() }
      ] : []
    };
  };

  // API Endpoints
  app.get("/api/ems/status", (req, res) => {
    res.json(getMockEMSData());
  });

  app.get("/api/ems/history", (req, res) => {
    // Generate last 24 hours of data
    const history = Array.from({ length: 24 }).map((_, i) => ({
      time: `${i}:00`,
      soc: 60 + Math.random() * 30,
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
