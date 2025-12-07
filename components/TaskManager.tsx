
import React, { useState } from 'react';
import { Task, Note, AppSettings } from '../types';
import { CheckSquare, StickyNote, Plus, Trash2, Calendar, Clock, CheckCircle } from 'lucide-react';

interface TaskManagerProps {
  tasks: Task[];
  notes: Note[];
  onUpdateTasks: (tasks: Task[]) => void;
  onUpdateNotes: (notes: Note[]) => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ 
  tasks, notes, onUpdateTasks, onUpdateNotes, settings, onUpdateSettings 
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isDaily, setIsDaily] = useState(false);
  const [newNoteInput, setNewNoteInput] = useState('');

  // --- Task Handlers ---
  const addTask = () => {
    if (!newTaskInput.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskInput,
      completed: false,
      isDaily: isDaily,
      createdAt: Date.now()
    };
    onUpdateTasks([newTask, ...tasks]);
    setNewTaskInput('');
    setIsDaily(false);
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    onUpdateTasks(updated);
  };

  const deleteTask = (id: string) => {
    onUpdateTasks(tasks.filter(t => t.id !== id));
  };

  // --- Note Handlers ---
  const addNote = () => {
    if (!newNoteInput.trim()) return;
    const newNote: Note = {
      id: Date.now().toString(),
      text: newNoteInput,
      createdAt: Date.now()
    };
    onUpdateNotes([newNote, ...notes]);
    setNewNoteInput('');
  };

  const deleteNote = (id: string) => {
    onUpdateNotes(notes.filter(n => n.id !== id));
  };

  // --- Settings Handlers ---
  const toggleDailyReminders = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ ...settings, enableDailyReminders: e.target.checked });
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ ...settings, dailyReminderTime: e.target.value });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-8 h-8 text-emerald-400" />
            Organizer
          </h2>
          <p className="text-slate-400">Manage your to-dos and ideas, synced with Telegram.</p>
        </div>

        {/* Reminder Settings */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex items-center gap-4">
           <div className="flex items-center gap-2">
             <Clock className="w-4 h-4 text-emerald-400" />
             <span className="text-sm text-slate-300">Daily Reminder</span>
           </div>
           <input 
              type="time" 
              value={settings.dailyReminderTime || "09:00"} 
              onChange={handleTimeChange}
              className="bg-slate-950 border border-slate-700 rounded p-1 text-xs text-white focus:outline-none focus:border-emerald-500"
           />
           <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.enableDailyReminders || false} onChange={toggleDailyReminders} className="sr-only peer" />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
           </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'tasks' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-500'}`}
        >
          <CheckSquare className="w-4 h-4" /> TASKS
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'notes' ? 'border-amber-500 text-white' : 'border-transparent text-slate-500'}`}
        >
          <StickyNote className="w-4 h-4" /> NOTES
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'tasks' && (
          <div className="h-full flex flex-col gap-4">
             {/* Input */}
             <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Add a new task..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button 
                  onClick={() => setIsDaily(!isDaily)}
                  className={`p-4 rounded-xl border transition-all ${isDaily ? 'bg-indigo-900/50 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                  title="Mark as Daily Task (Repeats)"
                >
                  <Calendar className="w-5 h-5" />
                </button>
                <button onClick={addTask} className="p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl">
                  <Plus className="w-5 h-5" />
                </button>
             </div>

             {/* List */}
             <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {tasks.length === 0 ? (
                  <div className="text-center text-slate-600 mt-10">No tasks. Add one or type /task in Telegram.</div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${task.completed ? 'bg-slate-900/30 border-slate-800 opacity-50' : 'bg-slate-800 border-slate-700'}`}>
                       <button onClick={() => toggleTask(task.id)} className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 hover:border-emerald-400'}`}>
                          {task.completed && <CheckCircle className="w-4 h-4 text-white" />}
                       </button>
                       <div className="flex-1">
                          <p className={`font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{task.text}</p>
                          {task.isDaily && <span className="text-[10px] text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded border border-indigo-500/30">Daily Recurring</span>}
                       </div>
                       <button onClick={() => deleteTask(task.id)} className="text-slate-500 hover:text-red-400 p-2">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="h-full flex flex-col gap-4">
             {/* Input */}
             <div className="flex gap-2">
                <textarea
                  value={newNoteInput}
                  onChange={(e) => setNewNoteInput(e.target.value)}
                  onKeyDown={(e) => {
                      if(e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          addNote();
                      }
                  }}
                  placeholder="Write a note..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none h-20"
                />
                <button onClick={addNote} className="px-6 bg-amber-600 hover:bg-amber-500 text-white rounded-xl">
                  <Plus className="w-5 h-5" />
                </button>
             </div>

             {/* Grid */}
             <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                {notes.length === 0 ? (
                   <div className="col-span-full text-center text-slate-600 mt-10">No notes yet.</div>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="bg-amber-900/10 border border-amber-500/20 p-5 rounded-xl flex flex-col relative group">
                        <p className="text-slate-300 text-sm whitespace-pre-wrap">{note.text}</p>
                        <div className="mt-4 pt-4 border-t border-amber-500/10 flex justify-between items-center">
                            <span className="text-xs text-slate-600">{new Date(note.createdAt).toLocaleDateString()}</span>
                            <button onClick={() => deleteNote(note.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;
