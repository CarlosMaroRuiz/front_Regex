import { useState, useEffect, useMemo } from 'react';

export const useVirtualizedData = (allData, pageSize = 50) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  // Filtrado optimizado con Web Workers si es necesario
  const filterData = useMemo(() => {
    if (!searchTerm.trim()) return allData;
    
    const searchLower = searchTerm.toLowerCase();
    return allData.filter(item => 
      item.nombre?.toLowerCase().includes(searchLower) ||
      item.correo?.toLowerCase().includes(searchLower) ||
      item.telefonoContacto?.includes(searchTerm) ||
      item.claveCliente?.toString().includes(searchTerm)
    );
  }, [allData, searchTerm]);

  // Datos paginados
  const paginatedData = useMemo(() => {
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    return filterData.slice(startIndex, endIndex);
  }, [filterData, currentPage, pageSize]);

  // Reset página cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const totalPages = Math.ceil(filterData.length / pageSize);
  const hasMore = currentPage < totalPages - 1;

  return {
    data: paginatedData,
    totalItems: filterData.length,
    currentPage,
    totalPages,
    hasMore,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    loadMore: () => setCurrentPage(prev => prev + 1),
    reset: () => {
      setCurrentPage(0);
      setSearchTerm('');
    }
  };
};