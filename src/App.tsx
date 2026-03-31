import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from './lib/ErrorToast';
import { useNetworkStatus } from './lib/useNetworkStatus';
import { SectionErrorBoundary } from './lib/ErrorBoundary';
import { getSessionHealth, getErrorLog } from './lib/errorLogger';
import { cancelAllRequests } from './lib/fetchWithRetry';
import {
  DashboardSkeleton,
  ModelsViewSkeleton,
  NotificationsViewSkeleton,
  SettingsSkeleton,
  TableRowSkeleton,
  SkeletonBlock,
} from './lib/Skeleton';
import { 
  LayoutDashboard, 
  Users, 
  UploadCloud, 
  Bell, 
  MessageSquare, 
  Calendar,
  Menu,
  X,
  LogOut,
  TrendingUp,
  DollarSign,
  Award,
  Smartphone,
  Monitor,
  Target,
  AlertTriangle,
  CheckCircle2,
  User,
  CheckCircle,
  Clock,
  Briefcase,
  ExternalLink,
  Flame,
  ShieldAlert,
  HelpCircle,
  ChevronRight,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  Search,
  Plus,
  UserPlus,
  WifiOff,
  MoreHorizontal,
  Phone,
  Video,
  CheckCheck,
  Paperclip,
  Smile,
  Send,
  Upload,
  FileText,
  Check,
  Settings,
  Quote,
  Calculator,
  RefreshCw,
  Trophy,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useDropzone } from 'react-dropzone';
import { cn } from './lib/utils';
import type { Model, Supervisor, Notification, WhatsAppMessage, UserRole, LevelName, LevelConfig, AgencyConfig } from './types';

const LEVELS: LevelConfig[] = [
  { name: 'Baby1', threshold: 150000, bonus: 500, agentShare: 100, hostSalary: 400, vipLevel: 1 },
  { name: 'Baby2', threshold: 250000, bonus: 800, agentShare: 150, hostSalary: 650, vipLevel: 1 },
  { name: 'Baby3', threshold: 350000, bonus: 1200, agentShare: 200, hostSalary: 1000, vipLevel: 1 },
  { name: 'D1', threshold: 450000, bonus: 1500, agentShare: 300, hostSalary: 1200, vipLevel: 2 },
  { name: 'D2', threshold: 600000, bonus: 2000, agentShare: 400, hostSalary: 1600, vipLevel: 2 },
  { name: 'D3', threshold: 800000, bonus: 2800, agentShare: 500, hostSalary: 2300, vipLevel: 2 },
  { name: 'C1', threshold: 1100000, bonus: 4000, agentShare: 800, hostSalary: 3200, vipLevel: 3 },
  { name: 'C2', threshold: 1500000, bonus: 5500, agentShare: 1000, hostSalary: 4500, vipLevel: 3 },
  { name: 'C3', threshold: 2000000, bonus: 7500, agentShare: 1500, hostSalary: 6000, vipLevel: 3 },
  { name: 'B1', threshold: 2700000, bonus: 10000, agentShare: 2000, hostSalary: 8000, vipLevel: 4 },
  { name: 'B2', threshold: 3300000, bonus: 12500, agentShare: 2500, hostSalary: 10000, vipLevel: 4 },
  { name: 'B3', threshold: 4200000, bonus: 16000, agentShare: 3200, hostSalary: 12800, vipLevel: 4 },
  { name: 'A1', threshold: 5200000, bonus: 20000, agentShare: 4000, hostSalary: 16000, vipLevel: 5 },
  { name: 'A2', threshold: 10000000, bonus: 40000, agentShare: 8000, hostSalary: 32000, vipLevel: 6 },
  { name: 'A3', threshold: 20000000, bonus: 80000, agentShare: 16000, hostSalary: 64000, vipLevel: 7 },
  { name: 'S1', threshold: 30000000, bonus: 120000, agentShare: 24000, hostSalary: 96000, vipLevel: 8 },
  { name: 'S2', threshold: 40000000, bonus: 160000, agentShare: 32000, hostSalary: 128000, vipLevel: 9 },
  { name: 'S3', threshold: 60000000, bonus: 240000, agentShare: 48000, hostSalary: 192000, vipLevel: 10 },
  { name: 'SS1', threshold: 90000000, bonus: 360000, agentShare: 72000, hostSalary: 288000, vipLevel: 10 },
  { name: 'SS2', threshold: 150000000, bonus: 600000, agentShare: 120000, hostSalary: 480000, vipLevel: 10 },
];

const getLevelForEarnings = (earnings: number): LevelConfig => {
  return [...LEVELS].reverse().find(l => earnings >= l.threshold) || LEVELS[0];
};

function BottomNav({ activeTab, setActiveTab, navItems, role }: {
  activeTab: string,
  setActiveTab: (tab: any) => void,
  navItems: any[],
  role: 'agent' | 'supervisor'
}) {
  const mobileNavItems = navItems.filter(item =>
    ['dashboard', 'models', 'automation', 'notifications', 'settings'].includes(item.id)
  );

  // Short Arabic labels for the bottom nav
  const mobileLabels: Record<string, string> = {
    dashboard: 'الرئيسية',
    models: 'المذيعات',
    automation: 'رفع البيانات',
    notifications: 'الإشعارات',
    settings: 'الإعدادات',
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bottom-nav-safe">
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-2xl border-t border-white/10" />
      <div className="relative flex justify-around items-center px-1 pt-2 pb-1">
        {mobileNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if ('vibrate' in navigator) navigator.vibrate(15);
                setActiveTab(item.id);
              }}
              className={cn(
                "flex flex-col items-center gap-1 py-1.5 px-2 rounded-2xl transition-all duration-200 min-w-[52px] flex-1",
                isActive
                  ? "text-brand-gold"
                  : "text-white/35 active:text-white/60"
              )}
            >
              <div className={cn(
                "relative flex items-center justify-center w-9 h-6 rounded-xl transition-all duration-200",
                isActive && "bg-brand-gold/15"
              )}>
                <item.icon
                  size={19}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={cn(
                    "transition-all duration-200",
                    isActive && "drop-shadow-[0_0_10px_rgba(212,175,55,0.7)]"
                  )}
                />
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-brand-gold rounded-full shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
                )}
              </div>
              <span className={cn(
                "text-[9px] font-bold tracking-wide transition-all duration-200",
                isActive ? "text-brand-gold" : "text-white/35"
              )}>
                {mobileLabels[item.id] || item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuickActionFAB({ onAction }: { onAction?: (action: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { id: 'add', icon: UserPlus, label: 'إضافة مذيعة', color: 'bg-brand-gold' },
    { id: 'message', icon: MessageSquare, label: 'رسالة سريعة', color: 'bg-brand-purple' },
    { id: 'upload', icon: Upload, label: 'رفع بيانات', color: 'bg-blue-500' },
  ];

  return (
    <div className="fixed bottom-24 left-6 z-40 md:hidden">
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col gap-3 mb-4 items-end">
            {actions.map((action, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0, y: 20 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  onAction?.(action.id);
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 group"
              >
                <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.label}
                </span>
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-black shadow-lg", action.color)}>
                  <action.icon size={20} />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center text-black shadow-2xl transition-all duration-300",
          isOpen ? "bg-white rotate-45" : "bg-brand-gold"
        )}
      >
        <Plus size={28} />
      </button>
    </div>
  );
}

function OfflineIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900/95 backdrop-blur-xl text-amber-300 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-2xl shadow-black/60 border border-amber-500/20"
    >
      <WifiOff size={13} className="text-amber-400" />
      <span>بدون اتصال — يتم عرض آخر بيانات محفوظة</span>
      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
    </motion.div>
  );
}

function RestoredIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900/95 backdrop-blur-xl text-green-300 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-2xl shadow-black/60 border border-green-500/20"
    >
      <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>تمت استعادة الاتصال — جاري المزامنة...</span>
    </motion.div>
  );
}

