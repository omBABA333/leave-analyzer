import React from "react";

const UploadExcel = ({ onUpload }) => {

  const handleFileChange = async(e) => {
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
    method: "POST",
    body: formData
    });

    const data = await res.json();
    console.log(data);
    
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
