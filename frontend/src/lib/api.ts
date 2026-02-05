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
      // Always store in localStorage for API client access
      localStorage.setItem('auth_token', token);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }
  
  getToken(): string | null {
    if (typeof window !== 'undefined' && !this.token) {
      // Try to load from localStorage if not set
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
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

    // Always try to get token (in case it was loaded from storage)
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        // Log error details in development
        if (process.env.NODE_ENV === 'development') {
          console.error('API Error:', {
            status: response.status,
            statusText: response.statusText,
            data,
          });
        }
        return {
          success: false,
          error: data.error || data.message || 'Request failed',
          details: data.details,
        };
      }

      return {
        success: true,
        ...data,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout. Please try again.',
        };
      }
      
      console.error('API Request Error:', {
        url,
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
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
  signup: (email: string, password: string, full_name?: string) => 
    api.post<{ message: string; requires_approval: boolean }>('/auth/signup', { email, password, full_name }),
  login: (email: string, password: string) => 
    api.post<{ token: string; user: any }>('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get<any>('/auth/me'),
  getPendingUsers: () => api.get<any[]>('/auth/pending-users'),
  approveUser: (userId: string) => api.post(`/auth/approve-user/${userId}`),
  rejectUser: (userId: string) => api.post(`/auth/reject-user/${userId}`),
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

// Users API (Admin only)
export const usersApi = {
  getAllUsers: () => api.get<any[]>('/users'),
  getUser: (id: string) => api.get<any>(`/users/${id}`),
  createUser: (data: { email: string; password: string; full_name?: string; role?: string; phone?: string }) =>
    api.post<any>('/users', data),
  updateUser: (id: string, data: { full_name?: string; role?: string; phone?: string; is_active?: boolean; approval_status?: string }) =>
    api.put<any>(`/users/${id}`, data),
  updateUserProfile: (id: string, data: { full_name?: string; phone?: string }) =>
    api.put<any>(`/users/${id}/profile`, data),
  updateUserRole: (id: string, role: string) =>
    api.put<any>(`/users/${id}/role`, { role }),
  approveUser: (id: string) =>
    api.put<any>(`/users/${id}/approve`),
  deleteUser: (id: string) =>
    api.delete(`/users/${id}`),
  uploadAvatar: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const url = `${API_URL}/users/${id}/avatar`;
    const token = api['token'] || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type - let browser set it with boundary for multipart/form-data
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Upload failed',
      };
    }

    return {
      success: true,
      ...data,
    };
  },
  updateDirectorStatus: (id: string, data: { is_director?: boolean; equity_ratio?: number }) =>
    api.put<any>(`/users/${id}/director`, data),
  getDirectors: () => api.get<any[]>('/users/directors'),
};

// Accounts API
export const accountsApi = {
  getDirectors: () => api.get<any[]>('/accounts/directors'),
  getInvoices: () => api.get<any[]>('/accounts/invoices'),
  getPayments: () => api.get<any[]>('/accounts/payments'),
  getTrialBalance: () => api.get<any[]>('/accounts/trial-balance'),
};
