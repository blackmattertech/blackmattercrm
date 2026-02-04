const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Request failed',
        };
      }

      return {
        success: true,
        ...data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);

// Auth API
export const authApi = {
  signup: (email: string, password: string, full_name?: string, role?: string) => 
    api.post<{ token: string; user: any; message: string }>('/auth/signup', { email, password, full_name, role }),
  login: (email: string, password: string) => 
    api.post<{ token: string; user: any }>('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get<any>('/auth/me'),
};

// CRM API
export const crmApi = {
  getLeads: (params?: any) => api.get<{ data: any[]; count: number }>(`/crm/leads?${new URLSearchParams(params).toString()}`),
  getLead: (id: string) => api.get<any>(`/crm/leads/${id}`),
  createLead: (data: any) => api.post<any>('/crm/leads', data),
  updateLead: (id: string, data: any) => api.put<any>(`/crm/leads/${id}`, data),
  deleteLead: (id: string) => api.delete(`/crm/leads/${id}`),
  getTasks: (params?: any) => api.get<{ data: any[]; count: number }>(`/crm/tasks?${new URLSearchParams(params).toString()}`),
  createTask: (data: any) => api.post<any>('/crm/tasks', data),
  getFollowups: (params?: any) => api.get<{ data: any[]; count: number }>(`/crm/followups?${new URLSearchParams(params).toString()}`),
  createFollowup: (data: any) => api.post<any>('/crm/followups', data),
  getActivities: (params?: any) => api.get<{ data: any[]; count: number }>(`/crm/activities?${new URLSearchParams(params).toString()}`),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get<any>('/dashboard/stats'),
  getAnalytics: () => api.get<any>('/dashboard/analytics'),
};

// Notifications API
export const notificationsApi = {
  getNotifications: () => api.get<any[]>('/notifications'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};
