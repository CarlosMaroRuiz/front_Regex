import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// ✅ Cache mejorado con categorías específicas
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const VALIDATION_CACHE_TTL = 30 * 1000; // 30 segundos para datos de validación (más dinámicos)

// Configurar axios con optimizaciones
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Interceptor mejorado para cache inteligente
api.interceptors.request.use((config) => {
  if (config.method === 'get') {
    const cacheKey = `${config.url}?${JSON.stringify(config.params || {})}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      // ✅ TTL diferenciado por tipo de endpoint
      const ttl = config.url.includes('invalid-data') || 
                  config.url.includes('validation') || 
                  config.url.includes('errors') 
                  ? VALIDATION_CACHE_TTL 
                  : CACHE_TTL;
      
      if ((Date.now() - cached.timestamp) < ttl) {
        console.log('🚀 Cache hit para:', cacheKey);
        return Promise.resolve({
          ...config,
          adapter: () => Promise.resolve({
            data: cached.data,
            status: 200,
            statusText: 'OK (cached)',
            headers: {},
            config
          })
        });
      } else {
        // Cache expirado, remover
        cache.delete(cacheKey);
        console.log('🗑️ Cache expirado removido:', cacheKey);
      }
    }
  }
  
  return config;
});

// ✅ Interceptor mejorado para guardar en cache
api.interceptors.response.use((response) => {
  if (response.config.method === 'get' && response.status === 200) {
    const responseSize = JSON.stringify(response.data).length;
    if (responseSize < 500000) { // Cache respuestas < 500KB
      const cacheKey = `${response.config.url}?${JSON.stringify(response.config.params || {})}`;
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
      console.log('💾 Guardado en cache:', cacheKey);
    }
  }
  
  return response;
}, (error) => {
  console.error('❌ API Error:', error.response?.status, error.message);
  return Promise.reject(error);
});

// ✅ Función mejorada para limpiar cache específico
export const clearCache = (pattern = null) => {
  if (pattern) {
    // Limpiar cache que coincida con el patrón
    const keysToDelete = [];
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => cache.delete(key));
    console.log(`🧹 Cache limpiado para patrón "${pattern}":`, keysToDelete.length, 'entradas');
  } else {
    // Limpiar todo el cache
    cache.clear();
    console.log('🧹 Todo el cache limpiado');
  }
};

// ✅ Función para invalidar cache de validación específicamente
export const invalidateValidationCache = () => {
  clearCache('invalid-data');
  clearCache('validation');
  clearCache('errors');
  clearCache('con-validacion');
  console.log('🔄 Cache de validación invalidado');
};

// ✅ Función para emitir eventos de actualización
const emitDataUpdate = (type, data) => {
  const event = new CustomEvent('api-data-updated', {
    detail: { type, data, timestamp: Date.now() }
  });
  window.dispatchEvent(event);
  console.log('📡 Evento emitido:', type, data);
};

export const contactosApi = {
  // ⚡ ENDPOINTS OPTIMIZADOS PARA GRANDES DATASETS
  
  getContactosPaginated: async (page = 0, size = 50, search = '') => {
    const params = { page, size };
    if (search && search.trim()) params.search = search.trim();
    
    try {
      const response = await api.get('/contactos/paginated', { params });
      return response;
    } catch (error) {
      console.error('❌ Error en paginación:', error);
      throw error;
    }
  },

  searchContactos: async (searchTerm, page = 0, size = 50) => {
    return api.get('/contactos/search', {
      params: { q: searchTerm, page, size }
    });
  },

  getContactosCount: () => api.get('/contactos/count'),

  // 📊 ENDPOINTS BÁSICOS CON MANEJO MEJORADO
  
  getAll: () => api.get('/contactos'),
  
  getById: (clave) => {
    console.log('🔍 Obteniendo contacto por clave:', clave);
    return api.get(`/contactos/${clave}`);
  },
  
  // ✅ Crear contacto con invalidación de cache y eventos
  create: async (contacto) => {
    try {
      console.log('➕ Creando contacto:', contacto);
      const response = await api.post('/contactos', contacto);
      
      if (response.data.success) {
        // Invalidar cache relevante
        clearCache('contactos');
        invalidateValidationCache();
        
        // Emitir evento de actualización
        emitDataUpdate('contacto-created', response.data.data);
        
        console.log('✅ Contacto creado exitosamente');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error creando contacto:', error);
      throw error;
    }
  },
  
  // ✅ Actualizar contacto con invalidación de cache y eventos
  update: async (clave, contacto) => {
    try {
      console.log('📝 Actualizando contacto:', clave, contacto);
      const response = await api.put(`/contactos/${clave}`, contacto);
      
      if (response.data.success) {
        // Invalidar cache relevante
        clearCache('contactos');
        clearCache(`/contactos/${clave}`);
        invalidateValidationCache();
        
        // Emitir evento de actualización
        emitDataUpdate('contacto-updated', {
          ...response.data.data,
          originalClave: clave
        });
        
        console.log('✅ Contacto actualizado exitosamente');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error actualizando contacto:', error);
      throw error;
    }
  },
  
  // ✅ Eliminar contacto con invalidación de cache y eventos
  delete: async (clave) => {
    try {
      console.log('🗑️ Eliminando contacto:', clave);
      const response = await api.delete(`/contactos/${clave}`);
      
      if (response.data.success) {
        // Invalidar cache relevante
        clearCache('contactos');
        clearCache(`/contactos/${clave}`);
        invalidateValidationCache();
        
        // Emitir evento de actualización
        emitDataUpdate('contacto-deleted', { clave });
        
        console.log('✅ Contacto eliminado exitosamente');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error eliminando contacto:', error);
      throw error;
    }
  },
  
  search: (params) => api.get('/contactos/buscar', { params }),
  getStats: () => api.get('/contactos/stats'),
  
  // 🔧 ENDPOINTS DE VALIDACIÓN MEJORADOS
  
  // ✅ Validación con cache de corta duración
  getValidationReport: async () => {
    try {
      console.log('📊 Obteniendo reporte de validación...');
      const response = await api.get('/contactos/validation');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo reporte de validación:', error);
      throw error;
    }
  },

  getValidationErrors: async () => {
    try {
      console.log('⚠️ Obteniendo errores de validación...');
      const response = await api.get('/contactos/errors');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo errores de validación:', error);
      throw error;
    }
  },

  getContactosWithValidation: () => api.get('/contactos/con-validacion'),
  
  // ✅ Datos inválidos con manejo de fallback mejorado
  getInvalidData: async () => {
    try {
      console.log('🔍 Obteniendo datos inválidos...');
      const response = await api.get('/contactos/invalid-data');
      
      if (response.data.success && response.data.data) {
        console.log('✅ Datos inválidos obtenidos:', response.data.data.length);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo datos inválidos:', error);
      
      // ✅ Fallback: intentar con endpoint de validación
      try {
        console.log('🔄 Intentando fallback con endpoint de validación...');
        const fallbackResponse = await api.get('/contactos/validation');
        
        if (fallbackResponse.data.success && fallbackResponse.data.data?.invalidRowsData) {
          console.log('✅ Datos inválidos obtenidos via fallback');
          // Restructurar la respuesta para mantener consistencia
          return {
            ...fallbackResponse,
            data: {
              ...fallbackResponse.data,
              data: fallbackResponse.data.data.invalidRowsData
            }
          };
        }
      } catch (fallbackError) {
        console.error('❌ Fallback también falló:', fallbackError);
      }
      
      throw error;
    }
  },
  
  // ✅ Recargar Excel con invalidación completa de cache
  reloadExcel: async () => {
    try {
      console.log('🔄 Recargando datos desde Excel...');
      const response = await api.post('/contactos/reload');
      
      if (response.data.success) {
        // Invalidar TODO el cache después de recargar
        clearCache();
        
        // Emitir evento de recarga completa
        emitDataUpdate('excel-reloaded', response.data.data);
        
        console.log('✅ Excel recargado exitosamente');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error recargando Excel:', error);
      throw error;
    }
  },
  
  // 🔧 ENDPOINTS DE DEBUG
  debugInvalidData: () => api.get('/contactos/debug/invalid-data'),
  forceInvalidData: () => api.get('/contactos/debug/force-invalid'),
  checkExcelFile: () => api.get('/contactos/debug/check-excel'),
  
  // ✅ Nuevo endpoint para validar claves
  validateKey: (clave) => {
    console.log('🔍 Validando clave:', clave);
    return api.get(`/contactos/validate/key/${clave}`);
  },
  
  healthCheck: () => api.get('/health'),
};

// ✅ Funciones auxiliares para manejo de eventos
export const subscribeToDataUpdates = (callback) => {
  const handleUpdate = (event) => {
    callback(event.detail);
  };
  
  window.addEventListener('api-data-updated', handleUpdate);
  
  // Retornar función de cleanup
  return () => {
    window.removeEventListener('api-data-updated', handleUpdate);
  };
};

// ✅ Función para obtener estadísticas del cache
export const getCacheStats = () => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  
  for (const [key, value] of cache.entries()) {
    const age = now - value.timestamp;
    const ttl = key.includes('invalid-data') || 
                key.includes('validation') || 
                key.includes('errors') 
                ? VALIDATION_CACHE_TTL 
                : CACHE_TTL;
    
    if (age < ttl) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }
  
  return {
    totalEntries: cache.size,
    validEntries,
    expiredEntries,
    cacheHitRate: validEntries / Math.max(cache.size, 1)
  };
};

export default api;