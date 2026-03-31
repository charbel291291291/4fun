export type UserRole = 'agent' | 'supervisor';

export type LevelName = 
  | 'Baby1' | 'Baby2' | 'Baby3' 
  | 'D1' | 'D2' | 'D3' 
  | 'C1' | 'C2' | 'C3' 
  | 'B1' | 'B2' | 'B3' 
  | 'A1' | 'A2' | 'A3' 
  | 'S1' | 'S2' | 'S3' 
  | 'SS1' | 'SS2';

export interface LevelConfig {
  name: LevelName;
  threshold: number;
  bonus: number;
  agentShare: number;
  hostSalary: number;
  vipLevel: number;
}

export interface Model {
  id: string;
  name: string;
  profile_image: string;
  status: 'online' | 'offline' | 'inactive';
  earnings: number;
  earnings_today: number;
  earnings_month: number;
  level: LevelName;
  vip_level: number;
  performance_score: number;
  behavior_score: number;
  streak: number;
  risk_indicator: boolean;
  target_days: number;
  target_hours: number;
  target_progress: number; // 0-100
  performance_status: 'achieved' | 'near target' | 'underperforming' | 'inactive';
  supervisor_id: string;
  last_active: string;
  whatsapp_number?: string;
  last_message_sent?: string;
  last_message_type?: 'motivation' | 'warning' | 'reminder';
}

export interface Supervisor {
  id: string;
  name: string;
  avatar: string;
  role: 'supervisor';
  team_size: number;
  performance: number;
  team_earnings: number;
  team_stats: {
    active_models: number;
    total_earnings: number;
    performance_avg: number;
    targets_met: number;
  };
  performance_overview: string;
}

export interface Notification {
  id: string;
  priority: 'gold' | 'red' | 'purple';
  title: string;
  message: string;
  timestamp: string;
  time: string;
  type: 'inactivity' | 'achievement' | 'drop' | 'system' | 'target_drop';
  model_id?: string;
}

export interface WhatsAppMessage {
  id: string;
  model_id: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  is_admin: boolean;
}

export interface AgencyConfig {
  name: string;
  agent_id: string;
  policies: {
    base_days: number;
    base_hours: number;
  };
}
