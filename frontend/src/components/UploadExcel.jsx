import React, { useState, useRef } from "react";

const UploadExcel = () => {
  // Tab State
  const [activeTab, setActiveTab] = useState("upload"); // 'upload' or 'history'

  // Upload State
  const [file, setFile] = useState(null);
  const [uploadData, setUploadData] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // History State
  const [selectedMonth, setSelectedMonth] = useState("");
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // --- Upload Handlers ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file first.");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      
      if (res.ok) {
        setUploadData(result);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = ""; 
      } else {
        alert("Server Error: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      alert("Network Error: Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // --- History Handlers ---
  const handleFetchHistory = async () => {
    if (!selectedMonth) return alert("Please select a month");
    
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/stats?month=${selectedMonth}`);
      const result = await res.json();
      
      if (res.ok) {
        if(result.summary === null) {
          alert("No records found for this month.");
          setHistoryData(null);
        } else {
          setHistoryData(result);
        }
      } else {
        alert("Error fetching data");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("⚠️ WARNING: This will delete ALL history from the database. Are you sure?")) return;
    
    try {
      const res = await fetch("/api/reset", { method: "DELETE" });
      if (res.ok) {
        alert("Database Cleared! Please upload your file again.");
        setUploadData(null);
        setHistoryData(null);
      } else {
        alert("Failed to reset database.");
      }
    } catch (e) {
      alert("Network error.");
    }
  };

  // Determine which data to show based on active tab
  const displayData = activeTab === "upload" ? uploadData : historyData;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-indigo-700">Leave & Productivity Analyzer</h1>
            <p className="text-gray-500 text-sm mt-1">Full Stack Intern Project</p>
          </div>
          
          <div className="flex gap-4">
            {/* RESET BUTTON */}
            <button 
              onClick={handleReset}
              className="px-4 py-2 rounded-md text-sm font-bold bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 transition"
            >
              🗑️ Clear Database
            </button>

            {/* TABS */}
            <div className="flex bg-white rounded-lg shadow-sm p-1 border">
              <button 
                onClick={() => setActiveTab("upload")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'upload' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Upload File
              </button>
              <button 
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'history' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Monthly History
              </button>
            </div>
          </div>
        </div>

        {/* --- UPLOAD SECTION --- */}
        {activeTab === "upload" && (
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-8 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">Upload Attendance Sheet</h2>
            <form onSubmit={handleUpload} className="flex gap-3 items-center">
              <div className="relative">
                <input 
                  type="file" 
                  accept=".xlsx" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
              <button 
                disabled={loading || !file}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Analyze"}
              </button>
            </form>
          </div>
        )}

        {/* --- HISTORY SECTION --- */}
        {activeTab === "history" && (
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-8 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">Select Month to Analyze</h2>
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <button 
                onClick={handleFetchHistory}
                disabled={historyLoading || !selectedMonth}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 h-[38px]"
              >
                {historyLoading ? "Loading..." : "Get Report"}
              </button>
            </div>
          </div>
        )}

        {/* --- DASHBOARD --- */}
        {displayData && (
          <div className="animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <Card label="Employee" value={displayData.summary.employeeName} />
              <Card label="Productivity" value={`${displayData.summary.productivity}%`} 
                    color={parseFloat(displayData.summary.productivity) > 100 ? "text-red-600" : parseFloat(displayData.summary.productivity) > 90 ? "text-green-600" : "text-yellow-600"} />
              <Card label="Leaves (in selection)" value={displayData.summary.leaves} />
              <Card label="Actual Hours" value={displayData.summary.totalWorked} />
              <Card label="Expected Hours" value={displayData.summary.totalExpected} />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {["Date", "Day Type", "In Time", "Out Time", "Hours", "Status"].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayData.details.map((row, idx) => (
                    <tr key={idx} className={row.isLeave ? "bg-red-50" : "hover:bg-gray-50"}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{row.dayType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.inTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.outTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{row.workedHours}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {row.isLeave ? <span className="text-red-600 font-bold">⚠ Absent</span> : <span className="text-green-600 font-medium">Present</span>}
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

const Card = ({ label, value, color = "text-gray-900" }) => (
  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
    <dt className="text-xs font-medium text-gray-500 uppercase truncate">{label}</dt>
    <dd className={`mt-1 text-2xl font-semibold ${color}`}>{value}</dd>
  </div>
);

export default UploadExcel;