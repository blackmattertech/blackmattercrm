// Dynamically determine API URL based on current hostname
// This allows the app to work on both localhost and network IP addresses
const getApiUrl = (): string => {
  // Use environment variable if set (highest priority)
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    console.log('[API] VITE_API_URL found in environment:', envUrl);
    
    // Extract IP from env URL to check if it matches current hostname
    try {
      const envUrlObj = new URL(envUrl);
      const envHostname = envUrlObj.hostname;
      const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      
      // If env URL points to different IP than current hostname, warn but use it
      if (envHostname !== currentHostname && envHostname !== 'localhost' && currentHostname !== 'localhost') {
        console.warn('[API] VITE_API_URL points to different IP:', envHostname, 'but frontend is on:', currentHostname);
        console.warn('[API] If connection fails, backend might be on:', currentHostname);
      }
    } catch (e) {
      // Invalid URL, continue with env URL as-is
    }
    
    return envUrl;
  }
  
  // If running in browser, use current hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // For localhost, use localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const apiUrl = `${protocol}//localhost:3001/api`;
      console.log('[API] Using localhost API URL:', apiUrl);
      return apiUrl;
    }
    
    // For network IPs, try to detect the backend IP
    // Check if there's a configured backend IP in localStorage first
    let backendHostname = hostname;
    const configuredBackendIP = localStorage.getItem('backend_ip');
    
    if (configuredBackendIP) {
      backendHostname = configuredBackendIP;
      console.log('[API] Using configured backend IP from localStorage:', configuredBackendIP);
    } else {
      // Auto-detect: if frontend is on .38, backend is likely on .39
      // But if that fails, fallback to same IP
      const ipParts = hostname.split('.');
      if (ipParts.length === 4 && ipParts[0] === '192' && ipParts[1] === '168') {
        const lastOctet = parseInt(ipParts[3]);
        // If frontend is on .38, try .39 first, but fallback to .38 if that fails
        if (lastOctet === 38) {
          // Try .39 first, but we'll test and fallback if needed
          backendHostname = '192.168.1.39';
          console.log('[API] Auto-detected: Frontend on .38, trying backend on .39');
        } else if (lastOctet === 39) {
          // If frontend is on .39, backend might be on same IP or .38
          backendHostname = hostname; // Use same IP
          console.log('[API] Frontend and backend likely on same IP:', hostname);
        } else {
          // For other IPs, use same IP (most common case)
          backendHostname = hostname;
          console.log('[API] Using same IP as frontend:', hostname);
        }
      }
    }
    
    const apiUrl = `${protocol}//${backendHostname}:3001/api`;
    
    // Log in development
    if ((import.meta as any).env?.MODE === 'development') {
      console.log('[API] Detected frontend hostname:', hostname);
      console.log('[API] Using backend hostname:', backendHostname);
      console.log('[API] Using API URL:', apiUrl);
      console.log('[API] Full window.location:', {
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        port: window.location.port,
        href: window.location.href
      });
      console.log('[API] To configure backend IP, run: localStorage.setItem("backend_ip", "192.168.1.38")');
    }
    
    return apiUrl;
  }
  
  // Fallback to localhost for SSR
  return 'http://localhost:3001/api';
};

