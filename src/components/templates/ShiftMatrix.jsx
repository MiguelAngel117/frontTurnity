import { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import "./ShiftMatrix.css";
import ShiftSelector from "../buttons/ShiftSelector";

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
  const [createError, setCreateError] = useState(null);

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
      const response = await fetch('http://localhost:3000/turnity/employeeshift/generate-weeks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formatDateForAPI(date)
        }),
      });

      const result = await response.json();
      
      if (result.success && result.data.weeks) {
        console.log("Weeks loaded:", result.data.weeks.weeks);
        setWeeks(result.data.weeks.weeks);
        setSelectedWeekIndex(0); // Seleccionar la primera semana por defecto
      } else {
        console.error("Error loading weeks:", result.message);
      }
    } catch (error) {
      console.error("Error fetching weeks:", error);
    } finally {
      setLoading(false);
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
  const handleSaveShift = (shiftData) => {
    console.log("Guardar turno:", shiftData);
    
    // Crear clave única para el turno (employeeId + fecha)
    const key = `${shiftData.employeeId}_${formatDateForAPI(shiftData.date)}`;
    
    // Si se está eliminando el turno, eliminar la entrada del estado
    if (shiftData.deleted) {
      setAssignedShifts(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    } else {
      // Actualizar estado de turnos asignados
      setAssignedShifts(prev => ({
        ...prev,
        [key]: shiftData
      }));
    }
    
    // Cerrar el selector
    setShiftSelectorOpen(false);
  };

  // Obtener información del turno asignado
  const getAssignedShiftInfo = (employeeId, date) => {
    const key = `${employeeId}_${formatDateForAPI(date)}`;
    const shift = assignedShifts[key];
    
    if (!shift) return null;
    
    // Determinar qué mostrar basado en el tipo de turno
    if (["DESCANSO - X", "CUMPLEAÑOS", "VACACIONES", "INCAPACIDAD", "JURADO VOT", "DIA_FAMILIA", "LICENCIA", "DIA_DISFRUTE"].includes(shift.hour)) {
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
    return assignedShifts[key] || null;
  };

  // Función para preparar los datos para el backend
  const prepareDataForBackend = () => {
    if (!selectedStore || !selectedStore.id_store || !selectedDepartment || !selectedDepartment.id_department) {
      return { error: "Seleccione tienda y departamento para continuar" };
    }

    if (!weeks || weeks.length === 0) {
      return { error: "No hay semanas disponibles" };
    }

    // Obtenemos la primera y última fecha del mes
    const firstWeekStart = new Date(weeks[0].start + "T00:00:00");
    const lastWeekEnd = new Date(weeks[weeks.length - 1].end + "T00:00:00");
    const numWeeks = weeks.length;

    // Organizamos los datos por empleado
    const employeesWithShifts = [];

    employees.forEach(employee => {
      const employeeShifts = [];
      const weeklyShiftMap = {};

      // Inicializamos la estructura de semanas
      weeks.forEach((week, weekIndex) => {
        weeklyShiftMap[weekIndex + 1] = {
          week: weekIndex + 1,
          working_day: employee.working_day,
          shifts: []
        };
      });

      // Recorremos todas las fechas para agregar los turnos
      let currentDate = new Date(firstWeekStart);
      while (currentDate <= lastWeekEnd) {
        const dateCopy = new Date(currentDate);
        const dateStr = formatDateForAPI(dateCopy);
        
        // Encontrar a qué semana pertenece esta fecha
        let weekNumber = 1;
        for (let i = 0; i < weeks.length; i++) {
          const weekStart = new Date(weeks[i].start + "T00:00:00");
          const weekEnd = new Date(weeks[i].end + "T00:00:00");
          
          if (dateCopy >= weekStart && dateCopy <= weekEnd) {
            weekNumber = i + 1;
            break;
          }
        }
        
        // Buscar el turno asignado o asignar libre por defecto
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
        
        // Si hay un turno asignado, lo usamos
        if (assignedShift) {
          if (["DESCANSO - X", "CUMPLEAÑOS", "VACACIONES", "INCAPACIDAD", "JURADO VOT", "DIA_FAMILIA", "LICENCIA", "DIA_DISFRUTE"].includes(assignedShift.hour)) {
            // Para turnos especiales usamos el valor del hour como turn
            shiftData = {
              shift_date: dateStr,
              turn: assignedShift.hour === "DESCANSO - X" ? "X" : assignedShift.hour,
              hours: 0,
              break: "01:00:00",
              initial_hour: "00:00:00"
            };
          } else if (assignedShift.shift) {
            // Para turnos normales
            shiftData = {
              shift_date: dateStr,
              turn: assignedShift.shift.id,
              hours: parseInt(assignedShift.hour) || 0,
              break: assignedShift.shift.break || "01:00:00",
              initial_hour: assignedShift.shift.initial_hour || "00:00:00"
            };
          }
        }
        
        // Agregar el turno a la semana correspondiente
        if (weeklyShiftMap[weekNumber]) {
          weeklyShiftMap[weekNumber].shifts.push(shiftData);
        }
        
        // Avanzar al siguiente día
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Convertimos el mapa a array
      Object.values(weeklyShiftMap).forEach(weekData => {
        employeeShifts.push(weekData);
      });
      
      // Agregamos el empleado con sus turnos
      employeesWithShifts.push({
        employee: {
          number_document: employee.number_document,
          working_day: employee.working_day
        },
        weeklyShifts: employeeShifts
      });
    });
    
    return {
      data: {
        storeId: selectedStore.id_store,
        departmentId: selectedDepartment.id_department,
        positionId: employees[0]?.id_position || 0, // Asumimos que todos los empleados tienen la misma posición
        startDate: formatDateForAPI(firstWeekStart),
        numWeeks: numWeeks,
        employeeShifts: employeesWithShifts
      }
    };
  };

  // Función para enviar los turnos al backend
  const handleCreateShifts = async () => {
    const { data, error } = prepareDataForBackend();
    
    if (error) {
      setCreateError(error);
      return;
    }
    
    setCreatingShifts(true);
    setCreateError(null);
    setCreateSuccess(false);
    
    try {
      console.log("Enviando datos al backend:", data);
      
      const response = await fetch('http://localhost:3000/turnity/employeeshift/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (response.status === 201) {
        setCreateSuccess(true);
        console.log("Turnos creados exitosamente:", result);
      } else {
        setCreateError(result.message || "Error al crear los turnos");
        console.error("Error creating shifts:", result);
      }
    } catch (error) {
      setCreateError("Error de conexión al servidor");
      console.error("Error sending shifts to backend:", error);
    } finally {
      setCreatingShifts(false);
    }
  };

  const weekDays = getWeekDays();

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

      {loading ? (
        <div className="loading-indicator">Cargando semanas...</div>
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
                    <div className="day-name">{day.toLocaleString('es-ES', { weekday: 'short' })}</div>
                  </div>
                ))}
              </div>

              <div className="scrollable-body">
                {/* Filas de empleados */}
                {employees.map((employee) => (
                  <div key={employee.number_document} className="shift-matrix-row">
                    <div className="employee-info-cell">
                      <div className="employee-name">{employee.full_name}</div>
                      <div className="employee-document">ID: {employee.number_document}</div>
                      <div className="employee-hours">{employee.working_day} hrs</div>
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
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Botón para crear turnos */}
          <div className="create-shifts-section">
            {createSuccess && (
              <div className="success-message">
                ¡Turnos creados exitosamente!
              </div>
            )}
            
            {createError && (
              <div className="error-message">
                Error: {createError}
              </div>
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
    </div>
  );
};

ShiftMatrix.propTypes = {
  employees: PropTypes.arrayOf(PropTypes.shape({
    number_document: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    full_name: PropTypes.string.isRequired,
    working_day: PropTypes.number.isRequired,
    name_position: PropTypes.string,
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