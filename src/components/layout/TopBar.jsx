import { useState, useRef, useEffect } from 'react';
import './Topbar.css'; 
import icon from '../../assets/icons/logo.png'; 
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const Topbar = ({ isSidebarOpen, toggleSidebar, onLogout }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
        <button className="toggle-button" onClick={toggleSidebar}>
          {isSidebarOpen ? '<' : '>'}
        </button>
        <img
          src={icon}
          onClick={() => navigate('/')}
          alt="App Logo"
          className="app-logo"
          style={{ cursor: 'pointer' }}
        />
      </div>
      <div className="topbar-right">
        <div className="profile-dropdown" ref={dropdownRef}>
          <div 
            className="profile-icon" 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ color: 'white', cursor: 'pointer' }}
          >
          🧑🏻
          </div>
          {dropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={handleProfileClick}>
                Perfil
              </div>
              <div className="dropdown-item" onClick={handleLogout}>
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