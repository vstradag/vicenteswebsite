import Groq from "groq-sdk";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages,
      temperature: 0.7,
    });

    return new Response(
      JSON.stringify(completion.choices[0].message),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Groq error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500 }
    );
  }
}