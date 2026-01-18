
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
  Calendar as CalendarIcon
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

const formatDateForInput = (date: Date) => {
  return date.toISOString().split('T')[0];
};

// --- Mock Data Generation ---
const DEPARTMENTS = ["IT", "Netzwerk", "Security", "Cloud", "DevOps"];
const COLORS = ["#E53935", "#1E88E5", "#43A047", "#FB8C00", "#8E24AA", "#00ACC1", "#3949AB", "#7CB342"];
const NAMES = [
  "Max Müller", "Anna Schmidt", "Thomas Weber", "Julia Fischer", "Michael Braun",
  "Sarah Koch", "Daniel Hoffmann", "Laura Becker", "Markus Wagner", "Christina Schäfer",
  "Stefan Bauer", "Katharina Meyer", "Patrick Richter", "Melanie Wolf", "Tobias Neumann",
  "Jennifer Schwarz", "Florian Zimmermann", "Sabrina Krüger", "Martin Hartmann", "Vanessa Lange",
  "Christian Schmitt", "Nadine Werner"
];

const initialEngineers: Engineer[] = NAMES.map((name, i) => ({
  id: i + 1,
  name,
  department: DEPARTMENTS[i % DEPARTMENTS.length],
  phone: `+49 151 ${10000000 + (i * 1234567 % 90000000)}`,
  avatarColor: COLORS[i % COLORS.length],
  shiftCount: 0,
  isAvailable: i !== 5 && i !== 12 // Mock some absences
}));

