// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import './ProfilePage.css'; // Crea este archivo para los estilos del perfil

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Obtener los datos del usuario del localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);
  
  if (!user) {
    return <div className="profile-loading">Cargando perfil...</div>;
  }
  
  return (
    <div className="profile-container">
      <h1>Perfil de Usuario</h1>
      
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div className="profile-name">{user.name || 'Usuario'}</div>
        </div>
        
        <div className="profile-details">
          <div className="profile-info-row">
            <div className="profile-info-label">Email:</div>
            <div className="profile-info-value">{user.email || 'No disponible'}</div>
          </div>
          
          <div className="profile-info-row">
            <div className="profile-info-label">Usuario:</div>
            <div className="profile-info-value">{user.alias_user || 'No disponible'}</div>
          </div>
          
          {/* Puedes agregar más campos según la estructura de tu objeto de usuario */}
          
          <div className="profile-actions">
            <button className="profile-edit-button">Editar Perfil</button>
            <button className="profile-password-button">Cambiar Contraseña</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;