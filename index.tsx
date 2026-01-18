import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Phone, 
  HardHat as EngineeringIcon, 
  BarChart, 
  ArrowLeftRight as SwapHoriz, 
  CalendarDays as CalendarMonth, 
  Search, 
  CheckCircle, 
  CalendarOff as EventBusy, 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  Sun as LightMode, 
  Moon as DarkMode, 
  Bell as Notifications, 
  User as Person,
  Star,
  Users as Group,
  Activity,
  X,
  RotateCcw,
  FastForward,
  Rewind,
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  FilterX,
  UserPlus,
  Trash2,
  Save
} from 'lucide-react';

// --- Types ---
interface Engineer {
  id: number;
  name: string;
  department: string;
  phone: string;
  avatarColor: string;
  shiftCount: number;
  isAvailable: boolean;
}

interface Schedule {
  weekNumber: number;
  year: number;
  engineerId: number | null;
}

interface WeekInfo {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
}

// --- Constants ---
const STORAGE_KEYS = {
  ENGINEERS: 'support_hotline_engineers_v2',
  SCHEDULES: 'support_hotline_schedules_v2',
  THEME: 'support_hotline_theme_v2'
};

const DEPARTMENTS = ["IT", "Netzwerk", "Security", "Cloud", "DevOps"];
const COLORS = ["#E53935", "#1E88E5", "#43A047", "#FB8C00", "#8E24AA", "#00ACC1", "#3949AB", "#7CB342"];

// --- Helpers ---
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const getDaysUntilNextMonday = (fromDate: Date) => {
  const day = fromDate.getDay();
  const diff = (day === 0 ? 1 : 8 - day);
  return diff;
};

