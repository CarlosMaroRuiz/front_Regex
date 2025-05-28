import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Cache simple para datos que no cambian frecuentemente
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Configurar axios con optimizaciones
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para cache
api.interceptors.request.use((config) => {
  // Solo cachear GET requests
  if (config.method === 'get') {
    const cacheKey = `${config.url}?${JSON.stringify(config.params)}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      // Retornar promesa resuelta con datos cacheados
      return Promise.resolve({
        ...config,
        adapter: () => Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        })
      });
    }
  }
  
  return config;
});

// Interceptor para guardar en cache
api.interceptors.response.use((response) => {
  // Cachear respuestas GET exitosas
  if (response.config.method === 'get' && response.status === 200) {
    const cacheKey = `${response.config.url}?${JSON.stringify(response.config.params)}`;
    cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });
  }
  
  return response;
}, (error) => {
  console.error('API Error:', error);
  return Promise.reject(error);
});

// Función para limpiar cache
export const clearCache = () => {
  cache.clear();
};

export const contactosApi = {
  // Obtener todos los contactos (con cache)
  getAll: () => api.get('/contactos'),
  
  // Obtener contacto por ID (con cache)
  getById: (id) => api.get(`/contactos/${id}`),
  
  // Crear contacto (limpia cache)
  create: async (contacto) => {
    const response = await api.post('/contactos', contacto);
    clearCache(); // Limpiar cache después de crear
    return response;
  },
  
  // Actualizar contacto (limpia cache)
  update: async (id, contacto) => {
    const response = await api.put(`/contactos/${id}`, contacto);
    clearCache(); // Limpiar cache después de actualizar
    return response;
  },
  
  // Eliminar contacto (limpia cache)
  delete: async (id) => {
    const response = await api.delete(`/contactos/${id}`);
    clearCache(); // Limpiar cache después de eliminar
    return response;
  },
  
  // Búsqueda con debounce
  search: (params) => api.get('/contactos/buscar', { params }),
  
  // Otros endpoints
  getValidationReport: () => api.get('/contactos/validation'),
  getValidationErrors: () => api.get('/contactos/errors'),
  getContactosWithValidation: () => api.get('/contactos/con-validacion'),
  getInvalidData: () => api.get('/contactos/invalid-data'),
  reloadExcel: async () => {
    const response = await api.post('/contactos/reload');
    clearCache(); // Limpiar cache después de recargar
    return response;
  },
  healthCheck: () => api.get('/health'),
};

export default api;