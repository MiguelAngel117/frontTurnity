import { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import "./ShiftMatrix.css";
import ShiftSelector from "../buttons/ShiftSelector";
import IncidentModal from "../modals/IncidentModal";
import { api } from "../../utils/api";

const ShiftMatrix = ({ employees, selectedStore, selectedDepartment }) => {
  const [weeks, setWeeks] = useState([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [displayMonth, setDisplayMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  // Estado para el selector de turnos
  const [shiftSelectorOpen, setShiftSelectorOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState({
    employeeId: null,
    date: null,
    employeeData: null
  });
  // Estado para almacenar los turnos asignados
  const [assignedShifts, setAssignedShifts] = useState({});
  // Estado para manejar la creación de turnos
  const [creatingShifts, setCreatingShifts] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createPass, setCreatePass] = useState(false);
  const [createError, setCreateError] = useState(null);
  // Estado para almacenar los datos de turnos existentes
  const [employeeShiftsData, setEmployeeShiftsData] = useState([]);
  // Estado para indicar si estamos cargando los turnos existentes
  const [loadingExistingShifts, setLoadingExistingShifts] = useState(false);
  const [incidentsModalOpen, setIncidentsModalOpen] = useState(false);
  const [incidents, setIncidents] = useState([]);

  // Ref para el scrolling
  const matrixRef = useRef(null);

  const formatDateForAPI = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  
  // Carga las semanas del mes actual
  const loadWeeks = async (date) => {
    setLoading(true);
    try {
      const result = await api.post('/employeeshift/generate-weeks', {
        date: formatDateForAPI(date)
      });
      
      if (result.success && result.data.weeks) {
        console.log("Weeks loaded:", result.data.weeks.weeks);
        setWeeks(result.data.weeks.weeks);
        setSelectedWeekIndex(0); // Seleccionar la primera semana por defecto
        
        // Una vez cargadas las semanas, cargar los turnos existentes
        loadExistingShifts(result.data.weeks.weeks);
      } else {
        console.error("Error loading weeks:", result.message);
      }
    } catch (error) {
      console.error("Error fetching weeks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar los turnos existentes
  const loadExistingShifts = async (weeksData) => {
    if (!employees || employees.length === 0 || !weeksData || weeksData.length === 0) {
      return;
    }
  
    setLoadingExistingShifts(true);
    
    try {
      // Obtener las fechas de inicio y fin basadas en las semanas
      const startDate = weeksData[0].start;
      const endDate = weeksData[weeksData.length - 1].end;
      
      // Preparar el array de IDs de empleados
      const employeeIds = employees.map(emp => emp.number_document);
      
      const result = await api.post('/employeeshift/by-employee-list/', {
        employees: employeeIds,
        startDate: startDate,
        endDate: endDate,
        numWeeks: weeksData.length
      });
      
      if (result.employeeShifts) {
        console.log("Existing shifts loaded:", result.employeeShifts);
        setEmployeeShiftsData(result.employeeShifts);
        
        // Procesar los turnos y agregarlos al estado assignedShifts
        const shiftsMap = {};
        
        result.employeeShifts.forEach(employeeData => {
          const employeeId = employeeData.employee.number_document;
          
          employeeData.weeklyShifts.forEach(weekData => {
            if (weekData.shifts && Array.isArray(weekData.shifts)) {
              weekData.shifts.forEach(shift => {
                const key = `${employeeId}_${shift.shift_date}`;
                
                // Determinar el tipo de turno (especial o normal)
                if (["CUMPLEAÑOS", "VACACIONES", "INCAPACIDAD", "JURADO VOT", "DIA_FAMILIA", "LICENCIA", "DIA_DISFRUTE"].includes(shift.turn)) {
                  shiftsMap[key] = {
                    employeeId: employeeId,
                    date: new Date(shift.shift_date),
                    hour: shift.turn,
                    deleted: false
                  };
                } else {
                  // Para turnos normales
                  shiftsMap[key] = {
                    employeeId: employeeId,
                    date: new Date(shift.shift_date),
                    hour: shift.hours.toString(),
                    shift: {
                      id: shift.turn,
                      code_shift: shift.turn,
                      initial_hour: shift.initial_hour,
                      break: shift.break
                    },
                    deleted: false
                  };
                }
              });
            }
          });
        });
        
        setAssignedShifts(shiftsMap);
      } else {
        console.error("Error loading existing shifts:", result.message || "No data received");
      }
    } catch (error) {
      console.error("Error fetching existing shifts:", error);
    } finally {
      setLoadingExistingShifts(false);
    }
  };

  // Carga las semanas al montar el componente
  useEffect(() => {
    loadWeeks(currentDate);
  }, []);

  // Actualiza el mes mostrado cuando cambia la fecha
  useEffect(() => {
    setDisplayMonth(currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }));
  }, [currentDate]);

  // Maneja el cambio de mes
  const handleMonthChange = (increment) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    newDate.setDate(15);
    setCurrentDate(newDate);
    loadWeeks(newDate);
  };
  
  const getWeekDays = () => {
    if (!weeks[selectedWeekIndex]) return [];
    
    const startDate = new Date(weeks[selectedWeekIndex].start + "T00:00:00"); // Asegurar la zona horaria
    const endDate = new Date(weeks[selectedWeekIndex].end + "T00:00:00");
    const days = [];
    
    let currentDay = new Date(startDate);
    while (currentDay <= endDate) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    return days;
  };

  // Manejar clic en una celda de turno
  const handleShiftCellClick = (employeeId, date, employeeData) => {
    // Cerrar primero si estaba abierto para asegurar que se reinicien los estados en ShiftSelector
    if (shiftSelectorOpen) {
      setShiftSelectorOpen(false);
      
      // Usar setTimeout para asegurar que el componente se cierre completamente antes de volver a abrirlo
      setTimeout(() => {
        setSelectedCell({
          employeeId,
          date,
          employeeData
        });
        setShiftSelectorOpen(true);
      }, 50);
    } else {
      setSelectedCell({
        employeeId,
        date,
        employeeData
      });
      setShiftSelectorOpen(true);
    }
  };

  // Manejar guardar turno
  // Manejar guardar turno
const handleSaveShift = (shiftData) => {
  console.log("Guardar turno:", shiftData);
  
  const key = `${shiftData.employeeId}_${formatDateForAPI(shiftData.date)}`;
  
  if (shiftData.deleted) {
    setAssignedShifts(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  } else {
    // Buscar la información semanal correcta para este empleado
    const employee = getEmployeesData().find(emp => emp.number_document === shiftData.employeeId);
    
    // Encontrar la semana correcta para la fecha actual
    let weekIndex = -1;
    for (let i = 0; i < weeks.length; i++) {
      const weekStart = new Date(weeks[i].start + "T00:00:00");
      const weekEnd = new Date(weeks[i].end + "T00:00:00");
      
      if (shiftData.date >= weekStart && shiftData.date <= weekEnd) {
        weekIndex = i;
        break;
      }
    }
    
    // Obtener la jornada específica para esta semana si está disponible
    let workingDay = employee?.working_day; // Jornada general por defecto
    
    if (employee?.weeklyShifts && weekIndex >= 0) {
      const weeklyData = employee.weeklyShifts.find(w => w.week === weekIndex + 1);
      if (weeklyData && weeklyData.working_day) {
        workingDay = weeklyData.working_day;
      }
    }
    
    // Asegurarse de que tengamos las horas para el contador
    const hoursValue = shiftData.hour && !isNaN(parseInt(shiftData.hour)) 
      ? parseInt(shiftData.hour) 
      : determineHoursForSpecialShift(shiftData.hour, workingDay);
    
    setAssignedShifts(prev => ({
      ...prev,
      [key]: {
        ...shiftData,
        hours: hoursValue // Añadir explícitamente las horas para cálculos posteriores
      }
    }));
  }
  
  setShiftSelectorOpen(false);
};

  const calculateTotalHours = (employeeId) => {
    if (!weeks[selectedWeekIndex]) return 0;
    
    const weekDays = getWeekDays();
    let totalHours = 0;
    
    weekDays.forEach(day => {
      const key = `${employeeId}_${formatDateForAPI(day)}`;
      const shift = assignedShifts[key];
      
      if (shift) {
        // Para turnos normales con horas numéricas
        if (shift.hour && !isNaN(parseInt(shift.hour))) {
          totalHours += parseInt(shift.hour);
        } 
        // Para turnos con horas explícitas
        else if (shift.hours && !isNaN(parseInt(shift.hours))) {
          totalHours += parseInt(shift.hours);
        }
        // Para turnos especiales
        else if (["CUMPLEAÑOS", "VACACIONES", "INCAPACIDAD", "JURADO VOT", "DIA_FAMILIA", "LICENCIA", "DIA_DISFRUTE"].includes(shift.hour)) {
          const employee = getEmployeesData().find(emp => emp.number_document === employeeId);
          if (employee) {
            totalHours += determineHoursForSpecialShift(shift.hour, employee.working_day);
          }
        }
      }
    });
    
    return totalHours;
  };

  // Obtener información del turno asignado
  const getAssignedShiftInfo = (employeeId, date) => {
    const key = `${employeeId}_${formatDateForAPI(date)}`;
    const shift = assignedShifts[key];
    
    if (!shift) return null;
    
    // Si el turno es "X" (descanso), retornar null para que se muestre como "Libre"
    if (shift.shift && shift.shift.id === "X") {
      return null;
    }
    
    // Determinar qué mostrar basado en el tipo de turno
    if (["CUMPLEAÑOS", "VACACIONES", "INCAPACIDAD", "JURADO VOT", "DIA_FAMILIA", "LICENCIA", "DIA_DISFRUTE"].includes(shift.hour)) {
      return {
        label: shift.hour,
        className: "special-shift"
      };
    }
    
    if (shift.shift) {
      return {
        label: `${shift.hour}Hras (${shift.shift.initial_hour.slice(0, 5)})`,
        className: "assigned-shift"
      };
    }
    
    return null;
  };

  // Pasar el turno existente al selector
  const getExistingShift = (employeeId, date) => {
    if (!date) return null;
    const key = `${employeeId}_${formatDateForAPI(date)}`;
    const shift = assignedShifts[key];
    
    // Si no hay turno asignado o el turno está marcado como "X" (descanso/libre),
    // devolver null para que se comporte como una celda nueva
    if (!shift || (shift.shift && shift.shift.id === "X")) {
      return null;
    }
    
    // Asegurarse de incluir correctamente la información del descanso
    if (shift.shift && shift.shift.break) {
      return {
        ...shift,
        break: shift.shift.break  // Asegurarse de que el break está disponible en el nivel superior
      };
    }
    
    return shift;
  };
  //función para determinar horas para turnos especiales
  const determineHoursForSpecialShift = (shiftType, workingDay) => {
    if (["CUMPLEAÑOS", "VACACIONES", "INCAPACIDAD", "JURADO VOT", "DIA_FAMILIA", "LICENCIA", "DIA_DISFRUTE"].includes(shiftType)) {
      // Convertir workingDay a número para asegurar comparación correcta
      const workingDayNum = parseInt(workingDay);
      console.log("Working day number:", workingDay);
      if (workingDayNum === 36) {
        return 6;
      } else {
        return 8; // Para jornadas de 46, 24, y 16 horas
      }
    }
    return 0; // Valor por defecto
  };

  // Función para preparar los datos para el backend
  const prepareDataForBackend = () => {
    // Validación inicial
    if (!selectedStore?.id_store || !selectedDepartment?.id_department) {
      return { error: "Seleccione tienda y departamento para continuar" };
    }
  
    if (!weeks?.length) {
      return { error: "No hay semanas disponibles" };
    }
  
    // Datos del rango de fechas
    const firstWeekStart = new Date(weeks[0].start + "T00:00:00");
    const lastWeekEnd = new Date(weeks[weeks.length - 1].end + "T00:00:00");
    const numWeeks = weeks.length;
  
    // Determinar empleados a procesar
    const employeesToProcess = employeeShiftsData.length > 0 
      ? employeeShiftsData
      : employees.map(emp => ({
          employee: {
            number_document: emp.number_document,
            working_day: emp.working_day
          },
          weeklyShifts: []
        }));
  
    // Organizar datos por empleado de manera más eficiente
    const employeesWithShifts = employeesToProcess.map(employeeData => {
      const employee = employeeData.employee;
      
      // Inicializar la estructura de semanas
      const weeklyShifts = weeks.map((week, weekIndex) => {
        const weekNumber = weekIndex + 1;
        const weekInfo = employeeData.weeklyShifts?.find(w => w.week === weekNumber);
        const workingDay = weekInfo?.working_day || employee.working_day;
        
        return {
          week: weekNumber,
          working_day: workingDay,
          shifts: []
        };
      });
      
      // Recorrer todas las fechas y asignar turnos
      let currentDate = new Date(firstWeekStart);
      while (currentDate <= lastWeekEnd) {
        const dateStr = formatDateForAPI(currentDate);
        
        // Encontrar la semana correspondiente
        let weekIndex = -1;
        for (let i = 0; i < weeks.length; i++) {
          const weekStart = new Date(weeks[i].start + "T00:00:00");
          const weekEnd = new Date(weeks[i].end + "T00:00:00");
          
          if (currentDate >= weekStart && currentDate <= weekEnd) {
            weekIndex = i;
            break;
          }
        }
        
        if (weekIndex >= 0) {
          // Buscar el turno asignado
          const key = `${employee.number_document}_${dateStr}`;
          const assignedShift = assignedShifts[key];
          
          // Shift para enviar al backend
          let shiftData = {
            shift_date: dateStr,
            turn: "X",
            hours: 0,
            break: "01:00:00",
            initial_hour: "00:00:00"
          };
          
          // Si hay un turno asignado, usar sus datos
          if (assignedShift) {
            if (["CUMPLEAÑOS", "VACACIONES", "INCAPACIDAD", "JURADO VOT", "DIA_FAMILIA", "LICENCIA", "DIA_DISFRUTE"].includes(assignedShift.hour)) {
              // Para turnos especiales
              const hoursValue = determineHoursForSpecialShift(
                assignedShift.hour, 
                employee.working_day
              );
              
              shiftData = {
                shift_date: dateStr,
                turn: assignedShift.hour,
                hours: hoursValue,
                break: "01:00:00",
                initial_hour: "00:00:00",
                end_hour: "00:00:00"
              };
            } else if (assignedShift.shift && assignedShift.shift.id !== "X") {
              // Para turnos normales
              shiftData = {
                shift_date: dateStr,
                turn: assignedShift.shift.code_shift || assignedShift.shift.id,
                hours: parseInt(assignedShift.hour) || 0,
                break: assignedShift.shift.break || "01:00:00",
                initial_hour: assignedShift.shift.initial_hour || "00:00:00",
                end_hour: assignedShift.shift.end_hour || "00:00:00"
              };
            }
          }
          
          // Agregar el turno a la semana correspondiente
          weeklyShifts[weekIndex].shifts.push(shiftData);
        }
        
        // Avanzar al siguiente día
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return {
        employee: {
          number_document: employee.number_document,
          working_day: employee.working_day
        },
        weeklyShifts
      };
    });
    
    return {
      data: {
        storeId: selectedStore.id_store,
        departmentId: selectedDepartment.id_department,
        numWeeks: numWeeks,
        employeeShifts: employeesWithShifts
      }
    };
  };

  const handleCreateShifts = async () => {
    const { data, error } = prepareDataForBackend();
    
    if (error) {
      setCreateError(error);
      return;
    }
    
    // Reiniciar el estado de incidentes al iniciar una nueva operación
    setIncidents([]);
    setIncidentsModalOpen(false);
    
    setCreatingShifts(true);
    setCreateError(null);
    setCreateSuccess(false);
    
    try {
      console.log("Enviando datos al backend:", data);
      
      const result = await api.post('/employeeshift/create', data);
      
      if (result.results.created > 0 || result.results.updated > 0) {
        setCreateSuccess(true);
        setCreatePass(false);
        console.log("Turnos creados exitosamente:", result);
      } else if (result.results.skipped > 0 && (result.results.created === 0 && result.results.updated === 0)) {
        setCreatePass(true);
        setCreateSuccess(false);
      } else {
        setCreatePass(false);
        console.error("Error creating shifts:", result);
        
        // Mostrar el modal de incidencias si hay errores en la respuesta
        if (result.errors && result.errors.length > 0) {
          setIncidents(result.errors);
          setIncidentsModalOpen(true);
        }
      }
    } catch (error) {
      setCreateError("Error de conexión al servidor");
      console.error("Error sending shifts to backend:", error);
    } finally {
      setCreatingShifts(false);
    }
  };

  // Obtener los datos de los empleados a mostrar
  const getEmployeesData = () => {
    // Si tenemos datos cargados de la API, usamos esos
    if (employeeShiftsData.length > 0) {
      return employeeShiftsData.map(empData => ({
        number_document: empData.employee.number_document,
        full_name: empData.employee.name,  // Usar el name que viene de la API
        working_day: empData.employee.working_day,
        position: empData.employee.position,  // Usar el position que viene de la API
        // Agregamos la información semanal para usar después
        weeklyShifts: empData.weeklyShifts
      }));
    }
    // Si no, usamos los datos de los props
    return employees;
  };

  const weekDays = getWeekDays();
  const displayEmployees = getEmployeesData();

  return (
    <div className="shift-matrix-container">
      <div className="month-navigation">
        <button onClick={() => handleMonthChange(-1)} className="month-nav-button">
          &lt; Mes Anterior
        </button>
        <span className="current-month">{displayMonth}</span>
        <button onClick={() => handleMonthChange(1)} className="month-nav-button">
          Mes Siguiente &gt;
        </button>
      </div>

      {loading || loadingExistingShifts ? (
        <div className="loading-indicator">
          {loading ? "Cargando semanas..." : "Cargando turnos existentes..."}
        </div>
      ) : (
        <>
          <div className="week-selector">
            {weeks.map((week, index) => {
              // Extraer el día de la fecha en formato YYYY-MM-DD (los últimos dos caracteres)
              const formattedStart = week.start.substring(8, 10); // Día de inicio
              const formattedEnd = week.end.substring(8, 10); // Día de fin

              return (
                <button 
                  key={index}
                  onClick={() => setSelectedWeekIndex(index)}
                  className={`week-button ${selectedWeekIndex === index ? 'selected' : ''}`}
                >
                  {formattedStart} - {formattedEnd}
                </button>
              );
            })}
          </div>

          <div className="shift-matrix" ref={matrixRef}>
            <div className="shift-matrix-grid">
              {/* Encabezado de días */}
              <div className="shift-matrix-row header-row">
                <div className="employee-info-cell">Colaboradores</div>
                {weekDays.map((day, index) => (
                  <div key={index} className="day-cell">
                    <div className="day-number">{day.getDate()}</div>
                    <div className="day-name">{day.toLocaleString('es-ES', { weekday: 'long' })}</div>
                  </div>
                ))}
                <div className="total-hours-cell header">Total Hrs</div>
              </div>

              <div className="scrollable-body">
                {/* Filas de empleados */}
                {displayEmployees.map((employee) => {
                // Obtener la jornada de la semana actual
                const currentWeekData = employee.weeklyShifts ? 
                  employee.weeklyShifts.find(week => week.week === selectedWeekIndex + 1) : null;
                
                // Usar la jornada semanal si está disponible, sino usar la general
                const weeklyWorkingDay = currentWeekData ? currentWeekData.working_day : employee.working_day;
                
                // Calcular el total de horas para este empleado en la semana actual
                const totalWeekHours = calculateTotalHours(employee.number_document);
                
                return (
                  <div key={employee.number_document} className="shift-matrix-row">
                    <div className="employee-info-cell">
                      <div className="employee-name">{employee.full_name || employee.name}</div>
                      <div className="employee-document">ID: {employee.number_document}</div>
                      <div className="employee-hours">{weeklyWorkingDay} hrs</div>
                      <div className="employee-position">{employee.position}</div>
                    </div>
                    
                    {/* Celdas para cada día */}
                    {weekDays.map((day, dayIndex) => {
                      const shiftInfo = getAssignedShiftInfo(employee.number_document, day);
                      
                      return (
                        <div 
                          key={dayIndex} 
                          className={`shift-cell ${shiftInfo ? shiftInfo.className : ''}`}
                          onClick={() => handleShiftCellClick(employee.number_document, day, employee)}
                        >
                          <span className="shift-status">
                            {shiftInfo ? shiftInfo.label : "Libre"}
                          </span>
                        </div>
                      );
                    })}
                    
                    {/* Nueva columna para el total de horas */}
                    <div className="total-hours-cell">
                      <div className="total-hours-value">
                        <strong>{totalWeekHours}</strong> hrs
                      </div>
                      {totalWeekHours < weeklyWorkingDay ? (
                        <div className="hours-warning">
                          Faltan hrs
                        </div>
                      ) : totalWeekHours > weeklyWorkingDay ? (
                        <div className="hours-warning">
                          Sobran hrs
                        </div>
                      ) : (
                        <div className="hours-normal">
                          Completo
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
            
          </div>
          <div className="create-shifts-section">
            {createSuccess && (
              <div className="success-message">
                ¡Turnos creados exitosamente!
              </div>
            )}

            {createPass && (
              <div className="pass-message">
                No hay Modificaciones en los turnos
              </div>
            )}
            
            {createError && (
              <div className="error-message">
                Error: {createError}
              </div>
            )}
            
            {/* Nuevo botón "Ver incidencias" que aparece cuando hay incidentes */}
            {incidents && incidents.length > 0 && (
              <button 
                className="view-incidents-button" 
                onClick={() => setIncidentsModalOpen(true)}
              >
                Ver incidencias
              </button>
            )}
            
            <button 
              className="create-shifts-button" 
              onClick={handleCreateShifts}
              disabled={creatingShifts}
            >
              {creatingShifts ? "Creando turnos..." : "Crear Turnos"}
            </button>
          </div>
        </>
      )}

      {/* Selector de turnos con clave única para forzar remontaje */}
      {shiftSelectorOpen && (
        <ShiftSelector 
          key={`${selectedCell.employeeId}_${selectedCell.date ? selectedCell.date.getTime() : 'new'}`}
          isOpen={shiftSelectorOpen}
          onClose={() => setShiftSelectorOpen(false)}
          onSave={handleSaveShift}
          date={selectedCell.date}
          employeeData={selectedCell.employeeData}
          existingShift={getExistingShift(selectedCell.employeeId, selectedCell.date)}
        />
      )}

    <IncidentModal 
      isOpen={incidentsModalOpen}
      onClose={() => setIncidentsModalOpen(false)}
      incidents={incidents}
    />
    </div>
  );
};

ShiftMatrix.propTypes = {
  employees: PropTypes.arrayOf(PropTypes.shape({
    number_document: PropTypes.oneOfType([PropTypes.string]).isRequired,
    full_name: PropTypes.string,
    name: PropTypes.string,
    working_day: PropTypes.number.isRequired,
    name_position: PropTypes.string,
    position: PropTypes.string,
    id_position: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })).isRequired,
  selectedStore: PropTypes.shape({
    id_store: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name_store: PropTypes.string
  }),
  selectedDepartment: PropTypes.shape({
    id_department: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name_department: PropTypes.string
  })
};

export default ShiftMatrix;