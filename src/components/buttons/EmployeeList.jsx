import { useState } from "react";
import PropTypes from 'prop-types';
import "./EmployeeList.css";

const EmployeeList = ({ employees, onEmployeeSelect, onContinue, selectedEmployees }) => {
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);
    
    if (isChecked) {
      // Seleccionar todos los empleados
      const allEmployeeIds = employees.map((employee) => employee.number_document);
      onEmployeeSelect(allEmployeeIds);
    } else {
      // Deseleccionar todos
      onEmployeeSelect([]);
    }
  };

  const handleEmployeeSelection = (employeeId) => {
    let updatedSelection;
    
    if (selectedEmployees.includes(employeeId)) {
      // Si ya está seleccionado, lo quitamos
      updatedSelection = selectedEmployees.filter(id => id !== employeeId);
    } else {
      // Si no está seleccionado, lo añadimos
      updatedSelection = [...selectedEmployees, employeeId];
    }
    
    onEmployeeSelect(updatedSelection);
    
    // Actualizar el estado del checkbox "Seleccionar todos"
    if (updatedSelection.length === employees.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  };

  return (
    <div className="employee-list-container">
      <h3>Seleccionar Empleados</h3>
      
      {employees.length === 0 ? (
        <p className="no-employees-message">No hay empleados registrados para este departamento.</p>
      ) : (
        <>
          <div className="employee-list-header">
            <div className="select-all-container">
              <input
                type="checkbox"
                id="selectAll"
                checked={selectAll}
                onChange={handleSelectAll}
              />
              <label htmlFor="selectAll">Seleccionar todos</label>
            </div>
            <p className="employees-count">
              {selectedEmployees.length} de {employees.length} empleados seleccionados
            </p>
          </div>
          
          <div className="employee-table">
            <div className="employee-table-header">
              <div className="employee-checkbox header-cell"></div>
              <div className="employee-name header-cell">Nombre</div>
              <div className="employee-working-day header-cell">Jornada</div>
              <div className="employee-position header-cell">Posición</div>
              <div className="employee-status header-cell">Estado Malla</div>
            </div>
            
            <div className="employee-table-body">
              {employees.map((employee) => (
                <div
                  key={employee.number_document}
                  className={`employee-row ${
                    selectedEmployees.includes(employee.number_document) ? "selected" : ""
                  }`}
                  onClick={() => handleEmployeeSelection(employee.number_document)}
                >
                  <div className="employee-checkbox">
                    <input
                      type="checkbox"
                      id={`employee-${employee.number_document}`}
                      checked={selectedEmployees.includes(employee.number_document)}
                      onChange={(e) => {
                        e.stopPropagation(); // Prevenir que se propague al row
                        handleEmployeeSelection(employee.number_document);
                      }}
                    />
                  </div>
                  <div className="employee-name" title={employee.full_name}>
                    {employee.full_name}
                  </div>
                  <div className="employee-working-day">
                    {employee.working_day} hrs
                  </div>
                  <div className="employee-position" title={employee.name_position}>
                    {employee.name_position}
                  </div>
                  <div className="employee-status">
                    <div 
                      className={`status-circle ${employee.has_shifts ? "green" : "red"}`} 
                      title={employee.has_shifts ? "Con malla asignada" : "Sin malla asignada"}>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="employee-list-footer">
            <button 
              className="continue-button" 
              onClick={onContinue}
              disabled={selectedEmployees.length === 0}
            >
              Continuar
            </button>
          </div>
        </>
      )}
    </div>
  );
};

EmployeeList.propTypes = {
  employees: PropTypes.arrayOf(PropTypes.shape({
    number_document: PropTypes.string.isRequired,
    full_name: PropTypes.string.isRequired,
    working_day: PropTypes.number.isRequired,
    name_position: PropTypes.string.isRequired,
    has_shifts: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]).isRequired,
  })).isRequired,
  onEmployeeSelect: PropTypes.func.isRequired,
  onContinue: PropTypes.func.isRequired,
  selectedEmployees: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default EmployeeList;