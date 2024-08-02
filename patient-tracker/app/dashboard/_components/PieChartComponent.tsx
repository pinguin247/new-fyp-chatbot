import React from "react";
import { Pie, PieChart, ResponsiveContainer } from "recharts";

function PieChartComponent() {
  const data02 = [
    {
      name: "Group A",
      value: 2400,
    },
    {
      name: "Group B",
      value: 4567,
    },
    {
      name: "Group C",
      value: 1398,
    },
    {
      name: "Group D",
      value: 9800,
    },
    {
      name: "Group E",
      value: 3908,
    },
    {
      name: "Group F",
      value: 4800,
    },
  ];
  return (
    <div className="border p-5 rounded-lg">
      <h2 className="font-bold text-lg">Monthly data</h2>
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
