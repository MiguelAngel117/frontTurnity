import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import "./ShiftSelector.css";
import { api } from '../../utils/api';

const ShiftSelector = ({ isOpen, onClose, onSave, date, employeeData, existingShift }) => {
  const [hours, setHours] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [breaks, setBreaks] = useState([]);
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedBreak, setSelectedBreak] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Cargar horas disponibles y datos existentes al abrir
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      
      // Verificar si estamos editando un turno existente
      if (existingShift) {
        setIsEditing(true);
        // Asegurar que existingShift.hour tiene un valor válido
        setSelectedHour(existingShift.hour || "");
        // Si no es un turno especial y el turno existe, cargar los detalles del turno
        const specialOptions = ["CUMPLEAÑOS", "VACACIONES", "INCAPACIDAD", "JURADO VOT", "DIA_FAMILIA", "LICENCIA", "DIA_DISFRUTE"];
        if (existingShift.hour && !specialOptions.includes(existingShift.hour) && existingShift.shift) {
          setSelectedShift(existingShift.shift);
          // Corregir: Asegurarse de usar correctamente el valor del descanso
          setSelectedBreak(existingShift.shift.break);
          // Cargar los turnos para esta hora
          api.get(`/shifts/by-hours/${existingShift.hour}`)
            .then(data => {
              setShifts(Array.isArray(data) ? data : []);
              
              // Si el turno tiene descanso, cargar los descansos
              if (existingShift.shift && existingShift.shift.code_shift) {
                return api.get(`/shifts/breaks/${existingShift.shift.code_shift}`);
              }
              return null;
            })
            .then(data => {
              if (data) {
                setBreaks(Array.isArray(data.breaks) ? data.breaks : []);
                // Asegurarse de establecer el descanso seleccionado después de cargar los descansos disponibles
                setSelectedBreak(existingShift.shift.break || "01:00:00");
              }
            })
            .catch(error => {
              console.error("Error fetching existing shift details:", error);
              setShifts([]);
              setBreaks([]);
            });
        }
      } else {
        // Reiniciar estados para un nuevo turno
        setIsEditing(false);
        setSelectedHour("");
        setSelectedShift(null);
        setSelectedBreak("");
        setShifts([]);
        setBreaks([]);
      }
      
      // Cargar las horas disponibles
      api.get("/shifts/list/")
        .then(data => {
          setHours(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(error => {
          console.error("Error fetching hours:", error);
          setHours([]);
          setLoading(false);
        });
    }
  }, [isOpen, existingShift]);

  // Manejar selección de horas
  const handleHourSelect = (hour) => {
    setSelectedHour(hour);
    setSelectedShift(null);
    setSelectedBreak("");
    
    // Si es una opción especial como DESCANSO, no cargar turnos
    const specialOptions = ["CUMPLEAÑOS", "VACACIONES", "INCAPACIDAD", "JURADO VOT", "DIA_FAMILIA", "LICENCIA", "DIA_DISFRUTE"];
    
    if (!hour || specialOptions.includes(hour)) {
      setShifts([]);
      return;
    }
    
    setLoading(true);
    api.get(`/shifts/by-hours/${hour}`)
      .then(data => {
        setShifts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching shifts:", error);
        setShifts([]);
        setLoading(false);
      });
  };

  // Manejar selección de turno
  const handleShiftSelect = (shift) => {
    setSelectedShift(shift);
    setSelectedBreak("");
    
    if (!shift || !shift.code_shift) {
      setBreaks([]);
      return;
    }
    
    setLoading(true);
    api.get(`/shifts/breaks/${shift.code_shift}`)
      .then(data => {
        setBreaks(Array.isArray(data.breaks) ? data.breaks : []);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching breaks:", error);
        setLoading(false);
        setBreaks([]);
      });
  };

  // Formatear fecha para mostrar
  const formatDate = (date) => {
    if (!date) return { dayName: "", formattedDate: "" };
    const d = new Date(date);
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const day = days[d.getDay()];
    return {
      dayName: day,
      formattedDate: d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    };
  };

  const { dayName, formattedDate } = formatDate(date);

  // Manejar guardar
  const handleSave = () => {
    // Si es un turno normal (con horas) asegurarse de que se capture code_shift
    const shiftData = {
      hour: selectedHour,
      shift: selectedShift ? {
        id: selectedShift.id || selectedShift.code_shift,
        code_shift: selectedShift.code_shift, // Asegurar que code_shift está incluido
        initial_hour: selectedShift.initial_hour,
        break: selectedBreak || selectedShift.break
      } : null,
      break: selectedBreak,
      date: date,
      employeeId: employeeData?.number_document
    };
    onSave(shiftData);
  };

  // Manejar eliminar
  const handleDelete = () => {
    if (confirm("¿Estás seguro de que deseas eliminar este turno?")) {
      // Crear un objeto con datos mínimos para identificar qué eliminar
      const deleteData = {
        date: date,
        employeeId: employeeData?.number_document,
        deleted: true
      };
      onSave(deleteData); // Usar la misma función pero marcar como eliminado
    }
  };

  if (!isOpen) return null;

  return (
    <div className="shift-selector-overlay">
      <div className="shift-selector-modal">
        <h2>{isEditing ? "Editar turno" : "Selecciona el turno"}</h2>
        
        <div className="date-info">
          <p>Día: <span>{dayName}</span></p>
          <p>Fecha: <span>{formattedDate}</span></p>
        </div>

        <div className="selector-section">
          <label>Hora</label>
          <select 
            value={selectedHour} 
            onChange={(e) => handleHourSelect(e.target.value)}
            disabled={loading}
          >
            <option value="">Seleccionar hora</option>
            {Array.isArray(hours) && hours.map((hour, index) => (
              <option key={index} value={hour}>{hour}</option>
            ))}
          </select>
        </div>

        {selectedHour && !["CUMPLEAÑOS", "VACACIONES", "INCAPACIDAD", "JURADO VOT", "DIA_FAMILIA", "LICENCIA", "DIA_DISFRUTE"].includes(selectedHour) && (
          <div className="selector-section">
            <label>Turnos</label>
            <select 
              value={selectedShift ? selectedShift.code_shift : ""} 
              onChange={(e) => {
                const shift = shifts.find(s => s.code_shift === e.target.value);
                handleShiftSelect(shift);
              }}
              disabled={loading || !Array.isArray(shifts) || shifts.length === 0}
            >
              <option value="">Seleccionar turno</option>
              {Array.isArray(shifts) && shifts.map((shift) => {
                const endHour = shift.end_hour.slice(0, 5);
                return (
                  <option key={shift.code_shift} value={shift.code_shift}>
                    {shift.initial_hour.slice(0, 5)} a {endHour}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {selectedShift && (
          <div className="selector-section">
            <label>Descanso</label>
            <select 
              value={selectedBreak} 
              onChange={(e) => setSelectedBreak(e.target.value)}
              disabled={loading || !Array.isArray(breaks) || breaks.length === 0}
            >
              <option value="">Seleccionar descanso</option>
              {Array.isArray(breaks) && breaks.map((breakTime, index) => (
                <option key={index} value={breakTime}>{breakTime}</option>
              ))}
            </select>
          </div>
        )}

        <div className="action-buttons">
          <button className="cancel-button" onClick={onClose}>Volver</button>
          
          {/* Mostrar el botón de eliminar solo en modo de edición */}
          {isEditing && existingShift && !existingShift.deleted && (
            <button 
              className="delete-button" 
              onClick={handleDelete}
            >
              Eliminar
            </button>
          )}
          
          <button 
            className="save-button" 
            onClick={handleSave}
            disabled={!selectedHour || (selectedHour && !["CUMPLEAÑOS", "VACACIONES", "INCAPACIDAD", "JURADO VOT", "DIA_FAMILIA", "LICENCIA", "DIA_DISFRUTE"].includes(selectedHour) && !selectedShift)}
          >
            {isEditing ? "Actualizar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
};

ShiftSelector.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  date: PropTypes.instanceOf(Date),
  employeeData: PropTypes.shape({
    number_document: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    full_name: PropTypes.string.isRequired
  }),
  existingShift: PropTypes.object
};

export default ShiftSelector;