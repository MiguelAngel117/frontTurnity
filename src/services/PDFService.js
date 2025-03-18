import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import autoTable from 'jspdf-autotable';

class PDFService {
  /**
   * Genera un PDF con los turnos de los empleados
   * @param {Array} employeeShifts - Array de datos de turnos por empleado
   * @param {Object} store - Información de la tienda seleccionada
   * @param {Object} department - Información del departamento seleccionada
   * @param {String} monthName - Nombre del mes seleccionado
   * @returns {Promise<Uint8Array>} - Bytes del PDF generado
   */

  async generateEmployeeShiftsPDF(employeeShifts, store, department, monthName) {
    // Make sure employeeShifts is an array
    const shiftsArray = Array.isArray(employeeShifts) 
      ? employeeShifts 
      : (employeeShifts.employeeShifts || []);
    
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
      
      // Shifts table in calendar format
      this._drawCalendarTable(doc, weeklyShifts);
      
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
    const pageWidth = doc.internal.pageSize.width;
    
    // Logo o nombre de la empresa en la esquina superior izquierda
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 63, 114); // Azul corporativo
    doc.text('REPORTE DE TURNOS', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80); // Gris para la fecha
    doc.text(`Fecha: ${currentDate}`, pageWidth - 10, 10, { align: 'right' });
    doc.text(`Página: ${pageCount}`, pageWidth - 10, 15, { align: 'right' });
    
    // Información de la tienda, departamento y mes en una línea
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 63, 114); // Azul corporativo
    const storeInfo = `Tienda: ${store.name_store} | Departamento: ${department.name_department} | Mes: ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
    doc.text(storeInfo, pageWidth / 2, 25, { align: 'center' });
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 63, 114); // Azul corporativo
    doc.line(10, 30, pageWidth - 10, 30);
  }
  
  /**
   * Dibuja la información del empleado
   */
  _drawEmployeeInfo(doc, employee) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 63, 114); // Azul corporativo
    doc.text('INFORMACIÓN DEL EMPLEADO', 14, 38);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80); // Gris para la información
    
    // Información del empleado en una línea
    const employeeInfo = `Nombre: ${employee.name || 'N/A'} | Documento: ${employee.number_document || 'N/A'} | Cargo: ${employee.position || 'N/A'} | Jornada laboral: ${employee.working_day || 'N/A'} horas`;
    doc.text(employeeInfo, 14, 46);
    
    // Línea separadora
    doc.setLineWidth(0.3);
    doc.setDrawColor(200, 200, 200); // Gris claro
    doc.line(10, 50, 287, 50);
  }
  
  /**
   * Dibuja la tabla de turnos en formato calendario
   */
  _drawCalendarTable(doc, weeklyShifts) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 63, 114); // Azul corporativo
    doc.text('TURNOS ASIGNADOS', 14, 58);
    
    // Preparar datos para la tabla de calendario
    const tableHead = [
      ['Semana / Jornada', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    ];
    
    const specialOptions = ["CUMPLEAÑOS", "VACACIONES", "INCAPACIDAD", "JURADO VOT", "DIA_FAMILIA", "LICENCIA", "DIA_DISFRUTE"];

    const tableBody = weeklyShifts.map(week => {
      let weeklyHours = week.working_day;
      // Agregar número de semana y jornada
      const weekRow = [`Semana ${week.week}\n(${weeklyHours} horas)`];
      
      // Organizar los turnos por día de la semana
      const weekShifts = this._organizeShiftsByWeekday(week.shifts);
      
      // Agregar cada día a la fila
      for (let day = 1; day <= 7; day++) {
        const shift = weekShifts[day] || null;
        
        if (!shift) {
          weekRow.push('-');
          continue;
        }
        
        let cellContent = '';
        
        // Formatear fecha (solo día del mes)
        if (shift.shift_date) {
          try {
            const shiftDate = new Date(shift.shift_date);
            cellContent += `${shiftDate.getDate()}\n`;
          } catch (e) {
            console.error("Error formateando fecha:", e);
          }
        }
        
        // Determinar si es día libre o especial
        if (shift.turn === 'X' || shift.hours === 0) {
          cellContent += 'LIBRE';
        } else if(specialOptions.includes(shift.turn)) {
          cellContent += `${shift.turn}`;
        } else {
          // Turno normal
          cellContent += `Horas: ${shift.hours}\n`;
          cellContent += `Hora Inicio: ${shift.initial_hour ? shift.initial_hour.substring(0, 5) : '-'} \n`;
          cellContent += `Hora Fin: ${shift.end_hour ? shift.end_hour.substring(0, 5) : '-'}\n`;
          cellContent += `Descanso: ${shift.break !== '01:00:00' ? shift.break : '-'}`;
        }
        
        weekRow.push(cellContent);
      }
      
      return weekRow;
    });
    
    // Crear la tabla con autoTable
    autoTable(doc, {
      startY: 62,
      head: tableHead,
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 63, 114],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      styles: {
        cellPadding: 2,
        fontSize: 8,
        lineWidth: 0.1,
        valign: 'top'
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' }, // Semana / Jornada
        1: { cellWidth: 36 }, // Lunes
        2: { cellWidth: 36 }, // Martes
        3: { cellWidth: 36 }, // Miércoles
        4: { cellWidth: 36 }, // Jueves
        5: { cellWidth: 36 }, // Viernes
        6: { cellWidth: 36 }, // Sábado
        7: { cellWidth: 36 }  // Domingo
      },
      didDrawCell: (data) => {
        // Celdas con estilos especiales (LIBRE y turnos especiales)
        if (data.column.index > 0 && data.cell.text && data.cell.text.length > 0) {
            const cellText = data.cell.text.join(' ');
            const lines = cellText.split('\n');
            const dayNumber = lines[0];
            const eventType = lines[1] || '';
            
            // Dibujar el encabezado de fecha para todos los días (normales y especiales)
            if (dayNumber && !isNaN(dayNumber)) {
              // Dibujar encabezado de fecha con fondo azul claro
              doc.setFillColor(230, 240, 255);  // Azul muy claro
              doc.rect(data.cell.x, data.cell.y, data.cell.width, 5, 'F');
              
              // Dibujar día con estilo especial
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9);
              doc.setTextColor(0, 63, 114);
              doc.text(dayNumber, data.cell.x + 2, data.cell.y + 3.8);
            }
            
            // Verificar si es un día especial
            if (eventType.includes('LIBRE') || specialOptions.some(option => eventType.includes(option))) {
              // Estilo para días libres o turnos especiales
              const cellMiddleX = data.cell.x + data.cell.width / 2;
              const cellMiddleY = data.cell.y + data.cell.height / 2 + 5; // Ajustado para quedar debajo del número
              
              // Dibujar fondo de color
              doc.setFillColor(240, 240, 240);  // Gris muy claro
              doc.rect(data.cell.x, data.cell.y + 5, data.cell.width, data.cell.height - 5, 'F');
              
              // Dibujar texto centrado
              doc.setFontSize(9);
              doc.setFont('helvetica', 'bold');
              
              // Diferentes colores para diferentes tipos de turnos
              if (eventType.includes('LIBRE')) {
                doc.setTextColor(0, 128, 0);  // Verde para libres
              } else if (eventType.includes('VACACIONES')) {
                doc.setTextColor(0, 102, 204);  // Azul para vacaciones
              } else if (eventType.includes('INCAPACIDAD')) {
                doc.setTextColor(204, 0, 0);  // Rojo para incapacidad
              } else {
                doc.setTextColor(102, 0, 102);  // Púrpura para otros turnos especiales
              }
              
              // Dibujar tipo de turno centrado
              doc.text(eventType, cellMiddleX, cellMiddleY, { align: 'center' });
          } else {
            // Estilo para días normales
            // Dibujar fondo de color claro
            const dayNumber = data.cell.text[0];
            if (dayNumber && !isNaN(dayNumber)) {
              // Dibujar encabezado de fecha
              doc.setFillColor(230, 240, 255);  // Azul muy claro
              doc.rect(data.cell.x, data.cell.y, data.cell.width, 5, 'F');
              
              // Dibujar día con estilo especial
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9);
              doc.setTextColor(0, 63, 114);
              doc.text(dayNumber, data.cell.x + 2, data.cell.y + 3.8);
            }
          }
        }
      }
    });
  }
  
  /**
   * Organiza los turnos por día de la semana (1=Lunes, 7=Domingo)
   */
  _organizeShiftsByWeekday(shifts) {
    const weekdayShifts = {};
    shifts.forEach(shift => {
      if (shift.shift_date) {
        try {
          const shiftDate = new Date(shift.shift_date);
          shiftDate.setDate(shiftDate.getDate() + 1);
          let weekday = shiftDate.getDay();
          weekday = weekday === 0 ? 7 : weekday; // Convertir 0 (Domingo) a 7
          weekdayShifts[weekday] = shift;
        } catch (e) {
          console.error("Error procesando fecha:", e);
        }
      }
    });
    console.log(weekdayShifts);
    return weekdayShifts;
  }
  
  /**
   * Dibuja el pie de página
   */
  _drawFooter(doc, pageNumber) {
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 120, 120);  // Gris para el pie de página
    doc.text('Este documento es informativo y está sujeto a cambios según las necesidades operativas.', pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    // Agregar número de página
    if (pageNumber) {
      doc.text(`Página ${pageNumber}`, pageWidth - 10, pageHeight - 10, { align: 'right' });
    }
    
    // Línea separadora
    doc.setLineWidth(0.3);
    doc.setDrawColor(200, 200, 200);  // Gris claro
    doc.line(10, pageHeight - 20, pageWidth - 10, pageHeight - 20);
  }
}

// Exportar instancia
export const pdfService = new PDFService();