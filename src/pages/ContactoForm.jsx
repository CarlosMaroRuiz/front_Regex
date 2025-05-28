import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { contactosApi } from '../services/api';
import toast from 'react-hot-toast';

const ContactoForm = () => {
  const navigate = useNavigate();
  const { clave } = useParams();
  const isEditing = Boolean(clave);
  
  const [formData, setFormData] = useState({
    claveCliente: '',
    nombre: '',
    correo: '',
    telefonoContacto: ''
  });

  const [loading, setLoading] = useState(false);
  const [loadingContacto, setLoadingContacto] = useState(isEditing);
  const [errors, setErrors] = useState({});
  
  // Estados para manejo de corrección de errores
  const [isFromCorrection, setIsFromCorrection] = useState(false);
  const [correctionCallback, setCorrectionCallback] = useState(null);
  const [originalErrorData, setOriginalErrorData] = useState(null);

  // ✅ FUNCIÓN AUXILIAR: Convertir cualquier valor a string de forma segura
  const safeToString = (value) => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  // ✅ FUNCIÓN AUXILIAR: Validar y limpiar string de forma segura
  const safeStringTrim = (value) => {
    const str = safeToString(value);
    return str.trim();
  };

  useEffect(() => {
    if (isEditing && clave) {
      loadContacto();
    } else if (!isEditing) {
      // Verificar si viene de corrección de errores
      const prefilledData = sessionStorage.getItem('prefilledContactData');
      const correctionInfo = sessionStorage.getItem('correction-callback');
      
      if (prefilledData) {
        try {
          const data = JSON.parse(prefilledData);
          console.log('📋 Cargando datos pre-llenados desde corrección:', data);
          
          // ✅ CORRECCIÓN: Asegurar que todos los campos sean strings
          setFormData({
            claveCliente: safeToString(data.claveCliente),
            nombre: safeToString(data.nombre),
            correo: safeToString(data.correo),
            telefonoContacto: safeToString(data.telefonoContacto)
          });
          
          setIsFromCorrection(true);
          sessionStorage.removeItem('prefilledContactData');
          
          if (correctionInfo) {
            const callback = JSON.parse(correctionInfo);
            setCorrectionCallback(callback);
            setOriginalErrorData(callback.originalData);
            console.log('🔗 Callback de corrección establecido:', callback);
          }
          
          toast.info('📝 Datos cargados desde corrección de errores');
        } catch (error) {
          console.error('Error parsing prefilled data:', error);
        }
      }
    }
  }, [isEditing, clave]);

  // También verificar cuando se edita un contacto desde corrección
  useEffect(() => {
    if (isEditing) {
      const correctionInfo = sessionStorage.getItem('correction-callback');
      if (correctionInfo) {
        try {
          const callback = JSON.parse(correctionInfo);
          setCorrectionCallback(callback);
          setOriginalErrorData(callback.originalData);
          setIsFromCorrection(true);
          console.log('🔗 Edición desde corrección detectada:', callback);
        } catch (error) {
          console.error('Error parsing correction callback:', error);
        }
      }
    }
  }, [isEditing, clave]);

  const loadContacto = async () => {
    try {
      setLoadingContacto(true);
      console.log(`🔍 Cargando contacto con clave: ${clave}`);
      
      const response = await contactosApi.getById(clave);
      
      if (response.data.success) {
        // Manejar diferentes estructuras de respuesta
        const contacto = response.data.data.contacto || response.data.data;
        console.log('✅ Contacto cargado:', contacto);
        
        // ✅ CORRECCIÓN: Asegurar que todos los campos sean strings
        setFormData({
          claveCliente: safeToString(contacto.claveCliente || contacto.ClaveCliente),
          nombre: safeToString(contacto.nombre || contacto.Nombre),
          correo: safeToString(contacto.correo || contacto.Correo),
          telefonoContacto: safeToString(contacto.telefonoContacto || contacto.TelefonoContacto)
        });
      } else {
        toast.error('No se pudo cargar el contacto');
        navigate('/contactos');
      }
    } catch (error) {
      console.error('❌ Error cargando contacto:', error);
      toast.error('Error cargando contacto');
      navigate('/contactos');
    } finally {
      setLoadingContacto(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // ✅ CORRECCIÓN: Asegurar que el valor siempre sea string
    setFormData(prev => ({
      ...prev,
      [name]: safeToString(value)
    }));

    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // ✅ FUNCIÓN CORREGIDA: validateForm con manejo seguro de tipos
  const validateForm = () => {
    const newErrors = {};

    // ✅ Validar clave cliente de forma segura
    const claveClienteStr = safeStringTrim(formData.claveCliente);
    if (!claveClienteStr) {
      newErrors.claveCliente = 'La clave cliente es requerida';
    }

    // ✅ Validar nombre de forma segura
    const nombreStr = safeStringTrim(formData.nombre);
    if (!nombreStr) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (nombreStr.length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    // ✅ Validar correo de forma segura
    const correoStr = safeStringTrim(formData.correo);
    if (!correoStr) {
      newErrors.correo = 'El correo es requerido';
    } else if (!correoStr.includes('@')) {
      newErrors.correo = 'El correo debe tener un formato válido';
    } else if (!correoStr.includes('.')) {
      newErrors.correo = 'El correo debe tener un formato válido';
    }

    // ✅ Validar teléfono de forma segura
    const telefonoStr = safeStringTrim(formData.telefonoContacto);
    if (!telefonoStr) {
      newErrors.telefonoContacto = 'El teléfono es requerido';
    } else if (telefonoStr.length !== 10) {
      newErrors.telefonoContacto = 'El teléfono debe tener exactamente 10 dígitos';
    } else if (!/^\d+$/.test(telefonoStr)) {
      newErrors.telefonoContacto = 'El teléfono debe contener solo números';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ FUNCIÓN MEJORADA: prepareClaveCliente con validación de tipos
  const prepareClaveCliente = (claveRaw) => {
    const claveStr = safeStringTrim(claveRaw);
    
    // Si es una cadena numérica, convertirla a número
    if (/^\d+$/.test(claveStr)) {
      const numero = parseInt(claveStr, 10);
      // Validar que sea un número válido
      if (!isNaN(numero) && numero > 0) {
        return numero;
      }
    }
    
    // Si no es numérica o es inválida, mantener como string
    return claveStr;
  };

  // ✅ FUNCIÓN MEJORADA: emitContactoUpdated con múltiples eventos
  const emitContactoUpdated = (contactoData) => {
    console.log('📡 Emitiendo eventos de actualización para:', contactoData);
    
    // ✅ Evento específico contacto-updated (para compatibilidad)
    const contactoUpdatedEvent = new CustomEvent('contacto-updated', {
      detail: {
        type: 'contacto-updated',
        contacto: contactoData,
        isFromCorrection: isFromCorrection,
        originalErrorData: originalErrorData,
        timestamp: Date.now()
      }
    });
    
    // ✅ Evento genérico api-data-updated (el que usa el sistema de cache)
    const apiDataUpdatedEvent = new CustomEvent('api-data-updated', {
      detail: {
        type: isEditing ? 'contacto-updated' : 'contacto-created',
        data: contactoData,
        isFromCorrection: isFromCorrection,
        originalErrorData: originalErrorData,
        timestamp: Date.now()
      }
    });
    
    // Emitir ambos eventos
    window.dispatchEvent(contactoUpdatedEvent);
    window.dispatchEvent(apiDataUpdatedEvent);
    
    console.log('📡 Eventos emitidos:', {
      'contacto-updated': contactoData,
      'api-data-updated': {
        type: isEditing ? 'contacto-updated' : 'contacto-created',
        data: contactoData
      }
    });

    // ✅ NUEVO: Forzar actualización de página de errores si viene de corrección
    if (isFromCorrection && originalErrorData) {
      console.log('🔄 Forzando actualización de corrección de errores...');
      
      // Emitir evento específico para ErrorCorrection
      const errorCorrectionEvent = new CustomEvent('error-correction-update', {
        detail: {
          type: 'item-corrected',
          correctedItem: contactoData,
          originalErrorData: originalErrorData,
          action: isEditing ? 'updated' : 'created',
          timestamp: Date.now()
        }
      });
      
      window.dispatchEvent(errorCorrectionEvent);
    }
  };

  // Función para manejar procesamiento de queue de corrección masiva
  const processNextInQueue = () => {
    const queueData = sessionStorage.getItem('mass-correction-queue');
    if (queueData) {
      try {
        const queue = JSON.parse(queueData);
        console.log('📋 Procesando siguiente en queue:', queue);
        
        if (queue.items && queue.items.length > 0) {
          const nextItem = queue.items[0];
          const remainingItems = queue.items.slice(1);
          
          // Actualizar queue
          const updatedQueue = {
            ...queue,
            items: remainingItems,
            currentIndex: queue.currentIndex + 1
          };
          
          if (remainingItems.length > 0) {
            sessionStorage.setItem('mass-correction-queue', JSON.stringify(updatedQueue));
            
            // Pre-llenar datos para el siguiente
            const nextFormData = {
              claveCliente: safeToString(nextItem.claveCliente),
              nombre: safeToString(nextItem.nombre),
              correo: safeToString(nextItem.correo),
              telefonoContacto: safeToString(nextItem.telefono || nextItem.telefonoContacto)
            };
            
            sessionStorage.setItem('prefilledContactData', JSON.stringify(nextFormData));
            
            toast.info(`Procesando ${updatedQueue.currentIndex + 1} de ${queue.totalCount}`);
            
            // Navegar al siguiente
            setTimeout(() => {
              if (nextItem.claveCliente) {
                navigate(`/contactos/editar/${nextItem.claveCliente}`);
              } else {
                navigate('/contactos/nuevo');
              }
            }, 1000);
            
          } else {
            // Queue completada
            sessionStorage.removeItem('mass-correction-queue');
            toast.success('🎉 Corrección masiva completada');
            setTimeout(() => navigate('/correccion'), 1500);
          }
        }
      } catch (error) {
        console.error('Error processing queue:', error);
        sessionStorage.removeItem('mass-correction-queue');
      }
    }
  };

  // ✅ FUNCIÓN CORREGIDA: handleSubmit con mejor manejo de eventos
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔍 [DEBUG] FormData antes de validar:', formData);
    console.log('🔍 [DEBUG] isFromCorrection:', isFromCorrection);
    console.log('🔍 [DEBUG] originalErrorData:', originalErrorData);
    console.log('🔍 [DEBUG] Tipos de datos:', {
      claveCliente: typeof formData.claveCliente,
      nombre: typeof formData.nombre,
      correo: typeof formData.correo,
      telefonoContacto: typeof formData.telefonoContacto
    });
    
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);

    try {
      // ✅ CORRECCIÓN: Preparar datos de forma segura
      const contactoData = {
        claveCliente: prepareClaveCliente(formData.claveCliente),
        nombre: safeStringTrim(formData.nombre),
        correo: safeStringTrim(formData.correo).toLowerCase(),
        telefonoContacto: safeStringTrim(formData.telefonoContacto)
      };

      console.log(`${isEditing ? '📝' : '➕'} ${isEditing ? 'Actualizando' : 'Creando'} contacto:`, contactoData);
      console.log('🔍 [DEBUG] Datos preparados:', contactoData);
      console.log('🔍 [DEBUG] Tipos finales:', {
        claveCliente: typeof contactoData.claveCliente,
        nombre: typeof contactoData.nombre,
        correo: typeof contactoData.correo,
        telefonoContacto: typeof contactoData.telefonoContacto
      });

      let response;
      if (isEditing) {
        response = await contactosApi.update(clave, contactoData);
      } else {
        response = await contactosApi.create(contactoData);
      }

      if (response.data.success) {
        const successMessage = `Contacto ${isEditing ? 'actualizado' : 'creado'} exitosamente`;
        toast.success(successMessage);
        
        // ✅ MEJORA CRÍTICA: Preparar datos completos para el evento
        const eventContactoData = {
          ...contactoData,
          clave: contactoData.claveCliente,
          // Incluir datos adicionales que puedan venir de la respuesta
          ...(response.data.data || {}),
          // Asegurar que la clave siempre esté presente en múltiples formatos
          id: contactoData.claveCliente,
          claveCliente: contactoData.claveCliente
        };
        
        console.log('🔍 [DEBUG] Event data preparado:', eventContactoData);
        
        // Emitir evento de actualización para que otros componentes se actualicen
        emitContactoUpdated(eventContactoData);
        
        // ✅ NUEVO: Delay antes de limpiar callback para asegurar que el evento se procese
        setTimeout(() => {
          // Limpiar callback de corrección
          if (correctionCallback) {
            sessionStorage.removeItem('correction-callback');
            console.log('🧹 Callback de corrección limpiado después de delay');
          }
        }, 500);
        
        // Procesar siguiente en queue si existe
        const hasQueue = sessionStorage.getItem('mass-correction-queue');
        if (hasQueue && isFromCorrection) {
          processNextInQueue();
          return;
        }
        
        // ✅ MEJORA: Navegación con delay para asegurar que los eventos se procesen
        const navigationDelay = isFromCorrection ? 2000 : 1000; // Más tiempo si viene de corrección
        
        if (isFromCorrection) {
          // Si viene de corrección, mostrar mensaje específico y volver
          toast.success('🎉 Corrección completada - Regresando...', { duration: 1500 });
          setTimeout(() => navigate('/correccion'), navigationDelay);
        } else {
          // Navegación normal
          setTimeout(() => navigate('/contactos'), navigationDelay);
        }
        
      } else {
        // Manejar errores de validación del backend
        if (response.data.data && Array.isArray(response.data.data)) {
          const backendErrors = {};
          response.data.data.forEach(error => {
            backendErrors[error.field] = error.message;
          });
          setErrors(backendErrors);
          toast.error('Por favor corrige los errores indicados');
        } else {
          toast.error(response.data.error || 'Error en el servidor');
        }
      }
    } catch (error) {
      console.error('❌ Error guardando contacto:', error);
      
      if (error.response?.status === 422 && error.response.data?.data) {
        // Errores de validación del backend
        const backendErrors = {};
        error.response.data.data.forEach(err => {
          backendErrors[err.field] = err.message;
        });
        setErrors(backendErrors);
        toast.error('Por favor corrige los errores de validación');
      } else if (error.response?.status === 409) {
        setErrors({ claveCliente: 'Ya existe un contacto con esta clave' });
        toast.error('Clave cliente duplicada');
      } else {
        toast.error(`Error ${isEditing ? 'actualizando' : 'creando'} contacto`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Limpiar datos de corrección si se cancela
    if (correctionCallback) {
      sessionStorage.removeItem('correction-callback');
      sessionStorage.removeItem('mass-correction-queue');
    }
    
    // Navegación inteligente al cancelar
    if (isFromCorrection) {
      navigate('/correccion');
    } else {
      navigate('/contactos');
    }
  };

  if (loadingContacto) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
        <p className="text-gray-600">Cargando contacto...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Mejorado */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Editar Contacto' : 'Nuevo Contacto'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isFromCorrection && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                  🔧 Corrección de Errores
                </span>
              )}
              {isEditing 
                ? `Modificar información del contacto con clave ${clave}`
                : isFromCorrection
                  ? 'Corrigiendo datos del contacto'
                  : 'Agrega un nuevo contacto al sistema'
              }
            </p>
          </div>
          <Link
            to={isFromCorrection ? '/correccion' : '/contactos'}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Volver {isFromCorrection ? 'a Corrección' : 'a Lista'}
          </Link>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white shadow rounded-lg">
        {/* Alerta mejorada para corrección de errores */}
        {isFromCorrection && originalErrorData && (
          <div className="px-6 pt-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400 text-xl">🔧</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Corrigiendo datos con errores:</strong>
                  </p>
                  <div className="mt-2">
                    {originalErrorData.errors?.map((error, index) => (
                      <span key={index} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                        {error}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-600 mt-2">
                    Corrige los datos y guarda para remover automáticamente de la lista de errores
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Clave Cliente */}
          <div>
            <label htmlFor="claveCliente" className="block text-sm font-medium text-gray-700">
              Clave Cliente *
            </label>
            <input
              type="text"
              id="claveCliente"
              name="claveCliente"
              value={formData.claveCliente}
              onChange={handleInputChange}
              disabled={isEditing}
              className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                errors.claveCliente ? 'border-red-300 ring-red-500' : ''
              } ${isEditing ? 'bg-gray-50 text-gray-500' : ''}`}
              placeholder="Ejemplo: 12345 o CLI001"
            />
            {errors.claveCliente && (
              <p className="mt-2 text-sm text-red-600">{errors.claveCliente}</p>
            )}
            {isEditing && (
              <p className="mt-2 text-sm text-gray-500">
                La clave cliente no se puede modificar
              </p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
              Nombre Completo *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                errors.nombre ? 'border-red-300 ring-red-500' : ''
              }`}
              placeholder="Ejemplo: Juan Pérez García"
            />
            {errors.nombre && (
              <p className="mt-2 text-sm text-red-600">{errors.nombre}</p>
            )}
          </div>

          {/* Correo */}
          <div>
            <label htmlFor="correo" className="block text-sm font-medium text-gray-700">
              Correo Electrónico *
            </label>
            <input
              type="email"
              id="correo"
              name="correo"
              value={formData.correo}
              onChange={handleInputChange}
              className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                errors.correo ? 'border-red-300 ring-red-500' : ''
              }`}
              placeholder="Ejemplo: juan.perez@correo.com"
            />
            {errors.correo && (
              <p className="mt-2 text-sm text-red-600">{errors.correo}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="telefonoContacto" className="block text-sm font-medium text-gray-700">
              Teléfono de Contacto *
            </label>
            <input
              type="tel"
              id="telefonoContacto"
              name="telefonoContacto"
              value={formData.telefonoContacto}
              onChange={handleInputChange}
              maxLength="10"
              className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                errors.telefonoContacto ? 'border-red-300 ring-red-500' : ''
              }`}
              placeholder="Ejemplo: 5551234567"
            />
            {errors.telefonoContacto && (
              <p className="mt-2 text-sm text-red-600">{errors.telefonoContacto}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Debe contener exactamente 10 dígitos sin espacios ni guiones
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 flex items-center"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {loading 
                ? (isEditing ? 'Actualizando...' : 'Creando...') 
                : (isEditing ? 'Actualizar Contacto' : 'Crear Contacto')
              }
            </button>
          </div>
        </form>
      </div>

      {/* Información adicional mejorada */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          {isFromCorrection ? '🔧 Corrección de Errores' : '💡 Información'}
        </h4>
        <div className="text-sm text-blue-800">
          {isFromCorrection ? (
            <>
              <p>• Los datos se han pre-llenado desde la detección de errores</p>
              <p>• Una vez guardado, el contacto se removerá automáticamente de la lista de errores</p>
              <p>• Verifica que todos los campos estén correctos antes de guardar</p>
            </>
          ) : (
            <>
              <p>• Todos los campos marcados con (*) son obligatorios</p>
              <p>• La clave cliente debe ser única en el sistema</p>
              <p>• Se aceptan claves numéricas (12345) o alfanuméricas (CLI001)</p>
              <p>• El correo debe tener un formato válido (ejemplo@dominio.com)</p>
              <p>• El teléfono debe contener solo números y tener 10 dígitos</p>
            </>
          )}
        </div>
      </div>

      {/* ✅ DEBUG INFO (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
          <h4 className="font-bold mb-1">🔍 Debug Info:</h4>
          <p>isEditing: {isEditing.toString()}</p>
          <p>isFromCorrection: {isFromCorrection.toString()}</p>
          <p>correctionCallback: {correctionCallback ? 'Set' : 'None'}</p>
          <p>originalErrorData: {originalErrorData ? 'Set' : 'None'}</p>
          <p>formData types: {JSON.stringify(Object.keys(formData).reduce((acc, key) => {
            acc[key] = typeof formData[key];
            return acc;
          }, {}))}</p>
          {originalErrorData && (
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">Ver originalErrorData</summary>
              <pre className="mt-1 text-xs bg-gray-200 p-2 rounded overflow-auto">
                {JSON.stringify(originalErrorData, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactoForm;