import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

const ITEM_HEIGHT = 80;
const CONTAINER_HEIGHT = 600;

const ContactRow = React.memo(({ index, style, data }) => {
  const { contactos, onEdit, onDelete } = data;
  const contacto = contactos[index];

  if (!contacto) {
    return (
      <div style={style} className="flex items-center justify-center">
        <div className="animate-pulse bg-gray-200 h-16 w-full mx-4 rounded"></div>
      </div>
    );
  }

  return (
    <div style={style} className="px-4 py-2 border-b border-gray-200">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center flex-1 min-w-0">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {contacto.nombre?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <div className="flex items-center">
              <div className="text-sm font-medium text-gray-900 truncate">
                {contacto.nombre}
              </div>
              <div className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                ID: {contacto.claveCliente || contacto.clave || contacto.id}
              </div>
            </div>
            <div className="text-sm text-gray-500 truncate">
              {contacto.correo}
            </div>
            <div className="text-sm text-gray-500">
              📞 {contacto.telefonoContacto || contacto.telefono || 'Sin teléfono'}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => onEdit(contacto)}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-full"
            title="Editar"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(contacto)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
            title="Eliminar"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
});

ContactRow.displayName = 'ContactRow';

const VirtualizedContactList = ({ 
  contactos = [], 
  onEdit = () => {}, 
  onDelete = () => {}, 
  loading = false,
  hasNextPage = false,
  loadNextPage = () => {}
}) => {
  const itemCount = hasNextPage ? contactos.length + 1 : contactos.length;
  const isItemLoaded = useCallback((index) => !!contactos[index], [contactos]);

  const itemData = useMemo(() => ({
    contactos,
    onEdit,
    onDelete
  }), [contactos, onEdit, onDelete]);

  // Asegurar que la altura sea un número válido
  const containerHeight = isNaN(CONTAINER_HEIGHT) ? 600 : CONTAINER_HEIGHT;
  const itemHeight = isNaN(ITEM_HEIGHT) ? 80 : ITEM_HEIGHT;

  if (contactos.length === 0 && !loading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-6 py-12 text-center">
          <div className="text-gray-400 text-4xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay contactos disponibles
          </h3>
          <p className="text-gray-500">
            Los contactos aparecerán aquí cuando estén disponibles
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      {/* Header con información */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-900">
            Lista de Contactos ({contactos.length.toLocaleString()})
          </h3>
          <div className="text-xs text-gray-500">
            📊 Lista virtualizada - Solo se renderizan elementos visibles
          </div>
        </div>
      </div>

      {/* Lista Virtualizada */}
      <div style={{ height: containerHeight }}>
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadNextPage}
        >
          {({ onItemsRendered, ref }) => (
            <List
              ref={ref}
              height={containerHeight}
              itemCount={itemCount}
              itemSize={itemHeight}
              itemData={itemData}
              onItemsRendered={onItemsRendered}
              overscanCount={5} // Renderizar 5 items extra fuera de la vista
            >
              {ContactRow}
            </List>
          )}
        </InfiniteLoader>
      </div>
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-4 border-t border-gray-200">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          <span className="ml-2 text-sm text-gray-500">Cargando más contactos...</span>
        </div>
      )}

      {/* Performance info */}
      <div className="px-6 py-2 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          ⚡ Optimizado para grandes datasets - Renderizando solo elementos visibles
        </p>
      </div>
    </div>
  );
};

export default VirtualizedContactList;