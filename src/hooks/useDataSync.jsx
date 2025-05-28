// hooks/useDataSync.js
import { useEffect, useCallback } from 'react';
import { subscribeToDataUpdates } from '../services/api';

// ✅ Hook para escuchar actualizaciones de datos
export const useDataSync = (onUpdate = null) => {
  useEffect(() => {
    const unsubscribe = subscribeToDataUpdates((updateData) => {
      console.log('📡 Actualización de datos recibida:', updateData);
      
      if (onUpdate) {
        onUpdate(updateData);
      }
      
      // Manejar diferentes tipos de actualizaciones
      switch (updateData.type) {
        case 'contacto-created':
          console.log('➕ Contacto creado:', updateData.data);
          break;
        case 'contacto-updated':
          console.log('📝 Contacto actualizado:', updateData.data);
          break;
        case 'contacto-deleted':
          console.log('🗑️ Contacto eliminado:', updateData.data);
          break;
        case 'excel-reloaded':
          console.log('🔄 Excel recargado:', updateData.data);
          break;
        default:
          console.log('📊 Actualización genérica:', updateData);
      }
    });

    return unsubscribe;
  }, [onUpdate]);
};

// hooks/useErrorCorrection.js
import { useState, useCallback } from 'react';
import { contactosApi } from '../services/api';
import toast from 'react-hot-toast';

// ✅ Hook especializado para corrección de errores
export const useErrorCorrection = () => {
  const [processing, setProcessing] = useState(new Set());
  const [correctedItems, setCorrectedItems] = useState(new Set());

  // Extraer clave numérica de texto sucio
  const extractNumericKey = useCallback((claveInput) => {
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
  }, []);

  // Verificar si un contacto existe
  const checkContactExists = useCallback(async (clave) => {
    try {
      const response = await contactosApi.getById(clave);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No existe
      }
      throw error; // Error real
    }
  }, []);

  // Marcar item como en procesamiento
  const markAsProcessing = useCallback((itemId) => {
    setProcessing(prev => new Set([...prev, itemId]));
  }, []);

  // Desmarcar item del procesamiento
  const unmarkAsProcessing = useCallback((itemId) => {
    setProcessing(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  }, []);

  // Marcar item como corregido
  const markAsCorrected = useCallback((itemId) => {
    setCorrectedItems(prev => new Set([...prev, itemId]));
    unmarkAsProcessing(itemId);
  }, [unmarkAsProcessing]);

  // Verificar si un item está siendo procesado
  const isProcessing = useCallback((itemId) => {
    return processing.has(itemId);
  }, [processing]);

  // Verificar si un item fue corregido
  const isCorrected = useCallback((itemId) => {
    return correctedItems.has(itemId);
  }, [correctedItems]);

  // Limpiar estados
  const clearStates = useCallback(() => {
    setProcessing(new Set());
    setCorrectedItems(new Set());
  }, []);

  // Procesar corrección individual
  const processIndividualCorrection = useCallback(async (item, options = {}) => {
    const { 
      onSuccess = () => {}, 
      onError = () => {},
      navigate = null 
    } = options;

    const clave = item.claveCliente || '';
    const itemId = item.id || clave;
    
    if (!clave || clave.trim() === '') {
      toast.error('Este contacto no tiene clave cliente válida');
      onError(new Error('Sin clave cliente'));
      return false;
    }

    console.log('🔧 Iniciando corrección individual:', item);
    markAsProcessing(itemId);

    try {
      // Verificar si existe
      const existingContact = await checkContactExists(clave);
      
      if (existingContact) {
        // Contacto existe, navegar a edición
        console.log('✅ Contacto encontrado, navegando a edición');
        
        if (navigate) {
          // Guardar contexto de corrección
          sessionStorage.setItem('correction-callback', JSON.stringify({
            type: 'edit',
            originalData: item,
            itemId: itemId
          }));
          
          navigate(`/contactos/editar/${clave}`);
        }
        
        onSuccess(existingContact);
        return true;
        
      } else {
        // Contacto no existe, crear nuevo
        console.log('❌ Contacto no encontrado, preparando creación');
        
        if (navigate) {
          // Preparar datos para creación
          const formData = {
            claveCliente: clave,
            nombre: item.nombre || '',
            correo: item.correo || '',
            telefonoContacto: item.telefono || item.telefonoContacto || ''
          };
          
          sessionStorage.setItem('prefilledContactData', JSON.stringify(formData));
          sessionStorage.setItem('correction-callback', JSON.stringify({
            type: 'create',
            originalData: item,
            itemId: itemId
          }));
          
          navigate('/contactos/nuevo');
        }
        
        onSuccess(null);
        return true;
      }
      
    } catch (error) {
      console.error('❌ Error en corrección individual:', error);
      toast.error('Error procesando la corrección');
      unmarkAsProcessing(itemId);
      onError(error);
      return false;
    }
  }, [checkContactExists, markAsProcessing, unmarkAsProcessing]);

  // Procesar corrección masiva
  const processMassCorrection = useCallback(async (items, options = {}) => {
    const { 
      onProgress = () => {},
      onComplete = () => {},
      navigate = null 
    } = options;

    console.log('🔧 Iniciando corrección masiva:', items.length, 'elementos');
    
    // Filtrar items válidos
    const validItems = items.filter(item => 
      item.claveCliente && item.claveCliente.trim() !== ''
    );
    
    if (validItems.length === 0) {
      toast.error('Ningún elemento tiene clave cliente válida');
      return false;
    }

    if (validItems.length !== items.length) {
      const invalidCount = items.length - validItems.length;
      toast.warning(`${invalidCount} elementos sin clave válida serán omitidos`);
    }

    try {
      // Configurar queue para procesamiento secuencial
      if (navigate && validItems.length > 1) {
        sessionStorage.setItem('mass-correction-queue', JSON.stringify({
          items: validItems.slice(1), // Resto de items
          currentIndex: 0,
          totalCount: validItems.length,
          completed: 0
        }));
      }

      // Procesar el primer item
      const firstItem = validItems[0];
      const success = await processIndividualCorrection(firstItem, {
        navigate,
        onSuccess: () => onProgress(1, validItems.length),
        onError: () => onProgress(1, validItems.length)
      });

      if (success && validItems.length === 1) {
        onComplete(1, validItems.length);
      }

      return success;
      
    } catch (error) {
      console.error('❌ Error en corrección masiva:', error);
      toast.error('Error en corrección masiva');
      return false;
    }
  }, [processIndividualCorrection]);

  return {
    // Estados
    processing,
    correctedItems,
    
    // Verificadores
    isProcessing,
    isCorrected,
    
    // Acciones
    markAsProcessing,
    unmarkAsProcessing,
    markAsCorrected,
    clearStates,
    
    // Procesadores
    processIndividualCorrection,
    processMassCorrection,
    
    // Utilidades
    extractNumericKey,
    checkContactExists
  };
};

