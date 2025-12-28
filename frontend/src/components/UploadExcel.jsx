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
    if (!file) return alert("No file Uploaded:<");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (res.ok) setData(result);
      else alert(result.error);
    } catch (err) {
      alert("Uploading failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-indigo-700">Leave & Productivity Analyzer</h1>
            <p className="text-gray-500 text-sm mt-1">Om Aher | Intern Project | MPSTME</p>
          </div>
          
          {/* Upload Form */}
          <form onSubmit={handleUpload} className="flex gap-3 bg-white p-2 rounded shadow-sm border">
            <input 
              type="file" 
              accept=".xlsx" 
              onChange={handleFileChange}
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <button 
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium transition"
            >
              {loading ? "Processing..." : "Analyze"}
            </button>
          </form>
        </div>

        {data && (
          <div className="animate-fade-in-up">
            {/* 1. Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <Card label="Employee" value={data.summary.employeeName} />
              <Card label="Productivity" value={`${data.summary.productivity}%`} 
                    color={parseFloat(data.summary.productivity) > 90 ? "text-green-600" : "text-yellow-600"} />
              <Card label="Leaves Used" value={`${data.summary.leaves} / 2`} 
                    color={data.summary.leaves > 2 ? "text-red-600" : "text-gray-800"} />
              <Card label="Actual Hours" value={data.summary.totalWorked} />
              <Card label="Expected Hours" value={data.summary.totalExpected} />
            </div>

            {/* 2. The Clean Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {["Date", "Day Type", "In Time", "Out Time", "Hours", "Status"].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.details.map((row, idx) => (
                    <tr key={idx} className={row.isLeave ? "bg-red-50" : "hover:bg-gray-50"}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.Date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                          ${row.DayType === 'Saturday' ? 'bg-orange-100 text-orange-800' : 
                            row.DayType === 'Sunday' ? 'bg-gray-200 text-gray-600' : 'text-gray-600'}`}>
                          {row.DayType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.InTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.OutTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-800">
                        {row.workedHours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {row.isLeave ? (
                          <span className="text-red-600 font-bold flex items-center gap-1">
                            ⚠ Absent
                          </span>
                        ) : row.status === 'Weekend' ? (
                          <span className="text-gray-400">Off</span>
                        ) : (
                          <span className="text-green-600 font-medium">Present</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Component for Cards
const Card = ({ label, value, color = "text-gray-900" }) => (
  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
    <dt className="text-xs font-medium text-gray-500 uppercase truncate">{label}</dt>
    <dd className={`mt-1 text-2xl font-semibold ${color}`}>{value}</dd>
  </div>
);

export default UploadExcel;