import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { contactosApi } from '../services/api';
import toast from 'react-hot-toast';

const ErrorCorrection = () => {
  const navigate = useNavigate();
  const [invalidData, setInvalidData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedErrors, setSelectedErrors] = useState(new Set());
  const [correcting, setCorrecting] = useState(false);
  const [activeTab, setActiveTab] = useState('invalid');
  const [processingQueue, setProcessingQueue] = useState(new Set());

  useEffect(() => {
    loadData();
    
    // ✅ Escuchar eventos de actualización de contactos
    const handleContactUpdate = (event) => {
      if (event.detail && event.detail.type === 'contacto-updated') {
        handleContactUpdated(event.detail.contacto);
      }
    };

    window.addEventListener('contacto-updated', handleContactUpdate);
    
    return () => {
      window.removeEventListener('contacto-updated', handleContactUpdate);
    };
  }, []);

  // ✅ Manejar cuando un contacto se actualiza exitosamente
  const handleContactUpdated = useCallback((updatedContacto) => {
    console.log('🔄 Contacto actualizado, removiendo de lista de errores:', updatedContacto);
    
    // Remover el contacto de la lista de datos inválidos
    setInvalidData(prev => {
      const filtered = prev.filter(item => {
        const itemKey = extractNumericKey(item.claveCliente) || item.claveCliente;
        const updatedKey = updatedContacto.claveCliente || updatedContacto.clave;
        return itemKey !== updatedKey;
      });
      
      if (filtered.length < prev.length) {
        const removedCount = prev.length - filtered.length;
        toast.success(`${removedCount} elemento(s) corregido(s) y removido(s) de la lista`);
      }
      
      return filtered;
    });

    // Limpiar de seleccionados
    setSelectedErrors(new Set());
    
    // Remover de la cola de procesamiento
    setProcessingQueue(prev => {
      const newQueue = new Set(prev);
      newQueue.delete(updatedContacto.claveCliente || updatedContacto.clave);
      return newQueue;
    });
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Iniciando carga de datos de validación...');
      
      const results = await Promise.allSettled([
        loadInvalidData(),
        loadValidationErrors()
      ]);

      console.log('📊 Resultados de carga:', results);

    } catch (error) {
      console.error('❌ Error general loading data:', error);
      toast.error('Error cargando datos de validación');
    } finally {
      setLoading(false);
    }
  };

  const loadInvalidData = async () => {
    try {
      console.log('🔍 Cargando datos inválidos...');
      
      const endpoints = [
        { name: 'invalid-data', call: () => contactosApi.getInvalidData() },
        { name: 'validation', call: () => contactosApi.getValidationReport() },
        { name: 'errors', call: () => contactosApi.getValidationErrors() }
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await endpoint.call();
          
          if (response?.data?.success) {
            let data = response.data.data || [];
            
            if (endpoint.name === 'invalid-data' && Array.isArray(data) && data.length > 0) {
              setInvalidData(data);
              toast.success(`${data.length} datos inválidos cargados`);
              return;
            }
            
            if (endpoint.name === 'validation' && data.invalidRowsData && Array.isArray(data.invalidRowsData)) {
              setInvalidData(data.invalidRowsData);
              toast.success(`${data.invalidRowsData.length} datos inválidos cargados`);
              return;
            }
          }
        } catch (endpointError) {
          console.log(`❌ Endpoint ${endpoint.name} falló:`, endpointError.response?.status);
        }
      }

      // Fallback a datos mock si no hay datos reales
      console.log('⚠️ Usando datos de ejemplo');
      setInvalidData(getMockInvalidData());
      toast.info('Usando datos de ejemplo para demo');

    } catch (error) {
      console.error('❌ Error loading invalid data:', error);
      setInvalidData([]);
    }
  };

  const loadValidationErrors = async () => {
    try {
      const response = await contactosApi.getValidationErrors();
      if (response?.data?.success) {
        const errors = response.data.data || [];
        setValidationErrors(Array.isArray(errors) ? errors : []);
      }
    } catch (error) {
      setValidationErrors([]);
    }
  };

  const getMockInvalidData = () => [
    {
      id: 1,
      claveCliente: 'CLI001',
      nombre: 'María González',
      correo: 'maria.invalido',
      telefono: '123',
      errors: ['Email sin formato válido', 'Teléfono muy corto']
    },
    {
      id: 2,
      claveCliente: 'ABC123',
      nombre: '',
      correo: 'contacto@test.com',
      telefono: '5551234567',
      errors: ['Nombre requerido']
    },
    {
      id: 3,
      claveCliente: '999',
      nombre: 'Juan Pérez',
      correo: 'juan@email-incorrecto',
      telefono: '12345678901',
      errors: ['Email inválido', 'Teléfono muy largo']
    }
  ];

  const extractNumericKey = (claveInput) => {
    if (!claveInput) return null;
    const claveStr = String(claveInput).trim();
    const directNumber = parseInt(claveStr, 10);
    if (!isNaN(directNumber) && directNumber > 0) return directNumber;
    
    const numeroExtraido = claveStr.match(/\d+/g);
    if (numeroExtraido) {
      const numeroMasLargo = numeroExtraido.reduce((a, b) => a.length > b.length ? a : b);
      const numero = parseInt(numeroMasLargo, 10);
      if (!isNaN(numero) && numero > 0 && numero < 999999999) return numero;
    }
    return null;
  };

  // ✅ NUEVA FUNCIÓN: Corregir contacto con actualización automática
  const handleCorrectContact = async (item, index) => {
    const clave = item.claveCliente || '';
    
    if (!clave || clave.trim() === '') {
      toast.error('Este contacto no tiene clave cliente válida');
      return;
    }

    console.log('🔧 Iniciando corrección de contacto:', item);
    
    // Marcar como en procesamiento
    setProcessingQueue(prev => new Set([...prev, clave]));

    try {
      // Verificar si el contacto existe
      const response = await contactosApi.getById(clave);
      
      if (response.data.success) {
        // Contacto existe, navegar a edición
        console.log('✅ Contacto encontrado, navegando a edición');
        
        // Guardar callback para actualización automática
        sessionStorage.setItem('correction-callback', JSON.stringify({
          type: 'edit',
          originalData: item,
          index: index
        }));
        
        navigate(`/contactos/editar/${clave}`);
        
      } else {
        // Contacto no existe, crear nuevo
        handleCreateFromInvalid(item, index);
      }
      
    } catch (error) {
      if (error.response?.status === 404) {
        // Contacto no encontrado, ofrecer crear
        handleCreateFromInvalid(item, index);
      } else {
        console.error('❌ Error verificando contacto:', error);
        toast.error('Error verificando el contacto');
        setProcessingQueue(prev => {
          const newQueue = new Set(prev);
          newQueue.delete(clave);
          return newQueue;
        });
      }
    }
  };

  // ✅ FUNCIÓN MEJORADA: Crear contacto desde datos inválidos
  const handleCreateFromInvalid = (item, index) => {
    console.log('➕ Creando contacto desde datos inválidos:', item);
    
    // Generar clave si no existe
    let claveParaUsar = item.claveCliente || '';
    if (!claveParaUsar.trim()) {
      claveParaUsar = `NEW${Date.now().toString().slice(-6)}`;
    }
    
    // Preparar datos para el formulario
    const formData = {
      claveCliente: claveParaUsar,
      nombre: item.nombre || '',
      correo: item.correo || '',
      telefonoContacto: item.telefono || item.telefonoContacto || ''
    };
    
    // Guardar en sessionStorage para pre-llenar formulario
    sessionStorage.setItem('prefilledContactData', JSON.stringify(formData));
    
    // Guardar callback para actualización automática
    sessionStorage.setItem('correction-callback', JSON.stringify({
      type: 'create',
      originalData: item,
      index: index
    }));
    
    navigate('/contactos/nuevo');
    toast.info(`Creando nuevo contacto con clave: ${claveParaUsar}`);
  };

  // ✅ NUEVA FUNCIÓN: Corrección masiva
  const handleMassCorrection = async () => {
    if (selectedErrors.size === 0) {
      toast.error('Selecciona al menos un elemento para corregir');
      return;
    }

    setCorrecting(true);
    const selectedItems = Array.from(selectedErrors).map(index => invalidData[index]);
    
    try {
      console.log('🔧 Iniciando corrección masiva de', selectedItems.length, 'elementos');
      
      // Procesar solo los que tienen clave válida
      const validItems = selectedItems.filter(item => 
        item.claveCliente && item.claveCliente.trim() !== ''
      );
      
      if (validItems.length === 0) {
        toast.error('Ningún elemento seleccionado tiene clave cliente válida');
        return;
      }

      // Mostrar preview de lo que se va a corregir
      const shouldProceed = window.confirm(
        `¿Proceder con la corrección masiva?\n\n` +
        `✅ ${validItems.length} elementos con clave válida\n` +
        `❌ ${selectedItems.length - validItems.length} elementos sin clave válida\n\n` +
        `Se abrirá el formulario de edición para cada elemento válido.`
      );

      if (!shouldProceed) return;

      // Procesar el primer elemento válido
      if (validItems.length > 0) {
        const firstItem = validItems[0];
        const originalIndex = invalidData.findIndex(item => item === firstItem);
        
        // Guardar información para procesamiento en lote
        sessionStorage.setItem('mass-correction-queue', JSON.stringify({
          items: validItems.slice(1), // Resto de items
          currentIndex: 0,
          totalCount: validItems.length
        }));
        
        await handleCorrectContact(firstItem, originalIndex);
      }

    } catch (error) {
      console.error('❌ Error en corrección masiva:', error);
      toast.error('Error en corrección masiva');
    } finally {
      setCorrecting(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Refresh datos después de corrección
  const handleRefreshAfterCorrection = async () => {
    try {
      console.log('🔄 Actualizando datos después de corrección...');
      await loadData();
      toast.success('Datos actualizados');
    } catch (error) {
      console.error('❌ Error actualizando datos:', error);
      toast.error('Error actualizando datos');
    }
  };

  // ✅ NUEVA FUNCIÓN: Marcar como corregido manualmente
  const handleMarkAsCorrected = (index) => {
    const item = invalidData[index];
    
    if (window.confirm(`¿Marcar "${item.nombre || 'Sin nombre'}" como corregido?\n\nEsto lo removerá de la lista de errores.`)) {
      setInvalidData(prev => prev.filter((_, i) => i !== index));
      
      // Remover de seleccionados si estaba seleccionado
      setSelectedErrors(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(index);
        return newSelected;
      });
      
      toast.success('Elemento marcado como corregido');
    }
  };

  const handleSelectError = (index) => {
    const newSelected = new Set(selectedErrors);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedErrors(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedErrors.size === invalidData.length) {
      setSelectedErrors(new Set());
    } else {
      setSelectedErrors(new Set(invalidData.map((_, index) => index)));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
        <p className="text-gray-600">Cargando datos de validación...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Mejorado */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Corrección de Errores</h1>
            <p className="mt-1 text-sm text-gray-500">
              Corrige y actualiza datos inválidos automáticamente
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleRefreshAfterCorrection}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              🔄 Actualizar
            </button>
            <Link
              to="/contactos"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              👥 Ver Contactos
            </Link>
          </div>
        </div>
      </div>

      {/* Stats de Corrección */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Datos por Corregir
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {invalidData.length}
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
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Seleccionados
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {selectedErrors.size}
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
                <span className="text-2xl">🔄</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    En Proceso
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {processingQueue.size}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Datos Inválidos ({invalidData.length})
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={handleMassCorrection}
                disabled={selectedErrors.size === 0 || correcting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {correcting ? '🔄 Procesando...' : '🔧 Corregir Seleccionados'}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          {invalidData.length > 0 ? (
            <>
              {/* Controles de Selección */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {selectedErrors.size === invalidData.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                  </button>
                  <span className="text-sm text-gray-500">
                    {selectedErrors.size} de {invalidData.length} seleccionados
                  </span>
                </div>
              </div>

              {/* Lista de Datos Inválidos */}
              <div className="space-y-4">
                {invalidData.map((item, index) => {
                  const isProcessing = processingQueue.has(item.claveCliente);
                  const isSelected = selectedErrors.has(index);
                  
                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 transition-all ${
                        isSelected ? 'border-primary-500 bg-primary-50' : 
                        isProcessing ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectError(index)}
                            disabled={isProcessing}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {item.nombre || 'Sin nombre'}
                              </span>
                              {item.claveCliente && (
                                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                                  Clave: {item.claveCliente}
                                </span>
                              )}
                              {isProcessing && (
                                <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                                  🔄 Procesando...
                                </span>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-500 mb-2">
                              📧 {item.correo || 'Sin correo'} | 
                              📞 {item.telefono || item.telefonoContacto || 'Sin teléfono'}
                            </div>
                            
                            <div className="flex flex-wrap gap-1">
                              {item.errors?.map((error, errorIndex) => (
                                <span
                                  key={errorIndex}
                                  className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded"
                                >
                                  {error}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleCorrectContact(item, index)}
                            disabled={isProcessing || !item.claveCliente}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isProcessing ? '🔄' : '🔧 Corregir'}
                          </button>
                          
                          <button
                            onClick={() => handleMarkAsCorrected(index)}
                            disabled={isProcessing}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            ✅ Marcar OK
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-green-400 text-4xl mb-4">🎉</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¡Excelente! No hay datos por corregir
              </h3>
              <p className="text-gray-500 mb-4">
                Todos los contactos están correctamente validados
              </p>
              <Link
                to="/contactos"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                👥 Ver Contactos
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Información de Ayuda */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-500 text-xl">💡</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Cómo usar la Corrección de Errores
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Corregir Individual:</strong> Haz clic en "🔧 Corregir" para editar un contacto específico</li>
                <li><strong>Corrección Masiva:</strong> Selecciona múltiples elementos y usa "Corregir Seleccionados"</li>
                <li><strong>Marcar como OK:</strong> Si un dato ya está correcto, márcalo como "✅ Marcar OK"</li>
                <li><strong>Actualización Automática:</strong> Los elementos corregidos se remueven automáticamente de la lista</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorCorrection;