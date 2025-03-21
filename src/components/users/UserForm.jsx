import { useState, useEffect } from 'react';
import { api } from "../../utils/api";
import LocationSelector from './LocationSelector';
import './UserForm.css';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

const UserForm = ({ user, onClose }) => {
  // Determinar si es modo edición o creación
  const isEditMode = !!user;
  
  const [formData, setFormData] = useState({
    number_document: '',
    alias_user: '',
    first_names: '',
    last_names: '',
    email: '',
    password: '',
    status_user: true, // true = active (1), false = inactive (0)
    role_name: 'Jefe',
    stores: [],
    departments: []
  });

  const [originalData, setOriginalData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showLocationSelector, setShowLocationSelector] = useState(true); // Por defecto mostrar para Jefe

  // Inicializa el formulario con los datos del usuario si estamos en modo edición
  useEffect(() => {
    if (isEditMode && user) {
      const userData = {
        number_document: user.number_document,
        alias_user: user.alias_user,
        first_names: user.first_names,
        last_names: user.last_names,
        email: user.email,
        password: '', // No mostrar contraseña actual por seguridad
        status_user: user.status_user === 1, // Convertir número a booleano
        role_name: user.role_name,
        stores: user.stores || [],
        departments: user.departments || []
      };
      
      setFormData(userData);
      setOriginalData(userData); // Guardar los datos originales para comparar cambios
      setShowLocationSelector(user.role_name !== 'Administrador');
    } else {
      // Inicializa el showLocationSelector según el rol predeterminado para modo creación
      setShowLocationSelector(formData.role_name !== 'Administrador');
    }
  }, [user, isEditMode]);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleStatusChange = (e) => {
    const value = e.target.value === 'active';
    setFormData({ ...formData, status_user: value });
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    
    // Resetear stores y departments cuando cambia el rol
    setFormData({
      ...formData,
      role_name: role,
      stores: [],
      departments: []
    });
    
    // Mostrar selector de ubicación solo para roles que lo necesiten
    setShowLocationSelector(role !== 'Administrador');
  };

  const handleStoresChange = (stores) => {
    setFormData({ ...formData, stores });
  };

  const handleDepartmentsChange = (departments) => {
    setFormData({ ...formData, departments });
  };

  // Función para calcular los cambios entre datos originales y actuales
  const getChangedData = () => {
    const changedData = {};
    
    // Solo compara campos que pueden ser editados
    const fieldsToCompare = [
      'alias_user', 'first_names', 'last_names', 'email', 
      'role_name', 'status_user'
    ];
    
    fieldsToCompare.forEach(field => {
      if (formData[field] !== originalData[field]) {
        if (field === 'status_user') {
          changedData[field] = formData[field] ? 1 : 0; // Convertir booleano a número
        } else {
          changedData[field] = formData[field];
        }
      }
    });
    
    // Añadir contraseña solo si se ha ingresado una nueva
    if (formData.password) {
      changedData.password = formData.password;
    }
    
    // Añadir stores y departments según el rol, si han cambiado
    if (formData.role_name === 'Gerente') {
      // Verificar si los arreglos son diferentes
      const storesChanged = JSON.stringify(formData.stores) !== JSON.stringify(originalData.stores);
      if (storesChanged) {
        changedData.role_name = formData.role_name;
        changedData.stores = formData.stores;
      }
    } else if (formData.role_name === 'Jefe') {
      const storesChanged = JSON.stringify(formData.stores) !== JSON.stringify(originalData.stores);
      const departmentsChanged = JSON.stringify(formData.departments) !== JSON.stringify(originalData.departments);
      if (storesChanged || departmentsChanged) {
        changedData.role_name = formData.role_name;
        changedData.stores = formData.stores;
        changedData.departments = formData.departments;
      }
    }
    
    return changedData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);
    
    try {
      if (isEditMode) {
        // Modo edición: enviar solo los campos que han cambiado
        const changedData = getChangedData();
        
        // Si no hay cambios, no hacer nada
        if (Object.keys(changedData).length === 0) {
          showNotification('No se detectaron cambios', 'error');
          setIsLoading(false);
          return;
        }
        
        // Log para depuración - quitar en producción
        console.log("Datos a actualizar:", JSON.stringify(changedData));
        
        const response = await api.put(`/users/${formData.number_document}`, changedData);
        if(response.status=== 209){
          showNotification(response.message, 'error')
        }else{
          showNotification('Usuario actualizado exitosamente', 'success');
          setTimeout(() => {
            onClose(); // Redirige a la página de usuarios
          }, 1500);
        }
      } else {
        // Modo creación: enviar todos los campos
        const dataToSend = { 
          number_document: Number(formData.number_document),
          alias_user: formData.alias_user,
          first_names: formData.first_names,
          last_names: formData.last_names,
          email: formData.email,
          password: formData.password,
          role_name: formData.role_name,
          status_user: formData.status_user ? 1 : 0 // Convertir booleano a número
        };
        
        // Añadir stores y departments según el rol
        if (formData.role_name === 'Gerente') {
          dataToSend.stores = formData.stores;
        } else if (formData.role_name === 'Jefe') {
          dataToSend.stores = formData.stores;
          dataToSend.departments = formData.departments;
        }
        
        // Log para depuración - quitar en producción
        console.log("Datos a enviar:", JSON.stringify(dataToSend));
        
        const response = await api.post('/users/', dataToSend);
        
        if(response.status=== 209){
          showNotification(response.message, 'error')
        }else{
          showNotification('Usuario creado exitosamente', 'success');
          setTimeout(() => {
            onClose(); // Redirige a la página de usuarios
          }, 1500);
        }
        
      }
      
      
    } catch (error) {
      console.log("Error", error);
      console.error(`Error ${isEditMode ? 'actualizando' : 'creando'} usuario:`, error);
      showNotification(error.response?.data?.message || error.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} el usuario`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="turns-report-page">
      <div className="turns-report-container">
        <div className="report-card">
          <h1 className="turns-report-title">{isEditMode ? 'Editar Usuario' : 'Formulario de Usuario'}</h1>
          
          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-section">
              <h2>Información Personal</h2>
              
              <div className="form-group">
                <label htmlFor="number_document">Número de Documento</label>
                <input
                  type="number"
                  id="number_document"
                  name="number_document"
                  value={formData.number_document}
                  onChange={handleInputChange}
                  required
                  disabled={isEditMode} // Deshabilitar en modo edición
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_names">Nombres</label>
                  <input
                    type="text"
                    id="first_names"
                    name="first_names"
                    value={formData.first_names}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="last_names">Apellidos</label>
                  <input
                    type="text"
                    id="last_names"
                    name="last_names"
                    value={formData.last_names}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h2>Información de Cuenta</h2>
              
              <div className="form-group">
                <label htmlFor="alias_user">Alias de Usuario</label>
                <input
                  type="text"
                  id="alias_user"
                  name="alias_user"
                  value={formData.alias_user}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">
                  {isEditMode ? 'Nueva Contraseña (dejar en blanco para mantener)' : 'Contraseña'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  onChange={handleInputChange}
                  required={!isEditMode} // Solo es requerido en modo creación
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="role_name">Rol</label>
                  <select
                    id="role_name"
                    name="role_name"
                    value={formData.role_name}
                    onChange={handleRoleChange}
                    required
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Gerente">Gerente</option>
                    <option value="Jefe">Jefe</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="status_user">Estado Usuario</label>
                  <select
                    id="status_user"
                    name="status_user"
                    value={formData.status_user ? 'active' : 'inactive'}
                    onChange={handleStatusChange}
                    required
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Mostrar el selector de ubicación solo para roles que lo necesiten */}
            {showLocationSelector && (
              <div className="form-section">
                <h2>Ubicación</h2>
                <LocationSelector 
                  role={formData.role_name}
                  onStoresChange={handleStoresChange}
                  onDepartmentsChange={handleDepartmentsChange}
                  initialStores={formData.stores}
                  initialDepartments={formData.departments}
                />
              </div>
            )}
            
            <div className="form-actions">
              <button 
                type="button" 
                className="back-button" 
                onClick={onClose}
              >
                Volver
              </button>
              <button 
                type="submit" 
                className="submit-button" 
                disabled={isLoading}
              >
                {isLoading ? 
                  (isEditMode ? 'Actualizando...' : 'Creando...') : 
                  (isEditMode ? 'Actualizar Usuario' : 'Crear Usuario')}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Notification component */}
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

UserForm.propTypes = {
  user: PropTypes.object, // No es obligatorio, será null para creación
  onClose: PropTypes.func.isRequired,
};

export default UserForm;