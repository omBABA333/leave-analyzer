import React, { useState } from "react";

const UploadExcel = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    }
  };

  return (
    <div className="card">
      <h3>Upload Attendance Excel</h3>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
      />

      <button onClick={handleUpload} style={{ marginTop: "10px" }}>
        Upload Excel
      </button>
    </div>
  );
};

export default UploadExcel;
