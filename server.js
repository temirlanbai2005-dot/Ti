import express from 'express';
import fetch from 'node-fetch';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION ---
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
// Use VITE_API_KEY if API_KEY is missing (Render might set it differently)
const API_KEY = process.env.API_KEY || process.env.VITE_API_KEY;

// In-memory storage for the server bot (resets on deploy/restart)
let tasks = [];
let notes = [];
let lastUpdateId = 0;

// --- AI HELPER ---
const generateAIResponse = async (prompt) => {
    if (!API_KEY) return "Error: Server API_KEY is missing.";
    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        // Correctly access text property (not function)
        return response.text || "No response.";
    } catch (e) {
        console.error("AI Error:", e);
        return "AI Service Unavailable.";
    }
};

// --- TELEGRAM LOGIC ---
const sendTelegram = async (text) => {
    if (!TELEGRAM_TOKEN || !CHAT_ID) return;
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: 'Markdown' })
        });
    } catch (e) { console.error("Telegram Send Error:", e); }
};

const processCommands = async () => {
    if (!TELEGRAM_TOKEN) return;
    try {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`);
        const data = await res.json();
        
        if (data.ok && data.result.length > 0) {
            for (const update of data.result) {
                lastUpdateId = update.update_id;
                const text = update.message?.text || "";
                
                if (!text) continue;

                console.log(`Received command: ${text}`);

                if (text.startsWith("/task")) {
                    const content = text.replace("/task", "").trim();
                    if(content) {
                        tasks.push({ id: Date.now(), text: content, done: false });
                        await sendTelegram(`✅ *Задача добавлена:* ${content}`);
                    } else {
                        await sendTelegram("⚠️ Напишите текст задачи: `/task Купить хлеб`");
                    }
                } 
                else if (text.startsWith("/note")) {
                    const content = text.replace("/note", "").trim();
                    notes.push({ id: Date.now(), text: content });
                    await sendTelegram(`📌 *Заметка сохранена.*`);
                }
                else if (text.startsWith("/list")) {
                    const active = tasks.filter(t => !t.done).map((t, i) => `${i+1}. ⬜ ${t.text}`).join('\n');
                    const done = tasks.filter(t => t.done).map(t => `✅ ${t.text}`).join('\n');
                    await sendTelegram(`📋 *Список Задач:*\n\n${active || "Нет активных задач"}\n\n${done ? `*Выполнено:*\n${done}` : ""}`);
                }
                else if (text.startsWith("/done")) {
                    const index = parseInt(text.replace("/done", "").trim()) - 1;
                    const active = tasks.filter(t => !t.done);
                    if (active[index]) {
                        active[index].done = true;
                         await sendTelegram(`👍 Задача "${active[index].text}" выполнена!`);
                    } else {
                        await sendTelegram("❌ Неверный номер задачи.");
                    }
                }
                else if (text.startsWith("/idea")) {
                    await sendTelegram("💡 *Генерирую идею...*");
                    const idea = await generateAIResponse("Generate one unique, viral 3D art content idea for Instagram. Short & punchy.");
                    await sendTelegram(`💎 *Идея:*\n${idea}`);
                }
                else if (text.startsWith("/help")) {
                     await sendTelegram(`🤖 *Бот активен (Сервер)*\n/task [текст]\n/note [текст]\n/list\n/done [номер]\n/idea`);
                }
            }
        }
    } catch (e) {
        // console.error("Polling Error:", e.message); 
    }
};

// Start Polling Loop (Independent of requests)
setInterval(processCommands, 3000);

// --- SERVER ROUTES ---

// 1. Serve Static Assets (Frontend)
app.use(express.static(path.join(__dirname, 'dist')));

// 2. Keep-Alive Endpoint (External pinger hits this)
app.get('/ping', (req, res) => {
    res.status(200).send('alive');
});

// 3. Fallback to index.html for React Router
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("Telegram Bot Background Worker Started.");
});
