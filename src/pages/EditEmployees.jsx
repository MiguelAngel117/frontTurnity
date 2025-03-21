import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Search, Edit, Trash2, ChevronDown, SortAsc, SortDesc } from 'lucide-react';
import './EditEmployees.css';

const EditEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage] = useState(5);
  const [stores, setStores] = useState([]);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await api.get('/employeeDep');
      console.log('Employees loaded:', data);
      setEmployees(data);
      setFilteredEmployees(data);
      
      // Extract unique stores for filter
      const uniqueStores = [...new Set(data.map(emp => emp.name_store))];
      setStores(uniqueStores);
      
      setLoading(false);
    } catch (error) {
      setError('Error loading employee list', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Filter employees based on search criteria
    let result = [...employees];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(employee => 
        employee.full_name.toLowerCase().includes(term) ||
        employee.number_document.toString().includes(term)
      );
    }
    
    if (storeFilter) {
      result = result.filter(employee => employee.name_store === storeFilter);
    }
    
    // Sort by name
    result.sort((a, b) => {
      const nameA = a.full_name.toLowerCase();
      const nameB = b.full_name.toLowerCase();
      
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
    
    setFilteredEmployees(result);
  }, [searchTerm, storeFilter, sortOrder, employees]);

  useEffect(() => {
    // When filters change, go back to first page
    setCurrentPage(1);
  }, [searchTerm, storeFilter]);

  const handleEditEmployee = (employeeId) => {
    console.log('Edit employee with ID:', employeeId);
  };

  const handleDeleteEmployee = (employeeId) => {
    console.log('Delete employee with ID:', employeeId);
  };

  const getCurrentPageEmployees = () => {
    const indexOfLastEmployee = currentPage * employeesPerPage;
    const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
    return filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  };
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="employees-container">
      <div className="employees-card">
        <h1 className="employees-title">Gestionar Empleados</h1>
        
        {/* Actions and filters container */}
        <div className="actions-filters-container">
          {/* Filters - Left side */}
          <div className="filters-section">
            {/* Text search */}
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search by name or document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="select-input"
              />
              <Search size={18} className="search-icon" />
            </div>
            
            {/* Store filter */}
            <div className="select-container">
              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="select-input"
              >
                <option value="">All stores</option>
                {stores.map(store => (
                  <option key={store} value={store}>{store}</option>
                ))}
              </select>
              <div className="select-arrow">
                <ChevronDown size={16} />
              </div>
            </div>
            
            {/* Sort button */}
            <button 
              onClick={toggleSortOrder}
              className="sort-button"
              title={sortOrder === 'asc' ? 'Ascending order' : 'Descending order'}
            >
              {sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
              Sort by name
            </button>
          </div>
        </div>
        
        {/* Loading message */}
        {loading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading employees...</p>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="error-message" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        {/* Employees table */}
        {!loading && !error && (
          <>
            {filteredEmployees.length > 0 ? (
            <>
              <div className="table-container">
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Nombre</th>
                      <th>Jornada</th>
                      <th>Tienda</th>
                      <th>Departamento</th>
                      <th>Posición</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentPageEmployees().map((employee) => (
                      <tr key={employee.id_employee_dep}>
                        <td>{employee.number_document}</td>
                        <td>{employee.full_name}</td>
                        <td>{employee.working_day}</td>
                        <td>{employee.name_store}</td>
                        <td>{employee.name_department}</td>
                        <td>{employee.name_position}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleEditEmployee(employee.id_employee_dep)}
                              className="action-button edit"
                              title="Edit employee"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee.id_employee_dep)}
                              className="action-button delete"
                              title="Delete employee"
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
              
              {/* Pagination controls */}
              <div className="pagination-controls">
                <button 
                  onClick={() => paginate(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  Previous
                </button>
                
                <div className="pagination-info">
                  Page {currentPage} of {Math.ceil(filteredEmployees.length / employeesPerPage)}
                </div>
                
                <button 
                  onClick={() => paginate(currentPage + 1)} 
                  disabled={currentPage >= Math.ceil(filteredEmployees.length / employeesPerPage)}
                  className="pagination-button"
                >
                  Next
                </button>
              </div>
            </>
            ) : (
              <div className="no-data-message">
                <p>No employees found with the current search criteria.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EditEmployees;