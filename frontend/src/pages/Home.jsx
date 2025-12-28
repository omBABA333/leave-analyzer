import React from "react";
import UploadExcel from "../components/UploadExcel";

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* We only need this component. It handles the upload AND the dashboard display. */}
      <UploadExcel />
    </div>
  );
};

export default Home;
