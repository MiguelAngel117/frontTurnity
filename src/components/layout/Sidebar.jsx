// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <nav className="sidebar">
      <h2 className="sidebar-title">Menú</h2>
      <ul className="sidebar-menu">
        <li>
          <span>Mallas</span>
          <ul>
            <li>
              <NavLink to="/mallas/crear">Crear Mallas</NavLink>
            </li>
            <li>
              <NavLink to="/mallas/reportes">Reportes</NavLink>
            </li>
          </ul>
        </li>
        <li>
          <span>Empleados</span>
          <ul>
            <li>
              <NavLink to="/empleados/editar">Editar Empleados</NavLink>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
