import React from "react";
import { Pie, PieChart, ResponsiveContainer } from "recharts";

function PieChartComponent() {
  const data02 = [
    {
      name: "18-24",
      value: 5,
    },
    {
      name: "25-34",
      value: 3,
    },
    {
      name: "35-44",
      value: 8,
    },
    {
      name: "45-54",
      value: 0,
    },
    {
      name: "55-64",
      value: 10,
    },
    {
      name: "65+",
      value: 12,
    },
  ];

  return (
    <div className="border p-5 rounded-lg">
      <h2 className="font-bold text-lg">Age Group Distribution</h2>
      <ResponsiveContainer width={"100%"} height={300}>
        <PieChart width={730} height={250}>
          <Pie
            data={data02}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#82ca9d"
            label
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PieChartComponent;
