const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are a knowledgeable older sibling explaining finance to a friend who just got their first job. No jargon. Give a relatable rupee example. Keep it under 3 sentences. End with why it matters to a young earner.

Respond ONLY with valid JSON:
{
  "plainExplanation": "one sentence, zero jargon",
  "example": "real rupee example with specific numbers",
  "whyItMatters": "one sentence about why this affects a young earner right now"
}`;

router.post("/explain", async (req, res) => {
  try {
    const { term, userContext } = req.body;
    if (!term) return res.status(400).json({ error: "Term is required" });

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", systemInstruction: SYSTEM_PROMPT });
    const result = await model.generateContent(
      `Explain this financial term: "${term}"${userContext ? `. Person earns ₹${userContext.salary}/month.` : ""}`
    );
    const raw = result.response.text().replace(/```json|```/g, "").trim();
    res.json({ term, ...JSON.parse(raw) });
  } catch (err) {
    console.error("Jargon API error:", err);
    res.json({
      term: req.body.term,
      plainExplanation: "This is a financial term that affects how your money grows over time.",
      example: "If you invest ₹10,000, this determines how much you get back.",
      whyItMatters: "Understanding this saves you from costly mistakes in your first years of earning.",
    });
  }
});

module.exports = router;
