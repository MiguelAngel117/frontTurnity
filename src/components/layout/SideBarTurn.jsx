import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import './SidebarTurn.css';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState({});
  const [userRole, setUserRole] = useState('');
  const [hoveredMenu, setHoveredMenu] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser && storedUser.roles && storedUser.roles.length > 0) {
      setUserRole(storedUser.roles[0]);
    }
  }, []);

  // Colapsar todos los subitems cuando se cierra el sidebar
  useEffect(() => {
    if (!isOpen) {
      setExpandedItems({});
    }
  }, [isOpen]);

  const toggleItem = (item, hasSubmenu) => {
    // Si el sidebar está cerrado y el ítem tiene submenú, primero abrimos el sidebar
    if (!isOpen && hasSubmenu) {
      setIsOpen(true);
      // Después de abrir el sidebar, expandimos el ítem
      setTimeout(() => {
        setExpandedItems((prev) => ({
          ...prev,
          [item]: true,
        }));
      }, 100);
    } else {
      // Comportamiento normal cuando el sidebar está abierto
      setExpandedItems((prev) => ({
        ...prev,
        [item]: !prev[item],
      }));
    }
  };

  const handleItemClick = (item, hasSubmenu, path) => {
    if (hasSubmenu) {
      toggleItem(item, hasSubmenu);
    } else {
      // Si no tiene submenú, navegar directamente
      navigate(path);
    }
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleMouseEnter = (menu) => {
    if (!isOpen) {
      setHoveredMenu(menu);
    }
  };

  const handleMouseLeave = () => {
    if (!isOpen) {
      setHoveredMenu(null);
    }
  };

  const isAdmin = userRole === 'Administrador';
  const isManagerOrBoss = userRole === 'Gerente' || userRole === 'Jefe';

  // Iconos para el menú
  const renderMenuIcon = (menuName) => {
    const icons = {
      home: '🏠',
      turnos: '📅',
      empleados: '👥',
      usuarios: '👤',
      reportes: '📊',
      mallas: '📋'
    };
    return icons[menuName] || '•';
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          <ul className="menu-list">
            {/* Botón de Inicio */}
            <li className="menu-item">
              <div 
                className="menu-item-header" 
                onClick={handleHomeClick}
              >
                <span className="menu-icon">{renderMenuIcon('home')}</span>
                {isOpen && <span className="menu-title">Inicio</span>}
              </div>
            </li>

            {/* Separador */}
            <li className="menu-separator"></li>

            {isAdmin && (
              <li className="menu-item"
                  onMouseEnter={() => handleMouseEnter('turnos')}
                  onMouseLeave={handleMouseLeave}>
                <div 
                  className={`menu-item-header ${expandedItems['turnos'] ? 'active' : ''}`} 
                  onClick={() => handleItemClick('turnos', true)}
                >
                  <span className="menu-icon">{renderMenuIcon('turnos')}</span>
                  {isOpen && <span className="menu-title">Turnos</span>}
                  {isOpen && (
                    <span className={`menu-arrow ${expandedItems['turnos'] ? 'expanded' : ''}`}>
                      ›
                    </span>
                  )}
                </div>
                {(isOpen || hoveredMenu === 'turnos') && (
                  <ul className={`submenu ${expandedItems['turnos'] || hoveredMenu === 'turnos' ? 'expanded' : ''}`}>
                    <li className="submenu-item">
                      <NavLink to="/schedules/create" className={({ isActive }) => isActive ? 'active' : ''}>
                        Crear Turnos
                      </NavLink>
                    </li>
                    <li className="submenu-item">
                      <NavLink to="/schedules/report_turns" className={({ isActive }) => isActive ? 'active' : ''}>
                        Mallas
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>
            )}

            {isManagerOrBoss && (
              <>
                <li className="menu-item">
                  <div 
                    className="menu-item-header" 
                    onClick={() => handleItemClick(null, false, '/schedules/create')}
                  >
                    <span className="menu-icon">{renderMenuIcon('turnos')}</span>
                    {isOpen && <span className="menu-title">Crear Turnos</span>}
                  </div>
                </li>
                <li className="menu-item">
                  <div 
                    className="menu-item-header" 
                    onClick={() => handleItemClick(null, false, '/schedules/report_turns')}
                  >
                    <span className="menu-icon">{renderMenuIcon('mallas')}</span>
                    {isOpen && <span className="menu-title">Mallas</span>}
                  </div>
                </li>
              </>
            )}

            {isAdmin && (
              <>
                <li className="menu-item"
                    onMouseEnter={() => handleMouseEnter('empleados')}
                    onMouseLeave={handleMouseLeave}>
                  <div 
                    className={`menu-item-header ${expandedItems['empleados'] ? 'active' : ''}`} 
                    onClick={() => handleItemClick('empleados', true)}
                  >
                    <span className="menu-icon">{renderMenuIcon('empleados')}</span>
                    {isOpen && <span className="menu-title">Empleados</span>}
                    {isOpen && (
                      <span className={`menu-arrow ${expandedItems['empleados'] ? 'expanded' : ''}`}>
                        ›
                      </span>
                    )}
                  </div>
                  {(isOpen || hoveredMenu === 'empleados') && (
                    <ul className={`submenu ${expandedItems['empleados'] || hoveredMenu === 'empleados' ? 'expanded' : ''}`}>
                      <li className="submenu-item">
                        <NavLink to="/employees/edit" className={({ isActive }) => isActive ? 'active' : ''}>
                          Editar Empleados
                        </NavLink>
                      </li>
                    </ul>
                  )}
                </li>

                <li className="menu-item">
                  <div 
                    className="menu-item-header" 
                    onClick={() => handleItemClick(null, false, '/users/')}
                  >
                    <span className="menu-icon">{renderMenuIcon('usuarios')}</span>
                    {isOpen && <span className="menu-title">Usuarios</span>}
                  </div>
                </li>

                <li className="menu-item"
                    onMouseEnter={() => handleMouseEnter('reportes')}
                    onMouseLeave={handleMouseLeave}>
                  <div 
                    className={`menu-item-header ${expandedItems['reportes'] ? 'active' : ''}`} 
                    onClick={() => handleItemClick('reportes', true)}
                  >
                    <span className="menu-icon">{renderMenuIcon('reportes')}</span>
                    {isOpen && <span className="menu-title">Reportes</span>}
                    {isOpen && (
                      <span className={`menu-arrow ${expandedItems['reportes'] ? 'expanded' : ''}`}>
                        ›
                      </span>
                    )}
                  </div>
                  {(isOpen || hoveredMenu === 'reportes') && (
                    <ul className={`submenu ${expandedItems['reportes'] || hoveredMenu === 'reportes' ? 'expanded' : ''}`}>
                      <li className="submenu-item">
                        <NavLink to="/reports/salary" className={({ isActive }) => isActive ? 'active' : ''}>
                          Compensación y Salarios
                        </NavLink>
                      </li>
                    </ul>
                  )}
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
};

export default Sidebar;