import { useState } from 'react';
import axios from 'axios';

function FileUpload({ onUpload }) {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('excelFile', file);
    
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/attendance/upload', formData);
      onUpload();
    } catch (error) {
      alert('Upload failed: ' + error.response.data.error);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <input type="file" accept=".xlsx" onChange={handleUpload} className="block w-full" />
      <button disabled={loading} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        {loading ? 'Uploading...' : 'Analyze Attendance'}
      </button>
    </div>
  );
}
