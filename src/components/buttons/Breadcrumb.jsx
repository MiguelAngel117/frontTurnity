//import { useState, useEffect } from "react";
import "./Breadcrumb.css";
import PropTypes from "prop-types";

const Breadcrumb = ({ items, onItemClick }) => {
  return (
    <div className="breadcrumb">
      {items.map((item, index) => (
        <span key={index}>
          <span
            className="breadcrumb-item"
            onClick={() => onItemClick(item, index)}
          >
            {item.label}
          </span>
          {index < items.length - 1 && " > "}
        </span>
      ))}
    </div>
  );
};

Breadcrumb.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired, // 'store', 'department', etc.
    })
  ).isRequired,
  onItemClick: PropTypes.func.isRequired,
};

export default Breadcrumb;