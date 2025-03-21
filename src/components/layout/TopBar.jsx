import { useState, useRef, useEffect } from 'react';
import './Topbar.css'; 
import icon from '../../assets/icons/logo.png'; 
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const Topbar = ({ isSidebarOpen, toggleSidebar, onLogout }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const dropdownRef = useRef(null);

  // Obtener el nombre del usuario del localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const name = storedUser.nombre || storedUser.name || 'Usuario';
    setUserName(name);
  }, []);

  // Cerrar el dropdown cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    navigate('/profile');
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
          <span className="toggle-icon">{isSidebarOpen ? '◀' : '▶'}</span>
        </button>
        <img
          src={icon}
          onClick={() => navigate('/')}
          alt="Turnity Logo"
          className="app-logo"
        />
      </div>
      <div className="topbar-right">
        <div className="profile-dropdown" ref={dropdownRef}>
          <div 
            className="profile-icon" 
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            🧑🏻 <span className="profile-name">{userName}</span>
          </div>
          {dropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={handleProfileClick}>
                <span className="dropdown-icon">👤</span>
                Perfil
              </div>
              <div className="dropdown-item" onClick={handleLogout}>
                <span className="dropdown-icon">🚪</span>
                Cerrar Sesión
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Topbar.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  onLogout: PropTypes.func
};

export default Topbar;