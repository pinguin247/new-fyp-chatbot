import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash, Search } from "lucide-react";
import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

function PatientListTable() {
  const pagination = true;
  const paginationPageSize = 10;
  const paginationPageSizeSelector = [25, 50, 100];

  const CustomButtons = (props) => {
    return (
      <AlertDialog>
        <AlertDialogTrigger>
          <Button variant="destructive">
            <Trash />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              patient's data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toast("Patient Deleted Successfully");
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  // Column Definitions: Defines the columns to be displayed.
  const [colDefs, setColDefs] = useState([
    { field: "name", headerName: "Name", filter: true },
    { field: "email", headerName: "Email", filter: true },
    { field: "phoneNumber", headerName: "Phone Number", filter: true },
    { field: "age", headerName: "Age", filter: true },
    { field: "gender", headerName: "Gender", filter: true },
    {
      field: "medicalCondition",
      headerName: "Medical Condition",
      filter: true,
    },
    { field: "disabilityLevel", headerName: "Disability Level", filter: true },
    { field: "action", headerName: "Action", cellRenderer: CustomButtons },
  ]);

  // Row Data: The data to be displayed.
  const [rowData, setRowData] = useState([
    {
      name: "John Doe",
      email: "john.doe@example.com",
      phoneNumber: "+1 123 456 7890",
      age: 45,
      gender: "Male",
      medicalCondition: "Hypertension",
      disabilityLevel: "Moderate",
    },
    {
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phoneNumber: "+44 123 456 7890",
      age: 33,
      gender: "Female",
      medicalCondition: "Diabetes",
      disabilityLevel: "Low",
    },
    {
      name: "Mark Taylor",
      email: "mark.taylor@example.com",
      phoneNumber: "+91 987 654 3210",
      age: 55,
      gender: "Male",
      medicalCondition: "None",
      disabilityLevel: "None",
    },
  ]);

  const [searchInput, setSearchInput] = useState();

  return (
    <div style={{ marginTop: 30, marginBottom: 30 }}>
      <div
        className="ag-theme-quartz" // applying the Data Grid theme
        style={{ height: 500 }} // the Data Grid will fill the size of the parent container
      >
        <div className="flex justify-start" style={{ marginBottom: 15 }}>
          <div
            className="p-2 rounded-lg border shadow-sm flex items-center gap-2"
            style={{ width: "50%", maxWidth: "400px" }}
          >
            <Search className="text-gray-500" />
            <input
              type="text"
              placeholder="Search Patients"
              className="bg-white outline-none w-full p-1 focus:outline-none"
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
        </div>
        <AgGridReact
          rowData={rowData}
          columnDefs={colDefs}
          quickFilterText={searchInput}
          pagination={pagination}
          paginationPageSize={paginationPageSize}
          paginationPageSizeSelector={paginationPageSizeSelector}
        />
      </div>
    </div>
  );
}

export default PatientListTable;
