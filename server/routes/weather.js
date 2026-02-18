import express from "express";

const router = express.Router();

const API_KEY = process.env.VITE_OPENWEATHER_API_KEY;
const API_BASE_URL = "https://api.openweathermap.org/data/2.5";

router.get("/", async (req, res) => {
  const { lat, lon, city } = req.query;

  if (!API_KEY) {
    return res
      .status(500)
      .json({ error: "Missing OpenWeatherMap API Key on server" });
  }

  try {
    let url = "";
    if (lat && lon) {
      url = `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fr`;
    } else if (city) {
      url = `${API_BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=fr`;
    } else {
      return res
        .status(400)
        .json({ error: "Missing lat/lon or city parameter" });
    }

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      return res
        .status(response.status)
        .json({ error: `OpenWeatherMap Error: ${errorText}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Weather Proxy Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
