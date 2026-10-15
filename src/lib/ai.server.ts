import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import type { z } from "zod";

const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";
const MODEL = "openai/gpt-6-astra";

function runIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID_HEADER)) headers.set(RUN_ID_HEADER, runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get(RUN_ID_HEADER)?.trim() || undefined;
    return res;
  };
}

export class AiError extends Error {}

export async function generateStructured<T>(schema: z.ZodType<T>, instructions: string, prompt: string): Promise<T> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError("AI is not configured.");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch(),
  });
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      instructions,
      prompt,
      maxRetries: 0,
      output: Output.object({ schema }),
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    return (await result.output) as T;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      try {
        return schema.parse(JSON.parse(error.text));
      } catch {
        /* fall through */
      }
    }
    const status = (error as { statusCode?: number })?.statusCode;
    if (status === 429) throw new AiError("Too many requests right now. Please wait a moment and try again.");
    if (status === 402) throw new AiError("AI credits are used up. Add credits in workspace billing to continue.");
    if (status === 403) throw new AiError("AI access is not available for this workspace.");
    console.error(error);
    throw new AiError("The AI could not complete this request. Please try again.");
  }
}
