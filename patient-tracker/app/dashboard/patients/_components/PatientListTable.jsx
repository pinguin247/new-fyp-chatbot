import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash, Search } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
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

function PatientListTable({ reload, setReload }) {
  const pagination = true;
  const paginationPageSize = 10;
  const paginationPageSizeSelector = [25, 50, 100];

  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");

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
                setReload(true);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  const [colDefs, setColDefs] = useState([
    { field: "full_name", headerName: "Name", filter: true },
    { field: "email", headerName: "Email", filter: true },
    { field: "phone_number", headerName: "Phone Number", filter: true },
    { field: "age", headerName: "Age", filter: true },
    { field: "gender", headerName: "Gender", filter: true },
    {
      field: "medical_condition",
      headerName: "Medical Condition",
      filter: true,
    },
    { field: "disability_level", headerName: "Disability Level", filter: true },
    { field: "action", headerName: "Action", cellRenderer: CustomButtons },
  ]);

  const fetchPatients = async () => {
    try {
      const response = await fetch(
        `http://${window.location.hostname}:${
          process.env.NEXT_PUBLIC_API_PORT || 3000
        }/api/data/get-patient-display-list`
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setRowData(data.patients || []);
    } catch (error) {
      setError(error.message || "Failed to fetch patients data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPatients();
    setReload(false); // Reset reload after fetching data
  }, [reload]);

  return (
    <div style={{ marginTop: 30, marginBottom: 30 }}>
      {loading ? (
        <p>Loading data...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        <div className="ag-theme-quartz" style={{ height: 500 }}>
          <div className="flex justify-start" style={{ marginBottom: 15 }}>
            <div
              className="p-2 rounded-lg border shadow-sm flex items-center gap-2"
              style={{ width: "50%", maxWidth: "400px" }}
            >
              <Search className="text-gray-500" />
              <input
                type="text"
                placeholder="Search Patients"
                className="bg-white outline-none w-full p-1"
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
      )}
    </div>
  );
}

export default PatientListTable;
