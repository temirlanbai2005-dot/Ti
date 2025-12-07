
import { GoogleGenAI } from "@google/genai";
import { AppSettings, LLMSource, SocialPlatform, TrendItem, TrendCategory } from "../types";
import { 
  SYSTEM_INSTRUCTION_GENERATOR, 
  SYSTEM_INSTRUCTION_TRENDS,
  SYSTEM_INSTRUCTION_TRENDS_AUDIO,
  SYSTEM_INSTRUCTION_TRENDS_FORMATS,
  SYSTEM_INSTRUCTION_TRENDS_PLOTS,
  SYSTEM_INSTRUCTION_CRITIQUE,
  SYSTEM_INSTRUCTION_BUSINESS,
  SYSTEM_INSTRUCTION_GROWTH
} from "../constants";

// Helper to create the Gemini client securely
const createGeminiClient = () => {
  // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("API Key is missing. Make sure API_KEY is set in environment variables.");
    throw new Error("API Key is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

interface GeneratePostParams {
  topic: string;
  platform: SocialPlatform;
  settings: AppSettings;
  useSearch?: boolean;
}

/**
 * Performs a raw Google Search using Gemini Flash as a bridge.
 */
const performGoogleSearch = async (query: string): Promise<string> => {
  try {
    const ai = createGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        You are a Search Engine Interface.
        QUERY: "${query}"
        
        INSTRUCTIONS:
        1. Use the 'googleSearch' tool to find the most recent, relevant, and high-traffic information.
        2. Return a comprehensive summary of the SEARCH RESULTS.
        3. Focus on facts, dates, numbers, and specific trend names.
        4. Do NOT write a social media post. Just output the raw information found.
      `,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || "No search results found.";
  } catch (error) {
    console.warn("Search Bridge failed:", error);
    return "Could not fetch online context due to connection error.";
  }
};

export const generatePost = async ({
  topic,
  platform,
  settings,
  useSearch = false
}: GeneratePostParams): Promise<string> => {
  if (settings.llmSource === LLMSource.CloudGemini) {
    try {
      const ai = createGeminiClient();
      const prompt = `
        User Style: ${settings.userStyle}
        Platform: ${platform}
        Language: ${settings.targetLanguage}
        Topic: ${topic}
        
        Task: Write a viral social media post.
        ${useSearch ? "IMPORTANT: Use Google Search to find the latest details about the topic before writing." : ""}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_GENERATOR,
          tools: useSearch ? [{ googleSearch: {} }] : [],
        }
      });
      return response.text || "Error: No content generated.";
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return `Error generating post: ${error.message}`;
    }
  } else {
    let finalPrompt = `
      You are an expert Social Media Copywriter for a 3D Artist.
      STYLE GUIDE: ${settings.userStyle}
      TARGET PLATFORM: ${platform}
      TARGET LANGUAGE: ${settings.targetLanguage}
      TOPIC: ${topic}
      CRITICAL: Output ONLY the post text. No conversational filler.
    `;

    if (useSearch) {
      const googleResults = await performGoogleSearch(topic);
      finalPrompt += `\n\n=== REAL-TIME GOOGLE SEARCH DATA ===\n${googleResults}\n========================================`;
    }
    return generateWithCustomAPI(finalPrompt, settings, SYSTEM_INSTRUCTION_GENERATOR);
  }
};

export const generateCreativeIdea = async (settings: AppSettings): Promise<string> => {
    const prompt = `Generate ONE unique content idea for a 3D Artist (Blender/Maya). Output ONLY the idea. Language: ${settings.targetLanguage}`;
    if (settings.llmSource === LLMSource.CloudGemini) {
        try {
            const ai = createGeminiClient();
            const response = await ai.models.generateContent({model: "gemini-2.5-flash", contents: prompt});
            return response.text || "Showcase a wireframe vs. render comparison.";
        } catch (e) { return "Showcase a wireframe vs. render comparison."; }
    } else {
        return generateWithCustomAPI(prompt, settings, "You are a Creative Director.");
    }
};

export const translatePost = async (content: string, settings: AppSettings): Promise<string> => {
    const prompt = `Translate to ${settings.targetLanguage} (or English if already in target). Maintain formatting. Content: "${content}"`;
    if (settings.llmSource === LLMSource.CloudGemini) {
        try {
            const ai = createGeminiClient();
            const response = await ai.models.generateContent({model: "gemini-2.5-flash", contents: prompt});
            return response.text || content;
        } catch (e) { return content; }
    } else {
        return generateWithCustomAPI(prompt, settings, "You are a Professional Translator.");
    }
};

