import { RefreshCw } from "lucide-react";

export default function Navbar({ onReloadExcel, loadingAction }) {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-600">
              Sistema de Gestión de Contactos
            </h1>
          </div>
          <div>
            <button
              onClick={onReloadExcel}
              disabled={loadingAction}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingAction ? 'animate-spin' : ''}`} />
              Recargar Excel
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}