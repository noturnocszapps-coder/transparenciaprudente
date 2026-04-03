export interface Councilor {
  id: string;
  name: string;
  party: string;
  projectsPresented: number;
  projectsApproved: number;
  attendanceRate: number; // 0-100
  rankingScore: number;
  lastUpdate: string;
  recentProjects?: { title: string; date: string; status: string }[];
}

export interface Spending {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  supplier: string;
  isAnomaly: boolean;
  anomalyReason?: string;
  councilorId?: string; // Optional: associated councilor for Gabinete expenses
}

export interface Report {
  id: string;
  date: string;
  title: string;
  content: string;
  type: 'daily' | 'weekly';
  summary: string;
}

export interface Alert {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  relatedId?: string;
  type: 'spending' | 'legislative';
}
