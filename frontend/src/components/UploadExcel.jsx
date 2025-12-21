import React from "react";

const UploadExcel = ({ onUpload }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  return (
    <div className="card">
      <h3>Upload Attendance Excel</h3>
      <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
    </div>
  );
};

export default UploadExcel;
