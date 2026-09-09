import { z } from "zod";
import { fail, handleError, ok } from "@/lib/api";
import { assistantWithLLM, runAssistant } from "@/lib/assistant";
import { ensureSeeded } from "@/lib/seed";
export const dynamic = "force-dynamic";

const schema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant", "ai"]), content: z.string().min(1).max(2000) })).min(1).max(20),
});

export async function POST(req: Request) {
  try {
    const { messages } = schema.parse(await req.json());
    await ensureSeeded();
    const llm = await assistantWithLLM(messages);
    const reply = llm ?? (await runAssistant(messages));
    return ok(reply, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return handleError(e);
  }
}
