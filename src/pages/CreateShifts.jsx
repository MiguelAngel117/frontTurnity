import { useState, useEffect } from "react";
import "./CreateShifts.css";
import Breadcrumb from "../components/buttons/Breadcrumb";
import Dropdown from "../components/buttons/Dropdown";
import EmployeeList from "../components/buttons/EmployeeList";
import ShiftMatrix from "../components/templates/ShiftMatrix";
import { api } from "../utils/api";

const CreateShifts = () => {
  const [stores, setStores] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showStoresDropdown, setShowStoresDropdown] = useState(false);
  const [showDepartmentsDropdown, setShowDepartmentsDropdown] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [selectedEmployeesData, setSelectedEmployeesData] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  // Obtener datos del usuario al cargar el componente
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUserInfo(storedUser);
  }, []);

  // Cargar tiendas disponibles
  useEffect(() => {
    const loadStores = async () => {
      if (userInfo) {
        setLoading(true);
        try {
          const data = await api.get(`/users/${userInfo.number_document}/stores`);
          
          // Filtrar tiendas según los permisos del usuario si es necesario
          let filteredStores = [];
          if (userInfo.stores && userInfo.stores.length > 0) {
            filteredStores = data.filter(store => 
              userInfo.stores.includes(store.id_store)
            );
          } else {
            filteredStores = data;
          }
          
          setStores(filteredStores);
          
          // Seleccionar automáticamente si solo hay una tienda
          if (filteredStores.length === 1) {
            handleStoreSelect(filteredStores[0]);
          }
        } catch (error) {
          console.error("Error loading stores:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadStores();
  }, [userInfo]);

  const handleStoreSelect = async (store) => {
    setSelectedStore(store);
    setSelectedDepartment(null);
    setEmployees([]);
    setSelectedEmployees([]);
    setShowStoresDropdown(false);
    setShowMatrix(false);

    try {
      setLoading(true);
      const data = await api.get(`/users/${userInfo.number_document}/stores/${store.id_store}/departments`);
      setDepartments(data);
      
      // Seleccionar automáticamente si solo hay un departamento
      if (data.length === 1) {
        handleDepartmentSelect(data[0]);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentSelect = async (department) => {
    setSelectedDepartment(department);
    setShowDepartmentsDropdown(false);
    setShowMatrix(false);
    
    if (selectedStore && department) {
      setLoading(true);
      try {
        const data = await api.get(
          `/employeeDep/Store/${selectedStore.id_store}/department/${department.id_department}`
        );
        
        // Convertir number_document a string para evitar problemas con PropTypes
        const formattedData = data.map(emp => ({
          ...emp,
          number_document: String(emp.number_document)
        }));
        
        setEmployees(formattedData);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Manejar la selección de empleados
  const handleEmployeeSelect = (selectedEmployeeIds) => {
    setSelectedEmployees(selectedEmployeeIds);
  };

  // Manejar el botón de continuar
  const handleContinue = () => {
    // Filtrar los empleados seleccionados para obtener sus datos completos
    const employeesData = employees.filter(emp => 
      selectedEmployees.includes(emp.number_document)
    );
    setSelectedEmployeesData(employeesData);
    setShowMatrix(true);
  };

  // Manejar el botón para volver a la selección de empleados
  const handleBackToSelection = () => {
    setShowMatrix(false);
  };

  // Preparar los items para el Breadcrumb
  const breadcrumbItems = [
    {
      id: "store",
      label: selectedStore ? selectedStore.name_store : "Tienda",
      type: "store",
    },
  ];

  if (selectedStore) {
    breadcrumbItems.push({
      id: "department",
      label: selectedDepartment ? selectedDepartment.name_department : "Departamento",
      type: "department",
    });
  }

  const handleBreadcrumbClick = (item, index) => {
    if (index === 0) {
      // Clic en Tienda
      setShowStoresDropdown(true);
    } else if (index === 1 && selectedStore) {
      // Clic en Departamento
      setShowDepartmentsDropdown(true);
    } else if (index === 2 && showMatrix) {
      // No hacer nada, ya estamos en la matriz
    }
  };

  // Adaptar los datos para el componente Dropdown
  const storeItems = stores.map(store => ({
    id: store.id_store,
    name: store.name_store,
    ...store
  }));

  const departmentItems = departments.map(dept => ({
    id: dept.id_store_dep,
    name: dept.name_department,
    ...dept
  }));

  return (
    <div className="create-shifts-page">
      {/* Breadcrumb reutilizable */}
      <Breadcrumb 
        items={breadcrumbItems}
        onItemClick={handleBreadcrumbClick}
      />
  
      {/* Contenido principal */}
      <div className="create-shifts-container">
        <div className="shifts-card">
          <h1 className="create-shifts-title">Crear Turnos</h1>
          
          {/* Mensaje de selección o carga */}
          {loading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Cargando información...</p>
            </div>
          ) : (!selectedStore || !selectedDepartment) && !showMatrix ? (
            <div className="selection-prompt">
              {!selectedStore ? 
                <p>Por favor selecciona una tienda</p> : 
                <p>Por favor selecciona un departamento</p>
              }
            </div>
          ) : null}
          
          {/* Mostrar EmployeeList cuando se ha seleccionado tienda y departamento */}
          {selectedStore && selectedDepartment && !showMatrix && (
            <div className="employees-selection-container">
              {loading ? (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  <p>Cargando empleados...</p>
                </div>
              ) : (
                <>
                  <EmployeeList 
                    employees={employees} 
                    onEmployeeSelect={handleEmployeeSelect}
                    onContinue={handleContinue}
                    selectedEmployees={selectedEmployees}
                  />
                </>
              )}
            </div>
          )}
          
          {/* Mostrar la matriz de turnos */}
          {showMatrix && (
            <div className="matrix-section">
              <div className="matrix-header">
                <button 
                  className="btn-link with-icon"
                  onClick={handleBackToSelection}
                >
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Volver a selección
                </button>
              </div>
              <ShiftMatrix 
                employees={selectedEmployeesData}
                selectedStore={selectedStore}
                selectedDepartment={selectedDepartment}
              />
            </div>
          )}
        </div>
      </div>
  
      {/* Dropdowns flotantes */}
      <Dropdown
        title="Tiendas"
        items={storeItems}
        onSelect={handleStoreSelect}
        onClose={() => setShowStoresDropdown(false)}
        isOpen={showStoresDropdown}
        searchable={true}
      />
  
      <Dropdown
        title="Departamentos"
        items={departmentItems}
        onSelect={handleDepartmentSelect}
        onClose={() => setShowDepartmentsDropdown(false)}
        isOpen={showDepartmentsDropdown}
        searchable={true}
      />
    </div>
  );
};

export default CreateShifts;