const API_URL = getApiUrl();

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
  status?: number; // HTTP status code for error handling
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private getBaseURL(): string {
    return getApiUrl();
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
    // Recalculate API URL dynamically in case hostname changed
    const currentApiUrl = getApiUrl();
    const url = `${currentApiUrl}${endpoint}`;
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
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for mobile

    // Log request in development - use console.group for better visibility
    if ((import.meta as any).env?.MODE === 'development') {
      try {
        const requestBody = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined;
        console.group(`🔵 [API Request] ${options.method || 'GET'} ${endpoint}`);
        console.log('📍 URL:', url);
        console.log('🔑 Has Token:', !!token);
        if (requestBody) {
          console.log('📦 Request Body:', requestBody);
        }
        console.groupEnd();
      } catch (e) {
        // Fallback if console.group not supported
        console.log(`[API Request] ${options.method || 'GET'} ${endpoint}`, { url, hasToken: !!token });
      }
    }

    try {
      console.log('[API] About to make fetch request:', {
        url,
        method: options.method || 'GET',
        hasBody: !!options.body,
        hasToken: !!token,
      });
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      
      console.log('[API] Fetch response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
      });

      clearTimeout(timeoutId);

      // Check if response is JSON
      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('[API] Non-JSON response:', text);
        return {
          success: false,
          error: `Server returned non-JSON response: ${response.status} ${response.statusText}`,
        };
      }

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          console.error('[API] 401 Unauthorized - Token may be invalid or expired');
          // Don't auto-logout here, let the calling code handle it
        } else if (response.status === 403) {
          console.error('[API] 403 Forbidden - Insufficient permissions');
        }
        
        // Log error details in development
        if ((import.meta as any).env?.MODE === 'development') {
          console.error('[API Error]', {
            status: response.status,
            statusText: response.statusText,
            url,
            data,
            headers: Object.fromEntries(response.headers.entries()),
          });
        }
        return {
          success: false,
          error: data.error || data.message || `Request failed: ${response.status} ${response.statusText}`,
          details: data.details,
          status: response.status, // Include status code for error handling
        };
      }

      return {
        success: true,
        ...data,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[API] Request timeout:', url);
        return {
          success: false,
          error: 'Request timeout. Please check your network connection and try again.',
        };
      }
      
      // Enhanced error logging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[API Request Exception]', {
        url,
        endpoint,
        error: errorMessage,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
        currentHostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
        currentProtocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A',
      });
      
      // Provide more helpful error messages
      let userFriendlyError = 'Network error';
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('Network request failed')) {
        // Test if backend is reachable
        const healthUrl = url.replace('/api' + endpoint, '/health');
        console.log('[API] Testing backend health at:', healthUrl);
        
        userFriendlyError = `Cannot connect to server at ${url}. Please check:\n1. Backend server is running on port 3001\n2. You are on the same network\n3. Firewall is not blocking the connection\n4. Try accessing: ${healthUrl}`;
      } else if (errorMessage.includes('CORS')) {
        userFriendlyError = 'CORS error. Please check backend CORS configuration.';
      } else {
        userFriendlyError = errorMessage;
      }
      
      return {
        success: false,
        error: userFriendlyError,
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

export const api = new ApiClient();

// Test API connectivity
export const testApiConnection = async (): Promise<{ success: boolean; message: string; apiUrl: string; healthUrl: string }> => {
  const apiUrl = getApiUrl();
  const healthUrl = apiUrl.replace('/api', '/health');
  
  console.log('[API Test] Testing connection to:', healthUrl);
  console.log('[API Test] API URL:', apiUrl);
  console.log('[API Test] Current location:', typeof window !== 'undefined' ? window.location.href : 'N/A');
  
  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    console.log('[API Test] Health check response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('[API Test] Health check data:', data);
      return {
        success: true,
        message: 'Backend is reachable',
        apiUrl,
        healthUrl,
      };
    } else {
      const text = await response.text();
      console.error('[API Test] Health check failed:', text);
      return {
        success: false,
        message: `Backend returned status ${response.status}: ${text}`,
        apiUrl,
        healthUrl,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Test] Connection error:', {
      error: errorMsg,
      type: error instanceof Error ? error.constructor.name : typeof error,
      healthUrl,
    });
    
    // If using VITE_API_URL or configured IP and it fails, try current hostname as fallback
    const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const envUrl = (import.meta as any).env?.VITE_API_URL;
    const configuredIP = localStorage.getItem('backend_ip');
    
    // Only try fallback if we're not already using current hostname and it's a network IP
    const currentApiUrl = `${typeof window !== 'undefined' ? window.location.protocol : 'http:'}//${currentHostname}:3001/api`;
    const isUsingDifferentIP = apiUrl !== currentApiUrl && currentHostname !== 'localhost' && currentHostname !== '127.0.0.1';
    
    if (isUsingDifferentIP && (envUrl || configuredIP)) {
      const fallbackUrl = `${window.location.protocol}//${currentHostname}:3001/health`;
      console.log('[API Test] Configured IP unreachable, trying fallback to current hostname:', fallbackUrl);
      
      try {
        const fallbackResponse = await fetch(fallbackUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
        });
        
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          console.log('[API Test] ✅ Fallback successful! Backend is on:', currentHostname);
          // Update localStorage to use current hostname for future requests
          localStorage.setItem('backend_ip', currentHostname);
          return {
            success: true,
            message: `Backend found on ${currentHostname} (auto-detected from fallback)`,
            apiUrl: currentApiUrl,
            healthUrl: fallbackUrl,
          };
        }
      } catch (fallbackError) {
        console.error('[API Test] Fallback also failed:', fallbackError);
      }
    }
    
    return {
      success: false,
      message: `Cannot reach backend: ${errorMsg}. Check if backend is running on port 3001.`,
      apiUrl,
      healthUrl,
    };
  }
};

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
  getLeads: (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get<{ data: any[]; count: number }>(`/crm/leads${queryString}`);
  },
  getLead: (id: string) => api.get<any>(`/crm/leads/${id}`),
  createLead: (data: any) => api.post<any>('/crm/leads', data),
  updateLead: (id: string, data: any) => api.put<any>(`/crm/leads/${id}`, data),
  deleteLead: (id: string) => api.delete(`/crm/leads/${id}`),
  updateLeadStatus: (id: string, status: string) => api.put<any>(`/crm/leads/${id}/status`, { status }),
  convertLeadToCustomer: (id: string) => api.post<any>(`/crm/leads/${id}/convert-to-customer`),
  getLeadActivities: (id: string) => api.get<any[]>(`/crm/leads/${id}/activities`),
  getCustomers: (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get<{ data: any[]; count: number }>(`/crm/customers${queryString}`);
  },
  getCustomer: (id: string) => api.get<any>(`/crm/customers/${id}`),
  createCustomer: (data: any) => api.post<any>('/crm/customers', data),
  updateCustomer: (id: string, data: any) => api.put<any>(`/crm/customers/${id}`, data),
  deleteCustomer: (id: string) => api.delete(`/crm/customers/${id}`),
  getTasks: (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get<{ data: any[]; count: number }>(`/crm/tasks${queryString}`);
  },
  createTask: (data: any) => api.post<any>('/crm/tasks', data),
  getFollowups: (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get<{ data: any[]; count: number }>(`/crm/followups${queryString}`);
  },
  createFollowup: (data: any) => api.post<any>('/crm/followups', data),
  getActivities: (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get<{ data: any[]; count: number }>(`/crm/activities${queryString}`);
  },
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
    
    const apiUrl = getApiUrl();
    const url = `${apiUrl}/users/${id}/avatar`;
    const token = api.getToken() || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type - let browser set it with boundary for multipart/form-data
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('[API] Non-JSON response for avatar upload:', text);
        return {
          success: false,
          error: `Server returned non-JSON response: ${response.status} ${response.statusText}`,
        };
      }

      if (!response.ok) {
        if ((import.meta as any).env?.MODE === 'development') {
          console.error('[API] Avatar upload error:', {
            status: response.status,
            statusText: response.statusText,
            url,
            data,
          });
        }
        return {
          success: false,
          error: data.error || data.message || 'Upload failed',
        };
      }

      return {
        success: true,
        ...data,
      };
    } catch (error) {
      console.error('[API] Avatar upload network error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error during upload',
      };
    }
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
