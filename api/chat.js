// api/chat.js

import Groq from "groq-sdk";

export default async function handler(req, res) {
  // I ensure only POST requests are allowed
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    // I initialize Groq using the env variable
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // I call the Groq chat model
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are Vicente Estrada Gonzalez's assistant. Be concise, clear, and helpful. Answer questions about his research, eye tracking work, AI tools, and projects.",
        },
        ...messages,
      ],
      temperature: 0.3,
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "No response generated.";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({ error: "Chat failed" });
  }
}