import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './components/layout/SideBar.jsx';
import Topbar from './components/layout/TopBar.jsx';
import CreateSchedules from './pages/CreateShifts.jsx';
import ReportsSchedules from './pages/ReportShifts.jsx';
import EditEmployees from './pages/EditEmployees.jsx';
import './styles/App.css';
import HomePage from './pages/Homepage.jsx';

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
      <div className="app">
        <Topbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={isSidebarOpen} />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/schedules/create" element={<CreateSchedules />} />
            <Route path="/schedules/reports" element={<ReportsSchedules />} />
            <Route path="/employees/edit" element={<EditEmployees />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
