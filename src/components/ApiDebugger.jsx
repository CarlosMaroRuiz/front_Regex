import { useState, useEffect } from "react";
import { API_URL } from "../config/api";

export default function ApiDebugger() {
  const [apiStatus, setApiStatus] = useState("desconocido");
  const [apiEndpoints, setApiEndpoints] = useState([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualUrl, setManualUrl] = useState("");

  // Verificar si la API está funcionando
  useEffect(() => {
    checkApiStatus();
    fetchAvailableEndpoints();
  }, []);

  const checkApiStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/health`);
      
      if (response.ok) {
        setApiStatus("activa");
        const data = await response.json();
        setResponseData(data);
      } else {
        setApiStatus("error");
        setError(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      setApiStatus("inaccesible");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableEndpoints = () => {
    // Lista de endpoints comunes que deberían estar disponibles
    setApiEndpoints([
      { url: "/health", method: "GET", description: "Estado de la API" },
      { url: "/contactos", method: "GET", description: "Listar todos los contactos" },
      { url: "/contactos/con-validacion", method: "GET", description: "Contactos con estado de validación" },
      { url: "/contactos/validation", method: "GET", description: "Reporte de validación" },
      { url: "/contactos/errors", method: "GET", description: "Errores de validación" },
      { url: "/contactos/invalid-data", method: "GET", description: "Datos inválidos para corrección" }
    ]);
  };

  const testEndpoint = async (endpoint) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}${endpoint}`);
      
      if (response.ok) {
        const data = await response.json();
        setResponseData(data);
      } else {
        setError(`Error ${response.status}: ${response.statusText}`);
        try {
          const errorData = await response.json();
          setResponseData(errorData);
        } catch (e) {
          setResponseData(null);
        }
      }
    } catch (err) {
      setError(err.message);
      setResponseData(null);
    } finally {
      setLoading(false);
    }
  };

  const testManualUrl = async () => {
    if (!manualUrl) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let fullUrl = manualUrl;
      if (!manualUrl.startsWith('http')) {
        fullUrl = `${API_URL}${manualUrl.startsWith('/') ? manualUrl : '/' + manualUrl}`;
      }
      
      const response = await fetch(fullUrl);
      
      if (response.ok) {
        const data = await response.json();
        setResponseData(data);
      } else {
        setError(`Error ${response.status}: ${response.statusText}`);
        try {
          const errorData = await response.json();
          setResponseData(errorData);
        } catch (e) {
          setResponseData(null);
        }
      }
    } catch (err) {
      setError(err.message);
      setResponseData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEndpointSelect = (e) => {
    setSelectedEndpoint(e.target.value);
    if (e.target.value) {
      testEndpoint(e.target.value);
    } else {
      setResponseData(null);
      setError(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Depurador de API</h2>
      
      <div className="mb-6 p-4 rounded-lg bg-gray-50 border">
        <h3 className="text-md font-semibold mb-2">Estado de la API:</h3>
        <div className="flex items-center">
          <div className={`h-3 w-3 rounded-full mr-2 ${
            apiStatus === 'activa' ? 'bg-green-500' : 
            apiStatus === 'error' ? 'bg-yellow-500' : 
            'bg-red-500'
          }`}></div>
          <span className="capitalize">{apiStatus}</span>
          <button 
            onClick={checkApiStatus}
            className="ml-4 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            disabled={loading}
          >
            Verificar
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          URL Base: <code className="bg-gray-100 px-1 rounded">{API_URL}</code>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Probar endpoint predefinido:
          </label>
          <select
            value={selectedEndpoint}
            onChange={handleEndpointSelect}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Seleccionar endpoint...</option>
            {apiEndpoints.map((endpoint, index) => (
              <option key={index} value={endpoint.url}>
                {endpoint.method} {endpoint.url} - {endpoint.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Probar URL personalizada:
          </label>
          <div className="flex">
            <input
              type="text"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="/contactos/1001"
              className="flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={testManualUrl}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading || !manualUrl}
            >
              Probar
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando...</span>
        </div>
      )}

      {error && (
        <div className="p-4 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <h3 className="text-md font-semibold mb-1">Error:</h3>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {responseData && (
        <div className="mt-4">
          <h3 className="text-md font-semibold mb-2">Respuesta:</h3>
          <pre className="p-4 bg-gray-800 text-green-400 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify(responseData, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6 border-t pt-4">
        <h3 className="text-md font-semibold mb-2">Recomendaciones para solucionar errores 404:</h3>
        <ul className="list-disc pl-6 text-sm text-gray-700 space-y-2">
          <li>Verifica que el servidor API esté en ejecución en el puerto 8080</li>
          <li>Asegúrate de que la URL base en <code className="bg-gray-100 px-1 rounded">config/api.js</code> sea correcta</li>
          <li>Si estás actualizando un contacto, verifica que exista primero consultando todos los contactos</li>
          <li>Revisa que el formato JSON que envías en las solicitudes PUT sea correcto</li>
          <li>Verifica si hay errores CORS habilitando las herramientas de desarrollador (F12) y revisando la pestaña "Network"</li>
        </ul>
      </div>
    </div>
  );
}