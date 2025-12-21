import React from "react";
import SummaryCards from "./SummaryCards";
import AttendanceTable from "./AttendanceTable";

const Dashboard = ({ data }) => {
  return (
    <div>
      <SummaryCards data={data} />
      <AttendanceTable data={data} />
    </div>
  );
};

export default Dashboard;
