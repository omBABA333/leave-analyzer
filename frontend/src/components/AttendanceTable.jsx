import React from "react";

const AttendanceTable = ({ data = [] }) => {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Date</th>
          <th>In Time</th>
          <th>Out Time</th>
          <th>Hours Worked</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan="4">No data available</td>
          </tr>
        ) : (
          data.map((row, index) => (
            <tr key={index}>
              <td>{row.date}</td>
              <td>{row.inTime}</td>
              <td>{row.outTime}</td>
              <td>{row.hours}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default AttendanceTable;