// hooks/useAutoRefresh.js
import { useEffect, useRef, useCallback } from 'react';

// ✅ Hook para auto-refresh de datos después de correcciones
export const useAutoRefresh = (refreshFn, dependencies = []) => {
  const refreshTimeoutRef = useRef(null);
  const lastRefreshRef = useRef(0);
  const MIN_REFRESH_INTERVAL = 2000; // Mínimo 2 segundos entre refreshes

  const scheduleRefresh = useCallback((delay = 1000) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshRef.current;
      
      if (timeSinceLastRefresh >= MIN_REFRESH_INTERVAL) {
        console.log('🔄 Auto-refresh ejecutándose...');
        refreshFn();
        lastRefreshRef.current = now;
      } else {
        // Re-schedule para completar el intervalo mínimo
        const remainingTime = MIN_REFRESH_INTERVAL - timeSinceLastRefresh;
        scheduleRefresh(remainingTime);
      }
    }, delay);
  }, [refreshFn]);

  // Escuchar eventos de actualización de contactos
  useEffect(() => {
    const handleContactUpdate = (event) => {
      if (event.detail && event.detail.type === 'contacto-updated') {
        console.log('📡 Contacto actualizado detectado, programando refresh...');
        scheduleRefresh(500); // Refresh rápido después de actualización
      }
    };

    const handleDataUpdate = (event) => {
      const updateType = event.detail?.type;
      if (['contacto-created', 'contacto-deleted', 'excel-reloaded'].includes(updateType)) {
        console.log('📡 Actualización de datos detectada:', updateType);
        scheduleRefresh(1000);
      }
    };

    window.addEventListener('contacto-updated', handleContactUpdate);
    window.addEventListener('api-data-updated', handleDataUpdate);

    return () => {
      window.removeEventListener('contacto-updated', handleContactUpdate);
      window.removeEventListener('api-data-updated', handleDataUpdate);
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [scheduleRefresh]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Refresh manual
  const manualRefresh = useCallback(() => {
    console.log('🔄 Refresh manual solicitado');
    scheduleRefresh(0);
  }, [scheduleRefresh]);

  return { manualRefresh, scheduleRefresh };
};

// Exportar todos los hooks
export default {
  useDataSync,
  useErrorCorrection,
  useAutoRefresh
};