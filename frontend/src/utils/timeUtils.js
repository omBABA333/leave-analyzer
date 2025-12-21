export const calculateHoursWorked = (inTime, outTime) => {
  const start = new Date(`1970-01-01T${inTime}`);
  const end = new Date(`1970-01-01T${outTime}`);
  const diff = (end - start) / (1000 * 60 * 60);
  return diff.toFixed(2);
};
