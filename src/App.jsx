import { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import Navbar from "./components/Navbar";
import ContactTable from "./components/ContactTable";
import ErrorContactTable from "./components/ErrorContactTable";
import ContactForm from "./components/ContactForm";
import LoadingSpinner from "./components/LoadingSpinner";
import StatsCard from "./components/StatsCard";
import SearchFilters from "./components/SearchFilters";
import { API_URL } from "./config/api";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [validationReport, setValidationReport] = useState(null);
  const [invalidContacts, setInvalidContacts] = useState([]);
  const [stats, setStats] = useState({
    totalContactos: 0,
    validContactos: 0,
    errorContactos: 0,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});

  useEffect(() => {
    fetchContactsWithValidation();
  }, []);

  useEffect(() => {
    // Cuando se cargan los contactos, inicializar los filtrados
    setFilteredContacts(contacts);
  }, [contacts]);

  const fetchContactsWithValidation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/contactos/con-validacion`);
      const result = await response.json();
      
      if (result.success) {
        setContacts(result.data.contactos || []);
        setFilteredContacts(result.data.contactos || []);
        setValidationReport(result.data.validationReport);
        setInvalidContacts(result.data.invalidRowsData || []);
        setStats({
          totalContactos: result.data.totalContactos || 0,
          validContactos: result.data.validContactos || 0,
          errorContactos: result.data.errorContactos || 0,
        });
      } else {
        toast.error("Error al cargar los contactos");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión al servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleReloadExcel = async () => {
    try {
      setLoadingAction(true);
      const response = await fetch(`${API_URL}/contactos/reload`, {
        method: "POST",
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success("Archivo Excel recargado exitosamente");
        fetchContactsWithValidation();
      } else {
        toast.error(result.error || "Error al recargar el archivo Excel");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión al servidor");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCreateContact = async (contactData) => {
    try {
      setLoadingAction(true);
      const response = await fetch(`${API_URL}/contactos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactData),
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success("Contacto creado exitosamente");
        setIsFormOpen(false);
        fetchContactsWithValidation();
      } else {
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(err => toast.error(`${err.campo}: ${err.mensaje}`));
        } else {
          toast.error(result.error || "Error al crear el contacto");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión al servidor");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUpdateContact = async (contactData) => {
    try {
      setLoadingAction(true);
      const response = await fetch(`${API_URL}/contactos/${contactData.claveCliente}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactData),
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success("Contacto actualizado exitosamente");
        setIsFormOpen(false);
        setIsEditMode(false);
        setCurrentContact(null);
        fetchContactsWithValidation();
      } else {
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(err => toast.error(`${err.campo}: ${err.mensaje}`));
        } else {
          toast.error(result.error || "Error al actualizar el contacto");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión al servidor");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteContact = async (claveCliente) => {
    if (!window.confirm("¿Estás seguro que deseas eliminar este contacto?")) return;
    
    try {
      setLoadingAction(true);
      const response = await fetch(`${API_URL}/contactos/${claveCliente}`, {
        method: "DELETE",
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success("Contacto eliminado exitosamente");
        fetchContactsWithValidation();
      } else {
        toast.error(result.error || "Error al eliminar el contacto");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión al servidor");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSearch = async (filters) => {
    setLoadingAction(true);
    setActiveFilters(filters);
    
    // Filtrar localmente si no hay muchos criterios
    if (!filters || Object.values(filters).every(val => val === "")) {
      setFilteredContacts(contacts);
      setLoadingAction(false);
      return;
    }
    
    try {
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      if (filters.claveCliente) params.append("claveCliente", filters.claveCliente);
      if (filters.nombre) params.append("nombre", filters.nombre);
      if (filters.correo) params.append("correo", filters.correo);
      if (filters.telefono) params.append("telefono", filters.telefono);
      
      // Hacer la búsqueda en la API
      const response = await fetch(`${API_URL}/contactos/buscar?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setFilteredContacts(result.data || []);
        if ((result.data || []).length === 0) {
          toast.info("No se encontraron contactos con los criterios especificados");
        }
      } else {
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(err => toast.error(`${err.campo}: ${err.mensaje}`));
        } else {
          toast.error(result.error || "Error al buscar contactos");
        }
        // Mantener la lista actual en caso de error
        setFilteredContacts(contacts);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión al servidor");
      // Mantener la lista actual en caso de error
      setFilteredContacts(contacts);
    } finally {
      setLoadingAction(false);
    }
  };

  const openCreateForm = () => {
    setCurrentContact(null);
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const openEditForm = (contact) => {
    setCurrentContact(contact);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setCurrentContact(null);
    setIsEditMode(false);
  };

  const submitForm = (data) => {
    if (isEditMode) {
      handleUpdateContact(data);
    } else {
      handleCreateContact(data);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Navbar onReloadExcel={handleReloadExcel} loadingAction={loadingAction} />
      
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatsCard 
                title="Total de Contactos" 
                value={stats.totalContactos} 
                icon="users" 
                color="blue"
              />
              <StatsCard 
                title="Contactos Válidos" 
                value={stats.validContactos} 
                icon="check-circle" 
                color="green"
              />
              <StatsCard 
                title="Contactos con Errores" 
                value={stats.errorContactos} 
                icon="alert-circle" 
                color="red"
              />
            </div>

            {/* Componente de búsqueda con filtros */}
            <SearchFilters 
              onSearch={handleSearch} 
              loading={loadingAction} 
            />

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Contactos con Errores</h2>
              </div>
              {invalidContacts.length > 0 ? (
                <ErrorContactTable 
                  invalidContacts={invalidContacts} 
                  validationReport={validationReport}
                  onEditContact={openEditForm}
                />
              ) : (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-green-700 font-medium">No hay contactos con errores. ¡Todo está correcto!</p>
                </div>
              )}
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {Object.values(activeFilters).some(v => v !== "") 
                    ? "Resultados de búsqueda" 
                    : "Todos los Contactos"}
                </h2>
                <button
                  onClick={openCreateForm}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                  disabled={loadingAction}
                >
                  <span className="mr-2">Nuevo Contacto</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <ContactTable 
                contacts={filteredContacts} 
                onEditContact={openEditForm} 
                onDeleteContact={handleDeleteContact}
                loadingAction={loadingAction}
              />
            </div>
          </>
        )}
      </main>

      {isFormOpen && (
        <ContactForm
          isOpen={isFormOpen}
          onClose={closeForm}
          onSubmit={submitForm}
          contact={currentContact}
          isEditMode={isEditMode}
          loading={loadingAction}
        />
      )}
    </div>
  );
}