export const analyzePostImprovement = async (content: string, platform: SocialPlatform, settings: AppSettings): Promise<string> => {
    const prompt = `Analyze this ${platform} post for a 3D artist: "${content}". Target Language: ${settings.targetLanguage}. Give viral score (1-10) and specific improvements.`;
    if (settings.llmSource === LLMSource.CloudGemini) {
      const ai = createGeminiClient();
      const response = await ai.models.generateContent({model: "gemini-2.5-flash", contents: prompt});
      return response.text || "Could not analyze.";
    } else {
      return generateWithCustomAPI(prompt, settings, "You are a Social Media Analyst.");
    }
}

export const analyzeTrends = async (settings: AppSettings, category: TrendCategory = TrendCategory.General): Promise<TrendItem[]> => {
  const jsonSchemaInstruction = `Output requirements: Return ONLY the raw JSON array inside a \`\`\`json block. Structure: [{ "platform": "Instagram", "trendName": "...", "description": "...", "hypeReason": "...", "growthMetric": "...", "vibe": "..." }]`;
  
  // Select system instruction and query based on category
  let systemInstruction = SYSTEM_INSTRUCTION_TRENDS;
  let query = "Find latest 3D Art trends.";

  if (category === TrendCategory.Audio) {
    systemInstruction = SYSTEM_INSTRUCTION_TRENDS_AUDIO;
    query = "Trending audio and songs on TikTok and Instagram Reels for art/tech this week.";
  } else if (category === TrendCategory.Formats) {
    systemInstruction = SYSTEM_INSTRUCTION_TRENDS_FORMATS;
    query = "Viral video editing formats and templates for 3D artists Instagram TikTok.";
  } else if (category === TrendCategory.Plots) {
    systemInstruction = SYSTEM_INSTRUCTION_TRENDS_PLOTS;
    query = "Trending hashtags and satisfying video concepts for 3D rendering.";
  }

  if (settings.llmSource === LLMSource.CloudGemini) {
    try {
      const ai = createGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: `${query}\n${jsonSchemaInstruction}`,
        config: { systemInstruction: systemInstruction, tools: [{ googleSearch: {} }] }
      });
      const trends = parseJsonFromResponse(response.text);
      return trends.map(t => ({ ...t, category }));
    } catch (error: any) { return []; }
  } else {
    try {
      const rawSearchData = await performGoogleSearch(query);
      const localPrompt = `Use this data: ${rawSearchData}. ${jsonSchemaInstruction}`;
      const textResponse = await generateWithCustomAPI(localPrompt, settings, systemInstruction);
      const trends = parseJsonFromResponse(textResponse);
       return trends.map(t => ({ ...t, category }));
    } catch (error) { return []; }
  }
};

// --- TELEGRAM SERVICES ---

export const sendTelegramMessage = async (settings: AppSettings, text: string) => {
    if (!settings.telegramBotToken || !settings.telegramChatId) return;
    
    try {
        await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: settings.telegramChatId,
                text: text,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) {
        console.error("Failed to send basic Telegram message", e);
    }
};

export const sendTelegramNotification = async (settings: AppSettings, trend: TrendItem) => {
    if (!settings.telegramBotToken || !settings.telegramChatId) return;

    let emoji = "🔥";
    if (trend.category === TrendCategory.Audio) emoji = "🎵";
    if (trend.category === TrendCategory.Formats) emoji = "🎬";
    if (trend.category === TrendCategory.Plots) emoji = "📝";

    // Create a rich message template
    const message = `
*📡 3D RADAR ALERT* | ${trend.category || 'General'}

${emoji} *Тренд:* ${trend.trendName}
🎯 *Платформа:* ${trend.platform}
📈 *Показатели:* ${trend.growthMetric || 'Высокая активность'}

🔎 *Почему это хайпит:*
_${trend.hypeReason}_

💡 *Суть:*
${trend.description}

${trend.difficulty ? `⚠️ *Сложность:* ${trend.difficulty}` : ''}
${trend.vibe ? `✨ *Вайб:* ${trend.vibe}` : ''}
    `;

    try {
        await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: settings.telegramChatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) {
        console.error("Failed to send Telegram notification", e);
    }
};

interface TelegramCommandResponse {
  command: string | null;
  payload: string | null;
  nextUpdateId: number;
  chatId?: string;
}

/**
 * Checks Telegram Bot API for new messages (commands)
 */
