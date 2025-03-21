  import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
  import { useState, useEffect } from 'react';
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
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (storedUser && storedUser.roles && storedUser.roles.length > 0) {
            setUserRole(storedUser.roles[0]);
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
    };

    // Controlar acceso a rutas según rol
    const hasAccess = (allowedRoles) => {
      return allowedRoles.includes(userRole) || userRole === 'Administrador';
    };

    // Verificar si el usuario está autenticado y tiene acceso a una ruta
    const renderProtectedRoute = (Component, allowedRoles) => {
      if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
      }
      
      if (hasAccess(allowedRoles)) {
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
      
      return <Navigate to="/" replace />;
    };

    // Muestra loading mientras verifica la autenticación
    if (isLoading) {
      return <div>Cargando...</div>;
    }

    return (
      <Router>
        <Routes>
          {/* Ruta de login */}
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <Login onLoginSuccess={() => setIsAuthenticated(true)} />
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
    );
  };

  export default App;