import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorPage from './pages/ErrorPage.jsx';
import Sidebar from './components/layout/SideBarTurn.jsx';
import Topbar from './components/layout/TopBar.jsx';
import CreateSchedules from './pages/CreateShifts.jsx';
import ReportsSchedules from './pages/ReportShifts.jsx';
import EditEmployees from './pages/EditEmployees.jsx';
import Login from './components/auth/LoginTur.jsx';
import ReportSalary from './pages/ReportSalary.jsx';
import TurnsReport from './pages/TurnsReport.jsx';
import UsersPage from './pages/UsersPage.jsx';
import './styles/App.css';
import HomePage from './pages/homepage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  // Verificación más robusta de la autenticación
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
    
      try {
        // Extraer y validar la información del usuario
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('Usuario almacenado en checkAuth:', storedUser); // Debugging
        
        if (storedUser && storedUser.roles && storedUser.roles.length > 0) {
          setUserRole(storedUser.roles[0]);
          console.log('Rol establecido en checkAuth:', storedUser.roles[0]); // Debugging
        } else {
          console.warn('No se encontró información de roles en el usuario almacenado');
          // Asignar rol predeterminado para evitar problemas de navegación
          setUserRole('Usuario');
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
  
    checkAuth();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUserRole('');
  };

  // Controlar acceso a rutas según rol
  const hasAccess = (allowedRoles) => {
    console.log('Verificando acceso. Rol actual:', userRole, 'Roles permitidos:', allowedRoles); // Debugging
    
    // Si el rol es Administrador, siempre tiene acceso
    if (userRole === 'Administrador') {
      return true;
    }
    
    // Verificar si el rol actual está en la lista de roles permitidos
    return allowedRoles.includes(userRole);
  };

  // Verificar si el usuario está autenticado y tiene acceso a una ruta
  const renderProtectedRoute = (Component, allowedRoles) => {
    if (!isAuthenticated) {
      console.log('No autenticado, redirigiendo a login'); // Debugging
      return <Navigate to="/login" replace />;
    }
    
    const access = hasAccess(allowedRoles);
    console.log('¿Tiene acceso?', access); // Debugging
    
    if (access) {
      return (
        <div className="app">
          <Topbar
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            onLogout={handleLogout}
          />
          <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
          <div className="app-content">
            <Component />
          </div>
        </div>
      );
    }
    
    console.log('Sin acceso, redirigiendo a home'); // Debugging
    return <Navigate to="/" replace />;
  };

  // Muestra loading mientras verifica la autenticación
  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorPage}>
      <Router>
        <Routes>
          {/* Ruta de login */}
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <Login onLoginSuccess={(userData) => {
                  console.log('Login exitoso, datos recibidos:', userData);
                  setIsAuthenticated(true);
                  
                  // IMPORTANTE: Establecer el rol del usuario aquí
                  if (userData && userData.roles && userData.roles.length > 0) {
                    setUserRole(userData.roles[0]);
                    console.log('Rol establecido después de login:', userData.roles[0]);
                  } else {
                    // Si no hay rol específico, establecer uno por defecto
                    console.warn('No se encontraron roles en los datos de usuario, asignando rol por defecto');
                    setUserRole('Usuario');
                  }
                }} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          
          {/* Página principal */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <div className="app">
                  <Topbar
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    onLogout={handleLogout}
                  />
                  <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                  <div className="app-content">
                    <HomePage />
                  </div>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Rutas accesibles para todos los roles */}
          <Route
            path="/profile"
            element={
              isAuthenticated ? (
                <div className="app">
                  <Topbar
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    onLogout={handleLogout}
                  />
                  <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                  <div className="app-content">
                    <ProfilePage />
                  </div>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Rutas compartidas por Administrador, Gerente y Jefe */}
          <Route
            path="/schedules/create"
            element={renderProtectedRoute(CreateSchedules, ['Administrador', 'Gerente', 'Jefe'])}
          />

          <Route
            path="/schedules/report_turns"
            element={renderProtectedRoute(TurnsReport, ['Administrador', 'Gerente', 'Jefe'])}
          />

          {/* Rutas exclusivas para Administrador */}
          <Route
            path="/employees/edit"
            element={renderProtectedRoute(EditEmployees, ['Administrador'])}
          />

          <Route
            path="/reports/salary"
            element={renderProtectedRoute(ReportSalary, ['Administrador'])}
          />

          <Route
            path="/users"
            element={renderProtectedRoute(UsersPage, ['Administrador'])}
          />

          <Route
            path="/schedules/reports"
            element={renderProtectedRoute(ReportsSchedules, ['Administrador'])}
          />

          {/* Redirección para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

export default App;