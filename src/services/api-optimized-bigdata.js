import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Cache más sofisticado para grandes datasets
class DataCache {
  constructor(maxItems = 1000, ttl = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxItems = maxItems;
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key, data) {
    // Limpiar cache si está lleno
    if (this.cache.size >= this.maxItems) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new DataCache();

// Cliente axios optimizado
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos para grandes datasets
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para compresión y cache
api.interceptors.request.use((config) => {
  // Agregar header para compresión
  config.headers['Accept-Encoding'] = 'gzip, deflate, br';
  
  return config;
});

api.interceptors.response.use((response) => {
  // Cachear solo respuestas pequeñas
  if (response.data && JSON.stringify(response.data).length < 100000) {
    const cacheKey = `${response.config.url}?${JSON.stringify(response.config.params)}`;
    cache.set(cacheKey, response.data);
  }
  
  return response;
});

export const contactosApi = {
  // Paginación del lado servidor
  getContactosPaginated: async (page = 0, size = 50, search = '') => {
    const params = { page, size };
    if (search) params.search = search;
    
    return api.get('/contactos/paginated', { params });
  },

  // Búsqueda del lado servidor
  searchContactos: async (searchTerm, page = 0, size = 50) => {
    return api.get('/contactos/search', {
      params: {
        q: searchTerm,
        page,
        size
      }
    });
  },

  // Obtener count sin datos
  getContactosCount: () => api.get('/contactos/count'),

  // Stream de datos para datasets muy grandes
  getContactosStream: async function* (batchSize = 1000) {
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await api.get('/contactos/paginated', {
          params: { page, size: batchSize }
        });
        
        const data = response.data.data || [];
        
        if (data.length === 0) {
          hasMore = false;
        } else {
          yield data;
          page++;
          hasMore = data.length === batchSize;
        }
      } catch (error) {
        console.error('Error fetching batch:', error);
        break;
      }
    }
  },

  // APIs originales optimizadas
  getAll: () => api.get('/contactos'),
  getById: (id) => api.get(`/contactos/${id}`),
  create: (contacto) => api.post('/contactos', contacto),
  update: (id, contacto) => api.put(`/contactos/${id}`, contacto),
  delete: (id) => api.delete(`/contactos/${id}`),
  
  // Búsqueda con filtros avanzados
  advancedSearch: (filters, page = 0, size = 50) => {
    return api.get('/contactos/buscar', { 
      params: { ...filters, page, size } 
    });
  },

  // Exportar datos por lotes
  exportBatch: (startId, endId) => {
    return api.get('/contactos/export', {
      params: { startId, endId }
    });
  },

  // Otros endpoints
  getValidationReport: () => api.get('/contactos/validation'),
  getInvalidData: () => api.get('/contactos/invalid-data'),
  reloadExcel: () => api.post('/contactos/reload'),
  healthCheck: () => api.get('/health'),
};