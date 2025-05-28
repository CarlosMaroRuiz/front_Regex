import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // ✅ SOLUCIÓN: Usar useRef para mantener referencias estables
  const invalidDataRef = useRef([]);
  const eventListenersAttached = useRef(false);

  // ✅ SOLUCIÓN: Actualizar ref cuando cambie invalidData
  useEffect(() => {
    invalidDataRef.current = invalidData;
  }, [invalidData]);

  // ✅ FUNCIÓN CRÍTICA: handleContactUpdated con useCallback para referencia estable
  const handleContactUpdated = useCallback((updatedContacto) => {
    console.log('🔄 [HANDLER] Procesando actualización de contacto:', updatedContacto);
    
    if (!updatedContacto) {
      console.warn('⚠️ [HANDLER] Contacto actualizado está vacío');
      return;
    }

    // Extraer la clave del contacto actualizado
    const updatedKey = updatedContacto.claveCliente || 
                      updatedContacto.clave || 
                      updatedContacto.id;

    console.log('🔍 [HANDLER] Clave del contacto actualizado:', updatedKey, typeof updatedKey);
    console.log('📊 [HANDLER] Lista actual:', invalidDataRef.current.length, 'elementos');

    // ✅ SOLUCIÓN: Usar functional update para evitar dependencias stale
    setInvalidData(prevData => {
      console.log('🔍 [HANDLER] Buscando en', prevData.length, 'elementos');
      
      const filtered = prevData.filter(item => {
        const itemKey = item.claveCliente || item.clave || item.id;
        
        console.log('🔍 [HANDLER] Comparando:', {
          itemKey,
          itemKeyType: typeof itemKey,
          updatedKey,
          updatedKeyType: typeof updatedKey,
          item: item.nombre || 'Sin nombre',
          exactMatch: itemKey === updatedKey,
          stringMatch: String(itemKey) === String(updatedKey),
          numberMatch: Number(itemKey) === Number(updatedKey)
        });

        // Comparación múltiple
        const matches = itemKey === updatedKey || 
                       String(itemKey) === String(updatedKey) ||
                       Number(itemKey) === Number(updatedKey);

        return !matches; // Mantener los que NO coinciden
      });
      
      const removedCount = prevData.length - filtered.length;
      console.log('✅ [HANDLER] Elementos removidos:', removedCount);
      
      if (removedCount > 0) {
        toast.success(`🎉 ${removedCount} elemento(s) corregido(s) y removido(s)`);
      } else {
        console.warn('⚠️ [HANDLER] No se removió ningún elemento');
        
        // ✅ FALLBACK: Intentar match por nombre y email
        const flexibleFiltered = prevData.filter(item => {
          const itemName = item.nombre?.toLowerCase() || '';
          const updatedName = updatedContacto.nombre?.toLowerCase() || '';
          const itemEmail = item.correo?.toLowerCase() || '';
          const updatedEmail = updatedContacto.correo?.toLowerCase() || '';
          
          const nameEmailMatch = itemName && updatedName && itemEmail && updatedEmail &&
                                 itemName === updatedName && itemEmail === updatedEmail;
          
          return !nameEmailMatch;
        });
        
        if (flexibleFiltered.length < prevData.length) {
          console.log('✅ [HANDLER] Match encontrado por nombre y email');
          toast.success('🎉 Elemento corregido (match por nombre/email)');
          return flexibleFiltered;
        }
      }
      
      return filtered;
    });

    // Limpiar processingQueue
    setProcessingQueue(prev => {
      const newQueue = new Set(prev);
      newQueue.delete(updatedKey);
      newQueue.delete(String(updatedKey));
      newQueue.delete(Number(updatedKey));
      return newQueue;
    });

    // Limpiar selectedErrors
    setSelectedErrors(new Set());
  }, []); // ✅ Sin dependencias para mantener referencia estable

  // ✅ SOLUCIÓN: Event listeners en useEffect separado sin dependencias
  useEffect(() => {
    if (eventListenersAttached.current) {
      console.log('⚠️ Event listeners ya están attachados, saltando...');
      return;
    }

    console.log('🔗 Attachando event listeners...');

    // ✅ Event handlers con referencias estables
    const handleContactUpdateEvent = (event) => {
      console.log('📡 [EVENT] contacto-updated recibido:', event.detail);
      
      if (event.detail && event.detail.contacto) {
        handleContactUpdated(event.detail.contacto);
      }
    };

    const handleApiDataUpdateEvent = (event) => {
      console.log('📡 [EVENT] api-data-updated recibido:', event.detail);
      
      if (event.detail && event.detail.data) {
        const { type, data } = event.detail;
        
        if (type === 'contacto-created' || type === 'contacto-updated') {
          handleContactUpdated(data);
        } else if (type === 'excel-reloaded') {
          console.log('🔄 [EVENT] Excel recargado, actualizando datos...');
          setTimeout(() => loadData(), 1000);
        } else if (type === 'force-refresh-validation') {
          console.log('🔄 [EVENT] Forzando refresh de validación...');
          setTimeout(() => loadData(), 500);
        }
      }
    };

    const handleErrorCorrectionUpdateEvent = (event) => {
      console.log('📡 [EVENT] error-correction-update recibido:', event.detail);
      
      if (event.detail && event.detail.correctedItem) {
        handleContactUpdated(event.detail.correctedItem);
      }
    };

    // ✅ Registrar listeners
    window.addEventListener('contacto-updated', handleContactUpdateEvent);
    window.addEventListener('api-data-updated', handleApiDataUpdateEvent);
    window.addEventListener('error-correction-update', handleErrorCorrectionUpdateEvent);
    
    eventListenersAttached.current = true;
    console.log('✅ Event listeners attachados correctamente');

    // ✅ Cleanup
    return () => {
      console.log('🧹 Limpiando event listeners...');
      window.removeEventListener('contacto-updated', handleContactUpdateEvent);
      window.removeEventListener('api-data-updated', handleApiDataUpdateEvent);
      window.removeEventListener('error-correction-update', handleErrorCorrectionUpdateEvent);
      eventListenersAttached.current = false;
    };
  }, []); // ✅ Array vacío - solo se ejecuta una vez

  // ✅ SOLUCIÓN: useEffect separado para cargar datos iniciales
  useEffect(() => {
    console.log('🚀 Cargando datos iniciales...');
    loadData();
  }, []); // Solo una vez al montar

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Iniciando carga de datos de validación...');
      
      // ✅ SOLUCIÓN: Forzar invalidación de cache antes de cargar
      if (contactosApi.invalidateValidationCache) {
        contactosApi.invalidateValidationCache();
      }
      
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
              console.log('✅ Datos inválidos cargados desde invalid-data:', data.length);
              setInvalidData(data);
              toast.success(`${data.length} datos inválidos cargados`);
              return;
            }
            
            if (endpoint.name === 'validation' && data.invalidRowsData && Array.isArray(data.invalidRowsData)) {
              console.log('✅ Datos inválidos cargados desde validation:', data.invalidRowsData.length);
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

  // ✅ FUNCIÓN CORREGIDA: extractNumericKey
  const extractNumericKey = (claveInput) => {
    if (!claveInput) return null;
    
    const claveStr = String(claveInput).trim();
    
    // Si ya es un número, devolverlo
    const directNumber = Number(claveStr);
    if (!isNaN(directNumber) && directNumber > 0) return directNumber;
    
    // Extraer números de la cadena
    const numeroExtraido = claveStr.match(/\d+/g);
    if (numeroExtraido && numeroExtraido.length > 0) {
      const numeroMasLargo = numeroExtraido.reduce((a, b) => a.length > b.length ? a : b);
      const numero = Number(numeroMasLargo);
      if (!isNaN(numero) && numero > 0 && numero < 999999999) return numero;
    }
    
    return claveStr;
  };

  // ✅ NUEVA FUNCIÓN: Test manual de event listeners
  const testEventListeners = () => {
    console.log('🧪 Testing event listeners...');
    
    // Simular evento de prueba
    const testEvent = new CustomEvent('api-data-updated', {
      detail: {
        type: 'contacto-created',
        data: {
          claveCliente: 121223,
          nombre: 'Test Contact',
          correo: 'test@test.com'
        }
      }
    });
    
    window.dispatchEvent(testEvent);
    console.log('🧪 Test event dispatched');
  };

  // ✅ NUEVA FUNCIÓN: Forzar actualización sin eventos
  const forceUpdateWithoutEvents = () => {
    console.log('🔄 Forzando actualización sin eventos...');
    
    // Simular que se corrigió el contacto con clave 121223
    const targetKey = 121223;
    
    setInvalidData(prev => {
      const filtered = prev.filter(item => {
        const itemKey = item.claveCliente || item.clave || item.id;
        const matches = itemKey === targetKey || 
                       String(itemKey) === String(targetKey) ||
                       Number(itemKey) === Number(targetKey);
        return !matches;
      });
      
      const removedCount = prev.length - filtered.length;
      if (removedCount > 0) {
        toast.success(`🎉 ${removedCount} elemento(s) removido(s) manualmente`);
      }
      
      return filtered;
    });
  };

  // Resto de funciones existentes...
  const handleCorrectContact = async (item, index) => {
    const clave = item.claveCliente || '';
    
    if (!clave || clave.toString().trim() === '') {
      toast.error('Este contacto no tiene clave cliente válida');
      return;
    }

    console.log('🔧 Iniciando corrección de contacto:', item);
    
    setProcessingQueue(prev => new Set([...prev, clave]));

    try {
      const response = await contactosApi.getById(clave);
      
      if (response.data.success) {
        console.log('✅ Contacto encontrado, navegando a edición');
        
        sessionStorage.setItem('correction-callback', JSON.stringify({
          type: 'edit',
          originalData: item,
          index: index,
          fromErrorCorrection: true
        }));
        
        navigate(`/contactos/editar/${clave}`);
        
      } else {
        handleCreateFromInvalid(item, index);
      }
      
    } catch (error) {
      if (error.response?.status === 404) {
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

  const handleCreateFromInvalid = (item, index) => {
    console.log('➕ Creando contacto desde datos inválidos:', item);
    
    let claveParaUsar = item.claveCliente || '';
    if (!claveParaUsar.toString().trim()) {
      claveParaUsar = `NEW${Date.now().toString().slice(-6)}`;
    }
    
    const formData = {
      claveCliente: claveParaUsar,
      nombre: item.nombre || '',
      correo: item.correo || '',
      telefonoContacto: item.telefono || item.telefonoContacto || ''
    };
    
    sessionStorage.setItem('prefilledContactData', JSON.stringify(formData));
    
    sessionStorage.setItem('correction-callback', JSON.stringify({
      type: 'create',
      originalData: item,
      index: index,
      fromErrorCorrection: true
    }));
    
    navigate('/contactos/nuevo');
    toast.info(`Creando nuevo contacto con clave: ${claveParaUsar}`);
  };

  const handleRemoveFromList = (index) => {
    const item = invalidData[index];
    const itemName = item.nombre || `Clave: ${item.claveCliente}`;
    
    if (window.confirm(`¿Remover "${itemName}" de la lista de errores?`)) {
      setInvalidData(prev => prev.filter((_, i) => i !== index));
      
      setSelectedErrors(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(index);
        const reajustedSelected = new Set();
        Array.from(newSelected).forEach(selectedIndex => {
          if (selectedIndex < index) {
            reajustedSelected.add(selectedIndex);
          } else if (selectedIndex > index) {
            reajustedSelected.add(selectedIndex - 1);
          }
        });
        return reajustedSelected;
      });
      
      toast.success('Elemento removido de la lista');
    }
  };

  const handleManualRefresh = async () => {
    try {
      console.log('🔄 Actualizando datos manualmente...');
      toast.loading('Actualizando datos...', { id: 'manual-refresh' });
      
      if (contactosApi.clearCache) {
        contactosApi.clearCache();
      }
      if (contactosApi.invalidateValidationCache) {
        contactosApi.invalidateValidationCache();
      }
      
      await loadData();
      
      toast.success('Datos actualizados correctamente', { id: 'manual-refresh' });
    } catch (error) {
      console.error('❌ Error actualizando datos:', error);
      toast.error('Error actualizando datos', { id: 'manual-refresh' });
    }
  };

  const handleMassCorrection = async () => {
    if (selectedErrors.size === 0) {
      toast.error('Selecciona al menos un elemento para corregir');
      return;
    }

    setCorrecting(true);
    const selectedItems = Array.from(selectedErrors).map(index => invalidData[index]);
    
    try {
      console.log('🔧 Iniciando corrección masiva de', selectedItems.length, 'elementos');
      
      const validItems = selectedItems.filter(item => 
        item.claveCliente && item.claveCliente.toString().trim() !== ''
      );
      
      if (validItems.length === 0) {
        toast.error('Ningún elemento seleccionado tiene clave cliente válida');
        return;
      }

      const shouldProceed = window.confirm(
        `¿Proceder con la corrección masiva?\n\n` +
        `✅ ${validItems.length} elementos con clave válida\n` +
        `❌ ${selectedItems.length - validItems.length} elementos sin clave válida`
      );

      if (!shouldProceed) return;

      if (validItems.length > 0) {
        const firstItem = validItems[0];
        const originalIndex = invalidData.findIndex(item => item === firstItem);
        
        sessionStorage.setItem('mass-correction-queue', JSON.stringify({
          items: validItems.slice(1),
          currentIndex: 0,
          totalCount: validItems.length,
          fromErrorCorrection: true
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
            {/* ✅ BOTONES DE DEBUG */}
            {process.env.NODE_ENV === 'development' && (
              <>
                <button
                  onClick={testEventListeners}
                  className="inline-flex items-center px-3 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                >
                  🧪 Test Events
                </button>
                <button
                  onClick={forceUpdateWithoutEvents}
                  className="inline-flex items-center px-3 py-2 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100"
                >
                  ⚡ Force Update
                </button>
              </>
            )}
            <button
              onClick={handleManualRefresh}
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
                  const itemKey = item.claveCliente || item.clave || item.id;
                  const isProcessing = processingQueue.has(itemKey);
                  const isSelected = selectedErrors.has(index);
                  
                  return (
                    <div
                      key={`${itemKey}-${index}`}
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
                              {itemKey && (
                                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                                  Clave: {itemKey}
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
                              )) || (
                                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                  Datos requieren validación
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleCorrectContact(item, index)}
                            disabled={isProcessing || !itemKey}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isProcessing ? '🔄' : '🔧 Corregir'}
                          </button>
                          
                          <button
                            onClick={() => handleRemoveFromList(index)}
                            disabled={isProcessing}
                            className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50"
                          >
                            ❌ Remover
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

      {/* ✅ DEBUG INFO MEJORADO */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 bg-gray-100 border border-gray-300 rounded-lg p-4">
          <h4 className="text-sm font-bold text-gray-800 mb-2">🔍 Debug Info:</h4>
          <div className="text-xs text-gray-600">
            <p>• Invalid data count: {invalidData.length}</p>
            <p>• Processing queue: {processingQueue.size}</p>
            <p>• Selected errors: {selectedErrors.size}</p>
            <p>• Event listeners attached: {eventListenersAttached.current ? 'Yes' : 'No'}</p>
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">Ver claves en invalidData</summary>
              <div className="mt-1 ml-4">
                {invalidData.slice(0, 5).map((item, i) => (
                  <p key={i}>
                    [{i}] {item.nombre} - Clave: {item.claveCliente} ({typeof item.claveCliente})
                  </p>
                ))}
                {invalidData.length > 5 && <p>... y {invalidData.length - 5} más</p>}
              </div>
            </details>
          </div>
        </div>
      )}

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
                <li><strong>Remover de la Lista:</strong> Si un dato ya está correcto, usa "❌ Remover" para quitarlo de la vista</li>
                <li><strong>Actualización Automática:</strong> Los elementos corregidos se remueven automáticamente de la lista</li>
                <li><strong>Actualizar Manualmente:</strong> Usa el botón "🔄 Actualizar" si los cambios no se reflejan</li>
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <li><strong>🧪 Test Events:</strong> Prueba si los event listeners están funcionando</li>
                    <li><strong>⚡ Force Update:</strong> Fuerza la actualización sin eventos (para debugging)</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorCorrection;