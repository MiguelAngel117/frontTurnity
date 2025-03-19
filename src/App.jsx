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
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage'

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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
        // Opcional: Hacer una petición a un endpoint que valide el token
        // Si no tienes este endpoint, simplemente establece la autenticación como verdadera
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

  // Muestra loading mientras verifica la autenticación
  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public route */}
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
        
        {/* Protected routes - redirect to login if not authenticated */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <div className="app">
                <Topbar 
                  isSidebarOpen={isSidebarOpen} 
                  toggleSidebar={toggleSidebar} 
                  onLogout={handleLogout}
                />
                <Sidebar isOpen={isSidebarOpen} />
                <div className="app-content">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/schedules/create" element={<CreateSchedules />} />
                    <Route path="/schedules/reports" element={<ReportsSchedules />} />
                    <Route path="/employees/edit" element={<EditEmployees />} />
                    <Route path="/reports/salary" element={<ReportSalary />} />
                    <Route path="/schedules/report_turns" element={<TurnsReport />} />
                    <Route path="/users/" element={<UsersPage />} />
                    
                    <Route path="/profile" element={<ProfilePage />} />
                  </Routes>
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;