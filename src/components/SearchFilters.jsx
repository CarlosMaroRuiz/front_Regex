import { useState } from "react";
import { Search, Filter, X } from "lucide-react";

export default function SearchFilters({ onSearch, loading }) {
  const [filters, setFilters] = useState({
    claveCliente: "",
    nombre: "",
    correo: "",
    telefono: ""
  });
  
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleClearFilters = () => {
    setFilters({
      claveCliente: "",
      nombre: "",
      correo: "",
      telefono: ""
    });
    onSearch({});
  };

  const toggleAdvanced = () => {
    setIsAdvancedOpen(!isAdvancedOpen);
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(val => val !== "");
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Buscar Contactos</h3>
        <div className="flex items-center">
          <button
            type="button"
            onClick={toggleAdvanced}
            className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium mr-4"
          >
            <Filter className="h-4 w-4 mr-1" />
            {isAdvancedOpen ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
          
          {hasActiveFilters() && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center text-gray-500 hover:text-gray-700 text-sm font-medium"
              disabled={loading}
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Búsqueda simple siempre visible */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          name="nombre"
          value={filters.nombre}
          onChange={handleChange}
          placeholder="Buscar por nombre..."
          className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="absolute right-2.5 bottom-2 px-4 py-1 bg-blue-600 rounded-lg text-white text-sm hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {/* Filtros avanzados */}
      {isAdvancedOpen && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="claveCliente" className="block text-sm font-medium text-gray-700 mb-1">
                Clave Cliente
              </label>
              <input
                type="text"
                id="claveCliente"
                name="claveCliente"
                value={filters.claveCliente}
                onChange={handleChange}
                placeholder="Ej. 1001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="text"
                id="correo"
                name="correo"
                value={filters.correo}
                onChange={handleChange}
                placeholder="Ej. usuario@gmail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                id="telefono"
                name="telefono"
                value={filters.telefono}
                onChange={handleChange}
                placeholder="Ej. 1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Aplicando filtros...
                </span>
              ) : (
                "Aplicar filtros"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Indicador de filtros activos */}
      {hasActiveFilters() && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Filtros activos:</span>
          {filters.claveCliente && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Clave: {filters.claveCliente}
              <button 
                onClick={() => {
                  setFilters(prev => ({ ...prev, claveCliente: "" }));
                  onSearch({ ...filters, claveCliente: "" });
                }}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.nombre && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Nombre: {filters.nombre}
              <button 
                onClick={() => {
                  setFilters(prev => ({ ...prev, nombre: "" }));
                  onSearch({ ...filters, nombre: "" });
                }}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.correo && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Correo: {filters.correo}
              <button 
                onClick={() => {
                  setFilters(prev => ({ ...prev, correo: "" }));
                  onSearch({ ...filters, correo: "" });
                }}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.telefono && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Teléfono: {filters.telefono}
              <button 
                onClick={() => {
                  setFilters(prev => ({ ...prev, telefono: "" }));
                  onSearch({ ...filters, telefono: "" });
                }}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}