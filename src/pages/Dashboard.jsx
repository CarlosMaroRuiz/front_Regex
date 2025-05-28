import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contactosApi } from '../services/api';
import { 
  UsersIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalContactos: 0,
    contactosValidos: 0,
    contactosInvalidos: 0,
    erroresValidacion: 0,
  });
  const [validationReport, setValidationReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar contactos y reporte de validación en paralelo
      const [contactosResponse, validationResponse] = await Promise.all([
        contactosApi.getAll(),
        contactosApi.getValidationReport()
      ]);

      const contactos = contactosResponse.data.data || [];
      const report = validationResponse.data.data || {};

      setStats({
        totalContactos: contactos.length,
        contactosValidos: report.validRows || 0,
        contactosInvalidos: report.invalidRows || 0,
        erroresValidacion: report.errors?.length || 0,
      });

      setValidationReport(report);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error cargando datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleReloadExcel = async () => {
    try {
      setReloading(true);
      const response = await contactosApi.reloadExcel();
      const report = response.data.data;
      
      toast.success(`Excel recargado: ${report.validRows} válidos, ${report.invalidRows} inválidos`);
      
      // Recargar datos del dashboard
      await loadDashboardData();
    } catch (error) {
      console.error('Error reloading Excel:', error);
      toast.error('Error recargando Excel');
    } finally {
      setReloading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, description, link }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {loading ? '...' : value}
              </dd>
              {description && (
                <dd className="text-sm text-gray-500 mt-1">
                  {description}
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>
      {link && (
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link 
              to={link} 
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Ver detalles →
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Resumen general del sistema de contactos
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Contactos"
          value={stats.totalContactos}
          icon={UsersIcon}
          color="text-blue-500"
          description="Contactos en el sistema"
          link="/contactos"
        />
        <StatCard
          title="Contactos Válidos"
          value={stats.contactosValidos}
          icon={CheckCircleIcon}
          color="text-green-500"
          description="Sin errores de validación"
          link="/contactos"
        />
        <StatCard
          title="Contactos Inválidos"
          value={stats.contactosInvalidos}
          icon={ExclamationTriangleIcon}
          color="text-red-500"
          description="Requieren corrección"
          link="/correccion"
        />
        <StatCard
          title="Errores de Validación"
          value={stats.erroresValidacion}
          icon={DocumentTextIcon}
          color="text-yellow-500"
          description="Total de errores encontrados"
          link="/validacion"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Validation Report */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Reporte de Validación Reciente
            </h3>
          </div>
          <div className="px-6 py-4">
            {validationReport ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Última actualización:</span>
                  <span className="text-sm font-medium">
                    {validationReport.loadTimestamp}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Filas procesadas:</span>
                  <span className="text-sm font-medium">
                    {validationReport.totalRows}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${validationReport.totalRows > 0 
                          ? (validationReport.validRows / validationReport.totalRows) * 100 
                          : 0}%`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Válidos: {validationReport.validRows}</span>
                    <span>Inválidos: {validationReport.invalidRows}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">Cargando reporte...</p>
              </div>
            )}
          </div>
          <div className="px-6 py-3 bg-gray-50">
            <Link
              to="/validacion"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Ver reporte completo →
            </Link>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Acciones Rápidas
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-3">
              <Link
                to="/contactos/nuevo"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <UsersIcon className="h-5 w-5 text-primary-500 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Nuevo Contacto
                  </div>
                  <div className="text-xs text-gray-500">
                    Agregar un contacto manualmente
                  </div>
                </div>
              </Link>
              
              <Link
                to="/correccion"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Corregir Errores
                  </div>
                  <div className="text-xs text-gray-500">
                    Revisar y corregir datos inválidos
                  </div>
                </div>
              </Link>
              
              <Link
                to="/contactos"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Ver Todos los Contactos
                  </div>
                  <div className="text-xs text-gray-500">
                    Explorar y buscar contactos
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;