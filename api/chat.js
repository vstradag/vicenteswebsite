import Groq from "groq-sdk";
import { vicenteKnowledge } from "../src/data/vicenteKnowledge.js";
import { publications, findRelevantPublications } from "../src/data/publications.js";

/** Convert knowledge object to LLM-ready text. Extend when adding new modules. */
function formatKnowledgeForPrompt(knowledge) {
  const lines = [];

  if (knowledge.summary) lines.push(`SUMMARY\n${knowledge.summary}\n`);

  if (knowledge.researchAreas?.length)
    lines.push(
      `RESEARCH AREAS\n${knowledge.researchAreas.join("; ")}\n`
    );

  if (knowledge.methods?.length)
    lines.push(`METHODS & TOOLS\n${knowledge.methods.join("; ")}\n`);

  if (knowledge.roles?.length) {
    const roleEntries = knowledge.roles.map(
      (r) =>
        `- ${r.title}, ${r.institution} (${r.period}, ${r.location}): ${r.description}`
    );
    lines.push(`RESEARCH EXPERIENCE\n${roleEntries.join("\n")}\n`);
  }

  if (knowledge.teaching?.length) {
    const teachEntries = knowledge.teaching.map(
      (t) => `- ${t.role}, ${t.institution} (${t.period}): ${t.description}`
    );
    lines.push(`TEACHING\n${teachEntries.join("\n")}\n`);
  }

  if (knowledge.education?.length) {
    const eduEntries = knowledge.education.map(
      (e) =>
        `- ${e.degree}, ${e.institution} (${e.period}). Supervisor: ${e.supervisor}. Thesis: ${e.thesis}`
    );
    lines.push(`EDUCATION\n${eduEntries.join("\n")}\n`);
  }

  if (knowledge.grants?.length) {
    const grantEntries = knowledge.grants.map((g) => {
      let s = `- ${g.role}: ${g.name} (${g.period})`;
      if (g.amount) s += `, ${g.amount}`;
      if (g.description) s += `. ${g.description}`;
      return s;
    });
    lines.push(`GRANTS & AWARDS\n${grantEntries.join("\n")}\n`);
  }

  if (knowledge.supervision?.length)
    lines.push(`SUPERVISION & MENTORSHIP\n${knowledge.supervision.join("\n")}\n`);

  if (knowledge.languages?.length)
    lines.push(`LANGUAGES\n${knowledge.languages.join("; ")}\n`);

  if (knowledge.collaboration)
    lines.push(`COLLABORATION\n${knowledge.collaboration}`);

  if (knowledge.contact) {
    const c = knowledge.contact;
    lines.push(
      `CONTACT (always include when discussing collaboration, supervision, or how to reach Vicente)\n` +
        `Email: ${c.email}\n` +
        `Send proposal (click to open email): ${c.mailtoProposal}\n` +
        `LinkedIn: ${c.linkedin}\n` +
        `Portfolio: ${c.portfolio}`
    );
  }

  return lines.join("\n").trim();
}

/** Broader triggers: research, work, projects, interests, etc. */
function shouldInjectPublicationContext(userMessage) {
  const q = userMessage.toLowerCase();
  const triggers = [
    "paper", "papers", "publication", "publications", "publish", "published",
    "journal", "doi", "article", "articles", "thesis", "chapter",
    "study", "studies", "work on", "wrote about",
    "research", "researches", "researcher", "focus", "focuses",
    "interest", "interests", "project", "projects",
    "key publication", "key publications", "eye-tracking", "collaboration",
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

    const publicationContext = shouldInjectPublicationContext(lastUserMessage)
      ? formatPublicationContext(lastUserMessage)
      : "";

    const systemPrompt = `You are Vicente's Research Assistant.

Base knowledge about Vicente:
${formatKnowledgeForPrompt(vicenteKnowledge)}

${
  publicationContext
    ? `Relevant publications for this question:
${publicationContext}`
    : ""
}

Rules:
- Be concise, clear, and helpful.
- Answer directly from the provided knowledge. Never say that "the knowledge is empty", "the provided knowledge does not specify", "I don't have information", or similar disclaimers about missing knowledge.
- When something is not covered, give the best answer you can from related context, then invite the visitor to check Vicente's Google Scholar (scholar.google.com/citations?user=0YSmKi4AAAAJ) or website (vicenteestrada.com) for more.
- When discussing a publication, use only the exact DOI URL provided in the publication context. If "DOI URL: not available" is shown, do not invent or guess a link; simply mention the title and suggest checking Google Scholar for the latest.
- When discussing collaboration opportunities, ALWAYS include: (1) Vicente's email vicente.estrada.go@gmail.com, (2) the mailto link mailto:vicente.estrada.go@gmail.com?subject=Collaboration%20Proposal so visitors can click to open their email client with a proposal subject, and (3) LinkedIn https://www.linkedin.com/in/vicentesg/. Invite them to send a proposal.
- Do not invent papers, DOIs, journals, affiliations, dates, or results.`;

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