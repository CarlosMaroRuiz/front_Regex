import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contactosApi } from '../services/api';
import { 
  DocumentTextIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ValidationReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [selectedError, setSelectedError] = useState(null);

  useEffect(() => {
    loadValidationReport();
  }, []);

  const loadValidationReport = async () => {
    try {
      setLoading(true);
      const response = await contactosApi.getValidationReport();
      setReport(response.data.data);
    } catch (error) {
      console.error('Error loading validation report:', error);
      toast.error('Error cargando reporte de validación');
    } finally {
      setLoading(false);
    }
  };

  const handleReloadExcel = async () => {
    try {
      setReloading(true);
      const response = await contactosApi.reloadExcel();
      const newReport = response.data.data;
      
      toast.success(`Excel recargado: ${newReport.validRows} válidos, ${newReport.invalidRows} inválidos`);
      
      // Recargar reporte
      await loadValidationReport();
    } catch (error) {
      console.error('Error reloading Excel:', error);
      toast.error('Error recargando Excel');
    } finally {
      setReloading(false);
    }
  };

  const getErrorTypeColor = (field) => {
    const colors = {
      claveCliente: 'text-blue-600 bg-blue-100',
      nombre: 'text-green-600 bg-green-100',
      correo: 'text-purple-600 bg-purple-100',
      telefonoContacto: 'text-orange-600 bg-orange-100',
      general: 'text-red-600 bg-red-100',
      estructura: 'text-gray-600 bg-gray-100'
    };
    return colors[field] || 'text-gray-600 bg-gray-100';
  };

  const getColumnName = (column) => {
    const columnNames = {
      A: 'Clave Cliente',
      B: 'Nombre',
      C: 'Correo',
      D: 'Teléfono',
      general: 'General'
    };
    return columnNames[column] || column;
  };

  const groupErrorsByType = (errors) => {
    const grouped = {};
    errors.forEach(error => {
      const key = error.field || 'general';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(error);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No se pudo cargar el reporte
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Intenta recargar la página
        </p>
      </div>
    );
  }

  const errorsByType = groupErrorsByType(report.errors || []);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reporte de Validación</h1>
            <p className="mt-1 text-sm text-gray-500">
              Estado de validación del archivo Excel y errores encontrados
            </p>
          </div>
          <button
            onClick={handleReloadExcel}
            disabled={reloading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${reloading ? 'animate-spin' : ''}`} />
            {reloading ? 'Recargando...' : 'Recargar Excel'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Procesadas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {report.totalRows}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Filas Válidas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {report.validRows}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Filas Inválidas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {report.invalidRows}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <WrenchScrewdriverIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Errores
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {report.errors?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Rate Progress */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Tasa de Éxito</h3>
        </div>
        <div className="px-6 py-4">
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progreso de validación</span>
              <span>
                {report.totalRows > 0 
                  ? Math.round((report.validRows / report.totalRows) * 100)
                  : 0
                }%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${report.totalRows > 0 
                    ? (report.validRows / report.totalRows) * 100 
                    : 0}%`
                }}
              ></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Válidas: {report.validRows}</span>
            <span>Inválidas: {report.invalidRows}</span>
          </div>
        </div>
      </div>

      {/* Report Info */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Información del Reporte</h3>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Última actualización</dt>
              <dd className="text-sm text-gray-900">{report.loadTimestamp}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Estado general</dt>
              <dd className="text-sm">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  report.invalidRows === 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {report.invalidRows === 0 ? '✅ Sin errores' : '⚠️ Requiere atención'}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Errors Section */}
      {report.errors && report.errors.length > 0 && (
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Errores Encontrados ({report.errors.length})
              </h3>
              <Link
                to="/correccion"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
              >
                <WrenchScrewdriverIcon className="h-4 w-4 mr-1" />
                Ir a Corrección
              </Link>
            </div>
          </div>
          
          {/* Errors by Type */}
          <div className="px-6 py-4">
            <div className="space-y-6">
              {Object.entries(errorsByType).map(([fieldType, fieldErrors]) => (
                <div key={fieldType} className="border border-gray-200 rounded-lg">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        Errores en: {getColumnName(fieldType === 'general' ? 'estructura' : fieldType)}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getErrorTypeColor(fieldType)}`}>
                        {fieldErrors.length} {fieldErrors.length === 1 ? 'error' : 'errores'}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="space-y-3">
                      {fieldErrors.slice(0, 5).map((error, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-md">
                          <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium text-red-800 bg-red-100 px-2 py-1 rounded">
                                Fila {error.row}
                              </span>
                              <span className="text-xs font-medium text-blue-800 bg-blue-100 px-2 py-1 rounded">
                                Columna {getColumnName(error.column)}
                              </span>
                            </div>
                            <p className="text-sm text-red-700 font-medium mb-1">
                              {error.error}
                            </p>
                            {error.value && (
                              <p className="text-xs text-red-600">
                                Valor: <code className="bg-red-100 px-1 py-0.5 rounded">{error.value}</code>
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {fieldErrors.length > 5 && (
                        <div className="text-center py-2">
                          <button
                            onClick={() => setSelectedError(fieldType)}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Ver {fieldErrors.length - 5} errores más...
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Errors State */}
      {(!report.errors || report.errors.length === 0) && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-12 text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              ¡Excelente! No hay errores de validación
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Todos los contactos en el archivo Excel están correctamente validados
            </p>
            <div className="mt-6">
              <Link
                to="/contactos"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Ver Contactos
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Acciones Recomendadas
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  {report.invalidRows > 0 && (
                    <li>
                      <Link to="/correccion" className="underline hover:text-blue-900">
                        Corregir {report.invalidRows} filas con errores
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link to="/contactos" className="underline hover:text-blue-900">
                      Revisar los {report.validRows} contactos válidos
                    </Link>
                  </li>
                  <li>
                    Verificar que el archivo Excel contenga los datos más actualizados
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Error Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Errores en: {getColumnName(selectedError)}
                </h3>
                <button
                  onClick={() => setSelectedError(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {errorsByType[selectedError]?.map((error, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium text-red-800 bg-red-100 px-2 py-1 rounded">
                            Fila {error.row}
                          </span>
                          <span className="text-xs font-medium text-blue-800 bg-blue-100 px-2 py-1 rounded">
                            Columna {getColumnName(error.column)}
                          </span>
                        </div>
                        <p className="text-sm text-red-700 font-medium mb-1">
                          {error.error}
                        </p>
                        {error.value && (
                          <p className="text-xs text-red-600">
                            Valor: <code className="bg-red-100 px-1 py-0.5 rounded">{error.value}</code>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setSelectedError(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationReport;