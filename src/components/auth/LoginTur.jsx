import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import './LoginTur.css';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../utils/api';

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    identifier: '', 
    password: ''
  });
  const [errors, setErrors] = useState({
    identifier: false,
    password: false
  });
  const [touched, setTouched] = useState({
    identifier: false,
    password: false
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  // Validar el formulario cada vez que cambian los datos
  useEffect(() => {
    const isValid = formData.identifier.trim() !== '' && formData.password.trim() !== '';
    setIsFormValid(isValid);
    
    // Actualizar errores si los campos han sido tocados
    if (touched.identifier) {
      setErrors(prev => ({
        ...prev,
        identifier: formData.identifier.trim() === ''
      }));
    }
    
    if (touched.password) {
      setErrors(prev => ({
        ...prev,
        password: formData.password.trim() === ''
      }));
    }
  }, [formData, touched]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({
      ...touched,
      [name]: true
    });
    
    // Validar campo cuando pierde el foco
    if (name === 'identifier') {
      setErrors({
        ...errors,
        identifier: formData.identifier.trim() === ''
      });
    } else if (name === 'password') {
      setErrors({
        ...errors,
        password: formData.password.trim() === ''
      });
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const validateForm = () => {
    const newErrors = {
      identifier: formData.identifier.trim() === '',
      password: formData.password.trim() === ''
    };
    
    setErrors(newErrors);
    setTouched({
      identifier: true,
      password: true
    });
    
    if (newErrors.identifier) {
      showNotification('Por favor ingrese su email o nombre de usuario', 'error');
      return false;
    }
    if (newErrors.password) {
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
      const payload = {
        identifier: formData.identifier,
        password: formData.password
      };
      
      // Usar el método público de la API para el login
      const data = await api.public.post('/users/login/', payload);
      
      if (data && data.token) {
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
        showNotification(data?.error || 'Error al iniciar sesión', 'error');
      }
    } catch (error) {
      // Si el error contiene un mensaje del servidor, mostrarlo
      if (error.message) {
        showNotification(error.message, 'error');
      } else {
        showNotification('Error de conexión', 'error');
      }
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
            <div className={`form-group ${errors.identifier ? 'error' : ''}`}>
              <label htmlFor="identifier">Email o Usuario</label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                placeholder="Ingrese su email o nombre de usuario"
                value={formData.identifier}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.identifier ? 'error-input' : ''}
              />
            </div>
            
            <div className={`form-group ${errors.password ? 'error' : ''}`}>
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Ingrese su contraseña"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.password ? 'error-input' : ''}
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
              className={`login-button ${isLoading ? 'loading' : ''} ${!isFormValid ? 'disabled' : ''}`}
              disabled={isLoading || !isFormValid}
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
            className={`user-form-notification ${notification.type}`}
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