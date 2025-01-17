import 
{ useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true); // Estado para el menú
  const [turnosOpen, setTurnosOpen] = useState(false); // Estado  para subopciones de turnos
  const [empleadosOpen, setEmpleadosOpen] = useState(false); // Estado para subopciones de empleados

  const toggleSidebar = () => {
    setIsOpen(!isOpen); // Alterna el estado de apertura del menú
  };

  const toggleTurnos = () => {
    setTurnosOpen(!turnosOpen); // Alterna las subopciones de turnos
  };

  const toggleEmpleados = () => {
    setEmpleadosOpen(!empleadosOpen); // Alterna las subopciones de empleados
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <button className="toggle-button" onClick={toggleSidebar}>
        {isOpen ? '<' : '>'}
      </button>
      <nav>
        <ul>
          <li className={`menu-item ${isOpen ? '' : 'hidden'}`}>
            <span className={`menu-title ${isOpen ? '' : 'hidden'}`} onClick={toggleTurnos}>
              Turnos
            </span>
            <ul className={`submenu ${!isOpen || !turnosOpen ? 'hidden' : ''}`}>
              <li>
                <NavLink to="/schedules/create">Crear Turnos</NavLink>
              </li>
              <li>
                <NavLink to="/schedules/reports">Reportes</NavLink>
              </li>
            </ul>
          </li>
          <li className={`menu-item ${isOpen ? '' : 'hidden'}`}>
            <span className={`menu-title ${isOpen ? '' : 'hidden'}`} onClick={toggleEmpleados}>
              Empleados
            </span>
            <ul className={`submenu ${!isOpen || !empleadosOpen ? 'hidden' : ''}`}>
              <li>
                <NavLink to="/employees/edit">Editar Empleados</NavLink>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;