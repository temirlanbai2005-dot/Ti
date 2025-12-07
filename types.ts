
export enum SocialPlatform {
  Instagram = 'Instagram',
  Twitter = 'Twitter/X',
  LinkedIn = 'LinkedIn',
  ArtStation = 'ArtStation',
  Telegram = 'Telegram',
  TikTok = 'TikTok',
  Pinterest = 'Pinterest',
  Threads = 'Threads'
}

export enum LLMSource {
  CloudGemini = 'Cloud Gemini',
  Local = 'Local LLM',
  CustomAPI = 'Custom API'
}

export enum AppMode {
  Generator = 'generator',
  Trends = 'trends',
  VisualAudit = 'visual_audit',
  Business = 'business',
  Tasks = 'tasks', // NEW
  Settings = 'settings'
}

export enum TrendCategory {
  General = 'General',
  Audio = 'Viral Audio',
  Formats = 'Video Formats',
  Plots = 'Hashtags & Plots'
}

export interface AppSettings {
  userStyle: string;
  targetLanguage: string;
  llmSource: LLMSource;
  customApiUrl: string;
  customApiKey: string;
  telegramBotToken: string;
  telegramChatId: string;
  // Reminder Settings
  enableDailyReminders: boolean;
  dailyReminderTime: string; // HH:MM format
}

export interface GeneratedPost {
  platform: SocialPlatform;
  content: string;
  critique: string;
  hashtags: string[];
}

export interface TrendItem {
  platform: SocialPlatform;
  trendName: string;
  description: string;
  hypeReason: string;
  category?: TrendCategory;
  growthMetric?: string;
  difficulty?: string;
  vibe?: string;
}

export interface GeneratorState {
  initialTopic?: string;
  initialPlatform?: SocialPlatform;
}

// New Interfaces for Organizer
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  isDaily: boolean; // Reappears every day if true
  createdAt: number;
}

export interface Note {
  id: string;
  text: string;
  createdAt: number;
}
