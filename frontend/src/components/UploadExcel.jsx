import React, { useState } from "react";

const UploadExcel = () => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      
      if (response.ok) {
        setData(result);
      } else {
        alert("Server Error: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      alert("Network Error: Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Leave & Productivity Analyzer</h1>
        <p className="text-gray-500 mb-8">NMIMS Intern Project • Upload monthly attendance sheet (.xlsx)</p>

        {/* Upload Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8 flex items-center gap-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100 cursor-pointer"
          />
          <button 
            onClick={handleUpload}
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-medium text-white transition-colors
              ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? "Analyzing..." : "Analyze Productivity"}
          </button>
        </div>

        {/* Results Section */}
        {data && (
          <div className="animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-blue-500">
                <h3 className="text-xs font-bold text-gray-400 uppercase">Productivity Score</h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className={`text-3xl font-bold ${parseFloat(data.summary.productivityScore) >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                    {data.summary.productivityScore}%
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-red-500">
                <h3 className="text-xs font-bold text-gray-400 uppercase">Leaves Taken</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-800">{data.summary.leavesTaken}</span>
                  <span className="text-gray-400 ml-2">/ {data.summary.leavesAllowed} allowed</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-green-500">
                <h3 className="text-xs font-bold text-gray-400 uppercase">Actual Hours</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">{data.summary.totalWorkedHours}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-gray-500">
                <h3 className="text-xs font-bold text-gray-400 uppercase">Expected Hours</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">{data.summary.totalExpectedHours}</p>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-bold text-gray-700">Daily Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-100 text-gray-500 uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Day</th>
                      <th className="px-6 py-3">In Time</th>
                      <th className="px-6 py-3">Out Time</th>
                      <th className="px-6 py-3">Hours Worked</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.details.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4">{row.Date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium 
                            ${row.DayType === 'Saturday' ? 'bg-orange-100 text-orange-800' : 
                              row.DayType === 'Sunday' ? 'bg-gray-200 text-gray-600' : 'bg-blue-50 text-blue-600'}`}>
                            {row.DayType}
                          </span>
                        </td>
                        <td className="px-6 py-4">{row.InTime}</td>
                        <td className="px-6 py-4">{row.OutTime}</td>
                        <td className="px-6 py-4 font-mono font-bold">{row.workedHours}</td>
                        <td className="px-6 py-4">
                          {row.isLeave ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Leave / Absent
                            </span>
                          ) : row.workedHours > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Present
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadExcel;