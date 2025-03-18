import { useState, useEffect } from "react";
import "./TurnsReport.css";
import Breadcrumb from "../components/buttons/Breadcrumb";
import Dropdown from "../components/buttons/Dropdown";
import { api } from "../utils/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { pdfService } from "../services/PDFService";
import { ChevronDown } from "lucide-react";

const TurnsReport = () => {
  const [stores, setStores] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [showStoresDropdown, setShowStoresDropdown] = useState(false);
  const [showDepartmentsDropdown, setShowDepartmentsDropdown] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shiftsData, setShiftsData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [reportGenerated, setReportGenerated] = useState(false);
  
  // Obtener datos del usuario al cargar el componente
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUserInfo(storedUser);
  }, []);

  // Cargar tiendas disponibles
  useEffect(() => {
    const loadStores = async () => {
      if (userInfo) {
        try {
          setLoading(true);
          const data = await api.get(`/users/${userInfo.number_document}/stores`);
          
          // Filtrar tiendas según los permisos del usuario si es necesario
          if (userInfo.stores && userInfo.stores.length > 0) {
            const filteredStores = data.filter(store => 
              userInfo.stores.includes(store.id_store)
            );
            setStores(filteredStores);
          } else {
            setStores(data);
          }
          
          // Si el usuario es jefe y solo tiene una tienda/departamento, cargar directamente
          if (userInfo.roles.includes("Jefe") && data.length === 1) {
            handleStoreSelect(data[0]);
          }
        } catch (error) {
          console.error("Error loading stores:", error);
          setError("Error al cargar tiendas");
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
    setShiftsData(null);
    setError(null);
    setReportGenerated(false);
    setSelectedMonth("");
    setShowStoresDropdown(false);

    try {
      setLoading(true);
      const data = await api.get(`/users/${userInfo.number_document}/stores/${store.id_store}/departments`);
      setDepartments(data);
      
      // Si el usuario es jefe y solo tiene un departamento, cargar directamente
      if (userInfo.roles.includes("Jefe") && data.length === 1) {
        handleDepartmentSelect(data[0]);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      setError("Error al cargar departamentos");
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentSelect = (department) => {
    setSelectedDepartment(department);
    setShowDepartmentsDropdown(false);
    setShiftsData(null);
    setReportGenerated(false);
    setSelectedMonth("");
    setError(null);
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setShiftsData(null);
    setReportGenerated(false);
    setError(null);
  };

  const handleGenerateReport = async () => {
    if (!selectedStore || !selectedDepartment || !selectedMonth) {
      setError("Por favor, selecciona una tienda, departamento y mes");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Formatear el mes como string con cero a la izquierda si es necesario
      const formattedMonth = parseInt(selectedMonth) < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
      
      const response = await api.post('/employeeshift/by-employee-list', {
        store: selectedStore.id_store,
        department: selectedDepartment.id_department,
        month: formattedMonth
      });
      
      // DEBUG: Confirmar que se recibieron datos
      console.log("Respuesta recibida:", response);
      
      // Verificar si hay error en la respuesta o está vacía
      if (!response || 
          response.status === 404 || 
          (Array.isArray(response) && response.length === 0)) {
        setError("No se encontraron empleados con los criterios especificados");
        setShiftsData([]);
        return;
      }
      
      // Si llegamos aquí, la respuesta es válida
      setShiftsData(response);
      
      // IMPORTANTE: Establecer reportGenerated a true DESPUÉS de setShiftsData
      setReportGenerated(true);
      console.log("Reporte generado:", true, "Datos de turnos:", response);
      
    } catch (error) {
      console.error("Error loading shifts data:", error);
      
      // Verificar si es un error 404 con mensaje específico
      if (error.response && error.response.status === 404) {
        setError("No se encontraron empleados con los criterios especificados");
      } else {
        setError("Error al cargar los datos de turnos");
      }
      
      setShiftsData([]);
    } finally {
      setLoading(false);
    }
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

  function getMonthName(month) {
    try {
      // Asegúrate de que month sea un número entero entre 1-12
      const monthNumber = parseInt(month, 10);
      if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
        return "Mes inválido";
      }
      
      const date = new Date();
      date.setDate(1);
      date.setMonth(monthNumber - 1);
      return format(date, 'MMMM', { locale: es });
    } catch (error) {
      console.error("Error en getMonthName:", error);
      return "Mes desconocido";
    }
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

  // Adaptar los datos para los componentes Dropdown
  const storeItems = stores.map(store => ({
    id: store.id_store,
    name: store.name_store,
    ...store
  }));

  const departmentItems = departments.map(dept => ({
    id: dept.id_store_dep || dept.id_department,
    name: dept.name_department,
    ...dept
  }));

  // Crear meses disponibles
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const availableMonths = Array.from({ length: currentMonth }, (_, i) => {
    const monthNumber = i + 1;
    const date = new Date();
    date.setDate(1);
    date.setMonth(i);
    return {
      value: monthNumber,
      label: format(date, 'MMMM', { locale: es })
    };
  });

  // Función para generar y descargar el PDF
  const generatePDF = async () => {
    if (!shiftsData || (Array.isArray(shiftsData) && shiftsData.length === 0)) {
      setError("No hay datos de turnos para generar el reporte");
      return;
    }
    
    try {
      setGenerating(true);
      setError(null);
      
      // Usar el servicio para generar el PDF
      const pdfBytes = await pdfService.generateEmployeeShiftsPDF(
        shiftsData, 
        selectedStore, 
        selectedDepartment, 
        getMonthName(selectedMonth)
      );
      
      // Crear un blob y un enlace para descargar
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Turnos_${selectedStore.name_store}_${selectedDepartment.name_department}_${getMonthName(selectedMonth)}.pdf`;
      link.click();
      
      // Limpiar el objeto URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Ocurrió un error al generar el PDF");
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setReportGenerated(false);
    setSelectedMonth("");
    setShiftsData(null);
    setError(null);
  };

  // Verificar si tenemos datos para mostrar
  const hasData = shiftsData && (
    (Array.isArray(shiftsData) && shiftsData.length > 0) || 
    (!Array.isArray(shiftsData) && Object.keys(shiftsData).length > 0)
  );

  return (
    <div className="turns-report-page">
      {/* Breadcrumb reutilizable */}
      <Breadcrumb 
        items={breadcrumbItems}
        onItemClick={handleBreadcrumbClick}
      />

      {/* Contenido principal */}
      <div className="turns-report-container">
        <div className="report-card">
          <h1 className="turns-report-title">Reporte de Turnos</h1>
          
          {/* Mensaje de selección o carga */}
          {loading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Cargando información...</p>
            </div>
          ) : !selectedStore || !selectedDepartment ? (
            <div className="selection-prompt">
              {!selectedStore ? 
                <p>Por favor selecciona una tienda</p> : 
                <p>Por favor selecciona un departamento</p>
              }
            </div>
          ) : null}
          
          {/* Selector de mes - visible solo cuando se ha seleccionado tienda y departamento y no hay reporte generado */}
          {selectedStore && selectedDepartment && !reportGenerated && (
            <div className="form-group">
              <label className="form-label">
                Selecciona el mes para generar el reporte:
              </label>
              <div className="select-container">
                <select
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className="select-input"
                  disabled={loading}
                >
                  <option value="">Seleccionar mes</option>
                  {availableMonths.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <div className="select-arrow">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          )}
          
          {/* Mensaje de error */}
          {error && (
            <div className="error-message" role="alert">
              <p>{error}</p>
            </div>
          )}
          
          {/* Botones de acción */}
          {selectedStore && selectedDepartment && !reportGenerated ? (
            <button
              onClick={handleGenerateReport}
              disabled={loading || !selectedMonth}
              className={`btn btn-primary ${loading || !selectedMonth ? 'disabled' : ''}`}
            >
              {loading ? 'Generando...' : 'Generar Reporte'}
            </button>
          ) : null}
          
          {/* Mostrar reporte generado */}
          {reportGenerated && hasData && (
            <div className="text-center">
              <div className="success-message" role="alert">
                <p className="font-bold">¡Tu reporte de turnos está listo!</p>
                <p>Has seleccionado los siguientes criterios:</p>
                <p>Tienda: <strong>{selectedStore.name_store}</strong></p>
                <p>Departamento: <strong>{selectedDepartment.name_department}</strong></p>
                <p>Mes: <strong>{getMonthName(parseInt(selectedMonth))}</strong></p>
                <p>Haz clic en el botón para descargar el archivo PDF.</p>
              </div>
              
              <button
                onClick={generatePDF}
                className="btn btn-success"
                disabled={generating}
              >
                <svg className="download-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                {generating ? 'Generando PDF...' : 'Descargar PDF'}
              </button>
              
              <button
                onClick={handleReset}
                className="btn-link"
              >
                Generar otro reporte
              </button>
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

export default TurnsReport;