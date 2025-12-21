import React from "react";

const MonthSelector = ({ value, onChange }) => {
  return (
    <div className="card">
      <label>Select Month:</label>
      <input type="month" value={value} onChange={onChange} />
    </div>
  );
};

export default MonthSelector;
