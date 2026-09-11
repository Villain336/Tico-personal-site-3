import {
  streamText,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { ticoSystemPrompt } from "@/content/tico-knowledge";

export const maxDuration = 30;

// Routed through Vercel AI Gateway (ships with the `ai` package). Locally this
// needs AI_GATEWAY_API_KEY in .env.local; on Vercel it authenticates via OIDC.
const MODEL = "openai/gpt-5-mini";

function gatewayConfigured() {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY ||
      process.env.VERCEL_OIDC_TOKEN ||
      process.env.VERCEL,
  );
}

export async function POST(req: Request) {
  if (!gatewayConfigured()) {
    return Response.json(
      {
        error:
          "Ask Tico isn't connected to a model yet. Add AI_GATEWAY_API_KEY to the environment (or deploy on Vercel) to turn it on.",
      },
      { status: 503 },
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  // Keep the context window small — this is a Q&A widget, not a long chat.
  const recent = messages.slice(-12);

  const result = streamText({
    model: MODEL,
    system: ticoSystemPrompt,
    messages: await convertToModelMessages(recent),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
