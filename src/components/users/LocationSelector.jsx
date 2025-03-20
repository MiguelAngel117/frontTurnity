import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { api } from "../../utils/api";
import './LocationSelector.css';

const LocationSelector = ({ role, onStoresChange, onDepartmentsChange, initialStores = [], initialDepartments = [] }) => {
  const [storesList, setStoresList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStore, setActiveStore] = useState(null);

  // Cargar tiendas al iniciar
  useEffect(() => {
    fetchStores();
  }, []);

  // Inicializar las selecciones con los valores iniciales recibidos por props
  useEffect(() => {
    if (initialStores && initialStores.length > 0) {
      setSelectedStores(initialStores);
    }
    
    if (initialDepartments && initialDepartments.length > 0) {
      setSelectedDepartments(initialDepartments);
    }
  }, [initialStores, initialDepartments]);

  // Cuando cambia la tienda seleccionada y el rol es Jefe, cargar sus departamentos
  useEffect(() => {
    if (role === 'Jefe' && selectedStores.length > 0) {
      fetchDepartments(selectedStores[0]);
      setActiveStore(selectedStores[0]);
    }
  }, [selectedStores, role]);

  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/stores');
      setStoresList(data);
      setIsLoading(false);
    } catch (error) {
      setError('Error al cargar las tiendas', error);
      setIsLoading(false);
    }
  };

  const fetchDepartments = async (storeId) => {
    setIsLoading(true);
    try {
      const data = await api.get(`/departmentStore/store/${storeId}`);
      setDepartmentsList(data);
      setIsLoading(false);
    } catch (error) {
      setError('Error al cargar los departamentos', error);
      setIsLoading(false);
    }
  };

  const handleStoreSelect = (storeId) => {
    let updatedStores;
    
    if (role === 'Jefe') {
      // Para Jefe, solo se permite una tienda
      updatedStores = [storeId];
      setSelectedDepartments([]);  // Resetear departamentos al cambiar de tienda
    } else {
      // Para Gerente, pueden seleccionar múltiples tiendas
      updatedStores = selectedStores.includes(storeId)
        ? selectedStores.filter(id => id !== storeId)
        : [...selectedStores, storeId];
    }
    
    setSelectedStores(updatedStores);
    onStoresChange(updatedStores);
  };

  const handleDepartmentSelect = (departmentId) => {
    const updatedDepartments = selectedDepartments.includes(departmentId)
      ? selectedDepartments.filter(id => id !== departmentId)
      : [...selectedDepartments, departmentId];
    
    setSelectedDepartments(updatedDepartments);
    onDepartmentsChange(updatedDepartments);
  };

  // Cuando no hay tiendas para seleccionar
  if (!storesList || storesList.length === 0 && !isLoading) {
    return <div className="no-data">No hay tiendas disponibles.</div>;
  }

  return (
    <div className="location-selector">
      {error && <div className="error-message">{error}</div>}
      
      <div className="selector-section">
        <h3>Selecciona {role === 'Jefe' ? 'una tienda' : 'tiendas'}</h3>
        
        {isLoading && !storesList.length ? (
          <div className="loading">Cargando tiendas...</div>
        ) : (
          <div className="stores-grid">
            {storesList.map(store => (
              <div 
                key={store.id_store} 
                className={`store-card ${selectedStores.includes(store.id_store) ? 'selected' : ''}`}
                onClick={() => handleStoreSelect(store.id_store)}
              >
                <div className="store-icon">🏬</div>
                <div className="store-name">{store.name_store}</div>
                <div className="store-hours">Abre: {store.hour_open_store} hrs</div>
                {role === 'Jefe' && selectedStores.includes(store.id_store) && (
                  <div className="store-badge">Seleccionada</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Mostrar departamentos solo para el rol de Jefe y cuando hay una tienda seleccionada */}
      {role === 'Jefe' && selectedStores.length > 0 && (
        <div className="selector-section">
          <h3>Selecciona departamentos</h3>
          
          {isLoading ? (
            <div className="loading">Cargando departamentos...</div>
          ) : departmentsList.length > 0 ? (
            <div className="departments-grid">
              {departmentsList.map(dept => (
                <div 
                  key={dept.id_department} 
                  className={`department-card ${selectedDepartments.includes(dept.id_department) ? 'selected' : ''}`}
                  onClick={() => handleDepartmentSelect(dept.id_department)}
                >
                  <div className="department-icon">📋</div>
                  <div className="department-name">{dept.name_department}</div>
                  {selectedDepartments.includes(dept.id_department) && (
                    <div className="department-badge">✓</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">No hay departamentos disponibles para esta tienda.</div>
          )}
        </div>
      )}
    </div>
  );
};

LocationSelector.propTypes = {
  role: PropTypes.string.isRequired,
  onStoresChange: PropTypes.func.isRequired,
  onDepartmentsChange: PropTypes.func.isRequired,
  initialStores: PropTypes.array,
  initialDepartments: PropTypes.array
};

export default LocationSelector;