"use client";
import React from "react";
import AddNewPatient from "./_components/AddNewPatient";
import PatientListTable from "./_components/PatientListTable";

function Patient() {
  return (
    <div className="p-7">
      <h2 className="font-bold text-2xl flex justify-between items-center">
        Patients
        <AddNewPatient />
      </h2>
      <PatientListTable />
    </div>
  );
}

export default Patient;
