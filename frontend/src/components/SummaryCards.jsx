import React from "react";

const SummaryCards = ({ data = [] }) => {
  const totalDays = data.length;

  return (
    <div className="summary">
      <div className="card">
        <h4>Total Working Days</h4>
        <p>{totalDays}</p>
      </div>
    </div>
  );
};

export default SummaryCards;
