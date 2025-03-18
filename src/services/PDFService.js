import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import autoTable from 'jspdf-autotable';

class PDFService {
  /**
   * Genera un PDF con los turnos de los empleados
   * @param {Array} employeeShifts - Array de datos de turnos por empleado
   * @param {Object} store - Información de la tienda seleccionada
   * @param {Object} department - Información del departamento seleccionado
   * @param {String} monthName - Nombre del mes seleccionado
   * @returns {Promise<Uint8Array>} - Bytes del PDF generado
   */
  async generateEmployeeShiftsPDF(employeeShifts, store, department, monthName) {
    // Make sure employeeShifts is an array
    const shiftsArray = Array.isArray(employeeShifts) 
      ? employeeShifts 
      : (employeeShifts.employeeShifts || []);
    
    console.log('processed shiftsArray:', shiftsArray);
    
    // Create PDF instance in landscape orientation
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Configure fonts
    doc.setFont('helvetica');
    
    // Get current date for the header
    const currentDate = format(new Date(), 'dd/MM/yyyy HH:mm');
    
    // Variables to control position in PDF
    let pageCount = 1;
    
    // Iterate through each employee to create their shift page
    shiftsArray.forEach((employeeData, index) => {
      // Add new page if not the first entry
      if (index > 0) {
        doc.addPage();
        pageCount++;
      }
      
      // Extract employee information
      const employee = employeeData.employee || {};
      const weeklyShifts = employeeData.weeklyShifts || [];
      
      // Header
      this._drawHeader(doc, store, department, monthName, currentDate, pageCount);
      
      // Employee information
      this._drawEmployeeInfo(doc, employee);
      
      // Shifts table
      this._drawShiftsTable(doc, weeklyShifts);
      
      // Footer
      this._drawFooter(doc, pageCount);
    });
    
    // Return PDF as byte array
    return doc.output('arraybuffer');
  }
  
  /**
   * Dibuja el encabezado del PDF
   */
  _drawHeader(doc, store, department, monthName, currentDate, pageCount) {
    // Logo o nombre de la empresa en la esquina superior izquierda
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE TURNOS', 149, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${currentDate}`, 284, 10, { align: 'right' });
    doc.text(`Página: ${pageCount}`, 284, 15, { align: 'right' });
    
    // Información de la tienda y departamento
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Tienda: ${store.name_store}`, 14, 25);
    doc.text(`Departamento: ${department.name_department}`, 14, 32);
    doc.text(`Mes: ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`, 14, 39);
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(10, 42, 287, 42);
  }
  
  /**
   * Dibuja la información del empleado
   */
  _drawEmployeeInfo(doc, employee) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL EMPLEADO', 14, 50);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${employee.name || 'N/A'}`, 14, 58);
    doc.text(`Documento: ${employee.number_document || 'N/A'}`, 14, 65);
    doc.text(`Cargo: ${employee.position || 'N/A'}`, 14, 72);
    doc.text(`Jornada laboral: ${employee.working_day || 'N/A'} horas`, 14, 79);
    
    // Línea separadora
    doc.setLineWidth(0.3);
    doc.line(10, 84, 287, 84);
  }
  
  /**
   * Dibuja la tabla de turnos semanales
   */
  _drawShiftsTable(doc, weeklyShifts) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TURNOS ASIGNADOS', 14, 92);
    
    // Crear tablas para cada semana
    let yPosition = 100;
    
    weeklyShifts.forEach((week) => {
      // Si no hay espacio suficiente para otra tabla, añadir nueva página
      if (yPosition > 180) {
        doc.addPage();
        yPosition = 30;
        this._drawFooter(doc);
      }
      
      // Título de la semana
      const weekStartDate = week.week_start_date ? 
        format(new Date(week.week_start_date), 'dd/MM/yyyy') : 
        `Semana ${week.week}`;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Semana ${week.week} (${weekStartDate}) - Jornada: ${week.working_day} horas`, 14, yPosition);
      
      // Preparar datos para la tabla
      const shifts = week.shifts || [];
      const tableData = shifts.map(shift => {
        // Formatear fecha
        let shiftDate = 'N/A';
        if (shift.shift_date) {
          try {
            shiftDate = format(new Date(shift.shift_date), 'dd/MM/yyyy (EEEE)', { locale: es });
            // Capitalizar primera letra del día
            shiftDate = shiftDate.charAt(0).toUpperCase() + shiftDate.slice(1);
          } catch (e) {
            console.error("Error formateando fecha:", e);
          }
        }
        
        // Determinar si es día libre
        const isDayOff = shift.turn === 'X' || shift.hours === 0;
        
        return [
          shiftDate,
          isDayOff ? 'DESCANSO' : (shift.turn || 'N/A'),
          isDayOff ? '-' : (shift.hours || 0),
          isDayOff ? '-' : (shift.initial_hour ? shift.initial_hour.substring(0, 5) : 'N/A'),
          isDayOff ? '-' : (shift.end_hour ? shift.end_hour.substring(0, 5) : 'N/A'),
          isDayOff ? '-' : (shift.break || 'N/A')
        ];
      });
      
      // Usar jspdf-autotable explícitamente
      autoTable(doc, {
        startY: yPosition + 5,
        head: [['Fecha', 'Turno', 'Horas', 'Hora Inicio', 'Hora Fin', 'Descanso']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [73, 80, 87],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          cellPadding: 2,
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 60 }, // Fecha
          1: { cellWidth: 30 }, // Turno
          2: { cellWidth: 20 }, // Horas
          3: { cellWidth: 30 }, // Hora Inicio
          4: { cellWidth: 30 }, // Hora Fin
          5: { cellWidth: 40 }  // Descanso
        }
      });
      
      // Actualizar posición Y para la siguiente tabla
      const finalY = doc.lastAutoTable.finalY;
      yPosition = finalY + 15;
    });
  }
  
  /**
   * Dibuja el pie de página
   */
  _drawFooter(doc, pageNumber) {
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Este documento es informativo y está sujeto a cambios según las necesidades operativas.', 149, pageHeight - 15, { align: 'center' });
    
    // Agregar número de página
    if (pageNumber) {
      doc.text(`Página ${pageNumber}`, 287, pageHeight - 10, { align: 'right' });
    }
    
    // Línea separadora
    doc.setLineWidth(0.3);
    doc.line(10, pageHeight - 20, 287, pageHeight - 20);
  }
}

// Exportar instancia
export const pdfService = new PDFService();