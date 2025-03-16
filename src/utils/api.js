// src/utils/api.js
const API_BASE_URL = 'http://localhost:3000/turnity';

export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  if (!token && !options.skipAuth) {
    // Si se requiere autenticación pero no hay token disponible
    console.error('No authentication token available');
    window.location.href = '/login';
    return null;
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(options.headers || {})
  };
  
  const config = {
    ...options,
    headers
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado o inválido
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return null;
      }
      if (response.status !== 409) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
    }
    
    // Para endpoints que no devuelven JSON
    if (options.rawResponse) {
      return response;
    }
    
    // Devolver los datos JSON
    return await response.json();
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    throw error;
  }
};

// Métodos específicos para operaciones CRUD comunes
export const api = {
  get: (endpoint, options = {}) => {
    return fetchWithAuth(endpoint, { ...options, method: 'GET' });
  },
  
  post: (endpoint, data, options = {}) => {
    return fetchWithAuth(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  put: (endpoint, data, options = {}) => {
    return fetchWithAuth(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  delete: (endpoint, options = {}) => {
    return fetchWithAuth(endpoint, { ...options, method: 'DELETE' });
  },
  
  // Para rutas públicas que no requieren autenticación
  public: {
    get: (endpoint, options = {}) => {
      return fetchWithAuth(endpoint, { ...options, method: 'GET', skipAuth: true });
    },
    post: (endpoint, data, options = {}) => {
      return fetchWithAuth(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
        skipAuth: true
      });
    }
  }
};