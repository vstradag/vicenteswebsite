import Groq from "groq-sdk";
import { vicenteKnowledge } from "../src/data/vicenteKnowledge.js";
import { publications, findRelevantPublications } from "../src/data/publications.js";

function isPublicationQuestion(userMessage) {
  // I detect whether the visitor is probably asking about papers or outputs.
  const q = userMessage.toLowerCase();

  const triggers = [
    "paper",
    "papers",
    "publication",
    "publications",
    "publish",
    "published",
    "journal",
    "doi",
    "article",
    "articles",
    "thesis",
    "chapter",
    "study",
    "studies",
    "work on",
    "wrote about"
  ];

  return triggers.some((term) => q.includes(term));
}

function formatPublicationContext(userMessage) {
  // I retrieve only the most relevant publications for the current question.
  const relevant = findRelevantPublications(userMessage, 5);

  // I fall back to a small featured subset if the question is about publications
  // but my lightweight matcher finds nothing useful.
  const fallback = publications.slice(0, 5);

  const selected = relevant.length > 0 ? relevant : fallback;

  return selected
    .map((pub, index) => {
      const doiLine = pub.doiUrl ? `DOI URL: ${pub.doiUrl}` : "DOI URL: not available";

      return `${index + 1}. ${pub.title}
Authors: ${(pub.authors || []).join(", ")}
Year: ${pub.year}
Journal: ${pub.journal}
Summary: ${pub.summary}
Topics: ${(pub.topics || []).join(", ")}
Recommended for: ${pub.recommendedFor || "General visitors"}
${doiLine}`;
    })
    .join("\n\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY is not set" });
    }

    const { messages } = req.body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res
        .status(400)
        .json({ error: "messages must be a non-empty array" });
    }

    // I extract the latest user message because I use it to decide
    // whether publication context should be injected.
    const lastUserMessage =
      [...messages].reverse().find((m) => m?.role === "user")?.content?.trim() || "";

    const publicationContext = isPublicationQuestion(lastUserMessage)
      ? formatPublicationContext(lastUserMessage)
      : "";

    const systemPrompt = `You are Vicente's Research Assistant.

Base knowledge about Vicente:
${vicenteKnowledge}

${
  publicationContext
    ? `Relevant publications for this question:
${publicationContext}`
    : ""
}

Rules:
- Be concise, clear, and helpful.
- Answer using the provided knowledge first.
- When discussing a publication, mention its title and DOI URL when available.
- Do not invent papers, DOIs, journals, affiliations, dates, or results.
- If the answer is not supported by the provided knowledge, say so clearly.
- If useful, suggest that the visitor check Vicente's Google Scholar or website for more.`;

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ],
      temperature: 0.3,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "No response generated.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown server error",
    });
  }
}