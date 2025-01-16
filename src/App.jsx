import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar.jsx';
import './styles/App.css'; // Estilos específicos para el App

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="content">
          <Routes>
            <Route path="/" element={<h1>Bienvenido</h1>} />
            <Route path="/mallas/crear" element={<h1>Crear Mallas</h1>} />
            <Route path="/mallas/reportes" element={<h1>Reportes</h1>} />
            <Route path="/empleados/editar" element={<h1>Editar Empleados</h1>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
