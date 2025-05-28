import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { contactosApi } from '../services/api';
import VirtualizedContactList from '../components/VirtualizedContactList';
import toast from 'react-hot-toast';

// Hook simple para debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const ContactosListOptimized = () => {
  const navigate = useNavigate();
  const [contactos, setContactos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const PAGE_SIZE = 50;

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Buscar cuando cambie el término de búsqueda
  useEffect(() => {
    if (debouncedSearchTerm) {
      handleSearch();
    } else {
      loadInitialData();
    }
  }, [debouncedSearchTerm]);

  const loadInitialData = useCallback(async () => {
    try {
      setInitialLoading(true);
      setCurrentPage(0);
      
      console.log('🚀 Cargando datos iniciales...');
      
      // Cargar primera página y count total en paralelo
      const [contactosResponse, countResponse] = await Promise.all([
        contactosApi.getContactosPaginated(0, PAGE_SIZE),
        contactosApi.getContactosCount()
      ]);

      console.log('📊 Respuesta contactos:', contactosResponse.data);
      console.log('📊 Respuesta count:', countResponse.data);

      // ✅ CORRECCIÓN: Manejar la estructura de respuesta de Go backend
      let data = [];
      let total = 0;

      // Tu backend Go probablemente devuelve la estructura directamente
      if (contactosResponse.data.success) {
        const responseData = contactosResponse.data.data;
        
        // Si data es un array directamente (respuesta simple de Go)
        if (Array.isArray(responseData)) {
          data = responseData;
        } 
        // Si data es un objeto con estructura de paginación
        else if (responseData && typeof responseData === 'object') {
          // Posibles estructuras de Go backend
          data = responseData.data || responseData.Data || responseData.contactos || responseData.items || [];
          
          // Obtener información adicional de paginación si está disponible
          if (responseData.total || responseData.Total || responseData.totalElements) {
            total = responseData.total || responseData.Total || responseData.totalElements;
          }
          if (responseData.hasNext !== undefined || responseData.HasNext !== undefined) {
            setHasNextPage(responseData.hasNext || responseData.HasNext);
          }
        }
      }

      // Extraer total count
      if (countResponse.data.success) {
        const countData = countResponse.data.data;
        // Go backend puede devolver number directamente o en un objeto
        total = typeof countData === 'number' ? countData : (countData.count || countData.total || total);
      }

      console.log('📋 Datos procesados:', {
        contactos: data.length,
        total: total,
        primerContacto: data[0]
      });

      setContactos(data || []);
      setTotalCount(total);
      
      // Si no obtuvimos hasNext del response, calcularlo
      if (!data || data.length < PAGE_SIZE) {
        setHasNextPage(false);
      } else if (hasNextPage === true) {
        setHasNextPage(data.length === PAGE_SIZE);
      }
      
      console.log(`✅ Cargados ${(data || []).length} contactos de ${total} total`);
      
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      toast.error('Error cargando contactos');
      
      // Fallback: intentar cargar con la API original si falla la paginada
      try {
        console.log('🔄 Intentando con API original...');
        const fallbackResponse = await contactosApi.getAll();
        const allData = fallbackResponse.data.success ? fallbackResponse.data.data : [];
        
        // Tomar solo los primeros PAGE_SIZE elementos
        const pageData = Array.isArray(allData) ? allData.slice(0, PAGE_SIZE) : [];
        
        setContactos(pageData);
        setTotalCount(Array.isArray(allData) ? allData.length : 0);
        setHasNextPage(Array.isArray(allData) ? allData.length > PAGE_SIZE : false);
        
        toast.success(`Cargados ${pageData.length} contactos (modo fallback)`);
      } catch (fallbackError) {
        console.error('❌ Error en fallback:', fallbackError);
        toast.error('Error cargando contactos');
        
        // Establecer valores seguros
        setContactos([]);
        setTotalCount(0);
        setHasNextPage(false);
      }
    } finally {
      setInitialLoading(false);
    }
  }, []);

  const loadNextPage = useCallback(async () => {
    if (loading || !hasNextPage) return;

    try {
      setLoading(true);
      const nextPage = currentPage + 1;
      
      console.log(`📄 Cargando página ${nextPage}...`);
      
      let response;
      if (debouncedSearchTerm) {
        response = await contactosApi.searchContactos(debouncedSearchTerm, nextPage, PAGE_SIZE);
      } else {
        response = await contactosApi.getContactosPaginated(nextPage, PAGE_SIZE);
      }

      // ✅ CORRECCIÓN: Manejar la estructura de respuesta de Go
      let newData = [];
      if (response.data.success) {
        const responseData = response.data.data;
        
        if (Array.isArray(responseData)) {
          newData = responseData;
        } else if (responseData && typeof responseData === 'object') {
          newData = responseData.data || responseData.Data || responseData.contactos || responseData.items || [];
        }
      }
      
      setContactos(prev => [...prev, ...(newData || [])]);
      setCurrentPage(nextPage);
      setHasNextPage((newData || []).length === PAGE_SIZE);
      
      console.log(`✅ Cargados ${(newData || []).length} contactos adicionales`);
      
    } catch (error) {
      console.error('❌ Error loading next page:', error);
      toast.error('Error cargando más contactos');
    } finally {
      setLoading(false);
    }
  }, [currentPage, loading, hasNextPage, debouncedSearchTerm]);

  const handleSearch = useCallback(async () => {
    try {
      setInitialLoading(true);
      setCurrentPage(0);
      
      console.log(`🔍 Buscando: "${debouncedSearchTerm}"`);
      
      const response = await contactosApi.searchContactos(debouncedSearchTerm, 0, PAGE_SIZE);
      
      // ✅ CORRECCIÓN: Manejar la estructura de respuesta de Go
      let data = [];
      if (response.data.success) {
        const responseData = response.data.data;
        
        if (Array.isArray(responseData)) {
          data = responseData;
        } else if (responseData && typeof responseData === 'object') {
          data = responseData.data || responseData.Data || responseData.contactos || responseData.items || [];
        }
      }
      
      setContactos(data || []);
      setHasNextPage((data || []).length === PAGE_SIZE);
      
      console.log(`✅ Encontrados ${(data || []).length} resultados`);
      
    } catch (error) {
      console.error('❌ Error searching:', error);
      toast.error('Error en la búsqueda');
      setContactos([]);
      setHasNextPage(false);
    } finally {
      setInitialLoading(false);
    }
  }, [debouncedSearchTerm]);

  const handleEdit = useCallback((contacto) => {
    // Usar la clave correcta según tu modelo de datos
    const clave = contacto.claveCliente || contacto.clave || contacto.id;
    navigate(`/contactos/editar/${clave}`);
  }, [navigate]);

  const handleDelete = useCallback(async (contacto) => {
    if (!window.confirm(`¿Eliminar contacto de ${contacto.nombre}?`)) return;

    try {
      // Usar la clave correcta según tu modelo de datos
      const clave = contacto.claveCliente || contacto.clave || contacto.id;
      await contactosApi.delete(clave);
      toast.success('Contacto eliminado');
      
      // Remover de la lista local usando la clave correcta
      setContactos(prev => prev.filter(c => {
        const contactoClave = c.claveCliente || c.clave || c.id;
        const targetClave = contacto.claveCliente || contacto.clave || contacto.id;
        return contactoClave !== targetClave;
      }));
      setTotalCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('❌ Error deleting contacto:', error);
      toast.error('Error eliminando contacto');
    }
  }, []);

  // ✅ CORRECCIÓN: Validación segura de arrays
  const safeContactos = Array.isArray(contactos) ? contactos : [];
  const safeTotalCount = typeof totalCount === 'number' ? totalCount : 0;

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
        <p className="text-gray-600">Cargando contactos...</p>
        <p className="text-sm text-gray-500">
          {safeTotalCount > 0 ? `${safeTotalCount.toLocaleString()} contactos disponibles` : 'Preparando datos...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Contactos {safeTotalCount > 0 && `(${safeTotalCount.toLocaleString()})`}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {debouncedSearchTerm 
                ? `${safeContactos.length.toLocaleString()} resultados para "${debouncedSearchTerm}"`
                : `Mostrando ${safeContactos.length.toLocaleString()} de ${safeTotalCount.toLocaleString()} contactos`
              }
            </p>
          </div>
          <Link
            to="/contactos/nuevo"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-sm"
          >
            ➕ Nuevo Contacto
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Buscar contactos (nombre, correo, teléfono, clave)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md text-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          {debouncedSearchTerm && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {safeContactos.length.toLocaleString()} resultados encontrados
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Limpiar búsqueda
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista Virtualizada */}
      <VirtualizedContactList
        contactos={safeContactos}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        hasNextPage={hasNextPage}
        loadNextPage={loadNextPage}
      />

      {/* Performance Info */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-blue-600 mr-2">⚡</span>
          <p className="text-sm text-blue-700">
            Lista optimizada para {safeTotalCount.toLocaleString()} registros - 
            Renderizando solo elementos visibles para máximo rendimiento
          </p>
        </div>
      </div>

      {/* Debug Info (remover en producción) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
          <h4 className="font-bold mb-2">🔍 Debug Info:</h4>
          <p>Contactos cargados: {safeContactos.length}</p>
          <p>Total en base: {safeTotalCount}</p>
          <p>Tiene más páginas: {hasNextPage ? 'Sí' : 'No'}</p>
          <p>Página actual: {currentPage}</p>
          <p>Término de búsqueda: {debouncedSearchTerm || 'Ninguno'}</p>
        </div>
      )}
    </div>
  );
};

export default ContactosListOptimized;