import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { api } from '../../utils/api';

const StoreDepartmentSelector = ({ onSelection, loading, setLoading }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [stores, setStores] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [error, setError] = useState(null);

  // Cargar información del usuario
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUserInfo(storedUser);
  }, []);

  // Cargar tiendas disponibles
  useEffect(() => {
    const loadStores = async () => {
      if (userInfo?.number_document) {
        try {
          setLoading(true);
          const data = await api.get(`/users/${userInfo.number_document}/stores`);
          
          if (userInfo.stores && userInfo.stores.length > 0) {
            const filteredStores = data.filter(store => 
              userInfo.stores.includes(store.id_store)
            );
            setStores(filteredStores);
          } else {
            setStores(data);
          }
          setLoading(false);
        } catch (error) {
          console.error("Error loading stores:", error);
          setError("Error al cargar las tiendas");
          setLoading(false);
        }
      }
    };

    loadStores();
  }, [userInfo, setLoading]);

  // Cargar departamentos cuando se selecciona una tienda
  useEffect(() => {
    const loadDepartments = async () => {
      if (selectedStore && userInfo?.number_document) {
        try {
          setLoading(true);
          const data = await api.get(`/users/${userInfo.number_document}/stores/${selectedStore}/departments`);
          setDepartments(data);
          setLoading(false);
        } catch (error) {
          console.error("Error loading departments:", error);
          setError("Error al cargar los departamentos");
          setLoading(false);
        }
      }
    };

    loadDepartments();
  }, [selectedStore, userInfo, setLoading]);

  // Manejar cambio de tienda
  const handleStoreChange = (e) => {
    const storeId = e.target.value;
    setSelectedStore(storeId);
    setSelectedDepartment(null); // Resetear departamento cuando cambia la tienda
  };

  // Manejar cambio de departamento
  const handleDepartmentChange = (e) => {
    const departmentId = e.target.value;
    setSelectedDepartment(departmentId);
  };

  // Manejar cambio de mes
  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value));
  };

  // Obtener lista de meses
  const getMonths = () => {
    const months = [];
    const currentMonth = new Date().getMonth() + 1;
    
    for (let i = 1; i <= currentMonth; i++) {
      const date = new Date(2025, i - 1, 1);
      const monthName = date.toLocaleString('es', { month: 'long' });
      months.push({ value: i, label: monthName.charAt(0).toUpperCase() + monthName.slice(1) });
    }
    
    return months;
  };

  // Enviar selección cuando cambian los valores
  useEffect(() => {
    if (selectedStore && selectedDepartment && selectedMonth) {
      onSelection({
        store: parseInt(selectedStore),
        department: parseInt(selectedDepartment),
        month: selectedMonth.toString()
      });
    }
  }, [selectedStore, selectedDepartment, selectedMonth, onSelection]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Selección de tienda */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="store">
            Tienda
          </label>
          <select
            id="store"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedStore || ''}
            onChange={handleStoreChange}
            disabled={loading || !stores.length}
          >
            <option value="">Seleccione una tienda</option>
            {stores.map(store => (
              <option key={store.id_store} value={store.id_store}>
                {store.name_store}
              </option>
            ))}
          </select>
        </div>
        
        {/* Selección de departamento */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="department">
            Departamento
          </label>
          <select
            id="department"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedDepartment || ''}
            onChange={handleDepartmentChange}
            disabled={loading || !departments.length || !selectedStore}
          >
            <option value="">Seleccione un departamento</option>
            {departments.map(department => (
              <option key={department.id_department} value={department.id_department}>
                {department.name_department}
              </option>
            ))}
          </select>
        </div>
        
        {/* Selección de mes */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="month">
            Mes
          </label>
          <select
            id="month"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedMonth}
            onChange={handleMonthChange}
            disabled={loading}
          >
            {getMonths().map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
StoreDepartmentSelector.propTypes = {
  onSelection: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  setLoading: PropTypes.func.isRequired,
};

export default StoreDepartmentSelector;