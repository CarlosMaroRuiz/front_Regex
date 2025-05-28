import { useState, useEffect, useCallback } from 'react';
import { contactosApi } from '../services/api';

export const useContactos = () => {
  const [contactos, setContactos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadContactos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contactosApi.getAll();
      setContactos(response.data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading contactos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContactos();
  }, [loadContactos]);

  return { contactos, loading, error, refetch: loadContactos };
};