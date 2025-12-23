import React, { useState } from "react";
import UploadExcel from "../components/UploadExcel";
import Dashboard from "../components/Dashboard";

const Home = () => {
  // eslint-disable-next-line no-unused-vars
  const [data] = useState([]);

  const handleUpload = (file) => {
    console.log("Uploaded file:", file);
    // Later: parse Excel here
  };

  return (
    <div>
      <h2>Leave & Productivity Analyzer</h2>
      <UploadExcel onUpload={handleUpload} />
      <Dashboard data={data} />
    </div>
  );
};

export default Home;
