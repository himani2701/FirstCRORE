const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const JARGON_SYSTEM_PROMPT = `You are a knowledgeable older sibling who understands finance deeply but explains it like you're texting a friend who just got their first job. You NEVER use jargon in your explanation. You ALWAYS give a relatable rupee example. You keep it under 3 sentences. You end with one sentence about why it matters to a young earner specifically.

Format your response as JSON:
{
  "plainExplanation": "one sentence max, zero jargon",
  "example": "a real rupee example with specific numbers",
  "whyItMatters": "one sentence about why this affects a young earner right now"
}

Only return valid JSON, nothing else.`;

// POST /api/jargon/explain
router.post("/explain", async (req, res) => {
  try {
    const { term, userContext } = req.body;

    if (!term) {
      return res.status(400).json({ error: "Term is required" });
    }

    const userMessage = `Explain this financial term in the simplest way possible: "${term}"${
      userContext
        ? `. The person earns ₹${userContext.salary}/month and is just starting their financial journey.`
        : ""
    }`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: JARGON_SYSTEM_PROMPT,
    });

    const result = await model.generateContent(userMessage);
    const raw = result.response.text();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.json({ term, ...parsed });
  } catch (err) {
    console.error("Jargon API error:", err);
    // fallback so demo doesn't break without API key
    res.json({
      term: req.body.term,
      plainExplanation:
        "This is a financial term that affects how your money grows over time.",
      example: "Think of it like this: if you invest ₹10,000, it changes how much you get back.",
      whyItMatters:
        "Understanding this now saves you from costly mistakes in your first 3 years of earning.",
    });
  }
});

module.exports = router;
