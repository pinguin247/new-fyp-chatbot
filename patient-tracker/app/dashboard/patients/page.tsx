"use client";
import React, { useState } from "react";
import AddNewPatient from "./_components/AddNewPatient";
import PatientListTable from "./_components/PatientListTable";

function Patient() {
  const [reload, setReload] = useState(false);

  // Function to trigger a data reload after adding a new patient
  const handlePatientAdded = () => {
    setReload(true);
  };
  return (
    <div className="p-7">
      <h2 className="font-bold text-2xl flex justify-between items-center">
        Patients
        <AddNewPatient onPatientAdded={handlePatientAdded} />
      </h2>
      <PatientListTable reload={reload} setReload={setReload} />
    </div>
  );
}

export default Patient;
