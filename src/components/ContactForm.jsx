import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function ContactForm({ isOpen, onClose, onSubmit, contact, isEditMode, loading }) {
  const [formData, setFormData] = useState({
    claveCliente: "",
    nombre: "",
    correo: "",
    telefonoContacto: ""
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (contact) {
      setFormData({
        claveCliente: contact.claveCliente || "",
        nombre: contact.nombre || "",
        correo: contact.correo || "",
        telefonoContacto: contact.telefonoContacto || ""
      });
    } else {
      setFormData({
        claveCliente: "",
        nombre: "",
        correo: "",
        telefonoContacto: ""
      });
    }
    setErrors({});
  }, [contact]);

  const validateForm = () => {
    const newErrors = {};
    
    // Validar clave cliente
    if (!formData.claveCliente) {
      newErrors.claveCliente = "La clave cliente es requerida";
    } else if (isNaN(formData.claveCliente) || parseInt(formData.claveCliente) <= 0) {
      newErrors.claveCliente = "La clave cliente debe ser un número mayor a 0";
    }

    // Validar nombre
    if (!formData.nombre) {
      newErrors.nombre = "El nombre es requerido";
    } else {
      const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
      if (!nombreRegex.test(formData.nombre)) {
        newErrors.nombre = "El nombre no debe contener números";
      }
    }

    // Validar correo
    if (!formData.correo) {
      newErrors.correo = "El correo es requerido";
    } else {
      const correoRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|live\.com|icloud\.com|protonmail\.com)$/;
      if (!correoRegex.test(formData.correo)) {
        newErrors.correo = "El correo debe ser de un proveedor conocido (gmail, yahoo, hotmail, outlook, live, icloud, protonmail)";
      }
    }

    // Validar teléfono
    if (!formData.telefonoContacto) {
      newErrors.telefonoContacto = "El teléfono es requerido";
    } else {
      const telefonoRegex = /^\d{10}$/;
      if (!telefonoRegex.test(formData.telefonoContacto)) {
        newErrors.telefonoContacto = "El teléfono debe tener exactamente 10 dígitos sin letras";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        claveCliente: parseInt(formData.claveCliente),
        nombre: formData.nombre,
        correo: formData.correo,
        telefonoContacto: formData.telefonoContacto
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditMode ? "Editar Contacto" : "Nuevo Contacto"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <label htmlFor="claveCliente" className="block text-sm font-medium text-gray-700 mb-1">
              Clave Cliente
            </label>
            <input
              type="text"
              id="claveCliente"
              name="claveCliente"
              value={formData.claveCliente}
              onChange={handleChange}
              disabled={isEditMode}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.claveCliente 
                  ? "border-red-300 focus:ring-red-500" 
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Ej. 123"
            />
            {errors.claveCliente && (
              <p className="mt-1 text-sm text-red-600">{errors.claveCliente}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.nombre 
                  ? "border-red-300 focus:ring-red-500" 
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Ej. Juan Pérez"
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-1">
              Correo
            </label>
            <input
              type="email"
              id="correo"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.correo 
                  ? "border-red-300 focus:ring-red-500" 
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Ej. juan@gmail.com"
            />
            {errors.correo && (
              <p className="mt-1 text-sm text-red-600">{errors.correo}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Debe ser de los proveedores: gmail.com, yahoo.com, hotmail.com, outlook.com, live.com, icloud.com, protonmail.com
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="telefonoContacto" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="text"
              id="telefonoContacto"
              name="telefonoContacto"
              value={formData.telefonoContacto}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.telefonoContacto 
                  ? "border-red-300 focus:ring-red-500" 
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Ej. 1234567890"
            />
            {errors.telefonoContacto && (
              <p className="mt-1 text-sm text-red-600">{errors.telefonoContacto}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Debe contener exactamente 10 dígitos numéricos
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 mr-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
              disabled={loading}
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isEditMode ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}