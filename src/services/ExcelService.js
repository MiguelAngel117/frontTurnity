// src/services/ExcelService.js
import * as XLSX from 'xlsx';

class ExcelService {
  /**
   * Genera y descarga un archivo Excel a partir de los datos proporcionados
   * @param {Array} data - Datos para el Excel
   * @param {string} fileName - Nombre del archivo para descargar
   * @returns {boolean} - Indica si la generación fue exitosa
   */
  static generateExcel(data, fileName = 'reporte.xlsx') {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error('No hay datos para generar el Excel');
      return false;
    }

    try {
      // Crear una hoja de trabajo
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Ajustar el ancho de las columnas
      const columnsWidth = [
        { wch: 15 }, // codigo_persona
        { wch: 30 }, // nombre
        { wch: 10 }, // jornada
        { wch: 12 }, // codigo_turno
        { wch: 15 }, // inicio_turno
        { wch: 15 }, // termino_turno
        { wch: 10 }, // horas
        { wch: 15 }, // turno
        { wch: 15 }, // cedula_jefe
        { wch: 25 }, // nombre_jefe
        { wch: 30 }, // tienda
        { wch: 25 }, // departamento
        { wch: 25 }, // posicion
      ];
      
      worksheet['!cols'] = columnsWidth;

      // Crear un libro
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');

      // Generar el archivo y descargarlo
      XLSX.writeFile(workbook, fileName);
      
      return true;
    } catch (error) {
      console.error('Error al generar el Excel:', error);
      return false;
    }
  }

  /**
   * Obtiene el nombre del mes en español
   * @param {number} month - Número del mes (1-12)
   * @returns {string} Nombre del mes en español
   */
  static getMonthName(month) {
    const monthNumber = parseInt(month);
    if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      return '';
    }
    
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    return monthNames[monthNumber - 1];
  }
}

export default ExcelService;