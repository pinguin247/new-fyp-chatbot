"use client";
import { useTheme } from "next-themes";
import React, { useEffect } from "react";
import { DatePicker } from "../_components/DatePicker";
import StatusList from "./_components/StatusList";
import BarChartComponent from "./_components/BarChartComponent";
import PieChartComponent from "./_components/PieChartComponent";

function Dashboard() {
  const { setTheme } = useTheme();
  useEffect(() => {
    setTheme("system");
  });
  return (
    <div className="p-10">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl">Dashboard</h2>
        <div className="flex items-center gap-4">
          <DatePicker />
        </div>
      </div>
      <StatusList />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2">
          <BarChartComponent />
        </div>
        <div>
          <PieChartComponent />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
