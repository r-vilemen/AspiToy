export type UserCommandType =
  | 'START_CLEANING'
  | 'PAUSE_CLEANING'
  | 'RESUME_CLEANING'
  | 'RETURN_TO_BASE'
  | 'CLEAN_REGION'
  | 'RESET_SIMULATION';

export type NotificationTone = 'info' | 'success' | 'warning';

export interface CommandRecord {
  id: string;
  type: UserCommandType;
  label: string;
  regionId?: string;
  timestamp: string;
  accepted: boolean;
  reason?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  tone: NotificationTone;
  timestamp: string;
}

