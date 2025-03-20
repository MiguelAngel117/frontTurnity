import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Search, UserPlus, Edit, Trash2, ChevronDown, SortAsc, SortDesc } from 'lucide-react';
import UserForm from '../components/users/UserForm';
import './UsersPage.css';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Roles disponibles en el sistema
  const roles = ['Administrador', 'Gerente', 'Jefe'];
  
  // Estados de usuario
  const statusOptions = [
    { value: 1, label: 'Activo' },
    { value: 0, label: 'Inactivo' }
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get('/users');
      console.log('Usuarios cargados:', data);
      setUsers(data);
      setFilteredUsers(data);
      setLoading(false);
    } catch (error) {
      setError('Error al cargar la lista de usuarios', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Filtrar usuarios basado en los criterios de búsqueda
    let result = [...users];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.alias_user.toLowerCase().includes(term) ||
        user.first_names.toLowerCase().includes(term) ||
        user.last_names.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.number_document.includes(term)
      );
    }
    
    if (roleFilter) {
      result = result.filter(user => user.role_name === roleFilter);
    }
    
    if (statusFilter !== '') {
      const statusValue = parseInt(statusFilter);
      result = result.filter(user => user.status_user === statusValue);
    }
    
    // Ordenar por nombre
    result.sort((a, b) => {
      const nameA = `${a.first_names} ${a.last_names}`.toLowerCase();
      const nameB = `${b.first_names} ${b.last_names}`.toLowerCase();
      
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
    
    setFilteredUsers(result);
  }, [searchTerm, roleFilter, statusFilter, sortOrder, users]);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (userId) => {
    const userToEdit = users.find(user => user.number_document === userId);
    setSelectedUser(userToEdit);
    setShowUserForm(true);
    if (showUserForm) {
      return <UserForm user={selectedUser} onClose={closeUserForm} />;
    }
  };

  const handleDeleteUser = async (userId) => {
    // Confirmar eliminación
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await api.delete(`/users/${userId}`);
          loadUsers();
      } catch (error) {
        setError('Error al eliminar el usuario', error);
      }
    }
  };

  const getStatusLabel = (status) => {
    return status === 1 ? 'Activo' : 'Inactivo';
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const closeUserForm = () => {
    setShowUserForm(false);
    loadUsers(); // Recargar usuarios después de guardar
  };

  if (showUserForm) {
    return <UserForm user={selectedUser} onClose={closeUserForm} />;
  }

  return (
      <div className="turns-report-container">
        <div className="report-card">
          <h1 className="turns-report-title">Gestión de Usuarios</h1>
          
          {/* Sección de acciones y filtros */}
          <div className="actions-filters-container">
            {/* Filtros - Ahora a la izquierda */}
            <div className="filters-section">
              {/* Búsqueda por texto */}
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="select-input"
                />
                <Search size={18} className="search-icon" />
              </div>
              
              {/* Filtro por rol */}
              <div className="select-container">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="select-input"
                >
                  <option value="">Todos los roles</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <div className="select-arrow">
                  <ChevronDown size={16} />
                </div>
              </div>
              
              {/* Filtro por estado */}
              <div className="select-container">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select-input"
                >
                  <option value="">Todos los estados</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <div className="select-arrow">
                  <ChevronDown size={16} />
                </div>
              </div>
              
              {/* Botón para ordenar */}
              <button 
                onClick={toggleSortOrder}
                className="sort-button"
                title={sortOrder === 'asc' ? 'Ordenado ascendente' : 'Ordenado descendente'}
              >
                {sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
                Ordenar por nombre
              </button>
            </div>
            
            {/* Botón de crear usuario - Ahora a la derecha */}
            <button 
              onClick={handleCreateUser}
              className="create-user-btn"
            >
              <UserPlus size={18} />
              Crear Usuario
            </button>
          </div>
          
          {/* Mensaje de carga */}
          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Cargando usuarios...</p>
            </div>
          )}
          
          {/* Mensaje de error */}
          {error && (
            <div className="error-message" role="alert">
              <p>{error}</p>
            </div>
          )}
          
          {/* Tabla de usuarios */}
          {!loading && !error && (
            <>
              {filteredUsers.length > 0 ? (
                <div className="table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Nombre completo</th>
                        <th>Documento</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.number_document}>
                          <td>{user.alias_user}</td>
                          <td>{`${user.first_names} ${user.last_names}`}</td>
                          <td>{user.number_document}</td>
                          <td>{user.email}</td>
                          <td>{user.role_name}</td>
                          <td>
                            <span
                              className={`status-badge ${user.status_user === 1 ? 'active' : 'inactive'}`}
                            >
                              {getStatusLabel(user.status_user)}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => handleEditUser(user.number_document)}
                                className="action-button edit"
                                title="Editar usuario"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.number_document)}
                                className="action-button delete"
                                title="Eliminar usuario"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-data-message">
                  <p>No se encontraron usuarios con los criterios de búsqueda.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
  );
};

export default UsersPage;