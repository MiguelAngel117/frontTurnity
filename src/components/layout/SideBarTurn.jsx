import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './SidebarTurn.css';
import PropTypes from 'prop-types';

const Sidebar = ({ isOpen }) => {
  const [expandedItems, setExpandedItems] = useState({});
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser && storedUser.roles && storedUser.roles.length > 0) {
      setUserRole(storedUser.roles[0]);
    }
  }, []);

  const toggleItem = (item) => {
    setExpandedItems((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const isAdmin = userRole === 'Administrador';
  const isManagerOrBoss = userRole === 'Gerente' || userRole === 'Jefe';

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <nav>
        <ul>
          {isAdmin && (
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
                  <NavLink to="/schedules/report_turns">Mallas</NavLink>
                </li>
              </ul>
            </li>
          )}

          {isManagerOrBoss && (
            <>
              <li className={`menu-item ${isOpen ? '' : 'hidden'}`}>
                <NavLink to="/schedules/create" className={`menu-title ${isOpen ? '' : 'hidden'}`}>
                  Crear Turnos
                </NavLink>
              </li>
              <li className={`menu-item ${isOpen ? '' : 'hidden'}`}>
                <NavLink to="/schedules/report_turns" className={`menu-title ${isOpen ? '' : 'hidden'}`}>
                  Mallas
                </NavLink>
              </li>
            </>
          )}

          {isAdmin && (
            <>
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

              <li className={`menu-item ${isOpen ? '' : 'hidden'}`}>
                <NavLink to="/users/" className={`menu-title ${isOpen ? '' : 'hidden'}`}>
                  Usuarios
                </NavLink>
              </li>

              <li className={`menu-item ${isOpen ? '' : 'hidden'}`}>
                <span
                  className={`menu-title ${isOpen ? '' : 'hidden'}`}
                  onClick={() => toggleItem('reportes')}
                >
                  Reportes
                </span>
                <ul className={`submenu ${!expandedItems['reportes'] ? 'hidden' : ''}`}>
                  <li>
                    <NavLink to="/reports/salary">Compensación y Salarios</NavLink>
                  </li>
                </ul>
              </li>
            </>
          )}
        </ul>
      </nav>
    </div>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
};

export default Sidebar;