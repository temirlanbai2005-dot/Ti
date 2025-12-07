import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
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
  // Use process.env.API_KEY exclusively.
  // Note: Vite config defines this from VITE_API_KEY
  if (!process.env.API_KEY) {
    console.error("API Key is missing. Make sure API_KEY is set in Environment Variables.");
    throw new Error("API Key is missing. Please check Environment Variables.");
  }
  return new GoogleGenerativeAI(process.env.API_KEY);
};

// Disable safety filters to prevent blocking "viral" or "edgy" content
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

interface GeneratePostParams {
  topic: string;
  platform: SocialPlatform;
  settings: AppSettings;
  useSearch?: boolean;
}

/**
 * Performs a raw Google Search using Gemini as a bridge.
 */
const performGoogleSearch = async (query: string): Promise<string> => {
  try {
    const genAI = createGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(`QUERY: "${query}"\nProvide a factual summary based on recent knowledge.`);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.warn("Search Bridge failed:", error);
    return "Could not fetch online context. Ensure Cloud Gemini is active.";
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
      const genAI = createGeminiClient();
      
      const prompt = `
        User Style: ${settings.userStyle}
        Platform: ${platform}
        Language: ${settings.targetLanguage}
        Topic: ${topic}
        Task: Write a viral social media post.
      `;

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", 
        systemInstruction: SYSTEM_INSTRUCTION_GENERATOR,
        safetySettings: SAFETY_SETTINGS
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return `Error generating post: ${error.message || 'Unknown error'}. Check your API Key.`;
    }
  } else {
    // Local / Custom Logic
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
      finalPrompt += `\n\n=== REAL-TIME CONTEXT ===\n${googleResults}\n========================================`;
    }
    return generateWithCustomAPI(finalPrompt, settings, SYSTEM_INSTRUCTION_GENERATOR);
  }
};

export const generateCreativeIdea = async (settings: AppSettings): Promise<string> => {
    const prompt = `Generate ONE unique content idea for a 3D Artist (Blender/Maya). Output ONLY the idea. Language: ${settings.targetLanguage}`;
    if (settings.llmSource === LLMSource.CloudGemini) {
        try {
            const genAI = createGeminiClient();
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                safetySettings: SAFETY_SETTINGS
            });
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (e) { return "Showcase a wireframe vs. render comparison."; }
    } else {
        return generateWithCustomAPI(prompt, settings, "You are a Creative Director.");
    }
};

export const translatePost = async (content: string, settings: AppSettings): Promise<string> => {
    const prompt = `Translate to ${settings.targetLanguage} (or English if already in target). Maintain formatting. Content: "${content}"`;
    if (settings.llmSource === LLMSource.CloudGemini) {
        try {
            const genAI = createGeminiClient();
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                safetySettings: SAFETY_SETTINGS
            });
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (e) { return content; }
    } else {
        return generateWithCustomAPI(prompt, settings, "You are a Professional Translator.");
    }
};

export const analyzePostImprovement = async (content: string, platform: SocialPlatform, settings: AppSettings): Promise<string> => {
    const prompt = `Analyze this ${platform} post for a 3D artist: "${content}". Target Language: ${settings.targetLanguage}. Give viral score (1-10) and specific improvements.`;
    if (settings.llmSource === LLMSource.CloudGemini) {
      try {
        const genAI = createGeminiClient();
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            safetySettings: SAFETY_SETTINGS
        });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (e: any) { return "Analysis failed: " + e.message; }
    } else {
      return generateWithCustomAPI(prompt, settings, "You are a Social Media Analyst.");
    }
}

export const analyzeTrends = async (settings: AppSettings, category: TrendCategory = TrendCategory.General): Promise<TrendItem[]> => {
  const jsonSchemaInstruction = `Output requirements: Return ONLY the raw JSON array inside a \`\`\`json block. Structure: [{ "platform": "Instagram", "trendName": "...", "description": "...", "hypeReason": "...", "growthMetric": "...", "vibe": "..." }]`;
  
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
      const genAI = createGeminiClient();
      const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          systemInstruction: systemInstruction,
          safetySettings: SAFETY_SETTINGS
      });
      
      const result = await model.generateContent(`${query}\n${jsonSchemaInstruction}`);
      const text = result.response.text();
      
      const trends = parseJsonFromResponse(text);
      return trends.map(t => ({ ...t, category }));
    } catch (error: any) { 
        console.error("Trend Analysis Error", error);
        return []; 
    }
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
        console.error("Failed to send Telegram message", e);
    }
};

export const sendTelegramNotification = async (settings: AppSettings, trend: TrendItem) => {
    if (!settings.telegramBotToken || !settings.telegramChatId) return;

    let emoji = "🔥";
    if (trend.category === TrendCategory.Audio) emoji = "🎵";
    if (trend.category === TrendCategory.Formats) emoji = "🎬";
    if (trend.category === TrendCategory.Plots) emoji = "📝";

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

    await sendTelegramMessage(settings, message);
};

interface TelegramCommandResponse {
  command: string | null;
  payload: string | null;
  nextUpdateId: number;
  chatId?: string;
}

export const checkTelegramCommands = async (settings: AppSettings, lastUpdateId: number): Promise<TelegramCommandResponse> => {
    // Handled by server.js
    return { command: null, payload: null, nextUpdateId: lastUpdateId };
};

// --- NEW FEATURES ---

export const analyzeImage = async (base64Image: string, settings: AppSettings): Promise<string> => {
  if (settings.llmSource !== LLMSource.CloudGemini) {
     return "Visual Audit is only available with Cloud Gemini mode enabled.";
  }
  
  try {
    const genAI = createGeminiClient();
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: SYSTEM_INSTRUCTION_CRITIQUE,
        safetySettings: SAFETY_SETTINGS
    });
    
    // Construct image part for stable SDK
    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: "image/png"
        }
    };

    const result = await model.generateContent([
        `Analyze this 3D render. Target Language: ${settings.targetLanguage}`,
        imagePart
    ]);
    return result.response.text();
  } catch (e: any) {
    return `Error analyzing image: ${e.message}`;
  }
};

export const generateBusinessResponse = async (input: string, type: 'chat' | 'pricing' | 'contract', settings: AppSettings): Promise<string> => {
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
      try {
        const genAI = createGeminiClient();
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: SYSTEM_INSTRUCTION_BUSINESS,
            safetySettings: SAFETY_SETTINGS
        });

        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (e: any) { return "Business AI Error: " + e.message; }
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
      const genAI = createGeminiClient();
      const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          systemInstruction: SYSTEM_INSTRUCTION_GROWTH,
          safetySettings: SAFETY_SETTINGS
      });
      const result = await model.generateContent(prompt);
      return result.response.text();
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
  // Ensure we strip markdown code blocks if present
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/) || [null, text];
  const jsonString = jsonMatch[1] || text;
  
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) { 
      console.warn("JSON Parse Failed, raw text:", text);
      return []; 
  }
};

async function generateWithCustomAPI(prompt: string, settings: AppSettings, systemInstruction: string): Promise<string> {
  try {
    const body = {
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }],
      stream: false
    };
    
    if (window.location.protocol === 'https:' && settings.customApiUrl.includes('localhost')) {
       return "🛑 CONFIGURATION ERROR: You are running on Cloud (HTTPS) but trying to access Localhost. Use Cloud Gemini or a public API.";
    }

    const response = await fetch(settings.customApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.customApiKey || 'dummy-key'}` },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response.";
  } catch (error: any) { 
      return `Custom API Error: ${error.message}`; 
  }
}
