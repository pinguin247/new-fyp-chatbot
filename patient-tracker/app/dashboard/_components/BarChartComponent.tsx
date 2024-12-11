import React from "react";
import {
  CartesianGrid,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  ResponsiveContainer,
} from "recharts";

function BarChartComponent() {
  const data = [
    {
      name: "Patient 1",
      moderate: 80,
      intense: 90,
    },
    {
      name: "Patient 2",
      moderate: 78,
      intense: 110,
    },
    {
      name: "Patient 3",
      moderate: 80,
      intense: 120,
    },
    {
      name: "Patient 4",
      moderate: 96,
      intense: 132,
    },
    {
      name: "Patient 5",
      moderate: 83,
      intense: 100,
    },
    {
      name: "Patient 6",
      moderate: 90,
      intense: 130,
    },
    {
      name: "Patient 7",
      moderate: 80,
      intense: 90,
    },
  ];
  return (
    <div className="p-5 border rounded-lg shadow-sm">
      <h2 className="my-2 font-bold text-lg">Heart Rate</h2>
      <ResponsiveContainer width={"100%"} height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="moderate" fill="#8884d8" />
          <Bar dataKey="intense" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BarChartComponent;
