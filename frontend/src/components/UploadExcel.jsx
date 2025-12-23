import React from "react";

const UploadExcel = ({ onUpload }) => {

  const handleFileChange = async(e) => {
    //const file = e.target.files[0];

    if (!file) {
    alert("Please select a file");
    return;
    }
    

    const formData = new FormData();
    formData.append("file", file);

     try {
      const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
      });

      if (!response.ok) {
        throw new Error("Upload failed");
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
      <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
    </div>
  );
};

export default UploadExcel;