function SystemHealthPanel() {
  const [health, setHealth] = useState(getSessionHealth());
  const [logs, setLogs] = useState(getErrorLog());
  const [expanded, setExpanded] = useState(false);

  // Refresh every 5s
  useEffect(() => {
    const t = setInterval(() => {
      setHealth(getSessionHealth());
      setLogs(getErrorLog());
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const healthScore = Math.max(
    0,
    100 - health.serverErrors * 10 - health.networkErrors * 5 - health.clientErrors * 3
  );
  const scoreColor = healthScore >= 80 ? 'text-green-400' : healthScore >= 50 ? 'text-brand-gold' : 'text-red-400';
  const scoreBg = healthScore >= 80 ? 'bg-green-500/10 border-green-500/20' : healthScore >= 50 ? 'bg-brand-gold/10 border-brand-gold/20' : 'bg-red-500/10 border-red-500/20';

  return (
    <div className="glass-card p-6 bg-white/3 border-white/5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-purple/20 rounded-xl text-brand-purple-light">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm">صحة النظام</h4>
            <p className="text-[10px] text-white/30">System Health Monitor</p>
          </div>
        </div>
        <div className={cn("px-3 py-1.5 rounded-xl border text-xs font-black", scoreBg, scoreColor)}>
          {healthScore}%
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'أخطاء الخادم', value: health.serverErrors, color: 'text-red-400' },
          { label: 'أخطاء الشبكة', value: health.networkErrors, color: 'text-amber-400' },
          { label: 'إجمالي المحاولات', value: health.totalRetries, color: 'text-purple-400' },
          { label: 'محاولات ناجحة', value: health.successfulRetries, color: 'text-green-400' },
        ].map((s, i) => (
          <div key={i} className="bg-black/20 rounded-xl p-3 border border-white/5 text-center">
            <p className={cn("text-lg font-black", s.color)}>{s.value}</p>
            <p className="text-[9px] text-white/30 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", health.currentlyOffline ? "bg-red-500 animate-pulse" : "bg-green-400")} />
          <span className="text-[11px] text-white/50 font-bold">
            {health.currentlyOffline ? 'غير متصل' : 'متصل بالشبكة'}
          </span>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-[10px] text-white/30 hover:text-white/60 transition-colors font-bold"
        >
          {expanded ? 'إخفاء السجل' : `عرض السجل (${logs.length})`}
        </button>
      </div>

      <AnimatePresence>
        {expanded && logs.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide">
              {[...logs].reverse().slice(0, 20).map(entry => (
                <div key={entry.id} className="flex items-center gap-3 p-2 bg-black/20 rounded-lg border border-white/5 text-right">
                  <span className={cn(
                    "text-[8px] font-black px-1.5 py-0.5 rounded shrink-0",
                    entry.category === 'server_error' ? "bg-red-500/20 text-red-400" :
                    entry.category === 'network_error' ? "bg-amber-500/20 text-amber-400" :
                    entry.category === 'react_error' ? "bg-purple-500/20 text-purple-400" :
                    "bg-white/10 text-white/40"
                  )}>
                    {entry.category.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-white/40 flex-1 truncate">{entry.message}</span>
                  <span className={cn("text-[8px] shrink-0", entry.resolved ? "text-green-400" : "text-white/20")}>
                    {entry.resolved ? '✓' : '·'}
                  </span>
                  <span className="text-[9px] text-white/20 shrink-0 font-mono tabular-nums">
                    {new Date(entry.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {expanded && logs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-4 text-white/20 text-xs"
          >
            لا يوجد أخطاء مسجلة في هذه الجلسة
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SettingsView = ({ userRole, onLogout }: { userRole: UserRole, onLogout: () => void }) => {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);
  const [agentPin, setAgentPin] = useState(localStorage.getItem('pin_agent') || '0000');
  const [supervisorPin, setSupervisorPin] = useState(localStorage.getItem('pin_supervisor') || '0000');
  const [isChangingAgent, setIsChangingAgent] = useState(false);
  const [isChangingSupervisor, setIsChangingSupervisor] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');

  const handlePinChange = (role: UserRole) => {
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setError('الرمز يجب أن يتكون من 4 أرقام');
      return;
    }
    localStorage.setItem(`pin_${role}`, newPin);
    if (role === 'agent') {
      setAgentPin(newPin);
      setIsChangingAgent(false);
    } else {
      setSupervisorPin(newPin);
      setIsChangingSupervisor(false);
    }
    setNewPin('');
    setError('');
  };

  if (isLoading) return <SettingsSkeleton />;

  return (
    <div className="space-y-8 max-w-2xl mx-auto py-10 animate-float-up">
      <div className="glass-card p-8 space-y-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-gold/20 rounded-xl text-brand-gold">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">الأمان والخصوصية</h3>
              <p className="text-sm text-white/40">إدارة رموز الدخول وحماية البيانات</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <span className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">نشط</span>
          </div>
        </div>

        <div className="p-4 bg-brand-purple/10 border border-brand-purple/20 rounded-2xl">
          <p className="text-xs text-brand-purple-light leading-relaxed">
            <span className="font-bold">ملاحظة:</span> يتم تخزين رموز الدخول محلياً على هذا الجهاز لضمان الخصوصية. الرمز الافتراضي هو <span className="font-mono font-bold text-white">0000</span>. يرجى تغييره لضمان أمان وكالتك.
          </p>
        </div>

        <div className="space-y-6">
          {userRole === 'agent' && (
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">رمز الوكيل (Agent PIN)</p>
                  <p className="text-xs text-white/40">الرمز الحالي: {agentPin}</p>
                </div>
                {!isChangingAgent && (
                  <button 
                    onClick={() => setIsChangingAgent(true)}
                    className="px-4 py-2 bg-brand-gold text-black text-xs font-bold rounded-lg"
                  >
                    تغيير
                  </button>
                )}
              </div>
              {isChangingAgent && (
                <div className="flex gap-4">
                  <input 
                    type="password"
                    maxLength={4}
                    placeholder="الرمز الجديد"
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-brand-gold outline-none"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                  />
                  <button 
                    onClick={() => handlePinChange('agent')}
                    className="px-4 py-2 bg-brand-gold text-black text-xs font-bold rounded-lg"
                  >
                    حفظ
                  </button>
                  <button 
                    onClick={() => setIsChangingAgent(false)}
                    className="px-4 py-2 bg-white/5 text-white text-xs font-bold rounded-lg"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">رمز المشرفة (Supervisor PIN)</p>
                <p className="text-xs text-white/40">الرمز الحالي: {supervisorPin}</p>
              </div>
              {!isChangingSupervisor && (
                <button 
                  onClick={() => setIsChangingSupervisor(true)}
                  className="px-4 py-2 bg-brand-purple text-white text-xs font-bold rounded-lg"
                >
                  تغيير
                </button>
              )}
            </div>
            {isChangingSupervisor && (
              <div className="flex gap-4">
                <input 
                  type="password"
                  maxLength={4}
                  placeholder="الرمز الجديد"
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-brand-purple outline-none"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                />
                <button 
                  onClick={() => handlePinChange('supervisor')}
                  className="px-4 py-2 bg-brand-purple text-white text-xs font-bold rounded-lg"
                >
                  حفظ
                </button>
                <button 
                  onClick={() => setIsChangingSupervisor(false)}
                  className="px-4 py-2 bg-white/5 text-white text-xs font-bold rounded-lg"
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
      </div>

      {/* System Health Panel — admin visibility */}
      <SystemHealthPanel />

      <button
        onClick={onLogout}
        className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
      >
        <LogOut size={20} /> تسجيل الخروج
      </button>
    </div>
  );
};

const AuthSystem = ({ onUnlock }: { onUnlock: (role: UserRole) => void }) => {
  const [step, setStep] = useState<'role' | 'pin'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Initialize default PINs if not set
  React.useEffect(() => {
    if (!localStorage.getItem('pin_agent')) localStorage.setItem('pin_agent', '0000');
    if (!localStorage.getItem('pin_supervisor')) localStorage.setItem('pin_supervisor', '0000');
  }, []);

  // Handle lock timer
  React.useEffect(() => {
    if (lockUntil) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setLockUntil(null);
          setAttempts(0);
          setTimeLeft(0);
          clearInterval(interval);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockUntil]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('pin');
    setPin('');
    setError(false);
  };

  const handleKeyPress = (num: string) => {
    if (lockUntil || pin.length >= 4) return;

    // Haptic feedback on mobile
    if ('vibrate' in navigator) navigator.vibrate(30);

    const newPin = pin + num;
    setPin(newPin);

    if (newPin.length === 4) {
      const correctPin = localStorage.getItem(`pin_${selectedRole}`) || '0000';
      if (newPin === correctPin) {
        // Success vibration pattern
        if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
        onUnlock(selectedRole!);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setError(true);
        // Error vibration pattern
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 100]);

        if (newAttempts >= 3) {
          setLockUntil(Date.now() + 30000);
          setTimeLeft(30);
        }

        setTimeout(() => {
          setPin('');
          setError(false);
        }, 1000);
      }
    }
  };

  const handleBackspace = () => {
    if (lockUntil) return;
    if ('vibrate' in navigator) navigator.vibrate(15);
    setPin(pin.slice(0, -1));
  };

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-purple/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-gold/5 blur-[120px] rounded-full" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-12 relative z-10 text-center"
        >
          <div className="space-y-4">
            <img 
              src="https://i.ibb.co/vYvH6yR/eyedeaz-logo.png" 
              alt="EYEDEAZ" 
              className="h-24 w-auto mx-auto mb-8"
              referrerPolicy="no-referrer"
            />
            <h2 className="text-3xl font-bold tracking-tight">اختيار نوع الدخول</h2>
            <p className="text-white/40 uppercase tracking-[0.2em] text-xs">Select Access Role</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <motion.button 
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(212,175,55,0.2)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect('agent')}
              className="group relative p-8 bg-white/5 border border-white/10 rounded-3xl transition-all hover:border-brand-gold/50 text-right flex items-center justify-between overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-gold/0 to-brand-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-6 relative z-10">
                <div className="p-4 bg-brand-gold/20 rounded-2xl text-brand-gold group-hover:scale-110 transition-transform">
                  <Briefcase size={32} />
                </div>
                <div>
                  <p className="font-black text-2xl mb-1">وكيل</p>
                  <p className="text-sm text-white/40 font-medium">Agent Access</p>
                </div>
              </div>
              <ChevronRight size={24} className="text-white/20 group-hover:text-brand-gold transition-colors group-hover:translate-x-1" />
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(168,85,247,0.2)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect('supervisor')}
              className="group relative p-8 bg-white/5 border border-white/10 rounded-3xl transition-all hover:border-brand-purple/50 text-right flex items-center justify-between overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-purple/0 to-brand-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-6 relative z-10">
                <div className="p-4 bg-brand-purple/20 rounded-2xl text-brand-purple group-hover:scale-110 transition-transform">
                  <Users size={32} />
                </div>
                <div>
                  <p className="font-black text-2xl mb-1">مشرفة</p>
                  <p className="text-sm text-white/40 font-medium">Supervisor Access</p>
                </div>
              </div>
              <ChevronRight size={24} className="text-white/20 group-hover:text-brand-purple transition-colors group-hover:translate-x-1" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-purple/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-gold/5 blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full space-y-12 relative z-10"
      >
        <div className="text-center space-y-6">
          <button 
            onClick={() => setStep('role')}
            className="text-white/40 hover:text-white transition-colors flex items-center gap-2 mx-auto text-xs uppercase tracking-widest mb-4"
          >
            <X size={14} /> العودة للاختيار
          </button>
          <div className="p-4 bg-white/5 rounded-2xl inline-block mb-4">
            {selectedRole === 'agent' ? (
              <Briefcase size={32} className="text-brand-gold" />
            ) : (
              <Users size={32} className="text-brand-purple" />
            )}
          </div>
          <h2 className="text-2xl font-bold">أدخل رمز الدخول</h2>
          <p className="text-white/40 text-xs uppercase tracking-widest">Enter 4-Digit PIN</p>
        </div>

        <div className="space-y-10">
          <motion.div 
            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
            className="flex justify-center gap-6"
          >
            {[...Array(4)].map((_, i) => (
              <div 
                key={i}
                className={cn(
                  "w-5 h-5 rounded-full border-2 transition-all duration-300",
                  pin.length > i ? "bg-brand-gold border-brand-gold shadow-[0_0_20px_rgba(234,179,8,0.6)] scale-110" : "border-white/20",
                  error && "border-red-500 bg-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                )}
              />
            ))}
          </motion.div>

          {lockUntil ? (
            <div className="text-center space-y-4 py-8">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse-red">
                <ShieldAlert size={36} />
              </div>
              <p className="text-red-500 font-bold text-lg">تم قفل النظام مؤقتاً</p>
              <div className="flex items-center justify-center gap-3">
                <div className="text-4xl font-black text-white tabular-nums">{timeLeft}</div>
                <span className="text-white/40 text-sm">ثانية</span>
              </div>
              <p className="text-white/30 text-xs">بعد 3 محاولات خاطئة متتالية</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  key={num}
                  onClick={() => handleKeyPress(num)}
                  className="h-[72px] rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-bold transition-colors active:bg-white/15"
                >
                  {num}
                </motion.button>
              ))}
              {/* Empty placeholder */}
              <div />
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => handleKeyPress('0')}
                className="h-[72px] rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-bold transition-colors active:bg-white/15"
              >
                0
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleBackspace}
                className="h-[72px] rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-bold transition-colors active:bg-red-500/20 text-white/40 active:text-red-400"
              >
                <X size={26} />
              </motion.button>
            </div>
          )}
        </div>

        {error && !lockUntil && (
          <p className="text-center text-red-500 font-bold animate-bounce">
            رمز غير صحيح
          </p>
        )}

        <p className="text-center text-white/20 text-[10px] uppercase tracking-widest">
          Vault Security System Active
        </p>
      </motion.div>
    </div>
  );
};

// Mock Data
const PERFORMANCE_DATA = [
  { name: 'السبت', earnings: 4200, margin: 840 },
  { name: 'الأحد', earnings: 3800, margin: 760 },
  { name: 'الاثنين', earnings: 4500, margin: 900 },
  { name: 'الثلاثاء', earnings: 5100, margin: 1020 },
  { name: 'الأربعاء', earnings: 4800, margin: 960 },
  { name: 'الخميس', earnings: 5500, margin: 1100 },
  { name: 'الجمعة', earnings: 6200, margin: 1240 },
];

const MONTHLY_TRENDS = [
  { name: 'أسبوع 1', earnings: 28000, margin: 5600 },
  { name: 'أسبوع 2', earnings: 32000, margin: 6400 },
  { name: 'أسبوع 3', earnings: 35000, margin: 7000 },
  { name: 'أسبوع 4', earnings: 42000, margin: 8400 },
];

const COMPARISON_METRICS = [
  { name: 'الأرباح الكلية', key: 'earnings_month' },
  { name: 'أرباح اليوم', key: 'earnings_today' },
  { name: 'نقاط الأداء', key: 'performance_score' },
  { name: 'نقاط السلوك', key: 'behavior_score' },
  { name: 'التقدم نحو الهدف', key: 'target_progress' },
];

const REVENUE_DISTRIBUTION = [
  { name: 'أرباح المذيعات', value: 80, color: '#D4AF37' },
  { name: 'هامش الوكالة', value: 15, color: '#A855F7' },
  { name: 'مصاريف تشغيلية', value: 5, color: '#ffffff20' },
];

const MOCK_MODELS: Model[] = [
  { 
    id: '101', 
    name: 'سارة أحمد', 
    status: 'online', 
    earnings: 480000,
    earnings_today: 450,
    earnings_month: 480000,
    level: 'D1',
    vip_level: 2, 
    performance_score: 95, 
    behavior_score: 98,
    streak: 12,
    risk_indicator: false,
    target_days: 5,
    target_hours: 10,
    target_progress: 85,
    performance_status: 'near target',
    supervisor_id: 'sup1',
    profile_image: 'https://picsum.photos/seed/sarah/100',
    last_active: 'الآن',
    whatsapp_number: '966500000001',
    last_message_sent: '2026-03-30T10:30:00Z',
    last_message_type: 'motivation'
  },
  { 
    id: '102', 
    name: 'ليلى محمد', 
    status: 'offline', 
    earnings: 280000,
    earnings_today: 0,
    earnings_month: 280000,
    level: 'Baby2',
    vip_level: 1, 
    performance_score: 78, 
    behavior_score: 85,
    streak: 4,
    risk_indicator: true,
    target_days: 5,
    target_hours: 10,
    target_progress: 65,
    performance_status: 'underperforming',
    supervisor_id: 'sup2',
    profile_image: 'https://picsum.photos/seed/layla/100',
    last_active: 'منذ ساعتين',
    whatsapp_number: '966500000002',
    last_message_sent: '2026-03-29T15:20:00Z',
    last_message_type: 'warning'
  },
  { 
    id: '103', 
    name: 'نورا علي', 
    status: 'online', 
    earnings: 1200000,
    earnings_today: 1200,
    earnings_month: 1200000,
    level: 'C1',
    vip_level: 3, 
    performance_score: 98, 
    behavior_score: 99,
    streak: 21,
    risk_indicator: false,
    target_days: 0,
    target_hours: 0,
    target_progress: 100,
    performance_status: 'achieved',
    supervisor_id: 'sup1',
    profile_image: 'https://picsum.photos/seed/nora/100',
    last_active: 'الآن',
    whatsapp_number: '966500000003',
    last_message_sent: '2026-03-31T09:00:00Z',
    last_message_type: 'motivation'
  },
  { 
    id: '104', 
    name: 'مريم خالد', 
    status: 'offline', 
    earnings: 120000,
    earnings_today: 0,
    earnings_month: 120000,
    level: 'Baby1',
    vip_level: 1, 
    performance_score: 35, 
    behavior_score: 40,
    streak: 0,
    risk_indicator: true,
    target_days: 5,
    target_hours: 10,
    target_progress: 20,
    performance_status: 'inactive',
    supervisor_id: 'sup2',
    profile_image: 'https://picsum.photos/seed/maryam/100',
    last_active: 'منذ 3 أيام',
    whatsapp_number: '', // Missing for testing
    last_message_sent: undefined,
    last_message_type: undefined
  },
  { 
    id: '105', 
    name: 'ياسمين فهد', 
    status: 'online', 
    earnings: 650000,
    earnings_today: 650,
    earnings_month: 650000,
    level: 'D2',
    vip_level: 2, 
    performance_score: 88, 
    behavior_score: 92,
    streak: 8,
    risk_indicator: false,
    target_days: 5,
    target_hours: 10,
    target_progress: 75,
    performance_status: 'near target',
    supervisor_id: 'sup1',
    profile_image: 'https://picsum.photos/seed/yasmin/100',
    last_active: 'الآن',
    whatsapp_number: '966500000005',
    last_message_sent: '2026-03-30T18:45:00Z',
    last_message_type: 'reminder'
  },
];

const MOCK_WHATSAPP_MESSAGES: WhatsAppMessage[] = [
  { id: 'm1', model_id: '101', text: 'أداء رائع اليوم سارة، استمري!', timestamp: '10:30 AM', status: 'read', is_admin: true },
  { id: 'm2', model_id: '101', text: 'شكراً لك أستاذ، سأبذل قصارى جهدي.', timestamp: '10:35 AM', status: 'read', is_admin: false },
];

const MOCK_SUPERVISORS: Supervisor[] = [
  { 
    id: 'sup1', 
    name: 'أحمد منصور', 
    avatar: 'https://picsum.photos/seed/mansour/100', 
    role: 'supervisor',
    team_size: 12, 
    team_earnings: 45000, 
    performance: 92,
    team_stats: {
      active_models: 10,
      total_earnings: 45000,
      performance_avg: 92,
      targets_met: 8
    },
    performance_overview: 'أداء متميز للفريق هذا الشهر مع التزام كامل بالأهداف.'
  },
  { 
    id: 'sup2', 
    name: 'خالد العتيبي', 
    avatar: 'https://picsum.photos/seed/otaibi/100', 
    role: 'supervisor',
    team_size: 10, 
    team_earnings: 32000, 
    performance: 78,
    team_stats: {
      active_models: 7,
      total_earnings: 32000,
      performance_avg: 78,
      targets_met: 6
    },
    performance_overview: 'يحتاج الفريق للتركيز على زيادة ساعات البث المسائية.'
  },
];

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', priority: 'red', title: 'تنبيه خمول حرج', message: 'المذيعة مريم خالد لم تفتح بث منذ 72 ساعة.', timestamp: 'منذ 15 دقيقة', time: '14:20', type: 'inactivity', model_id: '104' },
  { id: 'n2', priority: 'gold', title: 'إنجاز استثنائي', message: 'نورا علي تجاوزت الهدف الشهري بنسبة 20%!', timestamp: 'منذ ساعة', time: '13:05', type: 'achievement', model_id: '103' },
  { id: 'n3', priority: 'purple', title: 'انخفاض مفاجئ', message: 'انخفاض نشاط ليلى محمد بنسبة 40% اليوم.', timestamp: 'منذ 3 ساعات', time: '11:15', type: 'drop', model_id: '102' },
];

const WHATSAPP_MESSAGES = {
  motivation: "شدّي حالك اليوم، في فرصة توصلي لفل أعلى 💪🔥",
  warning: "في انخفاض بالأداء، لازم نركز اليوم أكثر ⚠️",
  reminder: "تذكير بالدوام وتحقيق التارجت اليومي ⏰"
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const offlineToastIdRef = useRef<string | null>(null);

  // Toast system
  const { showToast, dismissToast } = useToast();

  // Network status with toast integration
  const { isOnline, justRestored } = useNetworkStatus(() => {
    // On restore: dismiss offline toast, show restored toast
    if (offlineToastIdRef.current) {
      dismissToast(offlineToastIdRef.current);
      offlineToastIdRef.current = null;
    }
    showToast({
      type: 'restored',
      message: 'تمت استعادة الاتصال — جاري المزامنة...',
      duration: 3500,
    });
  });

  const isOffline = !isOnline;

  // Resize handler (online/offline now managed by useNetworkStatus)
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show persistent offline toast when going offline
  useEffect(() => {
    if (isOffline && !offlineToastIdRef.current) {
      offlineToastIdRef.current = showToast({
        type: 'offline',
        message: 'أنت غير متصل — يتم عرض آخر بيانات محفوظة',
        duration: 0, // persistent
      });
    }
  }, [isOffline, showToast]);

  // PWA install prompt capture
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Only show if not already dismissed
      if (!sessionStorage.getItem('pwa-banner-dismissed')) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Push notification permission request (after first login)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      // Small delay so it feels natural after login
      const t = setTimeout(() => {
        Notification.requestPermission().then(p => setNotifPermission(p));
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated]);

  // Send native notification for critical model alerts
  useEffect(() => {
    if (!isAuthenticated) return;
    if (notifPermission !== 'granted') return;
    const inactiveModels = models.filter(m => m.performance_status === 'inactive');
    const underperforming = models.filter(m => m.performance_status === 'underperforming');
    if (inactiveModels.length > 0) {
      const n = new window.Notification('⚠️ تنبيه: مذيعات خاملة', {
        body: `${inactiveModels.map(m => m.name).join('، ')} — لم تبثن منذ فترة طويلة`,
        icon: 'https://i.ibb.co/vYvH6yR/eyedeaz-logo.png',
        tag: 'inactive-alert',
      } as NotificationOptions);
      n.onclick = () => { window.focus(); setActiveTab('notifications'); };
    }
    if (underperforming.length > 0) {
      setTimeout(() => {
        const n2 = new window.Notification('📉 أداء منخفض', {
          body: `${underperforming.map(m => m.name).join('، ')} — تحتاج إلى متابعة عاجلة`,
          icon: 'https://i.ibb.co/vYvH6yR/eyedeaz-logo.png',
          tag: 'underperform-alert',
        } as NotificationOptions);
        n2.onclick = () => { window.focus(); setActiveTab('models'); };
      }, 1500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, notifPermission]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBanner(false);
    setInstallPrompt(null);
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('pwa-banner-dismissed', '1');
  };

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('agent');
  const [agencyName, setAgencyName] = useState('وكالة سهل حوران');
  const [isEditingAgencyName, setIsEditingAgencyName] = useState(false);
  const [models, setModels] = useState<Model[]>(MOCK_MODELS);
  const [showAddModal, setShowAddModal] = useState(false);

  const canEditAgency = userRole === 'agent';

  const filteredModels = userRole === 'agent' 
    ? models 
    : models.filter(m => m.supervisor_id === 'sup1');

  const handleUnlock = (role: UserRole) => {
    setUserRole(role);
    setIsAuthenticated(true);
    showToast({ type: 'success', message: 'تم تسجيل الدخول بنجاح', duration: 2500 });
  };

  // Inactivity Logout
  React.useEffect(() => {
    if (!isAuthenticated) return;
    
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsAuthenticated(false);
      }, 300000); // 5 minutes
    };

    const events = ['mousemove', 'keypress', 'click', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      clearTimeout(timeout);
    };
  }, [isAuthenticated]);

  // Cancel all pending requests on logout
  useEffect(() => {
    if (!isAuthenticated) {
      cancelAllRequests();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <AuthSystem onUnlock={handleUnlock} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'models', label: 'إدارة المذيعات', icon: Users },
    ...(userRole === 'agent' ? [
      { id: 'team', label: 'فريق الإشراف', icon: Briefcase },
    ] : []),
    { id: 'automation', label: 'الأتمتة والرفع', icon: UploadCloud },
    { id: 'notifications', label: 'التنبيهات', icon: Bell },
    { id: 'chat', label: 'المحادثات', icon: MessageSquare },
    { id: 'schedule', label: 'الجدول والمهام', icon: Calendar },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  const SystemAssistant = () => {
    const underperformingModels = models.filter(m => m.performance_status === 'underperforming');
    
    const sendBulkWarnings = () => {
      underperformingModels.forEach(m => {
        if (m.whatsapp_number) {
          const url = `https://wa.me/${m.whatsapp_number}?text=${encodeURIComponent(WHATSAPP_MESSAGES.warning)}`;
          window.open(url, '_blank');
        }
      });
      
      setModels(prev => prev.map(m => 
        m.performance_status === 'underperforming' ? {
          ...m,
          last_message_sent: new Date().toISOString(),
          last_message_type: 'warning'
        } : m
      ));
    };

    if (underperformingModels.length === 0) return null;

    return (
      <div className="glass-card p-4 border-brand-purple/30 bg-brand-purple/5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-brand-gold rounded-full animate-pulse" />
          <span className="text-xs font-bold text-brand-gold uppercase tracking-tighter">مساعد النظام الذكي</span>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">
          تم رصد انخفاض في أداء {underperformingModels.length} مذيعات. هل ترغب في إرسال تنبيهات واتساب آلية؟
        </p>
        <div className="flex gap-2 mt-4">
          <button className="flex-1 bg-brand-purple/40 hover:bg-brand-purple/60 text-[10px] py-2 rounded-lg transition-colors">تجاهل</button>
          <button 
            onClick={sendBulkWarnings}
            className="flex-1 bg-brand-gold text-black font-bold text-[10px] py-2 rounded-lg transition-transform active:scale-95"
          >
            إرسال الآن
          </button>
        </div>
      </div>
    );
  };

  const MainContent = () => (
    <main className={cn(
      "flex-1 transition-all duration-500 pb-24 md:pb-0 relative",
      !isMobile && (isSidebarOpen ? "mr-[280px]" : "mr-[80px]")
    )}>
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-purple/20 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-brand-gold/10 blur-[100px] rounded-full -z-10" />

      {/* Top Bar - Mobile Only */}
      {isMobile && (
        <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
          <a 
            href="https://eyedeaz227.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center">
              <img src="https://i.ibb.co/vYvH6yR/eyedeaz-logo.png" className="w-5 h-5 object-contain" alt="EYEDEAZ" />
            </div>
            <span className="text-sm font-black">EYEDEAZ</span>
          </a>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
              <Bell size={18} />
            </div>
            <div className="w-8 h-8 rounded-lg bg-brand-purple/20 flex items-center justify-center text-brand-purple">
              <User size={18} />
            </div>
          </div>
        </div>
      )}

      <div className="p-4 md:p-10 max-w-7xl mx-auto">
        <header className="hidden md:flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            {isEditingAgencyName && canEditAgency ? (
              <input 
                autoFocus
                className="bg-white/5 border border-brand-gold/50 rounded px-2 py-1 text-2xl font-bold focus:outline-none"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                onBlur={() => setIsEditingAgencyName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingAgencyName(false)}
              />
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center gap-2 group">
                  <h1 className="text-3xl font-bold">{agencyName}</h1>
                  {canEditAgency && (
                    <button 
                      onClick={() => setIsEditingAgencyName(true)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded transition-all"
                    >
                      <Plus size={14} className="text-brand-gold" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">eyedeaz internal system</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
              <div className={cn(
                "w-2 h-2 rounded-full",
                userRole === 'agent' ? "bg-brand-gold" : "bg-brand-purple"
              )} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                {userRole === 'agent' ? 'وكيل' : 'مشرفة'}
              </span>
            </div>
            <button 
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="bg-white/5 px-4 py-2 rounded-lg text-xs hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2"
            >
              {isPreviewMode ? <Monitor size={14} /> : <Smartphone size={14} />}
              {isPreviewMode ? 'العودة للوضع الكامل' : 'عرض وضع التقديم'}
            </button>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-white/50">الرصيد الحالي</p>
                <p className="text-xl font-bold text-brand-gold">$45,230.00</p>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-brand-gold p-1">
                <img src="https://picsum.photos/seed/admin/100" className="w-full h-full rounded-full object-cover" alt="Admin" />
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <SectionErrorBoundary key="dashboard"><DashboardView userRole={userRole} models={filteredModels} /></SectionErrorBoundary>}
          {activeTab === 'models' && <SectionErrorBoundary key="models"><ModelsView userRole={userRole} models={filteredModels} setModels={setModels} showAddModal={showAddModal} setShowAddModal={setShowAddModal} /></SectionErrorBoundary>}
          {activeTab === 'team' && userRole === 'agent' && <SectionErrorBoundary key="team"><TeamView /></SectionErrorBoundary>}
          {activeTab === 'automation' && userRole === 'agent' && <SectionErrorBoundary key="automation"><AutomationView models={filteredModels} /></SectionErrorBoundary>}
          {activeTab === 'notifications' && <SectionErrorBoundary key="notifications"><NotificationsView /></SectionErrorBoundary>}
          {activeTab === 'chat' && <SectionErrorBoundary key="chat"><ChatView /></SectionErrorBoundary>}
          {activeTab === 'schedule' && <SectionErrorBoundary key="schedule"><ScheduleView /></SectionErrorBoundary>}
          {activeTab === 'settings' && <SectionErrorBoundary key="settings"><SettingsView userRole={userRole} onLogout={() => setIsAuthenticated(false)} /></SectionErrorBoundary>}
        </AnimatePresence>

        <footer className="mt-20 pt-8 border-t border-white/5 text-center text-white/20 text-[10px] uppercase tracking-widest">
          eyedeaz internal system &copy; 2026
        </footer>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col md:flex-row text-white overflow-x-hidden">
      <AnimatePresence>
        {isOffline && <OfflineIndicator key="offline" />}
        {justRestored && !isOffline && <RestoredIndicator key="restored" />}
      </AnimatePresence>

      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && isMobile && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[200] px-4 pt-safe"
          >
            <div className="mt-3 mx-auto max-w-sm glass-card bg-brand-dark/95 border-brand-gold/30 p-4 flex items-center gap-4 shadow-2xl shadow-black/60">
              <img src="https://i.ibb.co/vYvH6yR/eyedeaz-logo.png" className="w-12 h-12 rounded-2xl object-contain bg-black/40 p-1 shrink-0" alt="eyedeaz" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-white">تثبيت التطبيق</p>
                <p className="text-[11px] text-white/50 truncate">أضف eyedeaz للشاشة الرئيسية</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={dismissInstallBanner}
                  className="px-3 py-2 bg-white/5 rounded-xl text-[11px] text-white/50 font-bold"
                >
                  لاحقاً
                </button>
                <button
                  onClick={handleInstall}
                  className="px-4 py-2 bg-brand-gold text-black rounded-xl text-[11px] font-black"
                >
                  تثبيت
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isPreviewMode ? (
        <>
          {/* Sidebar - Desktop Only */}
          {!isMobile && (
            <motion.aside 
              initial={false}
              animate={{ width: isSidebarOpen ? 280 : 80 }}
              className="bg-black/40 backdrop-blur-xl border-l border-white/10 flex flex-col h-screen sticky top-0 z-50"
            >
              <div className="p-6 flex items-center justify-between">
                {isSidebarOpen && (
                  <motion.a
                    href="https://eyedeaz227.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <img 
                      src="https://i.ibb.co/vYvH6yR/eyedeaz-logo.png" 
                      alt="EYEDEAZ" 
                      className="h-8 w-auto"
                      referrerPolicy="no-referrer"
                    />
                  </motion.a>
                )}
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group",
                    activeTab === item.id 
                      ? "bg-brand-purple purple-glow text-white" 
                      : "hover:bg-white/5 text-white/60 hover:text-white"
                  )}
                >
                  <item.icon size={22} className={cn(activeTab === item.id ? "text-white" : "group-hover:scale-110 transition-transform")} />
                  {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-white/10 space-y-4">
              <SystemAssistant />
              <button 
                onClick={() => setIsAuthenticated(false)}
                className="w-full flex items-center gap-4 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={22} />
                {isSidebarOpen && <span className="font-medium">تسجيل الخروج</span>}
              </button>
            </div>
          </motion.aside>
          )}
          <MainContent />

          {/* Mobile Navigation */}
          {isMobile && (
            <BottomNav 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              navItems={navItems}
              role={userRole}
            />
          )}

          {/* Mobile FAB */}
          {isMobile && activeTab === 'models' && (
            <QuickActionFAB 
              onAction={(action) => {
                if (action === 'add') setShowAddModal(true);
                // Handle other actions if needed
              }} 
            />
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center gap-12 p-12 bg-black/60 overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
          
          {/* Desktop Preview */}
          <div className="flex-1 h-[80vh] glass-card overflow-hidden flex shadow-[0_0_100px_rgba(0,0,0,0.8)] scale-90 origin-center border-white/20">
            <div className="w-64 border-l border-white/10 bg-black/40 p-6">
              <a 
                href="https://eyedeaz227.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block mb-10 hover:opacity-80 transition-opacity"
              >
                <img 
                  src="https://i.ibb.co/vYvH6yR/eyedeaz-logo.png" 
                  alt="EYEDEAZ" 
                  className="h-8 w-auto"
                  referrerPolicy="no-referrer"
                />
              </a>
              <div className="space-y-4">
                {navItems.slice(0, 4).map(item => (
                  <div key={item.id} className="flex items-center gap-3 text-white/40 text-sm"><item.icon size={16} /> {item.label}</div>
                ))}
              </div>
            </div>
            <div className="flex-1 p-8 overflow-y-auto bg-brand-dark/50">
              <DashboardView userRole={userRole} models={models} />
            </div>
          </div>
          
          {/* Mobile Preview */}
          <div className="w-[320px] h-[650px] bg-black border-[12px] border-zinc-800 rounded-[3.5rem] overflow-hidden shadow-2xl relative scale-90">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-zinc-800 rounded-b-3xl z-20" />
            <div className="h-full overflow-y-auto p-4 pt-12 bg-brand-dark relative">
              <div className="absolute top-0 right-0 w-full h-full bg-brand-purple/10 blur-3xl -z-10" />
              <div className="flex justify-between items-center mb-6">
                <Menu size={20} className="text-white/60" />
                <a 
                  href="https://eyedeaz227.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <img 
                    src="https://i.ibb.co/vYvH6yR/eyedeaz-logo.png" 
                    alt="EYEDEAZ" 
                    className="h-6 w-auto"
                    referrerPolicy="no-referrer"
                  />
                </a>
                <Bell size={20} className="text-white/60" />
              </div>
              <h2 className="text-lg font-bold mb-4">أهلاً بك، المشرف</h2>
              <div className="space-y-4">
                <div className="glass-card p-4 bg-white/5">
                  <p className="text-[10px] text-white/50 mb-1">أرباح اليوم</p>
                  <p className="text-lg font-bold text-brand-gold">$3,420</p>
                </div>
                <div className="glass-card p-4 bg-white/5">
                  <h3 className="text-xs font-bold mb-3">أداء المذيعات</h3>
                  {MOCK_MODELS.slice(0, 3).map(m => (
                    <div key={m.id} className="flex items-center justify-between mb-3 last:mb-0">
                      <div className="flex items-center gap-2">
                        <img src={m.profile_image} className="w-6 h-6 rounded-full" alt="" />
                        <span className="text-[10px]">{m.name}</span>
                      </div>
                      <span className="text-[10px] text-brand-gold font-bold">${m.earnings_today}</span>
                    </div>
                  ))}
                </div>
                <div className="h-32 glass-card p-4 bg-white/5">
                   <p className="text-[10px] text-white/50 mb-2">النشاط الأخير</p>
                   <div className="w-full h-full bg-white/5 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsPreviewMode(false)}
            className="absolute top-8 right-8 bg-brand-gold text-black px-8 py-3 rounded-full font-bold shadow-2xl hover:scale-105 transition-transform z-50"
          >
            إغلاق المعاينة
          </button>
        </div>
      )}
    </div>
  );
}

function DashboardView({ userRole, models }: { userRole: UserRole, models: Model[] }) {
  const [trendView, setTrendView] = useState<'weekly' | 'monthly'>('weekly');
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);
  const totalEarnings = models.reduce((acc, m) => acc + m.earnings, 0);
  const totalBonuses = models.reduce((acc, m) => acc + getLevelForEarnings(m.earnings).bonus, 0);
  const totalAgentShare = models.reduce((acc, m) => acc + getLevelForEarnings(m.earnings).agentShare, 0);
  const agencyProfit = totalEarnings - totalBonuses - totalAgentShare;

  const levelCounts = models.reduce((acc, m) => {
    const level = m.level.substring(0, 1);
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(levelCounts).map(([name, value]) => ({
    name: `مستوى ${name}`,
    value,
    color: name === 'S' || name === 'A' ? '#D4AF37' : name === 'B' || name === 'C' ? '#A855F7' : '#ffffff20'
  }));

  if (isLoading) return <DashboardSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Desktop breadcrumb */}
      <div className="hidden md:flex items-center gap-2 breadcrumb mb-2">
        <span className="breadcrumb-active">لوحة التحكم</span>
        <ChevronRight size={12} className="breadcrumb-sep" />
        <span>{userRole === 'agent' ? 'وكيل' : 'مشرف'}</span>
      </div>
      {/* MOBILE: Horizontally swipeable stat cards */}
      <div className="md:hidden -mx-4 px-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x-mandatory pb-2">
          {[
            { label: 'إجمالي الأرباح', value: totalEarnings, icon: DollarSign, color: 'text-brand-gold', bg: 'bg-brand-gold/10', border: 'border-brand-gold/20' },
            { label: 'إجمالي المكافآت', value: totalBonuses, icon: Award, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
            { label: 'عمولة الوكيل', value: totalAgentShare, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
            { label: 'صافي الربح', value: agencyProfit, icon: ShieldAlert, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
          ].map((stat, i) => (
            <div
              key={i}
              className={cn("glass-card shrink-0 w-[160px] snap-start p-5 relative overflow-hidden border", stat.bg, stat.border)}
            >
              <div className={cn("p-2.5 rounded-xl bg-black/20 w-fit mb-3 shadow-xl", stat.color)}>
                <stat.icon size={20} />
              </div>
              <p className="text-[9px] text-white/40 font-bold mb-1 uppercase tracking-wider leading-tight">{stat.label}</p>
              <h4 className="text-2xl font-black tracking-tighter leading-none">
                {stat.value.toLocaleString()}
              </h4>
              <p className="text-[9px] text-white/25 mt-1">نقطة</p>
            </div>
          ))}
        </div>
        {/* Scroll hint dots */}
        <div className="flex justify-center gap-1.5 mt-2">
          {[0,1,2,3].map(i => (
            <div key={i} className={cn("h-1 rounded-full transition-all", i === 0 ? "w-4 bg-brand-gold" : "w-1.5 bg-white/20")} />
          ))}
        </div>
      </div>

      {/* DESKTOP: Grid stat cards */}
      <div className="hidden md:grid md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الأرباح', value: totalEarnings, icon: DollarSign, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
          { label: 'إجمالي المكافآت', value: totalBonuses, icon: Award, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'عمولة الوكيل', value: totalAgentShare, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'صافي ربح الوكالة', value: agencyProfit, icon: ShieldAlert, color: 'text-green-400', bg: 'bg-green-500/10' },
        ].map((stat, i) => (
          <div key={i} className={cn("glass-card p-6 relative overflow-hidden group border-white/5", stat.bg)}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl group-hover:bg-white/10 transition-all" />
            <div className="relative z-10">
              <div className={cn("p-3 rounded-xl bg-black/20 w-fit mb-4 shadow-xl", stat.color)}>
                <stat.icon size={24} />
              </div>
              <p className="text-[10px] text-white/40 font-bold mb-1 uppercase tracking-[0.2em]">{stat.label}</p>
              <h4 className="text-3xl font-black tracking-tighter">
                {stat.value.toLocaleString()} <span className="text-[10px] text-white/30 font-normal">نقطة</span>
              </h4>
            </div>
          </div>
        ))}
      </div>

      {/* MOBILE: Quick status bar */}
      <div className="md:hidden grid grid-cols-3 gap-3">
        {[
          { label: 'نشطات الآن', value: models.filter(m => m.status === 'online').length, icon: Users, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'في خطر', value: models.filter(m => m.risk_indicator).length, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'أعلى أداء', value: `${models.length > 0 ? Math.max(...models.map(m => m.performance_score)) : 0}%`, icon: Trophy, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
        ].map((s, i) => (
          <div key={i} className={cn("glass-card p-3 text-center border-white/5", s.bg)}>
            <div className={cn("flex justify-center mb-1", s.color)}><s.icon size={16} /></div>
            <p className="text-lg font-black">{s.value}</p>
            <p className="text-[9px] text-white/40 font-bold">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Advanced Analytics Chart */}
        <div className="lg:col-span-2 glass-card p-5 md:p-8 border-white/5">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-bold">تحليل الأداء المالي</h3>
              <p className="text-sm text-white/40">مراقبة نمو الأرباح {trendView === 'weekly' ? 'اليومي' : 'الأسبوعي'} بناءً على القواعد المحددة</p>
            </div>
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => setTrendView('weekly')}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  trendView === 'weekly' ? "bg-brand-purple text-white shadow-lg shadow-brand-purple/20" : "hover:bg-white/5 text-white/40"
                )}
              >
                أسبوعي
              </button>
              <button 
                onClick={() => setTrendView('monthly')}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  trendView === 'monthly' ? "bg-brand-purple text-white shadow-lg shadow-brand-purple/20" : "hover:bg-white/5 text-white/40"
                )}
              >
                شهري
              </button>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendView === 'weekly' ? PERFORMANCE_DATA : MONTHLY_TRENDS}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}K`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ fontSize: '12px', color: '#D4AF37' }}
                />
                <Area type="monotone" dataKey="earnings" name="الأرباح" stroke="#D4AF37" strokeWidth={3} fill="url(#colorEarnings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Level Distribution Pie */}
        <div className="glass-card p-8 flex flex-col border-white/5">
          <h3 className="text-xl font-bold mb-2">توزيع المستويات</h3>
          <p className="text-sm text-white/40 mb-8">تحليل تصنيفات المذيعات التلقائي</p>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]" style={{ backgroundColor: item.color }} />
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/40">{item.name}</span>
                  <span className="text-sm font-bold">{item.value} مذيعة</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers Card */}
        <div className="lg:col-span-2 glass-card p-8 border-white/5">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold">نجوم الوكالة</h3>
            <button className="text-brand-gold text-sm font-bold flex items-center gap-2 group">
              عرض الترتيب الكامل <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...models].sort((a, b) => b.earnings - a.earnings).slice(0, 3).map((model, i) => {
              const level = getLevelForEarnings(model.earnings);
              return (
                <div key={model.id} className="p-6 bg-white/5 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-brand-gold/30 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/5 blur-3xl group-hover:bg-brand-gold/10 transition-colors" />
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className="relative mb-6">
                      <div className="absolute -inset-2 bg-gradient-to-tr from-brand-gold to-brand-purple rounded-full blur opacity-30 group-hover:opacity-60 transition-opacity" />
                      <img src={model.profile_image} className="w-20 h-20 rounded-full border-2 border-brand-gold p-1 relative z-10" alt="" />
                      <div className="absolute -bottom-2 -right-2 bg-brand-gold text-black text-xs font-black w-8 h-8 flex items-center justify-center rounded-full shadow-2xl border-4 border-brand-dark z-20">
                        {i + 1}
                      </div>
                    </div>
                    <h4 className="text-lg font-bold mb-1">{model.name}</h4>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="px-2 py-0.5 bg-brand-gold/20 text-brand-gold text-[10px] font-bold rounded-full border border-brand-gold/30">
                        {level.name}
                      </div>
                      <div className="flex items-center gap-1 text-orange-400 text-[10px] font-bold">
                        <Flame size={12} fill="currentColor" />
                        <span>{model.streak} يوم</span>
                      </div>
                    </div>
                    <div className="w-full bg-black/40 rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] text-white/40 mb-1 uppercase font-bold tracking-tighter">إجمالي النقاط</p>
                      <p className="text-xl font-bold text-brand-gold">{model.earnings.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Summary Widget */}
        <div className="glass-card p-8 bg-brand-purple/10 border-brand-purple/20">
          <h3 className="text-xl font-bold mb-6">ملخص اليوم</h3>
          <div className="space-y-6">
            {[
              { label: 'المضيفات النشطات', value: models.filter(m => m.status === 'online').length, icon: Users, color: 'text-green-400' },
              { label: 'تحقيق الأهداف', value: `${models.filter(m => m.performance_status === 'achieved').length}/${models.length}`, icon: Target, color: 'text-brand-gold' },
              { label: 'متوسط الأداء', value: `${models.length > 0 ? Math.round(models.reduce((acc, m) => acc + m.performance_score, 0) / models.length) : 0}%`, icon: TrendingUp, color: 'text-blue-400' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className={cn("p-2 rounded-lg bg-white/5", item.color)}>
                    <item.icon size={20} />
                  </div>
                  <span className="text-sm text-white/60">{item.label}</span>
                </div>
                <span className="text-lg font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ModelsView({ userRole, models, setModels, showAddModal, setShowAddModal }: {
  userRole: UserRole,
  models: Model[],
  setModels: React.Dispatch<React.SetStateAction<Model[]>>,
  showAddModal: boolean,
  setShowAddModal: (show: boolean) => void
}) {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(t);
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'inactive'>('all');
  const [comparisonList, setComparisonList] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [newModel, setNewModel] = useState<Partial<Model>>({
    id: '',
    name: '',
    whatsapp_number: '',
    status: 'offline',
    earnings: 0,
    earnings_today: 0,
    earnings_month: 0,
    level: 'Baby1',
    vip_level: 1,
    performance_score: 0,
    behavior_score: 0,
    streak: 0,
    risk_indicator: false,
    target_days: 5,
    target_hours: 10,
    target_progress: 0,
    performance_status: 'inactive',
    supervisor_id: 'sup1',
    profile_image: 'https://picsum.photos/seed/new/100',
    last_active: 'الآن'
  });
  const [error, setError] = useState('');

  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) || model.id.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || model.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddModel = () => {
    if (!newModel.name || !newModel.id || !newModel.whatsapp_number) {
      setError("رقم واتساب مطلوب لكل مذيعة قبل المتابعة");
      return;
    }
    setModels(prev => [...prev, newModel as Model]);
    setShowAddModal(false);
    setNewModel({
      id: '',
      name: '',
      whatsapp_number: '',
      status: 'offline',
      earnings: 0,
      earnings_today: 0,
      earnings_month: 0,
      level: 'Baby1',
      vip_level: 1,
      performance_score: 0,
      behavior_score: 0,
      streak: 0,
      risk_indicator: false,
      target_days: 5,
      target_hours: 10,
      target_progress: 0,
      performance_status: 'inactive',
      supervisor_id: 'sup1',
      profile_image: 'https://picsum.photos/seed/new/100',
      last_active: 'الآن'
    });
    setError('');
  };

  const openWhatsApp = (model: Model, type: 'motivation' | 'warning' | 'reminder') => {
    if (!model.whatsapp_number) return;
    
    const message = WHATSAPP_MESSAGES[type];
    const url = `https://wa.me/${model.whatsapp_number}?text=${encodeURIComponent(message)}`;
    
    // Update tracking
    setModels(prev => prev.map(m => 
      m.id === model.id ? { 
        ...m, 
        last_message_sent: new Date().toISOString(),
        last_message_type: type 
      } : m
    ));
    
    window.open(url, '_blank');
  };

  const toggleComparison = (id: string) => {
    setComparisonList(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  if (showComparison) {
    return <ModelComparisonView selectedIds={comparisonList} onBack={() => setShowComparison(false)} />;
  }

  if (isLoading) return <ModelsViewSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 relative"
    >
      {/* Add Model Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card bg-brand-dark/90 border-white/10 p-8 w-full max-w-md relative z-10 space-y-6"
            >
              <h3 className="text-2xl font-bold text-brand-gold">إضافة مذيعة جديدة</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-white/40 font-bold uppercase">الاسم الكامل</label>
                  <input 
                    type="text" 
                    value={newModel.name}
                    onChange={(e) => setNewModel(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-right focus:border-brand-gold outline-none"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40 font-bold uppercase">معرف المذيعة (ID)</label>
                  <input 
                    type="text" 
                    value={newModel.id}
                    onChange={(e) => setNewModel(prev => ({ ...prev, id: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-right focus:border-brand-gold outline-none"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40 font-bold uppercase">رقم الواتساب</label>
                  <input 
                    type="text" 
                    value={newModel.whatsapp_number}
                    onChange={(e) => setNewModel(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                    placeholder="966XXXXXXXXX"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-right focus:border-brand-gold outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs font-bold">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn-ghost flex-1 py-3 text-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAddModel}
                  className="btn-gold flex-1 py-3 text-sm"
                >
                  حفظ المذيعة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Comparison Bar */}
      <AnimatePresence>
        {comparisonList.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 glass-card bg-brand-purple/90 backdrop-blur-xl border-brand-purple/30 p-4 flex items-center gap-6 shadow-2xl shadow-brand-purple/40 min-w-[400px]"
          >
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <RefreshCw size={16} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">مقارنة المذيعات</p>
                <p className="text-[10px] text-white/60">{comparisonList.length} مذيعات مختارة</p>
              </div>
            </div>
            <div className="flex -space-x-2 rtl:space-x-reverse flex-1">
              {comparisonList.map(id => {
                const model = MOCK_MODELS.find(m => m.id === id);
                return (
                  <img key={id} src={model?.profile_image} className="w-8 h-8 rounded-full border-2 border-brand-purple object-cover" alt="" />
                );
              })}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setComparisonList([])}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all"
              >
                إلغاء
              </button>
              <button 
                onClick={() => setShowComparison(true)}
                disabled={comparisonList.length < 2}
                className="px-6 py-2 bg-brand-gold text-black rounded-xl text-xs font-bold hover:bg-brand-gold/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                بدء المقارنة
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Models Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المذيعات', value: models.length, icon: Users, color: 'text-brand-gold' },
          { label: 'متصل الآن', value: models.filter(m => m.status === 'online').length, icon: Monitor, color: 'text-green-400' },
          { label: 'مذيعات في خطر', value: models.filter(m => m.risk_indicator).length, icon: AlertTriangle, color: 'text-red-400' },
          { label: 'متوسط الأداء', value: `${Math.round(models.reduce((acc, m) => acc + m.performance_score, 0) / (models.length || 1))}%`, icon: Award, color: 'text-purple-400' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4 flex items-center justify-between bg-white/5 border-white/5">
            <div>
              <p className="text-[10px] text-white/40 font-bold uppercase mb-1">{stat.label}</p>
              <h3 className="text-xl font-bold">{stat.value}</h3>
            </div>
            <div className={cn("p-2 rounded-lg bg-white/5", stat.color)}>
              <stat.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* Sticky header for models */}
      <div className="sticky-header -mx-4 px-4 py-3 md:static md:mx-0 md:px-0 md:py-0 md:bg-transparent md:backdrop-blur-none md:border-none">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <div className="hidden md:flex items-center gap-2 breadcrumb mb-1">
              <span className="breadcrumb-active">المذيعات</span>
              <ChevronRight size={12} className="breadcrumb-sep" />
              <span>{filteredModels.length} نتيجة</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold">إدارة المذيعات</h2>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input
                type="text"
                placeholder="بحث بالاسم أو المعرف..."
                className="input-field py-2 pr-9 pl-3 text-sm"
                dir="rtl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'online', label: 'متصل' },
                { id: 'offline', label: 'غير متصل' },
                { id: 'inactive', label: 'خاملة' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id as any)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                    statusFilter === filter.id
                      ? "bg-brand-gold text-black border-brand-gold"
                      : "btn-ghost text-xs"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            {userRole === 'agent' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-gold hidden md:flex px-4 py-2 text-sm items-center gap-2"
              >
                <Plus size={16} /> إضافة مذيعة
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredModels.map((model) => {
          const level = getLevelForEarnings(model.earnings_month);
          const statusColor = model.status === 'online' ? 'bg-green-400' : 'bg-white/20';
          const perfColor = model.performance_status === 'achieved' ? 'text-green-400' :
            model.performance_status === 'near target' ? 'text-brand-gold' :
            model.performance_status === 'underperforming' ? 'text-orange-400' : 'text-red-400';
          const perfLabel = model.performance_status === 'achieved' ? 'تم الإنجاز' :
            model.performance_status === 'near target' ? 'قريب من الهدف' :
            model.performance_status === 'underperforming' ? 'أداء منخفض' : 'خاملة';

          return (
            <motion.div
              key={model.id}
              layout
              className={cn(
                "model-card",
                model.risk_indicator && "border-red-500/20"
              )}
            >
              {/* Risk banner */}
              {model.risk_indicator && (
                <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-1.5 flex items-center gap-2">
                  <AlertTriangle size={12} className="text-red-400" />
                  <span className="text-[10px] text-red-400 font-bold">تحذير: تحتاج متابعة فورية</span>
                </div>
              )}

              <div className="p-4 space-y-4">
                {/* Header row */}
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={model.profile_image}
                      className="w-14 h-14 rounded-2xl object-cover border border-white/10"
                      alt=""
                    />
                    <div className={cn("absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black", statusColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-bold truncate">{model.name}</h4>
                      {model.streak > 0 && (
                        <div className="flex items-center gap-1 text-orange-400 shrink-0">
                          <Flame size={11} fill="currentColor" />
                          <span className="text-[10px] font-bold">{model.streak}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-white/40">ID: {model.id}</span>
                      <span className={cn("text-[9px] font-bold", perfColor)}>• {perfLabel}</span>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-base font-black text-brand-gold leading-none">{model.earnings_month.toLocaleString()}</p>
                    <p className="text-[9px] text-white/30 mt-0.5">نقاط / شهر</p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-black/20 rounded-xl p-2.5 text-center border border-white/5">
                    <div className="flex items-center justify-center gap-1 mb-1 text-brand-gold">
                      <Award size={12} />
                      <span className="text-[10px] font-black">{level.name}</span>
                    </div>
                    <p className="text-[8px] text-white/30">المستوى</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-2.5 text-center border border-white/5">
                    <p className="text-sm font-black text-blue-400">{model.performance_score}%</p>
                    <p className="text-[8px] text-white/30">الأداء</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-2.5 text-center border border-white/5">
                    <p className="text-sm font-black text-green-400">{model.earnings_today.toLocaleString()}</p>
                    <p className="text-[8px] text-white/30">اليوم</p>
                  </div>
                </div>

                {/* Target progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-bold">
                    <span className="text-white/40">تقدم الهدف الشهري</span>
                    <span className={cn(
                      model.target_progress >= 100 ? "text-green-400" :
                      model.target_progress >= 70 ? "text-brand-gold" : "text-red-400"
                    )}>{model.target_progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, model.target_progress)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={cn(
                        "h-full rounded-full",
                        model.target_progress >= 100 ? "bg-green-400" :
                        model.target_progress >= 70 ? "bg-brand-gold" : "bg-red-400"
                      )}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => openWhatsApp(model, 'motivation')}
                    className="flex-1 py-2.5 rounded-xl bg-brand-gold/10 text-brand-gold text-[11px] font-bold border border-brand-gold/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare size={12} /> تحفيز
                  </button>
                  <button
                    onClick={() => openWhatsApp(model, 'warning')}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-[11px] font-bold border border-red-500/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle size={12} /> تنبيه
                  </button>
                  <button
                    onClick={() => openWhatsApp(model, 'reminder')}
                    className="flex-1 py-2.5 rounded-xl bg-brand-purple-light/10 text-brand-purple-light text-[11px] font-bold border border-brand-purple-light/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                  >
                    <Clock size={12} /> تذكير
                  </button>
                  <button
                    onClick={() => toggleComparison(model.id)}
                    className={cn(
                      "p-2.5 rounded-xl transition-all border active:scale-95",
                      comparisonList.includes(model.id)
                        ? "bg-brand-gold text-black border-brand-gold"
                        : "bg-white/5 text-white/40 border-white/10"
                    )}
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="hidden md:block glass-card overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider">المذيعة</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider">المستوى</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider">النقاط (شهرية)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider">تقدم الهدف</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider">الحالة التشغيلية</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredModels.map((model) => {
                const level = getLevelForEarnings(model.earnings_month);
                return (
                  <tr key={model.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={model.profile_image} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="" />
                          {model.risk_indicator && (
                            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 border-2 border-black shadow-lg">
                              <AlertTriangle size={8} className="text-white" />
                            </div>
                          )}
                          <div className={cn(
                            "absolute -bottom-1 -left-1 rounded-full p-0.5 border-2 border-black shadow-lg",
                            model.whatsapp_number ? "bg-green-500" : "bg-red-500"
                          )}>
                            <MessageSquare size={8} className="text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold">{model.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-white/40">ID: {model.id}</p>
                            {model.last_message_sent && (
                              <p className="text-[9px] text-brand-gold/60 font-bold">
                                آخر تواصل: {new Date(model.last_message_sent).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          model.status === 'online' ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : 
                          model.status === 'offline' ? "bg-white/20" : "bg-red-500/40"
                        )} />
                        <span className="text-xs">
                          {model.status === 'online' ? "متصل" : model.status === 'offline' ? "غير متصل" : "خاملة"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-gold/10 border border-brand-gold/20 w-fit">
                          <Award size={10} className="text-brand-gold" />
                          <span className="text-[10px] font-black text-brand-gold uppercase">{level.name}</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 w-fit">
                          <span className="text-[9px] font-bold text-brand-purple uppercase">VIP {level.vipLevel}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-brand-gold">{model.earnings_month.toLocaleString()}</p>
                      <p className="text-[10px] text-white/30">اليوم: {model.earnings_today.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-24 space-y-1.5">
                        <div className="flex justify-between text-[9px] font-bold">
                          <span className="text-white/40">الهدف</span>
                          <span className="text-white/40">{model.target_progress}%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-500",
                              model.target_progress >= 100 ? "bg-green-400" : model.target_progress >= 70 ? "bg-brand-gold" : "bg-red-400"
                            )} 
                            style={{ width: `${Math.min(100, model.target_progress)}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter",
                        model.performance_status === 'achieved' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                        model.performance_status === 'near target' ? "bg-brand-gold/10 text-brand-gold border border-brand-gold/20" :
                        model.performance_status === 'underperforming' ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                        "bg-red-500/10 text-red-400 border border-red-500/20"
                      )}>
                        {model.performance_status === 'achieved' ? 'تم الإنجاز' :
                         model.performance_status === 'near target' ? 'قريب من الهدف' :
                         model.performance_status === 'underperforming' ? 'أداء منخفض' : 'خاملة'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleComparison(model.id)}
                          className={cn(
                            "p-2 rounded-xl transition-all hover:scale-110 active:scale-95",
                            comparisonList.includes(model.id) ? "bg-brand-gold text-black" : "bg-white/5 text-white/40 hover:bg-white/10"
                          )}
                          title="مقارنة"
                        >
                          <RefreshCw size={16} />
                        </button>
                        
                        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                          <button 
                            onClick={() => openWhatsApp(model, 'motivation')}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:scale-105 active:scale-95",
                              model.performance_status === 'near target' 
                                ? "bg-brand-gold text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]" 
                                : "bg-white/5 text-white/60 hover:bg-white/10"
                            )}
                          >
                            رسالة تحفيزية
                          </button>
                          <button 
                            onClick={() => openWhatsApp(model, 'warning')}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:scale-105 active:scale-95",
                              model.performance_status === 'underperforming' 
                                ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
                                : "bg-white/5 text-white/60 hover:bg-white/10"
                            )}
                          >
                            تنبيه
                          </button>
                          <button 
                            onClick={() => openWhatsApp(model, 'reminder')}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:scale-105 active:scale-95",
                              model.status === 'inactive' 
                                ? "bg-brand-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
                                : "bg-white/5 text-white/60 hover:bg-white/10"
                            )}
                          >
                            تذكير
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function ModelComparisonView({ selectedIds, onBack }: { selectedIds: string[], onBack: () => void }) {
  const selectedModels = MOCK_MODELS.filter(m => selectedIds.includes(m.id));
  
  const comparisonData = [
    { name: 'السبت', ...selectedModels.reduce((acc, m, i) => ({ ...acc, [`m${i}`]: Math.random() * 5000 + 2000 }), {}) },
    { name: 'الأحد', ...selectedModels.reduce((acc, m, i) => ({ ...acc, [`m${i}`]: Math.random() * 5000 + 2000 }), {}) },
    { name: 'الاثنين', ...selectedModels.reduce((acc, m, i) => ({ ...acc, [`m${i}`]: Math.random() * 5000 + 2000 }), {}) },
    { name: 'الثلاثاء', ...selectedModels.reduce((acc, m, i) => ({ ...acc, [`m${i}`]: Math.random() * 5000 + 2000 }), {}) },
    { name: 'الأربعاء', ...selectedModels.reduce((acc, m, i) => ({ ...acc, [`m${i}`]: Math.random() * 5000 + 2000 }), {}) },
    { name: 'الخميس', ...selectedModels.reduce((acc, m, i) => ({ ...acc, [`m${i}`]: Math.random() * 5000 + 2000 }), {}) },
    { name: 'الجمعة', ...selectedModels.reduce((acc, m, i) => ({ ...acc, [`m${i}`]: Math.random() * 5000 + 2000 }), {}) },
  ];

  const colors = ['#D4AF37', '#A855F7', '#3B82F6', '#10B981', '#EF4444'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <h2 className="text-2xl font-bold">مقارنة الأداء التفصيلية</h2>
        </div>
        <div className="flex -space-x-3 rtl:space-x-reverse">
          {selectedModels.map((m, i) => (
            <div key={m.id} className="relative group">
              <img 
                src={m.profile_image} 
                className="w-10 h-10 rounded-full border-2 border-black object-cover ring-2 ring-transparent group-hover:ring-brand-gold transition-all" 
                alt="" 
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-black" style={{ backgroundColor: colors[i % colors.length] }} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-8 border-white/5">
          <h3 className="text-xl font-bold mb-8">مقارنة نمو الأرباح الأسبوعي</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '16px' }}
                />
                {selectedModels.map((m, i) => (
                  <Area 
                    key={m.id}
                    type="monotone" 
                    dataKey={`m${i}`} 
                    name={m.name} 
                    stroke={colors[i % colors.length]} 
                    strokeWidth={3} 
                    fill="transparent"
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 border-white/5">
          <h3 className="text-xl font-bold mb-6">ملخص المقارنة</h3>
          <div className="space-y-6">
            {selectedModels.map((m, i) => (
              <div key={m.id} className="p-4 bg-white/5 rounded-2xl border-r-4" style={{ borderRightColor: colors[i % colors.length] }}>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-sm">{m.name}</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">{m.level}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] text-white/30 uppercase mb-1">الأرباح</p>
                    <p className="text-sm font-bold text-brand-gold">${m.earnings_month.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/30 uppercase mb-1">الأداء</p>
                    <p className="text-sm font-bold text-green-400">{m.performance_score}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden border-white/5">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider">المقياس</th>
              {selectedModels.map(m => (
                <th key={m.id} className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider">{m.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {COMPARISON_METRICS.map((metric) => (
              <tr key={metric.key} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-white/60">{metric.name}</td>
                {selectedModels.map(m => (
                  <td key={m.id} className="px-6 py-4 text-sm font-bold">
                    {(m as any)[metric.key].toLocaleString()}
                    {metric.key === 'target_progress' || metric.key === 'performance_score' || metric.key === 'behavior_score' ? '%' : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function TeamView() {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">فريق الإشراف</h2>
        <button className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors">
          إضافة مشرف جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_SUPERVISORS.map((sup) => (
          <div key={sup.id} className="glass-card p-6 space-y-6 bg-white/5 border-white/5 group hover:border-brand-purple/30 transition-all">
            <div className="flex items-center gap-4">
              <img src={sup.avatar} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/10 group-hover:border-brand-purple/50 transition-colors" alt="" />
              <div>
                <h3 className="font-bold text-lg">{sup.name}</h3>
                <p className="text-xs text-white/40">مشرف معتمد</p>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                <p className="text-[10px] text-white/40 uppercase mb-1">المذيعات</p>
                <p className="text-lg font-bold">{sup.team_stats.active_models}</p>
              </div>
              <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                <p className="text-[10px] text-white/40 uppercase mb-1">الأداء</p>
                <p className="text-lg font-bold text-green-400">{sup.team_stats.performance_avg}%</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">نظرة على الفريق</p>
              <div className="flex -space-x-2 rtl:space-x-reverse">
                {MOCK_MODELS.filter(m => m.supervisor_id === sup.id).slice(0, 5).map((m, i) => (
                  <img key={i} src={m.profile_image} className="w-8 h-8 rounded-full border-2 border-black object-cover" alt="" />
                ))}
                {MOCK_MODELS.filter(m => m.supervisor_id === sup.id).length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-[10px] font-bold">
                    +{MOCK_MODELS.filter(m => m.supervisor_id === sup.id).length - 5}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] text-white/40 mb-2 uppercase font-bold tracking-tighter">ملخص الأداء</p>
              <p className="text-xs text-white/70 leading-relaxed">{sup.performance_overview}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button className="flex-1 bg-brand-purple/10 text-brand-purple py-2.5 rounded-xl text-xs font-bold hover:bg-brand-purple/20 transition-all">
                عرض التقارير
              </button>
              <button className="p-2.5 bg-white/5 text-white/40 rounded-xl hover:bg-white/10 transition-all">
                <MessageSquare size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function AutomationView({ models }: { models: Model[] }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [manualId, setManualId] = useState("");
  const [manualEarnings, setManualEarnings] = useState("");
  const [error, setError] = useState("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Check if any model is missing WhatsApp number
    const missingWhatsApp = models.some(m => !m.whatsapp_number);
    if (missingWhatsApp) {
      setError("رقم واتساب مطلوب لكل مذيعة قبل المتابعة");
      return;
    }

    setIsUploading(true);
    setError("");
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        setIsCalculating(true);
        setTimeout(() => {
          setIsCalculating(false);
          setShowResults(true);
        }, 2000);
      }
    }, 200);
  }, [models]);

  const handleManualProcess = () => {
    if (!manualId || !manualEarnings) return;
    
    // Check if the model exists and has a WhatsApp number
    const model = models.find(m => m.id === manualId);
    if (model && !model.whatsapp_number) {
      setError("رقم واتساب مطلوب لكل مذيعة قبل المتابعة");
      return;
    }

    setIsCalculating(true);
    setError("");
    setTimeout(() => {
      setIsCalculating(false);
      setShowResults(true);
    }, 1500);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  // Upload phase label
  const uploadPhaseLabel = isUploading
    ? `جاري الرفع... ${uploadProgress}%`
    : isCalculating
    ? 'جاري التحليل...'
    : isDragActive
    ? 'أفلت الملف هنا'
    : 'اسحب لقطات الشاشة هنا';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="space-y-1">
        <div className="hidden md:flex items-center gap-2 breadcrumb mb-1">
          <span className="breadcrumb-active">رفع البيانات</span>
          <ChevronRight size={12} className="breadcrumb-sep" />
          <span>محرك الحسابات</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold gold-text">محرك الحسابات الذكي</h2>
        <p className="text-white/40 text-sm">قم برفع لقطات الشاشة أو إدخال البيانات يدوياً لحساب الأرباح والعمولات فوراً</p>
      </div>

      {!showResults ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div
            {...getRootProps()}
            className={cn(
              "drop-zone glass-card p-10 flex flex-col items-center justify-center space-y-6 cursor-pointer h-full min-h-[360px] transition-all duration-300",
              isDragActive && "active",
              isUploading && "border-brand-gold/50 bg-brand-gold/5"
            )}
          >
            <input {...getInputProps()} />
            <AnimatePresence mode="wait">
              {isUploading ? (
                <motion.div
                  key="uploading"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="w-full max-w-xs space-y-5 text-center"
                >
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 border-4 border-brand-gold/20 rounded-full" />
                    <div
                      className="absolute inset-0 border-4 border-brand-gold rounded-full border-t-transparent animate-spin"
                      style={{ animationDuration: '1s' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center font-black text-brand-gold text-lg">
                      {uploadProgress}%
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill bg-brand-gold"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm font-bold text-brand-gold">جاري رفع ومعالجة الملف...</p>
                </motion.div>
              ) : isCalculating ? (
                <motion.div
                  key="calculating"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="text-center space-y-4"
                >
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -12, 0] }}
                        transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                        className="w-3.5 h-3.5 bg-brand-purple-light rounded-full glow-purple"
                      />
                    ))}
                  </div>
                  <p className="text-sm font-bold text-brand-purple-light">جاري تحليل البيانات وتطبيق السياسات...</p>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="text-center space-y-4"
                >
                  <motion.div
                    animate={isDragActive ? { scale: 1.15, rotate: 5 } : { scale: 1, rotate: 0 }}
                    className="w-20 h-20 rounded-3xl bg-brand-gold/10 flex items-center justify-center text-brand-gold mx-auto glow-gold"
                  >
                    <Upload size={38} />
                  </motion.div>
                  <div className="space-y-1">
                    <p className="text-base font-bold">{uploadPhaseLabel}</p>
                    <p className="text-xs text-white/30">يدعم الصور والجداول — الحد الأقصى 10MB</p>
                  </div>
                  <div className="text-[10px] text-white/20 uppercase font-black tracking-widest">أو انقر للاختيار</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Manual Entry Section */}
          <div className="glass-card p-8 bg-white/5 border-white/10 flex flex-col justify-between h-full min-h-[400px]">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-brand-gold">
                <div className="p-2 bg-brand-gold/10 rounded-lg">
                  <Calculator size={20} />
                </div>
                <h3 className="font-bold">إدخال يدوي سريع</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-white/40 font-bold uppercase">معرف المذيعة (ID)</label>
                  <input 
                    type="text" 
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder="مثال: MOD-772"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-right focus:border-brand-gold outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40 font-bold uppercase">إجمالي النقاط</label>
                  <input 
                    type="number" 
                    value={manualEarnings}
                    onChange={(e) => setManualEarnings(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-right focus:border-brand-gold outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-4 bg-brand-purple/5 rounded-xl border border-brand-purple/10">
                <p className="text-[10px] text-brand-purple font-bold uppercase mb-1">تنبيه النظام</p>
                <p className="text-xs text-white/60 leading-relaxed">سيتم تطبيق سياسة العمولات والمكافآت لعام 2024 تلقائياً بناءً على النقاط المدخلة.</p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-[10px] font-bold">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}
            </div>

            <button 
              onClick={handleManualProcess}
              disabled={!manualId || !manualEarnings || isCalculating}
              className="w-full bg-brand-gold text-black py-4 rounded-2xl font-black hover:bg-brand-gold/80 transition-all shadow-lg shadow-brand-gold/20 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              معالجة البيانات الآن
            </button>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="text-green-400" /> نتائج المعالجة (التقرير النهائي)
            </h3>
            <button 
              onClick={() => {
                setShowResults(false);
                setManualId("");
                setManualEarnings("");
              }}
              className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} /> معالجة جديدة
            </button>
          </div>

          <div className="glass-card overflow-hidden border-white/5">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase">المذيعة</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase">النقاط</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase">المستوى</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase">المكافأة</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase">صافي الراتب</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase">نسبة الوكيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(manualId ? [
                  { id: manualId, name: "إدخال يدوي", earnings: Number(manualEarnings) },
                  ...MOCK_MODELS.slice(0, 4)
                ] : models.slice(0, 5)).map((model, idx) => {
                  const level = getLevelForEarnings(model.earnings);
                  const fullModel = models.find(m => m.id === model.id) || model;
                  return (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 justify-end">
                          <span className="font-bold">{fullModel.name}</span>
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] text-white/40">
                            {fullModel.id.toString().slice(-3)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-brand-gold">{model.earnings.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-md bg-brand-purple/10 text-brand-purple text-[10px] font-bold border border-brand-purple/20">
                          {level.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-green-400 font-bold">${level.bonus}</td>
                      <td className="px-6 py-4 font-bold">${level.hostSalary}</td>
                      <td className="px-6 py-4 text-brand-gold font-bold">${level.agentShare}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-4">
            <button className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors">
              تصدير كملف PDF
            </button>
            <button className="bg-brand-gold text-black px-8 py-3 rounded-xl text-sm font-black hover:bg-brand-gold/80 transition-all">
              اعتماد النتائج وحفظها
            </button>
          </div>
        </motion.div>
      )}

      {/* Logic Rules Preview */}
      <div className="glass-card p-6 bg-white/5 border-white/5">
        <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Settings size={16} className="text-brand-gold" /> قواعد الحساب الحالية
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-xl bg-black/20 border border-white/5">
            <p className="text-[10px] text-white/40 uppercase mb-1">نسبة الوكيل</p>
            <p className="text-sm font-bold">متغيرة (10% - 25%) حسب المستوى</p>
          </div>
          <div className="p-3 rounded-xl bg-black/20 border border-white/5">
            <p className="text-[10px] text-white/40 uppercase mb-1">نظام المكافآت</p>
            <p className="text-sm font-bold">تراكمي يبدأ من مستوى Baby2</p>
          </div>
          <div className="p-3 rounded-xl bg-black/20 border border-white/5">
            <p className="text-[10px] text-white/40 uppercase mb-1">العملة المعتمدة</p>
            <p className="text-sm font-bold">الدولار الأمريكي (USD)</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NotificationsView() {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'high' | 'achievement'>('all');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'high') return n.priority === 'red';
    if (filter === 'achievement') return n.type === 'achievement';
    return true;
  });

  const redCount = notifications.filter(n => n.priority === 'red').length;
  const achievementCount = notifications.filter(n => n.type === 'achievement').length;

  const handleDismiss = (id: string) => {
    if ('vibrate' in navigator) navigator.vibrate(20);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleWhatsApp = (n: typeof MOCK_NOTIFICATIONS[0]) => {
    const model = MOCK_MODELS.find(m => m.id === n.model_id);
    if (!model?.whatsapp_number) return;
    const msg = n.type === 'inactivity'
      ? WHATSAPP_MESSAGES.reminder
      : n.type === 'drop'
      ? WHATSAPP_MESSAGES.warning
      : WHATSAPP_MESSAGES.motivation;
    window.open(`https://wa.me/${model.whatsapp_number}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (isLoading) return <NotificationsViewSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4 max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">التنبيهات</h2>
          {notifications.length > 0 && (
            <span className="animate-pulse-gold bg-brand-gold/10 text-brand-gold px-2.5 py-0.5 rounded-full text-[10px] font-black border border-brand-gold/30">
              {notifications.length} نشط
            </span>
          )}
        </div>
        {notifications.length > 0 && (
          <button
            onClick={() => setNotifications([])}
            className="text-[11px] text-white/30 hover:text-white/60 transition-colors font-bold"
          >
            مسح الكل
          </button>
        )}
      </div>

      {/* Filter tabs — horizontally scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {[
          { id: 'all', label: 'الكل', count: notifications.length },
          { id: 'high', label: 'طارئ', count: redCount },
          { id: 'achievement', label: 'إنجازات', count: achievementCount },
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shrink-0 border",
              filter === btn.id
                ? "bg-brand-gold text-black border-brand-gold shadow-lg shadow-brand-gold/20"
                : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
            )}
          >
            {btn.label}
            {btn.count > 0 && (
              <span className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black",
                filter === btn.id ? "bg-black/20 text-black" : "bg-white/10 text-white/60"
              )}>
                {btn.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredNotifications.map((n) => {
            const iconEl = n.type === 'inactivity' ? <Clock size={22} /> :
              n.type === 'achievement' ? <Award size={22} /> : <AlertTriangle size={22} />;
            const priorityStyles = {
              red: {
                border: 'border-l-4 border-l-red-500',
                icon: 'bg-red-500/15 text-red-400',
                glow: 'after:absolute after:inset-0 after:bg-red-500/3',
                badge: 'bg-red-500 text-white',
                badgeLabel: 'طارئ',
              },
              gold: {
                border: 'border-l-4 border-l-brand-gold',
                icon: 'bg-brand-gold/15 text-brand-gold',
                glow: '',
                badge: 'bg-brand-gold text-black',
                badgeLabel: 'إنجاز',
              },
              purple: {
                border: 'border-l-4 border-l-brand-purple-light',
                icon: 'bg-brand-purple-light/15 text-brand-purple-light',
                glow: '',
                badge: 'bg-brand-purple-light text-white',
                badgeLabel: 'تنبيه',
              },
            }[n.priority];

            return (
              <motion.div
                layout
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "notif-item",
                  priorityStyles.border
                )}
              >
                {n.priority === 'red' && (
                  <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 blur-3xl pointer-events-none" />
                )}
                <div className="p-4 flex gap-4 relative z-10">
                  {/* Icon */}
                  <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5", priorityStyles.icon)}>
                    {iconEl}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm leading-tight">{n.title}</h4>
                          <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full shrink-0", priorityStyles.badge)}>
                            {priorityStyles.badgeLabel}
                          </span>
                          {n.priority === 'red' && (
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-white/55 mt-1 leading-relaxed">{n.message}</p>
                      </div>
                      <div className="text-left shrink-0">
                        <span className="text-[10px] text-white/30 font-bold block">{n.time}</span>
                        <span className="text-[9px] text-white/20 block mt-0.5">{n.timestamp}</span>
                      </div>
                    </div>

                    {/* CTA buttons */}
                    <div className="flex gap-2 flex-wrap pt-1">
                      {n.model_id && (
                        <button
                          onClick={() => handleWhatsApp(n)}
                          className="px-3 py-1.5 bg-brand-gold text-black rounded-xl text-[10px] font-black flex items-center gap-1.5 active:scale-95 transition-transform shadow-sm shadow-brand-gold/20"
                        >
                          <MessageSquare size={11} /> واتساب
                        </button>
                      )}
                      <button className="px-3 py-1.5 bg-white/8 rounded-xl text-[10px] font-bold flex items-center gap-1.5 hover:bg-white/15 transition-colors">
                        <User size={11} /> الملف
                      </button>
                      <button
                        onClick={() => handleDismiss(n.id)}
                        className="px-3 py-1.5 bg-white/5 rounded-xl text-[10px] font-bold text-white/30 hover:bg-red-500/15 hover:text-red-400 transition-all flex items-center gap-1.5 border border-transparent hover:border-red-500/20 active:scale-95"
                      >
                        <X size={11} /> تجاهل
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredNotifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white/3 rounded-3xl border border-dashed border-white/10"
          >
            <CheckCircle2 size={44} className="mx-auto text-green-500/30 mb-4" />
            <p className="text-white/40 font-bold">كل شيء على ما يرام!</p>
            <p className="text-white/20 text-xs mt-1">لا يوجد تنبيهات حالياً</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function ChatView() {
  const [activeChat, setActiveChat] = useState(MOCK_MODELS[0].id);
  const [message, setMessage] = useState("");
  const [showInfo, setShowInfo] = useState(true);
  const [messages, setMessages] = useState<WhatsAppMessage[]>(MOCK_WHATSAPP_MESSAGES);

  const currentModel = MOCK_MODELS.find(m => m.id === activeChat);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    const newMessage: WhatsAppMessage = {
      id: Date.now().toString(),
      model_id: activeChat,
      text: message,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      is_admin: true
    };
    setMessages(prev => [...prev, newMessage]);
    setMessage("");
    
    // Simulate delivery
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m));
    }, 1000);
    
    // Simulate read
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'read' } : m));
    }, 2500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-card h-[calc(100vh-200px)] flex overflow-hidden bg-white/5 border-white/5"
    >
      {/* Chat Sidebar */}
      <div className="w-80 border-l border-white/10 flex flex-col bg-black/20">
        <div className="p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">المحادثات</h3>
            <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
              <MoreVertical size={16} className="text-white/40" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
            <input 
              type="text" 
              placeholder="بحث في المحادثات..." 
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pr-10 pl-4 text-xs outline-none focus:border-brand-gold transition-all text-right"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {MOCK_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => setActiveChat(model.id)}
              className={cn(
                "w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-all text-right border-b border-white/5 relative group",
                activeChat === model.id && "bg-white/10"
              )}
            >
              {activeChat === model.id && <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand-gold" />}
              <div className="relative shrink-0">
                <img src={model.profile_image} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                <div className={cn(
                  "absolute -bottom-1 -left-1 w-3 h-3 rounded-full border-2 border-black",
                  model.status === 'online' ? "bg-green-500" : "bg-white/20"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-bold text-sm truncate group-hover:text-brand-gold transition-colors">{model.name}</h4>
                  <span className="text-[10px] text-white/20">10:45 م</span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <p className="text-xs text-white/40 truncate flex-1">شكراً لك، سأقوم بذلك الآن...</p>
                  {model.id === '102' && (
                    <span className="bg-brand-gold text-black w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">2</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-black/40 relative">
        {/* Chat Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h3 className="font-bold text-sm">{currentModel?.name}</h3>
              <p className={cn("text-[10px]", currentModel?.status === 'online' ? "text-green-400" : "text-white/30")}>
                {currentModel?.status === 'online' ? 'متصل الآن' : 'آخر ظهور منذ ساعة'}
              </p>
            </div>
            <img src={currentModel?.profile_image} className="w-10 h-10 rounded-xl object-cover" alt="" />
          </div>
          <div className="flex gap-2">
            <button className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-white/40">
              <Phone size={18} />
            </button>
            <button className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-white/40">
              <Video size={18} />
            </button>
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className={cn("p-2.5 rounded-xl transition-all", showInfo ? "bg-brand-gold text-black" : "bg-white/5 text-white/40")}
            >
              <HelpCircle size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] relative">
          <div className="flex justify-center sticky top-0 z-10">
            <span className="px-4 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] text-white/60 font-bold uppercase tracking-widest border border-white/10 shadow-xl">اليوم</span>
          </div>

          <div className="space-y-4">
            {messages.filter(m => m.model_id === activeChat).map((msg) => (
              <div 
                key={msg.id}
                className={cn(
                  "flex gap-3 max-w-[75%]",
                  msg.is_admin ? "flex-row-reverse mr-auto" : ""
                )}
              >
                {!msg.is_admin && (
                  <img src={currentModel?.profile_image} className="w-8 h-8 rounded-lg object-cover shrink-0 mt-1" alt="" />
                )}
                {msg.is_admin && (
                  <div className="w-8 h-8 rounded-lg bg-brand-gold/20 flex items-center justify-center text-brand-gold shrink-0 mt-1">
                    <User size={16} />
                  </div>
                )}
                <div className={cn("space-y-1", msg.is_admin ? "text-left" : "text-right")}>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm leading-relaxed shadow-lg",
                    msg.is_admin 
                      ? "bg-brand-gold text-black rounded-tl-none font-medium" 
                      : "bg-white/10 text-white rounded-tr-none border border-white/5"
                  )}>
                    {msg.text}
                  </div>
                  <div className={cn("flex items-center gap-1 mt-1", msg.is_admin ? "justify-end" : "justify-start")}>
                    <p className={cn("text-[10px]", msg.is_admin ? "text-black/40" : "text-white/20")}>{msg.timestamp}</p>
                    {msg.is_admin && (
                      <div className="flex items-center">
                        {msg.status === 'sent' && <Check size={12} className="text-black/40" />}
                        {msg.status === 'delivered' && <CheckCheck size={12} className="text-black/40" />}
                        {msg.status === 'read' && <CheckCheck size={12} className="text-brand-purple" />}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/5 border-t border-white/10 backdrop-blur-md">
          <div className="flex gap-3 items-center">
            <button className="p-2.5 text-white/20 hover:text-brand-gold transition-colors">
              <Paperclip size={20} />
            </button>
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="اكتب رسالتك هنا..." 
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pr-4 pl-12 text-sm outline-none focus:border-brand-gold transition-all text-right"
              />
              <button className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-brand-gold transition-colors">
                <Smile size={20} />
              </button>
            </div>
            <button 
              onClick={handleSendMessage}
              className="w-12 h-12 bg-brand-gold text-black rounded-2xl flex items-center justify-center hover:bg-brand-gold/80 transition-all shadow-lg shadow-brand-gold/20"
            >
              <Send size={20} className="rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Sidebar */}
      <AnimatePresence>
        {showInfo && currentModel && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-white/10 bg-black/20 flex flex-col overflow-hidden"
          >
            <div className="p-8 text-center border-b border-white/10 bg-white/5">
              <img src={currentModel.profile_image} className="w-24 h-24 rounded-3xl mx-auto mb-4 object-cover border-2 border-brand-gold p-1 shadow-2xl shadow-brand-gold/20" alt="" />
              <h3 className="font-bold text-lg">{currentModel.name}</h3>
              <p className="text-xs text-white/40">ID: {currentModel.id}</p>
              <div className="flex justify-center gap-2 mt-4">
                <span className="text-[10px] px-2.5 py-1 bg-brand-gold/10 text-brand-gold rounded-full font-bold border border-brand-gold/20">VIP {currentModel.vip_level}</span>
                <span className="text-[10px] px-2.5 py-1 bg-green-500/10 text-green-400 rounded-full font-bold border border-green-500/20">نشطة</span>
              </div>
            </div>
            <div className="p-6 space-y-8 overflow-y-auto">
              <div className="space-y-4">
                <h4 className="text-[10px] text-white/40 uppercase font-bold tracking-widest">إحصائيات الأداء</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                    <p className="text-[10px] text-white/30 mb-1">أرباح اليوم</p>
                    <p className="text-sm font-bold text-brand-gold">${currentModel.earnings_today}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                    <p className="text-[10px] text-white/30 mb-1">التقدم</p>
                    <p className="text-sm font-bold text-white">{currentModel.target_progress}%</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] text-white/40 uppercase font-bold tracking-widest">ملاحظات المشرف</h4>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 relative">
                  <Quote size={12} className="absolute top-3 right-3 text-brand-gold/20" />
                  <p className="text-xs text-white/60 leading-relaxed italic pr-4">"تظهر التزاماً كبيراً بالمواعيد، تحتاج لزيادة التفاعل مع الداعمين الجدد لتحقيق مكافآت أعلى."</p>
                </div>
              </div>
              <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold hover:bg-white/10 transition-colors">
                عرض الملف الكامل للمذيعة
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ScheduleView() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'calendar'>('tasks');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">الجدول والمهام الذكية</h2>
          <p className="text-xs text-white/40">إدارة مواعيد البث والمهام اليومية للمذيعات</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab(activeTab === 'tasks' ? 'calendar' : 'tasks')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-all",
              activeTab === 'calendar' ? "bg-brand-gold text-black font-bold" : "bg-white/5 border border-white/10 hover:bg-white/10"
            )}
          >
            <Calendar size={18} /> {activeTab === 'calendar' ? 'عرض المهام' : 'عرض التقويم'}
          </button>
          <button className="bg-brand-gold text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-brand-gold/80 transition-colors">
            <Plus size={18} /> مهمة جديدة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Tasks List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 bg-white/5 border-white/5">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold">المهام اليومية</h3>
              <div className="flex gap-2">
                <span className="text-[10px] px-2.5 py-1 bg-green-500/10 text-green-400 rounded-full font-bold border border-green-500/20">5 مكتملة</span>
                <span className="text-[10px] px-2.5 py-1 bg-brand-purple/10 text-brand-purple rounded-full font-bold border border-brand-purple/20">3 قيد التنفيذ</span>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { title: 'بث مسائي لمدة 4 ساعات', model: 'سارة أحمد', status: 'pending', time: '08:00 م', priority: 'high' },
                { title: 'تحديث صورة الملف الشخصي', model: 'نورا علي', status: 'completed', time: '02:00 م', priority: 'medium' },
                { title: 'تحقيق هدف 1000 عملة', model: 'ياسمين فهد', status: 'pending', time: '11:59 م', priority: 'high' },
                { title: 'مراجعة سياسة الخصوصية الجديدة', model: 'ليلى محمد', status: 'pending', time: '05:00 م', priority: 'low' },
              ].map((task, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-black/20 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors",
                      task.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-brand-purple/20 text-brand-purple border-brand-purple/20'
                    )}>
                      {task.status === 'completed' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                      <h4 className={cn("font-bold text-sm", task.status === 'completed' && "text-white/40 line-through")}>{task.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-white/30 flex items-center gap-1">
                          <Users size={10} /> {task.model}
                        </span>
                        <span className="text-[10px] text-white/30 flex items-center gap-1">
                          <Clock size={10} /> {task.time}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      task.priority === 'high' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : 
                      task.priority === 'medium' ? "bg-brand-gold" : "bg-white/20"
                    )} />
                    <button className="p-2 text-white/20 hover:text-white transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <div className="glass-card p-6 bg-white/5 border-white/5">
            <h4 className="text-sm font-bold mb-6 flex items-center gap-2">
              <Target size={16} className="text-brand-gold" /> أهداف اليوم
            </h4>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-white/40">إجمالي النقاط</span>
                  <span className="text-brand-gold">75%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '75%' }}
                    className="h-full bg-brand-gold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-white/40">ساعات البث</span>
                  <span className="text-brand-purple">60%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '60%' }}
                    className="h-full bg-brand-purple"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 bg-brand-purple/10 border-brand-purple/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand-purple/20 rounded-lg text-brand-purple">
                <Flame size={20} />
              </div>
              <h4 className="font-bold text-sm">تحدي الوكالة</h4>
            </div>
            <p className="text-xs text-white/60 leading-relaxed mb-4">
              بقي 3 أيام على نهاية تحدي "النجوم الصاعدة". حقق 50,000 نقطة إضافية للحصول على عمولة مضاعفة!
            </p>
            <button className="w-full py-2.5 bg-brand-purple text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-purple/80 transition-all">
              عرض التفاصيل
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
