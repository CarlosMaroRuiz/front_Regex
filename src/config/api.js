// URL base de la API
export const API_URL = "http://localhost:8080/api";

// Funciones para manejar errores comunes
export const handleApiError = (error) => {
  console.error("API Error:", error);
  if (error.response) {
    // El servidor respondió con un código de estado fuera del rango 2xx
    return {
      message: error.response.data.error || "Error en el servidor",
      errors: error.response.data.errors || []
    };
  } else if (error.request) {
    // La solicitud fue hecha pero no se recibió respuesta
    return {
      message: "No se recibió respuesta del servidor. Verifique su conexión.",
      errors: []
    };
  } else {
    // Algo sucedió en la configuración de la solicitud que desencadenó un error
    return {
      message: "Error al procesar la solicitud. Intente nuevamente.",
      errors: []
    };
  }
};