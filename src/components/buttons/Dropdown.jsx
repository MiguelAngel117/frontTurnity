import { useState, useRef, useEffect } from "react";
import "./Dropdown.css";
import PropTypes from "prop-types";

const Dropdown = ({ 
  title, 
  items, 
  onSelect, 
  onClose,
  searchable = true,
  isOpen
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Cerrar al hacer clic fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const filteredItems = searchable
    ? items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : items;

  if (!isOpen) return null;

  return (
    <div className="dropdown-overlay">
      <div className="dropdown-modal" ref={dropdownRef}>
        <div className="dropdown-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {searchable && (
          <div className="search-container">
            <input
              type="text"
              placeholder={`Buscar ${title}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        )}
        
        <div className="dropdown-items">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="dropdown-item"
              onClick={() => {
                onSelect(item);
                setSearchTerm("");
              }}
            >
              {item.name}
            </div>
          ))}
          
          {filteredItems.length === 0 && (
            <div className="no-results">No se encontraron resultados</div>
          )}
        </div>
      </div>
    </div>
  );
};

Dropdown.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  searchable: PropTypes.bool,
  isOpen: PropTypes.bool.isRequired
};

export default Dropdown;