
import React, { useState, useEffect, useRef } from 'react';
import { AppMode, AppSettings, LLMSource, GeneratorState, TrendItem, TrendCategory, Task, Note } from './types';
import { DEFAULT_STYLE, TELEGRAM_HELP_MESSAGE } from './constants';
import { analyzeTrends, sendTelegramNotification, checkTelegramCommands, sendTelegramMessage, generateCreativeIdea } from './services/aiService';
import PostGenerator from './components/PostGenerator';
import TrendAnalyzer from './components/TrendAnalyzer';
import WorkAnalyzer from './components/WorkAnalyzer';
import BusinessCenter from './components/BusinessCenter';
import TaskManager from './components/TaskManager'; // NEW
import Settings from './components/Settings';
import { LayoutDashboard, PenTool, Settings as SettingsIcon, Image as ImageIcon, Briefcase, Activity, CheckSquare } from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
    userStyle: DEFAULT_STYLE,
    targetLanguage: 'Russian', 
    llmSource: LLMSource.CloudGemini,
    customApiUrl: 'http://localhost:11434/v1/chat/completions',
    customApiKey: '',
    telegramBotToken: '',
    telegramChatId: '',
    enableDailyReminders: false,
    dailyReminderTime: "09:00"
};

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.Generator);
  const [generatorState, setGeneratorState] = useState<GeneratorState>({});
  
  // 1. Settings Persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
      const saved = localStorage.getItem('app_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
      localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);

  // 2. Trend Logic Lifted
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [activeTrendCategory, setActiveTrendCategory] = useState<TrendCategory>(TrendCategory.General);
  const [autoMonitor, setAutoMonitor] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // 3. Task & Note Persistence
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('app_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('app_notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [lastReminderDate, setLastReminderDate] = useState<string>(''); // YYYY-MM-DD

  useEffect(() => { localStorage.setItem('app_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('app_notes', JSON.stringify(notes)); }, [notes]);
  
  // Telegram Polling Ref
  const lastUpdateIdRef = useRef(0);

  const handleTrendSelect = (trend: TrendItem) => {
      setGeneratorState({
          initialTopic: `${trend.trendName}: ${trend.description}. Focus on: ${trend.hypeReason}. Vibe: ${trend.vibe || 'Trending'}`,
          initialPlatform: trend.platform
      });
      setCurrentMode(AppMode.Generator);
  };

  const performScan = async (silent = false) => {
      if(!silent) setIsScanning(true);
      try {
          const result = await analyzeTrends(settings, activeTrendCategory);
          if(result.length > 0) {
              setTrends(result);
              if(silent && settings.telegramBotToken) {
                  await sendTelegramNotification(settings, result[0]);
              }
          }
      } catch(e) { console.error(e); }
      if(!silent) setIsScanning(false);
  };

  // 4. Global Monitoring Loop
  useEffect(() => {
      if(!settings.telegramBotToken) return;

      const intervalId = setInterval(async () => {
          // A. Check Telegram Commands
          const { command, payload, nextUpdateId, chatId } = await checkTelegramCommands(settings, lastUpdateIdRef.current);
          lastUpdateIdRef.current = nextUpdateId;

          if (command && chatId) {
             const targetChatId = chatId.toString();

             if (command === 'add_task' && payload) {
                 const newTask: Task = { id: Date.now().toString(), text: payload, completed: false, isDaily: false, createdAt: Date.now() };
                 setTasks(prev => [newTask, ...prev]);
                 await sendTelegramMessage({ ...settings, telegramChatId: targetChatId }, `✅ Задача добавлена: "${payload}"`);
             }
             else if (command === 'add_note' && payload) {
                 const newNote: Note = { id: Date.now().toString(), text: payload, createdAt: Date.now() };
                 setNotes(prev => [newNote, ...prev]);
                 await sendTelegramMessage({ ...settings, telegramChatId: targetChatId }, `📌 Заметка сохранена.`);
             }
             else if (command === 'list_tasks') {
                 // Format list for Telegram
                 const todo = tasks.filter(t => !t.completed).map((t, i) => `${i+1}. ⬜ ${t.text}`).join('\n');
                 const done = tasks.filter(t => t.completed).map(t => `✅ ${t.text}`).join('\n');
                 const msg = `📋 *ВАШИ ЗАДАЧИ:*\n\n${todo || "Нет активных задач"}\n\n${done ? `*Выполнено:*\n${done}` : ""}`;
                 await sendTelegramMessage({ ...settings, telegramChatId: targetChatId }, msg);
             }
             else if (command === 'done_task' && payload) {
                // Try to parse index (1-based)
                const index = parseInt(payload) - 1;
                const activeTasks = tasks.filter(t => !t.completed);
                
                if (!isNaN(index) && index >= 0 && index < activeTasks.length) {
                    const targetId = activeTasks[index].id;
                    setTasks(prev => prev.map(t => t.id === targetId ? { ...t, completed: true } : t));
                    await sendTelegramMessage({ ...settings, telegramChatId: targetChatId }, `👍 Задача "${activeTasks[index].text}" выполнена!`);
                } else {
                    await sendTelegramMessage({ ...settings, telegramChatId: targetChatId }, `❌ Неверный номер задачи. Используйте /list чтобы узнать номера.`);
                }
             }
             else if (command === 'check_trends') {
                 await sendTelegramMessage({ ...settings, telegramChatId: targetChatId }, "🔍 *Сканирую тренды...*");
                 await performScan(true);
             } 
             else if (command === 'get_idea') {
                 await sendTelegramMessage({ ...settings, telegramChatId: targetChatId }, "💡 *Генерирую идею...*");
                 const idea = await generateCreativeIdea(settings);
                 await sendTelegramMessage({ ...settings, telegramChatId: targetChatId }, `💎 *Идея для контента:*\n\n${idea}`);
             }
             else if (command === 'get_help' || command === 'start') {
                 await sendTelegramMessage({ ...settings, telegramChatId: targetChatId }, TELEGRAM_HELP_MESSAGE);
             }
             else if (command === 'get_status') {
                 await sendTelegramMessage({ ...settings, telegramChatId: targetChatId }, "✅ *Сервер в порядке*");
             }
          }

          // B. Daily Reminder Logic
          if (settings.enableDailyReminders && settings.dailyReminderTime) {
             const now = new Date();
             const todayStr = now.toISOString().split('T')[0];
             const [hour, minute] = settings.dailyReminderTime.split(':').map(Number);
             
             // Check if it's time (within this minute) and haven't sent today
             if (now.getHours() === hour && now.getMinutes() === minute && lastReminderDate !== todayStr) {
                 const activeTasks = tasks.filter(t => !t.completed);
                 if (activeTasks.length > 0) {
                     const list = activeTasks.map(t => `▫️ ${t.text}`).join('\n');
                     await sendTelegramMessage(settings, `🌅 *Доброе утро! Ваши задачи на сегодня:*\n\n${list}`);
                 } else {
                     await sendTelegramMessage(settings, `🌅 *Доброе утро!* У вас пока нет задач на сегодня.`);
                 }
                 setLastReminderDate(todayStr);
             }
          }
          
      }, 3000); 

      return () => clearInterval(intervalId);
  }, [settings, tasks, notes, autoMonitor, lastReminderDate]);


  const renderContent = () => {
    switch (currentMode) {
      case AppMode.Generator:
        return <PostGenerator settings={settings} initialTopic={generatorState.initialTopic} initialPlatform={generatorState.initialPlatform} />;
      case AppMode.Trends:
        return <TrendAnalyzer settings={settings} onSelectTrend={handleTrendSelect} trends={trends} activeCategory={activeTrendCategory} onCategoryChange={setActiveTrendCategory} autoMonitor={autoMonitor} onAutoMonitorChange={setAutoMonitor} isScanning={isScanning} onManualScan={() => performScan(false)} />;
      case AppMode.VisualAudit:
        return <WorkAnalyzer settings={settings} />;
      case AppMode.Business:
        return <BusinessCenter settings={settings} />;
      case AppMode.Tasks:
        return <TaskManager tasks={tasks} notes={notes} onUpdateTasks={setTasks} onUpdateNotes={setNotes} settings={settings} onUpdateSettings={setSettings} />;
      case AppMode.Settings:
        return <Settings settings={settings} onUpdate={setSettings} />;
      default:
        return <PostGenerator settings={settings} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <nav className="w-20 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 shrink-0 z-20">
        <div>
          <div className="p-6 flex items-center gap-3 text-indigo-500">
            <LayoutDashboard className="w-8 h-8" />
            <span className="font-bold text-xl hidden md:block tracking-tight">3D Social<span className="text-white">Arch</span></span>
          </div>

          <div className="flex flex-col gap-2 p-4">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 hidden md:block px-3">Content</div>
            <NavButton active={currentMode === AppMode.Generator} onClick={() => setCurrentMode(AppMode.Generator)} icon={<PenTool className="w-5 h-5" />} label="Generator" />
            <NavButton active={currentMode === AppMode.Trends} onClick={() => setCurrentMode(AppMode.Trends)} icon={<Activity className="w-5 h-5" />} label="Trend Radar" />
            
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 mt-4 hidden md:block px-3">Tools</div>
            <NavButton active={currentMode === AppMode.Tasks} onClick={() => setCurrentMode(AppMode.Tasks)} icon={<CheckSquare className="w-5 h-5" />} label="Organizer" />
            <NavButton active={currentMode === AppMode.VisualAudit} onClick={() => setCurrentMode(AppMode.VisualAudit)} icon={<ImageIcon className="w-5 h-5" />} label="Visual Audit" />
            <NavButton active={currentMode === AppMode.Business} onClick={() => setCurrentMode(AppMode.Business)} icon={<Briefcase className="w-5 h-5" />} label="Business" />
            
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 mt-4 hidden md:block px-3">System</div>
            <NavButton active={currentMode === AppMode.Settings} onClick={() => setCurrentMode(AppMode.Settings)} icon={<SettingsIcon className="w-5 h-5" />} label="Settings" />
          </div>
        </div>

        <div className="p-6 border-t border-slate-800">
          <div className="text-xs text-slate-500 hidden md:block">
            <p>Source: {settings.llmSource}</p>
            {settings.telegramBotToken && <p className="text-emerald-400 flex items-center gap-1 mt-1">● Bot Connected</p>}
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-hidden relative w-full">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)`, backgroundSize: '40px 40px' }}></div>
        <div className="relative z-10 h-full overflow-y-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group w-full ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    {icon}
    <span className="font-medium hidden md:block">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white hidden md:block"></div>}
  </button>
);

export default App;
