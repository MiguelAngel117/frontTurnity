import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import PropTypes from 'prop-types';

const Sidebar = ({ isOpen }) => {
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItem = (item) => {
    setExpandedItems((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <nav>
        <ul>
          <li className={`menu-item ${isOpen ? '' : 'hidden'}`}>
            <span
              className={`menu-title ${isOpen ? '' : 'hidden'}`}
              onClick={() => toggleItem('turnos')}
            >
              Turnos
            </span>
            <ul className={`submenu ${!expandedItems['turnos'] ? 'hidden' : ''}`}>
              <li>
                <NavLink to="/schedules/create">Crear Turnos</NavLink>
              </li>
              <li>
                <NavLink to="/schedules/reports">Reportes</NavLink>
              </li>
            </ul>
          </li>
          <li className={`menu-item ${isOpen ? '' : 'hidden'}`}>
            <span
              className={`menu-title ${isOpen ? '' : 'hidden'}`}
              onClick={() => toggleItem('empleados')}
            >
              Empleados
            </span>
            <ul className={`submenu ${!expandedItems['empleados'] ? 'hidden' : ''}`}>
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

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
};

export default Sidebar;
