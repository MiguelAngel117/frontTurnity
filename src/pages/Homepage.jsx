import { useState, useEffect } from 'react';
import './Homepage.css';

const HomePage = () => {
  const [userInfo, setUserInfo] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');

  // Obtener información del usuario
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUserInfo(storedUser);
  }, []);

  // Actualizar la hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Establecer saludo según la hora del día
  useEffect(() => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Buenos días');
    } else if (hour >= 12 && hour < 19) {
      setGreeting('Buenas tardes');
    } else {
      setGreeting('Buenas noches');
    }
  }, [currentTime]);

  // Formatear fecha
  const formatDate = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  };

  // Formatear hora
  const formatTime = (date) => {
    const options = { 
      hour: '2-digit', 
      minute: '2-digit'
    };
    return date.toLocaleTimeString('es-ES', options);
  };

  const firstName = userInfo.first_names

  return (
    <div className="homepage-container">
      <div className="welcome-card">
        <div className="welcome-header">
          <h1 className="welcome-title">
            <span className="welcome-greeting">{greeting}</span>
            <span className="user-name">{firstName}</span>
          </h1>
          <div className="date-time-container">
            <div className="date">{formatDate(currentTime)}</div>
            <div className="time">{formatTime(currentTime)}</div>
          </div>
        </div>
        
        <div className="welcome-content">
          <div className="logo-container">
            <h2 className="turnity-logo">TURNITY</h2>
          </div>
          <p className="welcome-message">
            Bienvenido a tu plataforma de gestión de mallas para Falabella Retail
          </p>
          
          <div className="feature-cards">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Gestión de Turnos</h3>
              <p>Administra fácilmente los turnos de tu equipo</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📆</div>
              <h3>Calendario</h3>
              <p>Visualiza la programación mensual</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Reportes</h3>
              <p>Genera reportes para tus colaboradores o áreas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;