export interface Stats {
  users: { total: number; active: number };
  pageViews: { total: number };
  events: { total: number; signups: number; logins: number };
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export const adminAnalyticsService = {
  async getStats(): Promise<Stats> {
    const response = await fetch('/api/admin/analytics/stats', { credentials: 'include' });
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    const data = await response.json();
    return data.data;
  },

  async getUsers(): Promise<User[]> {
    const response = await fetch('/api/admin/analytics/users', { credentials: 'include' });
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return data.data.users;
  },
};