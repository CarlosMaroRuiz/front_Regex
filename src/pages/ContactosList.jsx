import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { contactosApi } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Componente ContactoCard memoizado para evitar re-renders innecesarios
const ContactoCard = React.memo(({ contacto, onEdit, onDelete }) => {
  return (
    <li>
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {contacto.nombre.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="flex items-center">
              <div className="text-sm font-medium text-gray-900">
                {contacto.nombre}
              </div>
              <div className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                ID: {contacto.claveCliente}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {contacto.correo}
            </div>
            <div className="text-sm text-gray-500">
              📞 {contacto.telefonoContacto}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(contacto)}
            className="inline-flex items-center p-2 border border-transparent rounded-full text-primary-600 hover:bg-primary-50"
            title="Editar contacto"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(contacto)}
            className="inline-flex items-center p-2 border border-transparent rounded-full text-red-600 hover:bg-red-50"
            title="Eliminar contacto"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  );
});

ContactoCard.displayName = 'ContactoCard';

const ContactosList = () => {
  const [contactos, setContactos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    claveCliente: '',
    nombre: '',
    correo: '',
    telefono: ''
  });
  const [selectedContacto, setSelectedContacto] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Debounce search term para evitar demasiadas llamadas API
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Cargar contactos al montar el componente
  useEffect(() => {
    loadContactos();
  }, []);

  const loadContactos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await contactosApi.getAll();
      const data = response.data.data || [];
      setContactos(data);
    } catch (error) {
      console.error('Error loading contactos:', error);
      toast.error('Error cargando contactos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtrado optimizado con useMemo
  const filteredContactos = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return contactos;
    }

    const searchLower = debouncedSearchTerm.toLowerCase();
    return contactos.filter(contacto =>
      contacto.nombre.toLowerCase().includes(searchLower) ||
      contacto.correo.toLowerCase().includes(searchLower) ||
      contacto.telefonoContacto.includes(searchLower) ||
      contacto.claveCliente.toString().includes(searchLower)
    );
  }, [contactos, debouncedSearchTerm]);

  // Búsqueda avanzada optimizada
  const handleAdvancedSearch = useCallback(async () => {
    try {
      setLoading(true);
      
      // Filtrar parámetros vacíos
      const params = {};
      Object.keys(searchFilters).forEach(key => {
        if (searchFilters[key].trim() !== '') {
          params[key] = searchFilters[key];
        }
      });

      if (Object.keys(params).length === 0) {
        await loadContactos();
        return;
      }

      const response = await contactosApi.search(params);
      const data = response.data.data || [];
      setContactos(data);
      
      toast.success(`${data.length} contactos encontrados`);
    } catch (error) {
      console.error('Error searching contactos:', error);
      toast.error('Error en la búsqueda');
    } finally {
      setLoading(false);
    }
  }, [searchFilters, loadContactos]);

  // Handlers optimizados con useCallback
  const handleEdit = useCallback((contacto) => {
    // Navegar a edición - implementar con navigate si es necesario
    window.location.href = `/contactos/editar/${contacto.claveCliente}`;
  }, []);

  const handleDelete = useCallback(async (contacto) => {
    try {
      await contactosApi.delete(contacto.claveCliente);
      toast.success('Contacto eliminado exitosamente');
      await loadContactos();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting contacto:', error);
      toast.error('Error eliminando contacto');
    }
  }, [loadContactos]);

  const openDeleteModal = useCallback((contacto) => {
    setSelectedContacto(contacto);
    setShowDeleteModal(true);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchFilters({
      claveCliente: '',
      nombre: '',
      correo: '',
      telefono: ''
    });
    setSearchTerm('');
    loadContactos();
  }, [loadContactos]);

  // Mostrar loading solo en carga inicial
  if (loading && contactos.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contactos</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestiona todos los contactos del sistema ({contactos.length} total)
            </p>
          </div>
          <Link
            to="/contactos/nuevo"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Contacto
          </Link>
        </div>
      </div>

      {/* Search Section Optimizada */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Buscar Contactos</h3>
        </div>
        <div className="px-6 py-4">
          {/* Quick Search con debounce */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Búsqueda rápida (nombre, correo, teléfono, clave)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            {debouncedSearchTerm && (
              <p className="mt-1 text-sm text-gray-500">
                Mostrando {filteredContactos.length} resultados para "{debouncedSearchTerm}"
              </p>
            )}
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Clave Cliente
              </label>
              <input
                type="text"
                value={searchFilters.claveCliente}
                onChange={(e) => setSearchFilters(prev => ({
                  ...prev,
                  claveCliente: e.target.value
                }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                type="text"
                value={searchFilters.nombre}
                onChange={(e) => setSearchFilters(prev => ({
                  ...prev,
                  nombre: e.target.value
                }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Correo
              </label>
              <input
                type="email"
                value={searchFilters.correo}
                onChange={(e) => setSearchFilters(prev => ({
                  ...prev,
                  correo: e.target.value
                }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="juan@gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                type="text"
                value={searchFilters.telefono}
                onChange={(e) => setSearchFilters(prev => ({
                  ...prev,
                  telefono: e.target.value
                }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="5551234567"
              />
            </div>
          </div>

          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleAdvancedSearch}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-700">
          Mostrando {filteredContactos.length} de {contactos.length} contactos
        </p>
        {loading && (
          <div className="flex items-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
            Cargando...
          </div>
        )}
      </div>

      {/* Contactos List Optimizada */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredContactos.length === 0 ? (
          <div className="text-center py-12">
            <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay contactos
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || Object.values(searchFilters).some(f => f.trim()) 
                ? 'No se encontraron contactos con los criterios de búsqueda'
                : 'Comienza creando un nuevo contacto'
              }
            </p>
            {!searchTerm && !Object.values(searchFilters).some(f => f.trim()) && (
              <div className="mt-6">
                <Link
                  to="/contactos/nuevo"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nuevo Contacto
                </Link>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredContactos.map((contacto) => (
              <ContactoCard
                key={contacto.claveCliente}
                contacto={contacto}
                onEdit={handleEdit}
                onDelete={openDeleteModal}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Delete Modal Optimizado */}
      {showDeleteModal && selectedContacto && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">
                Eliminar Contacto
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  ¿Estás seguro de que deseas eliminar el contacto de{' '}
                  <span className="font-medium">{selectedContacto.nombre}</span>?
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(selectedContacto)}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactosList;