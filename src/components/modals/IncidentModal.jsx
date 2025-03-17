import PropTypes from 'prop-types';
import "./IncidentModal.css";

const IncidentModal = ({ isOpen, onClose, incidents }) => {
  if (!isOpen) return null;

  return (
    <div className="incident-modal-overlay">
      <div className="incident-modal">
        <div className="incident-modal-header">
          <h3>Incidencias</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="incident-modal-body">
          <table className="incidents-table">
            <thead>
              <tr>
                <th>Id Empleado</th>
                <th>Observación</th>
              </tr>
            </thead>
          </table>
          <div className="incidents-table-body-container">
            <table className="incidents-table">
              <tbody>
                {incidents.map((incident, index) => (
                  <tr 
                    key={index} 
                    className={incident.type === "error" ? "error-row" : "warning-row"}
                  >
                    <td>{incident.id_employee}</td>
                    <td>{incident.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="incident-modal-footer">
          <button className="ok-button" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
};

IncidentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  incidents: PropTypes.arrayOf(
    PropTypes.shape({
      id_employee: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      message: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired
    })
  ).isRequired
};

export default IncidentModal;