const generateWeeksForYear = (year: number): WeekInfo[] => {
  const weeks: WeekInfo[] = [];
  for (let w = 1; w <= 52; w++) {
    const jan1 = new Date(year, 0, 1);
    const daysToFirstMonday = (8 - jan1.getDay()) % 7;
    const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + (w - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weeks.push({ weekNumber: w, startDate: weekStart, endDate: weekEnd });
  }
  return weeks;
};

// --- Initial Data ---
const NAMES = ["Max Müller", "Anna Schmidt", "Thomas Weber", "Julia Fischer", "Michael Braun"];
const initialEngineers: Engineer[] = NAMES.map((name, i) => ({
  id: i + 1,
  name,
  department: DEPARTMENTS[i % DEPARTMENTS.length],
  phone: `+49 151 ${10000000 + i * 1111111}`,
  avatarColor: COLORS[i % COLORS.length],
  shiftCount: 0,
  isAvailable: true
}));

const SupportHotlineDemo: React.FC = () => {
  // --- State with LocalStorage initialization ---
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem(STORAGE_KEYS.THEME) === 'true');
  const [engineers, setEngineers] = useState<Engineer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ENGINEERS);
    return saved ? JSON.parse(saved) : initialEngineers;
  });
  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    return saved ? JSON.parse(saved) : [];
  });

  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [searchText, setSearchText] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor((new Date().getMonth()) / 3) + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Modals
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [editingEngineer, setEditingEngineer] = useState<Engineer | null>(null);

  const [filterEngineerId, setFilterEngineerId] = useState<number | null>(null);
  const [simulatedDate, setSimulatedDate] = useState(new Date());

  // --- Persistence Effects ---
  useEffect(() => localStorage.setItem(STORAGE_KEYS.THEME, isDarkMode.toString()), [isDarkMode]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.ENGINEERS, JSON.stringify(engineers)), [engineers]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules)), [schedules]);

  // Initial Auto-Schedule if empty for year
  useEffect(() => {
    if (schedules.filter(s => s.year === selectedYear).length === 0) {
      const available = engineers.filter(e => e.isAvailable);
      if (available.length > 0) {
        const newYearScheds = [];
        for (let w = 1; w <= 52; w++) {
          const eng = available[(w - 1) % available.length];
          newYearScheds.push({ weekNumber: w, year: selectedYear, engineerId: eng.id });
        }
        setSchedules(prev => [...prev, ...newYearScheds]);
      }
    }
  }, [selectedYear]);

  // --- Computed Data ---
  const currentWeek = useMemo(() => getWeekNumber(simulatedDate), [simulatedDate]);
  const simulatedYear = simulatedDate.getFullYear();

  const currentOnCall = useMemo(() => {
    const sched = schedules.find(s => s.weekNumber === currentWeek && s.year === simulatedYear);
    return engineers.find(e => e.id === sched?.engineerId);
  }, [schedules, currentWeek, engineers, simulatedYear]);

  const engineersWithCounts = useMemo(() => {
    return engineers.map(eng => ({
      ...eng,
      shiftCount: schedules.filter(s => s.engineerId === eng.id && s.year === selectedYear).length
    }));
  }, [engineers, schedules, selectedYear]);

  const filteredEngineers = useMemo(() => {
    return engineersWithCounts
      .filter(e => e.name.toLowerCase().includes(searchText.toLowerCase()))
      .sort((a, b) => b.shiftCount - a.shiftCount);
  }, [engineersWithCounts, searchText]);

  const allYearWeeks = useMemo(() => generateWeeksForYear(selectedYear), [selectedYear]);

  const displayedWeeks = useMemo(() => {
    const qWeeks = allYearWeeks.slice((selectedQuarter - 1) * 13, selectedQuarter * 13);
    if (!filterEngineerId) return qWeeks;
    return allYearWeeks.filter(week => {
      const sched = schedules.find(s => s.weekNumber === week.weekNumber && s.year === selectedYear);
      return sched?.engineerId === filterEngineerId;
    });
  }, [allYearWeeks, selectedQuarter, schedules, filterEngineerId, selectedYear]);

  const filterEngineer = useMemo(() => 
    engineersWithCounts.find(e => e.id === filterEngineerId), 
  [engineersWithCounts, filterEngineerId]);

  const avgShifts = useMemo(() => {
    if (engineersWithCounts.length === 0) return 0;
    return (engineersWithCounts.reduce((acc, curr) => acc + curr.shiftCount, 0) / engineersWithCounts.length).toFixed(1);
  }, [engineersWithCounts]);

  const adjustWeek = (weeks: number) => {
    const newDate = new Date(simulatedDate);
    newDate.setDate(newDate.getDate() + weeks * 7);
    setSimulatedDate(newDate);
  };

  const handleEditWeek = (week: number) => {
    const existing = schedules.find(s => s.weekNumber === week && s.year === selectedYear);
    setEditingWeek(week);
    setSelectedAssignmentId(existing?.engineerId || null);
  };

  const saveWeekSchedule = () => {
    if (editingWeek === null) return;
    setSchedules(prev => {
      const filtered = prev.filter(s => !(s.weekNumber === editingWeek && s.year === selectedYear));
      return [...filtered, { weekNumber: editingWeek, year: selectedYear, engineerId: selectedAssignmentId }];
    });
    setEditingWeek(null);
  };

  const startEditEngineer = (eng: Engineer) => setEditingEngineer({ ...eng });
  const startAddEngineer = () => {
    const newId = Math.max(0, ...engineers.map(e => e.id)) + 1;
    setEditingEngineer({
      id: newId,
      name: "",
      department: DEPARTMENTS[0],
      phone: "+49 ",
      avatarColor: COLORS[newId % COLORS.length],
      shiftCount: 0,
      isAvailable: true
    });
  };

  const saveEngineer = () => {
    if (!editingEngineer) return;
    if (!editingEngineer.name.trim()) return alert("Bitte einen Namen angeben");
    setEngineers(prev => {
      const exists = prev.find(e => e.id === editingEngineer.id);
      if (exists) return prev.map(e => e.id === editingEngineer.id ? editingEngineer : e);
      return [...prev, editingEngineer];
    });
    setEditingEngineer(null);
  };

  const deleteEngineer = (id: number) => {
    if (confirm("Möchten Sie diesen Ingenieur wirklich löschen?")) {
      setEngineers(prev => prev.filter(e => e.id !== id));
      setSchedules(prev => prev.map(s => s.engineerId === id ? { ...s, engineerId: null } : s));
      if (filterEngineerId === id) setFilterEngineerId(null);
      setEditingEngineer(null);
    }
  };

  const getShiftColor = (count: number) => {
    if (count <= 1) return "bg-red-100 text-red-700 border-red-200";
    if (count <= 3) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  const calendarWeeks = useMemo(() => {
    const startOfMonth = new Date(simulatedDate.getFullYear(), simulatedDate.getMonth(), 1);
    const firstDay = startOfMonth.getDay();
    const daysToSub = firstDay === 0 ? 6 : firstDay - 1;
    const current = new Date(startOfMonth);
    current.setDate(startOfMonth.getDate() - daysToSub);
    
    const weeks = [];
    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [simulatedDate]);

  return (
    <div className={`${isDarkMode ? 'dark bg-slate-900' : 'bg-slate-50'} min-h-screen lg:h-screen lg:overflow-hidden font-sans transition-colors duration-300 flex flex-col`}>
      {/* AppBar */}
      <nav className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-blue-700 border-blue-800'} h-14 flex-none sticky top-0 z-50 flex items-center justify-between px-6 text-white shadow-md`}>
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5" />
          <h1 className="text-lg font-bold tracking-tight hidden sm:block">SupportHotlineDemo</h1>
        </div>

        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl backdrop-blur-sm border border-white/10">
          <button onClick={() => adjustWeek(-1)} className="p-1.5 hover:bg-white/20 rounded-lg"><Rewind className="w-4 h-4" /></button>
          <div className="px-3 py-1 bg-white/10 rounded-lg flex flex-col items-center">
            <span className="text-[9px] leading-none text-white/50 font-bold">KW {currentWeek}</span>
            <span className="text-xs font-black">{simulatedDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
          </div>
          <button onClick={() => adjustWeek(1)} className="p-1.5 hover:bg-white/20 rounded-lg"><FastForward className="w-4 h-4" /></button>
          <button onClick={() => setSimulatedDate(new Date())} className="ml-1 p-1.5 hover:bg-white/20 rounded-lg text-white/50 hover:text-white"><RotateCcw className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            {isDarkMode ? <LightMode className="w-5 h-5" /> : <DarkMode className="w-5 h-5" />}
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full hidden sm:block">
            <Notifications className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full">
            <Person className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="flex-none lg:flex-1 lg:overflow-hidden p-4 sm:p-6 space-y-6 flex flex-col">
        {/* Status Header */}
        <div className="flex-none space-y-6">
          <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-6 rounded-2xl shadow-lg border relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 w-2 h-full ${isDarkMode ? 'bg-blue-500' : 'bg-blue-700'}`}></div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Bereitschaftsdienst</h2>
                <p className="text-slate-400 text-sm">KW {currentWeek} | {simulatedDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
              <div className={`${isDarkMode ? 'bg-slate-700' : 'bg-blue-50'} p-4 rounded-xl flex items-center gap-4 min-w-[280px]`}>
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg"><Activity className="w-6 h-6 animate-pulse" /></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Aktuell im Dienst</p>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{currentOnCall?.name || "Nicht zugewiesen"}</p>
                  <p className="text-slate-500 text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> {currentOnCall?.phone || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[
              { label: "Ingenieure", val: engineers.length, icon: EngineeringIcon, color: "text-blue-500" },
              { label: "Ø Einsätze", val: avgShifts, icon: BarChart, color: "text-amber-500" },
              { label: "Tage bis Wechsel", val: getDaysUntilNextMonday(simulatedDate), icon: SwapHoriz, color: "text-emerald-500" },
              { label: "Zeitraum", val: selectedYear, icon: CalendarMonth, color: "text-cyan-500" }
            ].map((kpi, i) => (
              <div key={i} className={`${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100'} p-4 rounded-2xl shadow-sm border flex items-center justify-between`}>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{kpi.label}</p>
                  <p className="text-2xl font-black">{kpi.val}</p>
                </div>
                <kpi.icon className={`${kpi.color} w-8 h-8 opacity-20`} />
              </div>
            ))}
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-4 rounded-2xl shadow-sm border flex flex-col`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Verteilung (Top 10)</p>
                <BarChart className="w-4 h-4 text-blue-500 opacity-50" />
              </div>
              <div className="flex items-end justify-between h-[42px] gap-1 px-1">
                {engineersWithCounts.sort((a,b) => b.shiftCount - a.shiftCount).slice(0, 10).map((eng, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div 
                      className="w-full rounded-t-[2px] bg-blue-500 opacity-60 group-hover:opacity-100 transition-all cursor-help relative min-h-[4px]" 
                      style={{ height: `${Math.max(10, (eng.shiftCount / 12) * 100)}%` }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap z-[60] font-bold shadow-xl">
                        {eng.name.split(' ')[0]}: {eng.shiftCount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-none lg:flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2">
          {/* Left: Engineer List */}
          <div className="lg:col-span-5 flex flex-col h-full min-h-[400px] lg:min-h-0">
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-6 rounded-2xl shadow-sm border flex flex-col h-full`}>
              <div className="flex-none flex items-center justify-between mb-6 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Group className="w-5 h-5 text-blue-500" />
                  <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Personal</h3>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                   <button onClick={startAddEngineer} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-md">
                    <UserPlus className="w-4 h-4" /> Neu
                  </button>
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" placeholder="Suchen..." 
                      className={`pl-10 pr-4 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 w-full ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200'}`}
                      value={searchText} onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-left text-sm border-separate border-spacing-0">
                  <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500'} uppercase text-[10px] font-bold`}>
                    <tr>
                      <th className="pb-3 border-b dark:border-slate-700">Name</th>
                      <th className="pb-3 border-b dark:border-slate-700 text-center">Einsätze</th>
                      <th className="pb-3 border-b dark:border-slate-700 text-center">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-50'}`}>
                    {filteredEngineers.map((eng) => (
                      <tr key={eng.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                        <td className="py-3 cursor-pointer" onClick={() => setFilterEngineerId(eng.id === filterEngineerId ? null : eng.id)}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex-none flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: eng.avatarColor }}>{eng.name.charAt(0)}</div>
                            <div className="min-w-0">
                              <p className={`font-bold truncate ${filterEngineerId === eng.id ? 'text-blue-500' : (isDarkMode ? 'text-white' : 'text-slate-800')}`}>{eng.name}</p>
                              <p className="text-[10px] text-slate-400">{eng.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getShiftColor(eng.shiftCount)}`}>{eng.shiftCount}</span>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); startEditEngineer(eng); }} className="p-1.5 text-slate-400 hover:text-blue-500"><Edit className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteEngineer(eng.id); }} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Schedule */}
          <div className="lg:col-span-7 flex flex-col h-full min-h-[500px] lg:min-h-0">
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-6 rounded-2xl shadow-sm border flex flex-col h-full`}>
              <div className="flex-none flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex flex-col">
                  <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    {filterEngineerId ? `Plan für ${filterEngineer?.name}` : `Einsatzplan ${selectedYear}`}
                  </h3>
                  {filterEngineerId && (
                    <button onClick={() => setFilterEngineerId(null)} className="text-[10px] font-bold text-blue-500 uppercase mt-0.5 flex items-center gap-1 hover:text-blue-600 transition-colors">
                      <FilterX className="w-3 h-3" /> Filter aufheben
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {!filterEngineerId && (
                    <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                      <button onClick={() => setViewMode('table')} className={`p-1.5 rounded transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-400'}`}><List className="w-4 h-4" /></button>
                      <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4" /></button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg text-xs font-bold text-blue-600">
                    <button onClick={() => setSelectedQuarter(q => q > 1 ? q - 1 : 4)} className="p-1"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="px-2">Q{selectedQuarter}</span>
                    <button onClick={() => setSelectedQuarter(q => q < 4 ? q + 1 : 1)} className="p-1"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {viewMode === 'table' || filterEngineerId ? (
                  <table className="w-full text-left text-sm border-separate border-spacing-0">
                    <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500'} uppercase text-[10px] font-bold`}>
                      <tr>
                        <th className="p-3 border-b dark:border-slate-700">KW</th>
                        <th className="p-3 border-b dark:border-slate-700">Bereitschaft</th>
                        <th className="p-3 border-b dark:border-slate-700 text-center">Status</th>
                        <th className="p-3 border-b dark:border-slate-700 text-center">Aktion</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                      {displayedWeeks.map((week) => {
                        const sched = schedules.find(s => s.weekNumber === week.weekNumber && s.year === selectedYear);
                        const eng = engineers.find(e => e.id === sched?.engineerId);
                        const isActive = week.weekNumber === currentWeek && selectedYear === simulatedYear;
                        return (
                          <tr key={week.weekNumber} className={`${isActive ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''} group`}>
                            <td className="p-3 font-bold">{week.weekNumber}</td>
                            <td className="p-3">
                              {eng ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full flex-none flex items-center justify-center text-[10px] text-white font-bold shadow-sm" style={{ backgroundColor: eng.avatarColor }}>{eng.name.charAt(0)}</div>
                                  <p className={`font-bold text-xs truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{eng.name}</p>
                                </div>
                              ) : <span className="text-slate-300 italic text-xs">Offen</span>}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${isActive ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                {isActive ? 'AKTIV' : 'GEPLANT'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button onClick={() => handleEditWeek(week.weekNumber)} className="p-1.5 text-slate-400 hover:text-blue-500"><Edit className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4 bg-blue-50 dark:bg-slate-700/50 p-3 rounded-xl border dark:border-slate-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            {simulatedDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">KW {currentWeek}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-8 gap-1 mb-2 px-1">
                      <div className="text-center text-[9px] font-black text-slate-400 uppercase">KW</div>
                      {['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'].map(d => (
                        <div key={d} className="text-center text-[9px] font-black text-slate-400 uppercase">{d}</div>
                      ))}
                    </div>

                    <div className="space-y-1">
                      {calendarWeeks.map((week, wIdx) => {
                        const weekNum = getWeekNumber(week[0]);
                        const isSimulatedWeek = weekNum === currentWeek;
                        const sched = schedules.find(s => s.weekNumber === weekNum && s.year === week[0].getFullYear());
                        const eng = engineers.find(e => e.id === sched?.engineerId);

                        return (
                          <div key={wIdx} className={`grid grid-cols-8 gap-1 p-1 rounded-xl transition-all duration-300 ${isSimulatedWeek ? 'bg-blue-100/50 dark:bg-blue-900/20 ring-1 ring-blue-500/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
                            <div className="flex items-center justify-center">
                              <span className={`text-[10px] font-black px-1.5 py-1 rounded-md ${isSimulatedWeek ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                {weekNum}
                              </span>
                            </div>
                            {week.map((day, dIdx) => {
                              const isToday = day.toDateString() === new Date().toDateString();
                              const isSimDay = day.toDateString() === simulatedDate.toDateString();
                              const isCurrentMonth = day.getMonth() === simulatedDate.getMonth();
                              
                              return (
                                <div 
                                  key={dIdx} 
                                  onClick={() => handleEditWeek(weekNum)}
                                  className={`relative min-h-[60px] p-1 border rounded-lg flex flex-col cursor-pointer transition-all group ${
                                    isSimDay 
                                      ? 'bg-white dark:bg-slate-600 border-blue-500 shadow-md scale-[1.02] z-10' 
                                      : isCurrentMonth 
                                        ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-200' 
                                        : 'bg-slate-50/50 dark:bg-slate-900/50 border-transparent opacity-40'
                                  }`}
                                >
                                  <span className={`text-[10px] font-bold ${isSimDay ? 'text-blue-600' : 'text-slate-400'}`}>
                                    {day.getDate()}
                                  </span>
                                  {dIdx === 0 && eng && (
                                    <div className="mt-1 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/40 p-1 rounded-md border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-top-1">
                                      <div className="w-1.5 h-1.5 rounded-full flex-none" style={{ backgroundColor: eng.avatarColor }} />
                                      <span className="text-[8px] font-black truncate text-blue-800 dark:text-blue-200 uppercase">{eng.name.split(' ')[0]}</span>
                                    </div>
                                  )}
                                  {isToday && (
                                    <div className="absolute top-1 right-1 w-1 h-1 bg-red-500 rounded-full" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- MODALS --- */}

      {/* Engineer Edit/New Modal */}
      {editingEngineer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className={`${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-800 border-slate-200'} w-full max-w-md rounded-3xl shadow-2xl border p-6 flex flex-col gap-5 animate-in zoom-in duration-200`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <EngineeringIcon className="w-5 h-5 text-blue-500" />
                Ingenieur {engineers.find(e => e.id === editingEngineer.id) ? "bearbeiten" : "anlegen"}
              </h3>
              <button onClick={() => setEditingEngineer(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Name</label>
                <input type="text" value={editingEngineer.name} onChange={e => setEditingEngineer({ ...editingEngineer, name: e.target.value })} className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`} placeholder="Name eingeben..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Bereich</label>
                  <select value={editingEngineer.department} onChange={e => setEditingEngineer({ ...editingEngineer, department: e.target.value })} className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Farbe</label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setEditingEngineer({ ...editingEngineer, avatarColor: c })} className={`w-5 h-5 rounded-full border-2 ${editingEngineer.avatarColor === c ? 'border-blue-500 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Telefon</label>
                <input type="text" value={editingEngineer.phone} onChange={e => setEditingEngineer({ ...editingEngineer, phone: e.target.value })} className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`} />
              </div>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 cursor-pointer">
                <input type="checkbox" checked={editingEngineer.isAvailable} onChange={e => setEditingEngineer({ ...editingEngineer, isAvailable: e.target.checked })} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-medium">Verfügbar für Bereitschaft</span>
              </label>
            </div>
            <div className="flex gap-3 pt-4 border-t dark:border-slate-700">
              {engineers.find(e => e.id === editingEngineer.id) && (
                <button onClick={() => deleteEngineer(editingEngineer.id)} className="px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"><Trash2 className="w-4 h-4" /> Löschen</button>
              )}
              <button onClick={saveEngineer} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95"><Save className="w-4 h-4" /> Speichern</button>
            </div>
          </div>
        </div>
      )}

      {/* Week Assignment Modal */}
      {editingWeek !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className={`${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-800 border-slate-200'} w-full max-w-md rounded-3xl shadow-2xl border p-6 flex flex-col gap-6 animate-in zoom-in duration-200`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Zuweisung KW {editingWeek}</h3>
              <button onClick={() => setEditingWeek(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Ingenieur auswählen</label>
              <select 
                className={`w-full p-4 rounded-xl border font-bold outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`}
                value={selectedAssignmentId || ""}
                onChange={(e) => setSelectedAssignmentId(Number(e.target.value) || null)}
              >
                <option value="">-- Keine Zuweisung --</option>
                {engineers.filter(e => e.isAvailable).map(eng => (
                  <option key={eng.id} value={eng.id}>{eng.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditingWeek(null)} className="flex-1 py-4 rounded-xl font-bold bg-slate-100 dark:bg-slate-700 text-xs">Abbrechen</button>
              <button onClick={saveWeekSchedule} className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all">Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<SupportHotlineDemo />);
