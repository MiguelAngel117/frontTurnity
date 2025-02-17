import { useState, useEffect } from "react";
import "./CreateShifts.css";

const CreateShifts = () => {
  const [stores, setStores] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [searchStore, setSearchStore] = useState("");
  const [searchDepartment, setSearchDepartment] = useState("");
  const [showStores, setShowStores] = useState(false);
  const [showDepartments, setShowDepartments] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3000/turnity/stores")
      .then((res) => res.json())
      .then((data) => setStores(data))
      .catch((error) => console.error("Error fetching stores:", error));
  }, []);

  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    setSelectedDepartment(null);
    setSearchStore("");
    setShowStores(false);

    fetch(`http://localhost:3000/turnity/departmentStore/store/${store.id_store}`)
      .then((res) => res.json())
      .then((data) => setDepartments(data))
      .catch((error) => console.error("Error fetching departments:", error));
  };

  const handleDepartmentSelect = (department) => {
    setSelectedDepartment(department);
    setSearchDepartment("");
    setShowDepartments(false);
  };

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span
          className="breadcrumb-item"
          onClick={() => {
            setSelectedStore(null);
            setSelectedDepartment(null);
            setShowStores(true);
          }}
        >
          {selectedStore ? selectedStore.name_store : "Tienda"}
        </span>
        {" > "}
        {selectedStore && (
          <span
            className="breadcrumb-item"
            onClick={() => {
              setSelectedDepartment(null);
              setShowDepartments(true);
            }}
          >
            {selectedDepartment ? selectedDepartment.name_department : "Departamento"}
          </span>
        )}
      </div>

      {/* Dropdown para seleccionar tienda */}
      {showStores && (
        <div className="dropdown">
          <input
            type="text"
            placeholder="Buscar Tienda..."
            value={searchStore}
            onChange={(e) => setSearchStore(e.target.value)}
          />
          <div className="dropdown-menu">
            {stores
              .filter((store) =>
                store.name_store.toLowerCase().includes(searchStore.toLowerCase())
              )
              .map((store) => (
                <div
                  key={store.id_store}
                  className="dropdown-item"
                  onClick={() => handleStoreSelect(store)}
                >
                  {store.name_store}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Dropdown para seleccionar departamento */}
      {showDepartments && selectedStore && (
        <div className="dropdown">
          <input
            type="text"
            placeholder="Buscar Departamento..."
            value={searchDepartment}
            onChange={(e) => setSearchDepartment(e.target.value)}
          />
          <div className="dropdown-menu">
            {departments
              .filter((dept) =>
                dept.name_department.toLowerCase().includes(searchDepartment.toLowerCase())
              )
              .map((dept) => (
                <div
                  key={dept.id_store_dep}
                  className="dropdown-item"
                  onClick={() => handleDepartmentSelect(dept)}
                >
                  {dept.name_department}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateShifts;
