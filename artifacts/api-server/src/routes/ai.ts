import { Router, type IRouter } from "express";
import { db, siteSettingsTable } from "@workspace/db";
import { AiGenerateBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/ai/generate", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AiGenerateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [settings] = await db.select().from(siteSettingsTable);
  const apiKey = settings?.grokApiKey || process.env.GROK_API_KEY;

  if (!apiKey) {
    res.status(400).json({ error: "AI API key not configured. Please add your Grok API key in Settings." });
    return;
  }

  const { action, prompt, existingContent } = parsed.data;

  const systemPrompts: Record<string, string> = {
    generate: "You are an expert blog writer. Write a high-quality, SEO-optimized blog post based on the given topic. Use clear headings, engaging prose, and authoritative tone.",
    expand: "You are an expert blog writer. Expand the provided content with more detail, examples, and depth while maintaining the original style and tone.",
    rewrite: "You are an expert editor. Rewrite the provided content to be more engaging, clear, and SEO-friendly while preserving the core message.",
    summarize: "You are an expert summarizer. Create a concise, engaging summary of the provided content.",
    seo_title: "You are an SEO expert. Generate 5 compelling, click-worthy SEO title options for the given topic or content. Return them as a numbered list.",
    seo_description: "You are an SEO expert. Generate a compelling meta description (150-160 characters) for the given content.",
    suggest_tags: "You are an SEO expert. Suggest 8-10 relevant tags for the given content. Return them as a comma-separated list.",
    suggest_links: "You are a content strategist. Suggest 5 relevant internal link opportunities based on the given content. Return them as a numbered list.",
  };

  const userMessage = existingContent
    ? `Topic/Prompt: ${prompt}\n\nExisting Content:\n${existingContent}`
    : prompt;

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-3",
        messages: [
          { role: "system", content: systemPrompts[action] || systemPrompts.generate },
          { role: "user", content: userMessage },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      res.status(502).json({ error: `AI API error: ${err}` });
      return;
    }

    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
    const result = data.choices[0]?.message?.content ?? "";

    res.json({ result, suggestions: [] });
  } catch (error) {
    res.status(502).json({ error: "Failed to connect to AI service" });
  }
});

export default router;
