import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar.jsx';
import CreateSchedules from './pages/CreateShifts.jsx';
import ReportsSchedules from './pages/ReportShifts.jsx';
import EditEmployees from './pages/EditEmployees.jsx';
import './styles/App.css';

const App = () => {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <div className="app-content">
          <Routes>
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
