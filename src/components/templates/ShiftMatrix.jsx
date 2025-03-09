import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import "./ShiftMatrix.css";
import ShiftSelector from "../buttons/ShiftSelector";

const ShiftMatrix = ({ employees }) => {
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
    
    // Aquí podrías hacer una llamada a API para guardar en backend
    // fetch('http://localhost:3000/turnity/employeeshift/save', { ... })
    
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

          <div className="shift-matrix">
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
    name_position: PropTypes.string
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