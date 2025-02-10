import './Topbar.css'; 
import icon from '../../assets/icons/logo.png'; 
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const Topbar = ({ isSidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate();

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
        <div className="profile-icon">👤</div>
      </div>
    </div>
  );
};

Topbar.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
};

export default Topbar;