const SupportHotlineDemo: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [engineers, setEngineers] = useState<Engineer[]>(initialEngineers);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor((new Date().getMonth()) / 3) + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [selectedEngineerId, setSelectedEngineerId] = useState<number | null>(null);
  
  // Simulation State
  const [simulatedDate, setSimulatedDate] = useState(new Date());

  const currentWeek = useMemo(() => getWeekNumber(simulatedDate), [simulatedDate]);
  const simulatedYear = simulatedDate.getFullYear();

  // Initialize schedules
  useEffect(() => {
    const newSchedules: Schedule[] = [];
    const available = engineers.filter(e => e.isAvailable);
    const updatedEngineers = [...engineers].map(e => ({ ...e, shiftCount: 0 }));

    for (let w = 1; w <= 52; w++) {
      const eng = available[(w - 1) % available.length];
      newSchedules.push({ weekNumber: w, year: selectedYear, engineerId: eng.id });
      const engIndex = updatedEngineers.findIndex(e => e.id === eng.id);
      if (engIndex !== -1) updatedEngineers[engIndex].shiftCount++;
    }
    setSchedules(newSchedules);
    setEngineers(updatedEngineers);
  }, [selectedYear]);

  // Derived Data
  const currentOnCall = useMemo(() => {
    const sched = schedules.find(s => s.weekNumber === currentWeek && s.year === simulatedYear);
    return engineers.find(e => e.id === sched?.engineerId);
  }, [schedules, currentWeek, engineers, simulatedYear]);

  const filteredEngineers = useMemo(() => {
    return engineers
      .filter(e => e.name.toLowerCase().includes(searchText.toLowerCase()))
      .sort((a, b) => {
        if (a.id === currentOnCall?.id) return -1;
        if (b.id === currentOnCall?.id) return 1;
        return b.shiftCount - a.shiftCount;
      });
  }, [engineers, searchText, currentOnCall]);

  const quarterWeeks = useMemo(() => {
    const weeks: WeekInfo[] = [];
    const startWeek = (selectedQuarter - 1) * 13 + 1;
    const endWeek = Math.min(selectedQuarter * 13, 52);

    for (let w = startWeek; w <= endWeek; w++) {
      const jan1 = new Date(selectedYear, 0, 1);
      const daysToFirstMonday = (8 - jan1.getDay()) % 7;
      const firstMonday = new Date(selectedYear, 0, 1 + daysToFirstMonday);
      const weekStart = new Date(firstMonday);
      weekStart.setDate(firstMonday.getDate() + (w - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weeks.push({ weekNumber: w, startDate: weekStart, endDate: weekEnd });
    }
    return weeks;
  }, [selectedQuarter, selectedYear]);

  const avgShifts = useMemo(() => {
    return (engineers.reduce((acc, curr) => acc + curr.shiftCount, 0) / engineers.length).toFixed(1);
  }, [engineers]);

  const handleEdit = (week: number) => {
    const existing = schedules.find(s => s.weekNumber === week && s.year === selectedYear);
    setEditingWeek(week);
    setSelectedEngineerId(existing?.engineerId || null);
  };

  const saveSchedule = () => {
    if (editingWeek === null) return;
    
    const newSchedules = [...schedules];
    const index = newSchedules.findIndex(s => s.weekNumber === editingWeek && s.year === selectedYear);
    
    // Update shift counts
    const updatedEngineers = [...engineers];
    if (index !== -1) {
      const oldId = newSchedules[index].engineerId;
      if (oldId) {
        const oldEngIdx = updatedEngineers.findIndex(e => e.id === oldId);
        if (oldEngIdx !== -1) updatedEngineers[oldEngIdx].shiftCount--;
      }
      newSchedules[index].engineerId = selectedEngineerId;
    } else {
      newSchedules.push({ weekNumber: editingWeek, year: selectedYear, engineerId: selectedEngineerId });
    }

    if (selectedEngineerId) {
      const newEngIdx = updatedEngineers.findIndex(e => e.id === selectedEngineerId);
      if (newEngIdx !== -1) updatedEngineers[newEngIdx].shiftCount++;
    }

    setSchedules(newSchedules);
    setEngineers(updatedEngineers);
    setEditingWeek(null);
  };

  const getShiftColor = (count: number) => {
    if (count <= 1) return "bg-red-100 text-red-700 border-red-200";
    if (count <= 3) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  // Simulation handlers
  const adjustWeek = (weeks: number) => {
    const newDate = new Date(simulatedDate);
    newDate.setDate(newDate.getDate() + (weeks * 7));
    setSimulatedDate(newDate);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setSimulatedDate(new Date(val));
    }
  };

  const resetSimulation = () => {
    setSimulatedDate(new Date());
  };

  // Calendar View Helpers
  const calendarDays = useMemo(() => {
    // Show current simulated month
    const startOfMonth = new Date(simulatedDate.getFullYear(), simulatedDate.getMonth(), 1);
    const endOfMonth = new Date(simulatedDate.getFullYear(), simulatedDate.getMonth() + 1, 0);
    
    // Adjust to show full weeks (start on Monday)
    const firstDay = startOfMonth.getDay(); // 0 is Sun
    const daysToSub = firstDay === 0 ? 6 : firstDay - 1;
    const calendarStart = new Date(startOfMonth);
    calendarStart.setDate(startOfMonth.getDate() - daysToSub);

    const days = [];
    let current = new Date(calendarStart);
    // Display 6 weeks for consistency
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [simulatedDate]);

  return (
    <div className={`${isDarkMode ? 'dark bg-slate-900' : 'bg-slate-50'} h-screen overflow-hidden font-sans transition-colors duration-300 flex flex-col`}>
      {/* AppBar */}
      <nav className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-blue-700 border-blue-800'} h-14 flex-none flex items-center justify-between px-6 text-white shadow-md z-50`}>
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5" />
          <h1 className="text-lg font-bold tracking-tight hidden sm:block">SupportHotlineDemo</h1>
        </div>

        {/* Simulation Bar */}
        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-1 px-2 border-r border-white/20 mr-1 hidden xs:flex">
             <Activity className="w-3 h-3 text-emerald-400" />
             <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Simulation</span>
          </div>
          <button 
            onClick={() => adjustWeek(-1)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors group"
            title="Woche zurück"
          >
            <Rewind className="w-4 h-4" />
          </button>
          
          <div className="px-3 py-1 bg-white/10 rounded-lg flex items-center justify-center gap-2 group cursor-pointer hover:bg-white/20 transition-colors relative">
            <CalendarIcon className="w-3 h-3 text-white/60" />
            <input 
              type="date" 
              value={formatDateForInput(simulatedDate)}
              onChange={handleDateChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              title="Simulation Datum wählen"
            />
            <div className="flex flex-col items-center">
              <span className="text-[9px] leading-none text-white/50 font-bold uppercase">KW {currentWeek}</span>
              <span className="text-xs leading-none font-black">{simulatedDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
            </div>
          </div>

          <button 
            onClick={() => adjustWeek(1)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Woche vor"
          >
            <FastForward className="w-4 h-4" />
          </button>
          
          <button 
            onClick={resetSimulation}
            className="ml-1 p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/50 hover:text-white"
            title="Simulation zurücksetzen"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
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

      <main className="flex-1 overflow-hidden p-6 space-y-6 flex flex-col">
        {/* Fixed Content Wrapper */}
        <div className="flex-none space-y-6">
          {/* Status Header */}
          <div className={`${isDarkMode ? 'bg-gradient-to-br from-slate-800 to-slate-700' : 'bg-gradient-to-br from-blue-600 to-blue-800'} p-6 rounded-2xl shadow-lg text-white`}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <div className="flex items-center gap-2 text-white/90 mb-1">
                  <Phone className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Service-Hotline Bereitschaft</h2>
                </div>
                <p className="text-white/70 text-sm font-medium uppercase tracking-wider">
                  KW {currentWeek} | {simulatedDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                  {simulatedDate.toDateString() !== new Date().toDateString() && (
                    <span className="ml-2 bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/30">SIMULIERT</span>
                  )}
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 flex items-center gap-4 min-w-[300px]">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg relative overflow-hidden group">
                  <Person className="w-7 h-7 text-white transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
                </div>
                <div>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest leading-none">Aktuell im Dienst</p>
                  <p className="text-lg font-bold truncate max-w-[180px] my-1">{currentOnCall?.name || "Nicht zugewiesen"}</p>
                  <p className="text-white/80 text-sm flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {currentOnCall?.phone || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* KPI and Chart Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[
              { label: "Ingenieure", val: engineers.length, sub: "Rotation", icon: EngineeringIcon, color: "text-blue-500" },
              { label: "Ø Einsätze", val: avgShifts, sub: "pro Kopf", icon: BarChart, color: "text-amber-500" },
              { label: "Nächster Wechsel", val: getDaysUntilNextMonday(simulatedDate), sub: "Tage (Mo)", icon: SwapHoriz, color: "text-emerald-500" },
              { label: "Geplant bis", val: `KW ${schedules.length > 0 ? Math.max(...schedules.map(s => s.weekNumber)) : 0}`, sub: selectedYear, icon: CalendarMonth, color: "text-cyan-500" }
            ].map((kpi, i) => (
              <div key={i} className={`${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100'} p-4 rounded-2xl shadow-sm border flex items-center justify-between transition-all hover:translate-y-[-2px]`}>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 truncate">{kpi.label}</p>
                  <p className="text-2xl font-black truncate">{kpi.val}</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5 truncate">{kpi.sub}</p>
                </div>
                <kpi.icon className={`${kpi.color} w-8 h-8 flex-none opacity-20`} />
              </div>
            ))}

            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-4 rounded-2xl shadow-sm border flex flex-col transition-all hover:translate-y-[-2px]`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-blue-500" />
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Verteilung (Top 10)</p>
                </div>
              </div>
              <div className="flex items-end justify-between h-[42px] gap-1 px-1">
                {engineers.sort((a,b) => b.shiftCount - a.shiftCount).slice(0, 10).map((eng, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div 
                      className="w-full rounded-t-[2px] bg-blue-500 opacity-60 group-hover:opacity-100 transition-all cursor-help relative min-h-[4px]" 
                      style={{ height: `${Math.max(10, (eng.shiftCount / 10) * 100)}%` }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap z-[60] transition-opacity font-bold shadow-xl pointer-events-none">
                        {eng.name.split(' ')[0]}: {eng.shiftCount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Main Content Sections */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2">
          
          {/* Left: Engineer List */}
          <div className="lg:col-span-5 h-full min-h-0">
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-6 rounded-2xl shadow-sm border flex flex-col h-full min-h-0`}>
              <div className="flex-none flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Group className="w-5 h-5 text-blue-500" />
                  <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Ingenieure</h3>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Suchen..." 
                    className={`pl-10 pr-4 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 transition-all ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-left text-sm border-separate border-spacing-0">
                  <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500'}`}>
                    <tr>
                      <th className="pb-3 pt-1 border-b dark:border-slate-700 font-bold uppercase text-[10px] tracking-widest">Name</th>
                      <th className="pb-3 pt-1 border-b dark:border-slate-700 font-bold uppercase text-[10px] tracking-widest text-center">Einsätze</th>
                      <th className="pb-3 pt-1 border-b dark:border-slate-700 font-bold uppercase text-[10px] tracking-widest text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-50'}`}>
                    {filteredEngineers.map((eng) => (
                      <tr key={eng.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex-none flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: eng.avatarColor }}>
                              {eng.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className={`font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{eng.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{eng.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getShiftColor(eng.shiftCount)}`}>
                            {eng.shiftCount}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          {eng.id === currentOnCall?.id ? (
                            <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ring-emerald-500/20">
                              <Activity className="w-3 h-3 animate-pulse" /> AKTIV
                            </div>
                          ) : eng.isAvailable ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 inline opacity-40" />
                          ) : (
                            <EventBusy className="w-4 h-4 text-slate-300 inline" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Schedule (Scrollable with View Switch) */}
          <div className="lg:col-span-7 h-full flex flex-col min-h-0">
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-6 rounded-2xl shadow-sm border flex flex-col h-full min-h-0`}>
              <div className="flex-none flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <CalendarMonth className="w-5 h-5 text-blue-500" />
                  <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Bereitschaftsplan {selectedYear}</h3>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* View Mode Switch */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                    <button 
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode('calendar')}
                      className={`p-1.5 rounded transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                    <button 
                      onClick={() => selectedQuarter > 1 ? setSelectedQuarter(selectedQuarter - 1) : (setSelectedQuarter(4), setSelectedYear(selectedYear - 1))}
                      className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded shadow-sm transition-all"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-500" />
                    </button>
                    <span className="text-xs font-bold text-blue-600 px-3 uppercase tracking-widest">Q{selectedQuarter}</span>
                    <button 
                      onClick={() => selectedQuarter < 4 ? setSelectedQuarter(selectedQuarter + 1) : (setSelectedQuarter(1), setSelectedYear(selectedYear + 1))}
                      className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded shadow-sm transition-all"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {viewMode === 'table' ? (
                  <table className="w-full text-left text-sm border-separate border-spacing-0">
                    <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500'} text-[10px] uppercase font-bold tracking-widest`}>
                      <tr>
                        <th className="p-3 pt-1 border-b dark:border-slate-700">KW</th>
                        <th className="p-3 pt-1 border-b dark:border-slate-700">Zeitraum</th>
                        <th className="p-3 pt-1 border-b dark:border-slate-700">Zuweisung</th>
                        <th className="p-3 pt-1 border-b dark:border-slate-700 text-center">Status</th>
                        <th className="p-3 pt-1 border-b dark:border-slate-700 text-center">Aktion</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                      {quarterWeeks.map((week) => {
                        const sched = schedules.find(s => s.weekNumber === week.weekNumber && s.year === selectedYear);
                        const eng = engineers.find(e => e.id === sched?.engineerId);
                        const isActive = week.weekNumber === currentWeek && selectedYear === simulatedYear;
                        const isPast = (selectedYear < simulatedYear) || (selectedYear === simulatedYear && week.weekNumber < currentWeek);

                        return (
                          <tr key={week.weekNumber} className={`${isActive ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''} transition-colors group`}>
                            <td className="p-3 font-bold flex items-center gap-2">
                              {week.weekNumber}
                              {isActive && <Star className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse" />}
                            </td>
                            <td className="p-3 text-[11px] text-slate-400 font-medium">
                              {week.startDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - {week.endDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                            </td>
                            <td className="p-3">
                              {eng ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full flex-none flex items-center justify-center text-[10px] text-white font-bold shadow-sm" style={{ backgroundColor: eng.avatarColor }}>
                                    {eng.name.charAt(0)}
                                  </div>
                                  <div className="leading-none min-w-0">
                                    <p className={`font-bold text-xs truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{eng.name}</p>
                                    <p className="text-[9px] text-slate-400">{eng.phone}</p>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-300 italic text-xs">Nicht zugewiesen</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all inline-block min-w-[70px] ${
                                isPast ? 'bg-slate-100 text-slate-400 border-slate-200' :
                                isActive ? 'bg-emerald-500 text-white border-emerald-600 scale-105 shadow-sm' :
                                eng ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-amber-50 text-amber-500 border-amber-100'
                              }`}>
                                {isPast ? 'ERLEDIGT' : isActive ? 'AKTIV' : eng ? 'GEPLANT' : 'OFFEN'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button 
                                onClick={() => handleEdit(week.weekNumber)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-2">
                    <div className="grid grid-cols-7 mb-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                      {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day, idx) => {
                        const weekNum = getWeekNumber(day);
                        const dayYear = day.getFullYear();
                        const sched = schedules.find(s => s.weekNumber === weekNum && s.year === dayYear);
                        const eng = engineers.find(e => e.id === sched?.engineerId);
                        const isCurrentMonth = day.getMonth() === simulatedDate.getMonth();
                        const isToday = day.toDateString() === new Date().toDateString();
                        const isSimulated = day.toDateString() === simulatedDate.toDateString();
                        const isMonday = day.getDay() === 1;

                        return (
                          <div 
                            key={idx} 
                            className={`min-h-[80px] p-2 rounded-xl border transition-all flex flex-col gap-1 relative group cursor-pointer ${
                              !isCurrentMonth ? 'opacity-30 border-transparent' : 
                              isSimulated ? 'border-blue-500 bg-blue-50/10' : 
                              'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
                            }`}
                            onClick={() => handleEdit(weekNum)}
                          >
                            <div className="flex justify-between items-center">
                              <span className={`text-[11px] font-bold ${isToday ? 'bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded-full' : isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                {day.getDate()}
                              </span>
                              {isMonday && (
                                <span className="text-[9px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1 rounded">
                                  KW {weekNum}
                                </span>
                              )}
                            </div>
                            
                            {isMonday && eng && (
                              <div className="mt-1 flex flex-col gap-0.5 overflow-hidden">
                                <div className="flex items-center gap-1.5 p-1 rounded bg-slate-50 dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                                  <div className="w-3 h-3 rounded-full flex-none" style={{ backgroundColor: eng.avatarColor }} />
                                  <p className="text-[9px] font-bold truncate leading-tight uppercase tracking-tighter">{eng.name.split(' ')[0]}</p>
                                </div>
                                <div className="h-0.5 w-full bg-blue-500/20 rounded-full" />
                              </div>
                            )}
                            
                            {/* Visual indicator for the whole week */}
                            {eng && (
                              <div className="absolute left-0 bottom-0 right-0 h-1 rounded-b-xl opacity-30" style={{ backgroundColor: eng.avatarColor }} />
                            )}
                            
                            <button 
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-100 dark:border-slate-700 text-blue-500 transition-opacity"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
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

      {/* Edit Modal */}
      {editingWeek !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className={`${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-800 border-slate-200'} w-full max-w-md rounded-3xl shadow-2xl border p-8 flex flex-col gap-6 animate-in fade-in zoom-in duration-200`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-500" />
                KW {editingWeek} bearbeiten
              </h3>
              <button onClick={() => setEditingWeek(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Ingenieur auswählen</label>
              <select 
                className={`w-full p-4 rounded-xl border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-800'}`}
                value={selectedEngineerId || ""}
                onChange={(e) => setSelectedEngineerId(Number(e.target.value) || null)}
              >
                <option value="">-- Keine Zuweisung --</option>
                {engineers.filter(e => e.isAvailable).map(eng => (
                  <option key={eng.id} value={eng.id}>
                    {eng.name} ({eng.shiftCount} Einsätze)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setEditingWeek(null)}
                className={`flex-1 py-4 rounded-xl font-bold uppercase text-xs tracking-widest transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
              >
                Abbrechen
              </button>
              <button 
                onClick={saveSchedule}
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-blue-200 transition-all active:scale-95"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<SupportHotlineDemo />);
