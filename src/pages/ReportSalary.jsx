// src/pages/ReportSalary/ReportSalary.jsx
import { useState, useMemo } from 'react';
import { api } from '../utils/api';
import ExcelService from '../services/ExcelService';
import { ChevronDown } from 'lucide-react';
import './ReportSalary.css';

const ReportSalary = () => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);

  // Obtener fecha actual para limitar la selección de meses
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Usar useMemo para evitar recalcular los meses en cada render
  const availableMonths = useMemo(() => {
    const months = [];
    for (let i = 1; i <= 12; i++) {
      // Solo incluir meses hasta el actual
      if (i <= currentMonth) {
        months.push({
          value: i,
          label: ExcelService.getMonthName(i)
        });
      }
    }
    return months;
  }, [currentMonth]);

  const handleGenerateReport = async () => {
    if (!selectedMonth) {
      setError('Por favor, selecciona un mes');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Obtener los datos del endpoint
      const response = await api.get(`/employeeshift/employee-shifts?month=${selectedMonth}`);
      
      // Manejar la respuesta específica de "No se encontraron turnos"
      if (response.status === 404) {
        setError(response.message || 'No se encontraron turnos para el período seleccionado');
        setIsLoading(false);
        return;
      }
      
      // Verificar si hay datos válidos
      if (!response || !Array.isArray(response) || response.length === 0) {
        setError('No hay datos disponibles para este mes');
        setIsLoading(false);
        return;
      }
      
      // Guardar los datos para descargar después
      setReportData(response);
      setReportGenerated(true);
      
    } catch (error) {
      // Intentar extraer el mensaje de error si existe
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al generar el reporte. Por favor intenta nuevamente.';
                          
      setError(errorMessage);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!reportData) return;
    
    const fileName = `Reporte_Turnos_${ExcelService.getMonthName(selectedMonth)}_${currentYear}.xlsx`;
    ExcelService.generateExcel(reportData, fileName);
  };

  const handleReset = () => {
    setReportGenerated(false);
    setSelectedMonth('');
    setReportData(null);
    setError('');
  };

  return (
    <div className="report-container">
      <div className="report-card">
        <h1 className="report-title">Reporte de Compensación y Salarios</h1>
        
        {/* Selector de mes - oculto cuando el reporte está generado */}
        {!reportGenerated && (
          <div className="form-group">
            <label className="form-label">
              Selecciona el mes para generar el reporte:
            </label>
            <div className="select-container">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="select-input"
                disabled={isLoading}
              >
                <option value="">Seleccionar mes</option>
                {availableMonths.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <div className="select-arrow">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="error-message" role="alert">
            <p>{error}</p>
          </div>
        )}

        {!reportGenerated ? (
          <button
            onClick={handleGenerateReport}
            disabled={isLoading || !selectedMonth}
            className={`btn btn-primary ${isLoading || !selectedMonth ? 'disabled' : ''}`}
          >
            {isLoading ? 'Generando...' : 'Generar Reporte'}
          </button>
        ) : (
          <div className="text-center">
            <div className="success-message" role="alert">
              <p className="font-bold">¡Tu reporte de compensación y salarios está listo!</p>
              <p>Has seleccionado el mes de: <strong>{ExcelService.getMonthName(parseInt(selectedMonth))}</strong></p>
              <p>Haz clic en el botón para descargar el archivo Excel.</p>
            </div>
            
            <button
              onClick={handleDownload}
              className="btn btn-success"
            >
              <svg className="download-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              Descargar Excel
            </button>
            
            <button
              onClick={handleReset}
              className="btn-link"
            >
              Generar otro reporte
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportSalary;