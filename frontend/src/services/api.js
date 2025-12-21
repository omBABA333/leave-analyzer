const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

export const uploadAttendance = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  return response.json();
};
