import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { motion, AnimatePresence } from 'framer-motion';

const Login = ( {onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    identifier: '', // Can be email or username
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const validateForm = () => {
    if (!formData.identifier) {
      showNotification('Por favor ingrese su email o nombre de usuario', 'error');
      return false;
    }
    if (!formData.password) {
      showNotification('Por favor ingrese su contraseña', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Determine if input is email or username
      const isEmail = formData.identifier.includes('@');
      
      const payload = {
        [isEmail ? 'email' : 'alias_user']: formData.identifier,
        password: formData.password
      };
      
      const response = await fetch('http://localhost:3000/turnity/users/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        showNotification('Inicio de sesión exitoso', 'success');
        
        // Llama a onLoginSuccess para actualizar el estado en App.jsx
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        
        // Redirect to home page after a brief delay
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        showNotification(data.message || 'Error al iniciar sesión', 'error');
      }
    } catch (error) {
      showNotification('Error de conexión', 'error');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="brand-content">
          <div className="brand-box">
            <h1>Turnity</h1>
            <p>Plataforma para la gestión de turnos laborales</p>
          </div>
        </div>
      </div>
      
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-header">
            <h2>¡Bienvenido de nuevo!</h2>
            <p>Accede a tu cuenta para gestionar</p>
            <p>los turnos de tus colaboradores</p>
          </div>
          
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="identifier">Email o Usuario</label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                placeholder="Ingrese su email o nombre de usuario"
                value={formData.identifier}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Ingrese su contraseña"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-actions">
              <div className="remember-me">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Recordarme</label>
              </div>
              <a href="#" className="forgot-password">¿Olvidó su contraseña?</a>
            </div>
            
            <button 
              type="submit" 
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
          
          <p className="register-link">
            ¿No tiene una cuenta? <a href="#">Contacte a su administrador</a>
          </p>
        </div>
      </div>
      
      <AnimatePresence>
        {notification && (
          <motion.div 
            className={`notification ${notification.type}`}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
Login.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired,
};

export default Login;