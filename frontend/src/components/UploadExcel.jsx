import React, { useState } from "react";

const UploadExcel = () => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null); // Store response data

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    // 1. STOP PAGE REFRESH
    e.preventDefault(); 
    console.log("Button clicked...");

    if (!file) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("Sending request to /api/upload...");
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Success Data:", result); // CHECK THIS IN CONSOLE
      setData(result); // Save data to show on screen
      alert(result.message);

    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed: " + error.message);
    }
  };

  return (
    <div className="p-4 border rounded shadow bg-white max-w-lg mx-auto mt-10">
      <h3 className="text-xl font-bold mb-4">Upload Attendance Excel</h3>

      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button 
          type="submit" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Upload & Analyze
        </button>
      </form>

      {/* DEBUG: Display the data on screen so we know it works */}
      {data && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs overflow-auto h-64">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default UploadExcel;