export const checkTelegramCommands = async (settings: AppSettings, lastUpdateId: number): Promise<TelegramCommandResponse> => {
    if (!settings.telegramBotToken) return { command: null, payload: null, nextUpdateId: lastUpdateId };

    try {
        const response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/getUpdates?offset=${lastUpdateId + 1}&timeout=0`);
        const data = await response.json();
        
        if (data.ok && data.result.length > 0) {
            const lastUpdate = data.result[data.result.length - 1];
            const text: string = lastUpdate.message?.text || "";
            const chatId = lastUpdate.message?.chat?.id;

            let command = null;
            let payload = null;

            if (text.startsWith("/task")) {
                command = "add_task";
                payload = text.replace("/task", "").trim();
            } else if (text.startsWith("/note")) {
                command = "add_note";
                payload = text.replace("/note", "").trim();
            } else if (text.startsWith("/list") || text.startsWith("/tasks")) {
                command = "list_tasks";
            } else if (text.startsWith("/done")) {
                command = "done_task";
                payload = text.replace("/done", "").trim();
            } else if (text.startsWith("/trends") || text.startsWith("/check")) {
                command = "check_trends";
            } else if (text.startsWith("/idea")) {
                command = "get_idea";
            } else if (text.startsWith("/help")) {
                command = "get_help";
            } else if (text.startsWith("/start")) {
                command = "start";
            } else if (text.startsWith("/status")) {
                command = "get_status";
            }

            return { command, payload, nextUpdateId: lastUpdate.update_id, chatId };
        }
    } catch (e) {
        // Silent fail for polling
    }
    return { command: null, payload: null, nextUpdateId: lastUpdateId };
};

// --- NEW FEATURES ---

export const analyzeImage = async (base64Image: string, settings: AppSettings): Promise<string> => {
  // Only Cloud Gemini supports vision reliably for this demo
  if (settings.llmSource !== LLMSource.CloudGemini) {
     return "Visual Audit is only available with Cloud Gemini mode enabled.";
  }
  
  try {
    const ai = createGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/png", data: base64Image } },
          { text: `Analyze this 3D render. Target Language: ${settings.targetLanguage}` }
        ]
      },
      config: { systemInstruction: SYSTEM_INSTRUCTION_CRITIQUE }
    });
    return response.text || "Could not analyze image.";
  } catch (e: any) {
    return `Error analyzing image: ${e.message}`;
  }
};

export const generateBusinessResponse = async (input: string, type: 'chat' | 'pricing' | 'contract', settings: AppSettings): Promise<string> => {
  // Map internal types to system instruction modes
  let promptMode = "";
  if (type === 'chat') promptMode = "COMMUNICATION (Chat Mode)";
  if (type === 'pricing') promptMode = "PRICING ANALYST (Calculator Mode)";
  if (type === 'contract') promptMode = "LEGAL SHIELD (Contract Mode)";

  const prompt = `
    Active Mode: ${promptMode}
    User Input Details: "${input}"
    Target Language: ${settings.targetLanguage}
  `;
  
  if (settings.llmSource === LLMSource.CloudGemini) {
      const ai = createGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION_BUSINESS }
      });
      return response.text || "No response generated.";
  } else {
      return generateWithCustomAPI(prompt, settings, SYSTEM_INSTRUCTION_BUSINESS);
  }
};

export const generateGrowthAdvice = async (input: string, mode: 'mentor' | 'competitors', settings: AppSettings): Promise<string> => {
  const prompt = `
    Mode: ${mode === 'mentor' ? 'MENTOR MODE' : 'COMPETITOR SPY MODE'}
    User Query: "${input}"
    Target Language: ${settings.targetLanguage}
  `;

  if (settings.llmSource === LLMSource.CloudGemini) {
    try {
      const ai = createGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION_GROWTH }
      });
      return response.text || "No advice generated.";
    } catch (e: any) {
      return `Error: ${e.message}`;
    }
  } else {
    return generateWithCustomAPI(prompt, settings, SYSTEM_INSTRUCTION_GROWTH);
  }
};

// --- HELPERS ---

const parseJsonFromResponse = (text: string | undefined): TrendItem[] => {
  if (!text) return [];
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/) || [null, text];
  const jsonString = jsonMatch[1] || "[]";
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) { return []; }
};

async function generateWithCustomAPI(prompt: string, settings: AppSettings, systemInstruction: string): Promise<string> {
  try {
    const body = {
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }],
      stream: false
    };
    const response = await fetch(settings.customApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.customApiKey || 'dummy-key'}` },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response.";
  } catch (error: any) { return `Custom API Error: ${error.message}`; }
}
