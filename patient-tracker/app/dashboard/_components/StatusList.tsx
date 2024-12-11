import React from "react";
import Card from "./Card";
import { TrendingDown, TrendingUp, UserRound, LucideIcon } from "lucide-react";

const StatusList: React.FC = () => {
  const totalPatient = 20;
  const percentage = 70;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 my-6">
      <Card
        icon={<UserRound />}
        title="Total No. of Patients"
        value={totalPatient}
      />
      <Card
        icon={<TrendingUp />}
        title="Total % of patients achieved targets"
        value={percentage + "%"}
      />
      <Card
        icon={<TrendingDown />}
        title="Total % of Persuasion Success by Chatbot "
        value={5 + "%"}
      />
    </div>
  );
};

export default StatusList;
