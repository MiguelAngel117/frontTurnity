import { useState, useEffect } from 'react';
import { api } from "../../utils/api";
import LocationSelector from './LocationSelector';
import './UserForm.css';
import PropTypes from 'prop-types';

const UserForm = ({onClose}) => {
  const [formData, setFormData] = useState({
    number_document: '',
    alias_user: '',
    first_names: '',
    last_names: '',
    email: '',
    password: '',
    status_user: 1,
    role_name: 'Jefe',
    stores: [],
    departments: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLocationSelector, setShowLocationSelector] = useState(true); // Por defecto mostrar para Jefe
  const [successMessage, setSuccessMessage] = useState('');

  // Inicializa el showLocationSelector según el rol predeterminado
  useEffect(() => {
    setShowLocationSelector(formData.role_name !== 'Administrador');
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
        const dataToSend = { 
            number_document: Number(formData.number_document),
            alias_user: formData.alias_user,
            first_names: formData.first_names,
            last_names: formData.last_names,
            email: formData.email,
            password: formData.password,
            role_name: formData.role_name,
            status_user: 1 // Asegúrate de que sea un número entero
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
          
          await api.post('/users/', dataToSend);
          setSuccessMessage('Usuario creado exitosamente');
      
      // Resetear el formulario
      setFormData({
        number_document: '',
        alias_user: '',
        first_names: '',
        last_names: '',
        email: '',
        password: '',
        role_name: 'Jefe',
        status_user: 1, // Mantener el status_user
        stores: [],
        departments: []
      });
      
    } catch (error) {
      console.error("Error creating user:", error);
      setError(error.response?.data?.message || error.message || 'Error al crear el usuario');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="turns-report-page">
      <div className="turns-report-container">
        <div className="report-card">
          <h1 className="turns-report-title">Formulario de Usuario</h1>
          
          <form onSubmit={handleSubmit} className="user-form">
            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
            
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
                <label htmlFor="password">Contraseña</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
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
            </div>
            
            {/* Mostrar el selector de ubicación solo para roles que lo necesiten */}
            {showLocationSelector && (
              <div className="form-section">
                <h2>Ubicación</h2>
                <LocationSelector 
                  role={formData.role_name}
                  onStoresChange={handleStoresChange}
                  onDepartmentsChange={handleDepartmentsChange}
                />
              </div>
            )}
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button" 
                onClick={onClose}
              >
                Volver
              </button>
              <button 
                type="submit" 
                className="submit-button" 
                disabled={isLoading}
              >
                {isLoading ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
UserForm.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default UserForm;