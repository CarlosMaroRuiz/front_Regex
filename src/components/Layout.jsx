import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Contactos', href: '/contactos', icon: '👥' },
    { name: 'Validación', href: '/validacion', icon: '✅' },
    { name: 'Corrección', href: '/correccion', icon: '🔧' },
    { name: 'Debug API', href: '/debug', icon: '🔍' },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className="text-2xl mr-3">📋</div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Sistema de Contactos
                </h1>
              </Link>
            </div>
            
            {/* Indicador de estado */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Sistema Activo</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-4 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-white border-b-2 border-white'
                    : 'text-primary-100 hover:text-white hover:border-b-2 hover:border-primary-200'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Breadcrumb para formularios */}
      {(location.pathname.includes('/nuevo') || location.pathname.includes('/editar')) && (
        <div className="bg-gray-100 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Inicio</span>
                    🏠
                  </Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <span className="text-gray-400 mx-2">/</span>
                    <Link
                      to="/contactos"
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      Contactos
                    </Link>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <span className="text-gray-400 mx-2">/</span>
                    <span className="text-sm font-medium text-gray-900">
                      {location.pathname.includes('/nuevo') ? 'Nuevo Contacto' : 'Editar Contacto'}
                    </span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2025 Sistema de Contactos. Procesando 89,883+ registros con React + Go.
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>⚡ Optimizado para grandes datasets</span>
              <span>|</span>
              <span>🚀 Paginación virtualizada</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;