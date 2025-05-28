import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// Components
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ContactosListOptimized from './pages/ContactosListOptimized';
import ContactoForm from './pages/ContactoForm';
import ValidationReport from './pages/ValidationReport';
import ErrorCorrection from './pages/ErrorCorrection';
import DebugApiStatus from './components/DebugApiStatus';

// Services
import { subscribeToDataUpdates, getCacheStats } from './services/api';

function App() {
  // ✅ Configurar listeners globales para sincronización de datos
  useEffect(() => {
    console.log('🚀 Inicializando aplicación con sincronización de datos...');
    
    // Suscribirse a actualizaciones de datos
    const unsubscribe = subscribeToDataUpdates((updateData) => {
      console.log('📡 Actualización global recibida:', updateData);
      
      // Manejar diferentes tipos de actualizaciones a nivel global
      switch (updateData.type) {
        case 'contacto-created':
          toast.success('✅ Contacto creado correctamente');
          break;
          
        case 'contacto-updated':
          toast.success('📝 Contacto actualizado correctamente');
          // Emitir evento específico para componentes que lo necesiten
          window.dispatchEvent(new CustomEvent('contacto-updated', {
            detail: updateData
          }));
          break;
          
        case 'contacto-deleted':
          toast.success('🗑️ Contacto eliminado correctamente');
          break;
          
        case 'excel-reloaded':
          toast.success('🔄 Datos recargados desde Excel');
          // Forzar refresh de todos los componentes que muestren datos
          window.dispatchEvent(new CustomEvent('data-reload-complete', {
            detail: updateData
          }));
          break;
          
        default:
          console.log('📊 Actualización de datos:', updateData.type);
      }
    });

    // ✅ Listener para errores de conexión API
    const handleApiError = (event) => {
      console.error('🔌 Error de conexión API:', event.detail);
      toast.error('Error de conexión con el servidor');
    };

    // ✅ Listener para estadísticas de rendimiento (solo en desarrollo)
    const handlePerformanceCheck = () => {
      if (process.env.NODE_ENV === 'development') {
        const stats = getCacheStats();
        console.log('📊 Estadísticas de cache:', stats);
        
        if (stats.cacheHitRate < 0.3) {
          console.warn('⚠️ Baja tasa de aciertos de cache:', stats.cacheHitRate);
        }
      }
    };

    // ✅ Configurar listeners
    window.addEventListener('api-error', handleApiError);
    
    // Check de rendimiento cada 5 minutos en desarrollo
    let perfInterval;
    if (process.env.NODE_ENV === 'development') {
      perfInterval = setInterval(handlePerformanceCheck, 5 * 60 * 1000);
      // Check inicial después de 30 segundos
      setTimeout(handlePerformanceCheck, 30000);
    }

    // ✅ Configurar manejo de errores no capturados
    const handleUnhandledError = (event) => {
      console.error('❌ Error no manejado:', event.error);
      
      // Solo mostrar toast para errores relacionados con API
      if (event.error?.message?.includes('API') || 
          event.error?.message?.includes('fetch') ||
          event.error?.message?.includes('axios')) {
        toast.error('Error de comunicación con el servidor');
      }
    };

    const handleUnhandledRejection = (event) => {
      console.error('❌ Promesa rechazada no manejada:', event.reason);
      
      // Manejar errores específicos de API
      if (event.reason?.response?.status === 500) {
        toast.error('Error interno del servidor');
      } else if (event.reason?.response?.status === 404) {
        console.log('ℹ️ Recurso no encontrado (404) - manejado silenciosamente');
      } else if (event.reason?.code === 'NETWORK_ERROR') {
        toast.error('Error de red - verifica tu conexión');
      }
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // ✅ Log de inicialización exitosa
    console.log('✅ App inicializada correctamente con:', {
      dataSync: 'Activo',
      errorHandling: 'Configurado',
      cacheSystem: 'Operativo',
      environment: process.env.NODE_ENV
    });

    // Cleanup
    return () => {
      unsubscribe();
      window.removeEventListener('api-error', handleApiError);
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      
      if (perfInterval) {
        clearInterval(perfInterval);
      }
      
      console.log('🧹 App cleanup completado');
    };
  }, []);

  // ✅ Configuración mejorada de toast
  const toastConfig = {
    duration: 4000,
    style: {
      background: '#363636',
      color: '#fff',
      borderRadius: '8px',
      fontSize: '14px',
      maxWidth: '500px',
    },
    success: {
      duration: 3000,
      iconTheme: {
        primary: '#10B981',
        secondary: '#fff',
      },
    },
    error: {
      duration: 6000,
      iconTheme: {
        primary: '#EF4444',
        secondary: '#fff',
      },
    },
    loading: {
      duration: Infinity,
    },
    // ✅ Configuraciones específicas para corrección de errores
    custom: {
      correction: {
        duration: 5000,
        style: {
          background: '#3B82F6',
          color: '#fff',
        },
      },
    },
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            
            {/* 🚀 Lista optimizada para grandes datasets */}
            <Route path="/contactos" element={<ContactosListOptimized />} />
            
            {/* 📝 Formularios con manejo mejorado de corrección */}
            <Route path="/contactos/nuevo" element={<ContactoForm />} />
            <Route path="/contactos/editar/:clave" element={<ContactoForm />} />
            
            {/* 📊 Validación y corrección */}
            <Route path="/validacion" element={<ValidationReport />} />
            <Route path="/correccion" element={<ErrorCorrection />} />
            
            {/* 🔧 Debug para verificar API Go */}
            <Route path="/debug" element={<DebugApiStatus />} />
          </Routes>
        </Layout>
        
        {/* ✅ Toaster mejorado con configuración específica */}
        <Toaster 
          position="top-right"
          toastOptions={toastConfig}
          containerStyle={{
            top: 20,
            right: 20,
          }}
          gutter={8}
        />
        
        {/* ✅ Indicador de desarrollo (solo en dev) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 z-50">
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
              🔧 DEV MODE
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;