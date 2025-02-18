import { useState, useEffect } from "react";
import "./CreateShifts.css";
import Breadcrumb from "../components/buttons/Breadcrumb";
import Dropdown from "../components/buttons/Dropdown";

const CreateShifts = () => {
  const [stores, setStores] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showStoresDropdown, setShowStoresDropdown] = useState(false);
  const [showDepartmentsDropdown, setShowDepartmentsDropdown] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3000/turnity/stores")
      .then((res) => res.json())
      .then((data) => setStores(data))
      .catch((error) => console.error("Error fetching stores:", error));
  }, []);

  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    setSelectedDepartment(null);
    setShowStoresDropdown(false);

    fetch(`http://localhost:3000/turnity/departmentStore/store/${store.id_store}`)
      .then((res) => res.json())
      .then((data) => setDepartments(data))
      .catch((error) => console.error("Error fetching departments:", error));
  };

  const handleDepartmentSelect = (department) => {
    setSelectedDepartment(department);
    setShowDepartmentsDropdown(false);
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
    <div className="page">
      {/* Breadcrumb reutilizable */}
      <Breadcrumb 
        items={breadcrumbItems}
        onItemClick={handleBreadcrumbClick}
      />

      {/* Contenido de la página */}
      <div className="page-content">
        {selectedStore && selectedDepartment ? (
          <div className="shifts-container">
            {/* Aquí iría el contenido para crear turnos */}
            <h2>Crear Turnos</h2>
            <p>Tienda: {selectedStore.name_store}</p>
            <p>Departamento: {selectedDepartment.name_department}</p>
            {/* Resto del formulario para crear turnos */}
          </div>
        ) : (
          <div className="selection-prompt">
            {!selectedStore ? 
              <p>Selecciona una tienda para continuar</p> : 
              <p>Selecciona un departamento para continuar</p>
            }
          </div>
        )}
      </div>

      {/* Dropdowns flotantes */}
      <Dropdown
        title="Tiendas"
        items={storeItems}
        onSelect={handleStoreSelect}
        onClose={() => setShowStoresDropdown(false)}
        isOpen={showStoresDropdown}
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