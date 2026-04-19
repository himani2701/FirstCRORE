require("dotenv").config();
const express = require("express");
const cors = require("cors");

const optimizerRoutes = require("./routes/optimizer");
const jargonRoutes = require("./routes/jargon");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", optimizerRoutes);
app.use("/api/jargon", jargonRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "FirstCrore API is running" });
});

app.listen(PORT, () => {
  console.log(`\n🪙  FirstCrore server running on http://localhost:${PORT}`);
  console.log(
    `   Gemini API Key: ${process.env.GEMINI_API_KEY ? "✅ Found" : "⚠️  Not set — jargon buster will use fallback"}\n`
  );
});
