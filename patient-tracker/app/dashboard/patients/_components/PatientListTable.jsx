import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash, Search } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid

function PatientListTable() {
  const pagination = true;
  const paginationPageSize = 10;
  const paginationPageSizeSelector = [25, 50, 100];

  const CustomButtons = (props) => {
    return <Button variant="destructive"><Trash /></Button>;
  };

  // Column Definitions: Defines the columns to be displayed.
  const [colDefs, setColDefs] = useState([
    { field: "id", filter: true },
    { field: "name", filter: true },
    { field: "email", filter: true },
    { field: "contact", filter: true },
    { field: "action", cellRenderer: CustomButtons }
  ]);

  // Row Data: The data to be displayed.
  const [rowData, setRowData] = useState([
    { make: "Tesla", model: "Model Y", price: 64950, electric: true },
    { make: "Ford", model: "F-Series", price: 33850, electric: false },
    { make: "Toyota", model: "Corolla", price: 29600, electric: false },
  ]);

  const [searchInput, setSearchInput]=useState();

  return (
    <div style={{marginTop:30, marginBottom:30}}>
      <div
        className="ag-theme-quartz" // applying the Data Grid theme
        style={{ height: 500 }} // the Data Grid will fill the size of the parent container
      >
        <div className='flex justify-start' style={{marginBottom:15}}>
          <div className='p-2 rounded-lg border shadow-sm flex items-center gap-2' style={{ width: '50%', maxWidth: '400px' }}>
            <Search className='text-gray-500' />
            <input 
              type='text' 
              placeholder='Search Patients' 
              className='bg-white outline-none w-full p-1 focus:outline-none' 
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
