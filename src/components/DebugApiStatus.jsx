import React, { useState, useEffect } from 'react';
import { contactosApi } from '../services/api';

const DebugApiStatus = () => {
  const [endpointStatus, setEndpointStatus] = useState({});
  const [testing, setTesting] = useState(false);

  const endpoints = [
    { name: 'Health Check', key: 'health', call: () => contactosApi.healthCheck() },
    { name: 'Count', key: 'count', call: () => contactosApi.getContactosCount() },
    { name: 'Paginated (first 10)', key: 'paginated', call: () => contactosApi.getContactosPaginated(0, 10) },
    { name: 'Search', key: 'search', call: () => contactosApi.searchContactos('test', 0, 10) },
    { name: 'Stats', key: 'stats', call: () => contactosApi.getStats() },
    { name: 'Validation Report', key: 'validation', call: () => contactosApi.getValidationReport() },
    { name: 'Validation Errors', key: 'errors', call: () => contactosApi.getValidationErrors() },
    { name: 'Invalid Data', key: 'invalidData', call: () => contactosApi.getInvalidData() },
  ];

  const testEndpoints = async () => {
    setTesting(true);
    const results = {};

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Testing endpoint: ${endpoint.name}`);
        const response = await endpoint.call();
        
        results[endpoint.key] = {
          status: 'success',
          message: `✅ OK (${response.status})`,
          data: response.data,
          responseSize: JSON.stringify(response.data).length
        };
        
        console.log(`✅ ${endpoint.name}:`, response.data);
        
      } catch (error) {
        results[endpoint.key] = {
          status: 'error',
          message: `❌ Error ${error.response?.status || 'Network'}`,
          error: error.response?.data || error.message
        };
        
        console.log(`❌ ${endpoint.name}:`, error.response?.status, error.message);
      }
      
      // Pequeña pausa entre llamadas
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setEndpointStatus(results);
    setTesting(false);
  };

  useEffect(() => {
    testEndpoints();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Estado de API - Endpoints Go Backend</h3>
        <button
          onClick={testEndpoints}
          disabled={testing}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {testing ? '⏳ Probando...' : '🔄 Probar Endpoints'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {endpoints.map((endpoint) => {
          const status = endpointStatus[endpoint.key];
          
          return (
            <div
              key={endpoint.key}
              className={`border rounded-lg p-4 ${getStatusColor(status?.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{endpoint.name}</h4>
                <span className="text-xl">{getStatusIcon(status?.status)}</span>
              </div>
              
              <div className="text-sm">
                {status ? (
                  <>
                    <p className="font-medium">{status.message}</p>
                    {status.status === 'success' && (
                      <div className="mt-2 text-xs">
                        <p>Tamaño respuesta: {status.responseSize} bytes</p>
                        {status.data?.success !== undefined && (
                          <p>Success: {status.data.success ? 'true' : 'false'}</p>
                        )}
                        {Array.isArray(status.data?.data) && (
                          <p>Items: {status.data.data.length}</p>
                        )}
                        {typeof status.data?.data === 'number' && (
                          <p>Valor: {status.data.data.toLocaleString()}</p>
                        )}
                      </div>
                    )}
                    {status.status === 'error' && (
                      <div className="mt-2 text-xs">
                        <p>Error: {JSON.stringify(status.error)}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p>⏳ Esperando...</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen */}
      {Object.keys(endpointStatus).length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">📊 Resumen</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(endpointStatus).filter(s => s.status === 'success').length}
              </div>
              <div className="text-gray-600">Funcionando</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Object.values(endpointStatus).filter(s => s.status === 'error').length}
              </div>
              <div className="text-gray-600">Con Error</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {((Object.values(endpointStatus).filter(s => s.status === 'success').length / endpoints.length) * 100).toFixed(0)}%
              </div>
              <div className="text-gray-600">Disponible</div>
            </div>
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Información</h4>
        <div className="text-sm text-blue-800">
          <p>• Este componente verifica que todos los endpoints de tu backend Go estén funcionando</p>
          <p>• Los endpoints críticos para la funcionalidad básica son: health, count, paginated</p>
          <p>• Los endpoints de validación son opcionales pero útiles para corrección de errores</p>
          <p>• Si algún endpoint falla, verifica que tu servidor Go esté corriendo en el puerto correcto</p>
        </div>
      </div>
    </div>
  );
};

export default DebugApiStatus;