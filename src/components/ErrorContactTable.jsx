import { useState } from "react";
import { Edit, AlertCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function ErrorContactTable({ invalidContacts, validationReport, onEditContact }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Obtener errores por fila
  const getErrorsForRow = (rowData) => {
    if (!validationReport || !validationReport.errors) return [];
    
    return validationReport.errors.filter(error => {
      if (!error.rowData) return false;
      
      return (
        error.rowData.claveCliente === rowData.claveCliente &&
        error.rowData.nombre === rowData.nombre &&
        error.rowData.correo === rowData.correo &&
        error.rowData.telefonoContacto === rowData.telefonoContacto
      );
    });
  };

  // Obtener mensajes de error simplificados
  const getErrorMessages = (rowData) => {
    const errors = getErrorsForRow(rowData);
    const errorMessages = {};
    
    errors.forEach(error => {
      if (!errorMessages[error.field]) {
        errorMessages[error.field] = error.error;
      }
    });
    
    return errorMessages;
  };

  // Filtrar contactos inválidos
  const filteredContacts = invalidContacts.filter(contact => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (contact.claveCliente || "").toString().toLowerCase().includes(searchTermLower) ||
      (contact.nombre || "").toLowerCase().includes(searchTermLower) ||
      (contact.correo || "").toLowerCase().includes(searchTermLower) ||
      (contact.telefonoContacto || "").includes(searchTermLower)
    );
  });

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContacts = filteredContacts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Transformar RowData a formato compatible con el formulario
  const prepareContactForEdit = (rowData) => {
    return {
      claveCliente: rowData.claveCliente ? parseInt(rowData.claveCliente) || 0 : 0,
      nombre: rowData.nombre || "",
      correo: rowData.correo || "",
      telefonoContacto: rowData.telefonoContacto || ""
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-red-200">
      <div className="p-4 border-b">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar contactos con errores..."
            className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-red-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-red-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clave Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Correo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teléfono
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Errores
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentContacts.length > 0 ? (
              currentContacts.map((contact, index) => {
                const errorMessages = getErrorMessages(contact);
                return (
                  <tr key={index} className="bg-red-50 bg-opacity-30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contact.claveCliente || "-"}
                        {errorMessages.claveCliente && (
                          <div className="text-xs text-red-600 mt-1">
                            <AlertCircle className="h-3 w-3 inline mr-1" />
                            {errorMessages.claveCliente}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contact.nombre || "-"}
                        {errorMessages.nombre && (
                          <div className="text-xs text-red-600 mt-1">
                            <AlertCircle className="h-3 w-3 inline mr-1" />
                            {errorMessages.nombre}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contact.correo || "-"}
                        {errorMessages.correo && (
                          <div className="text-xs text-red-600 mt-1">
                            <AlertCircle className="h-3 w-3 inline mr-1" />
                            {errorMessages.correo}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contact.telefonoContacto || "-"}
                        {errorMessages.telefonoContacto && (
                          <div className="text-xs text-red-600 mt-1">
                            <AlertCircle className="h-3 w-3 inline mr-1" />
                            {errorMessages.telefonoContacto}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-red-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {contact.errorCount || Object.keys(errorMessages).length} error(es)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onEditContact(prepareContactForEdit(contact))}
                        className="text-blue-600 hover:text-blue-900 flex items-center justify-end"
                      >
                        <Edit className="h-5 w-5 mr-1" />
                        <span>Corregir</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm text-gray-500">No hay contactos con errores</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {filteredContacts.length > 0 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Anterior
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{" "}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredContacts.length)}
                </span>{" "}
                de <span className="font-medium">{filteredContacts.length}</span> contactos con errores
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {[...Array(totalPages).keys()].map((number) => (
                  <button
                    key={number + 1}
                    onClick={() => setCurrentPage(number + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border ${
                      currentPage === number + 1
                        ? "z-10 bg-red-50 border-red-500 text-red-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    } text-sm font-medium`}
                  >
                    {number + 1}
                  </button>
                ))}
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}