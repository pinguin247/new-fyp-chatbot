"use client";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import FileUpload from "./FileUpload";

type Inputs = {
  patientId: string;
  moderate_hr_min: string;
  moderate_hr_max: string;
  vigorous_hr_min: string;
  vigorous_hr_max: string;
  target_duration_week: string;
  prompt_times: string;
  medical_condition: string;
  disability_level: string;
};

type AddNewPatientProps = {
  onPatientAdded: () => void; // Callback to refresh data after adding a new patient
};

function AddNewPatient({ onPatientAdded }: AddNewPatientProps) {
  const [open, setOpen] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<Inputs>();

  const moderate_hr_min = watch("moderate_hr_min");
  const vigorous_hr_min = watch("vigorous_hr_min");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch(
          `http://${window.location.hostname}:${
            process.env.NEXT_PUBLIC_API_PORT || 3000
          }/api/data/get-patient-names`
        );
        const data = await response.json();

        if (Array.isArray(data.patients)) {
          setPatients(data.patients);
        } else {
          setPatients([]);
        }
      } catch (error) {
        toast.error("Error fetching patients.");
      }
    };

    fetchPatients();
  }, []);

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files);
  };

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      if (!data.patientId) {
        toast.error("Please select a patient.");
        return;
      }

      const promptTimesArray = data.prompt_times
        .split(",")
        .map((time) => time.trim());

      const patientDetails = {
        patient_id: data.patientId,
        moderate_hr_min: data.moderate_hr_min,
        moderate_hr_max: data.moderate_hr_max,
        vigorous_hr_min: data.vigorous_hr_min,
        vigorous_hr_max: data.vigorous_hr_max,
        target_duration_week: data.target_duration_week,
        prompt_times: promptTimesArray,
        medical_condition: data.medical_condition,
        disability_level: data.disability_level,
      };

      console.log(patientDetails);

      const addPatientResponse = await fetch(
        `http://${window.location.hostname}:${
          process.env.NEXT_PUBLIC_API_PORT || 3000
        }/api/data/add-patient`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patientDetails),
        }
      );

      if (!addPatientResponse.ok) {
        toast.error("Failed to add patient details.");
        return;
      }

      toast.success("Patient details added successfully.");

      if (uploadedFiles.length > 0) {
        const formData = new FormData();
        formData.append("profileID", data.patientId);
        uploadedFiles.forEach((file) => {
          formData.append("files", file);
        });

        const fileUploadResponse = await fetch(
          `http://${window.location.hostname}:${
            process.env.NEXT_PUBLIC_API_PORT || 3000
          }/parser/parse-and-upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (fileUploadResponse.ok) {
          toast.success("Files parsed and uploaded successfully.");
        } else {
          toast.error("Failed to parse and upload files.");
        }
      }
      onPatientAdded();

      setOpen(false);
    } catch (error) {
      toast.error("Error submitting patient data.");
    }
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Add New Patient</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ height: "80vh", overflowY: "scroll" }}>
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="py-3">
                  <label>Patient</label>
                  <select
                    {...register("patientId", { required: true })}
                    className="bg-white border rounded-md p-2 w-full"
                  >
                    <option value="">Select a patient</option>
                    {Array.isArray(patients) && patients.length > 0 ? (
                      patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.full_name}
                        </option>
                      ))
                    ) : (
                      <option value="">No patients available</option>
                    )}
                  </select>
                  {errors.patientId && (
                    <p className="text-red-500">This field is required</p>
                  )}
                </div>

                <div className="py-3">
                  <label>Moderate Heart Rate (Min)</label>
                  <Input
                    type="number"
                    placeholder="Enter Min HR"
                    {...register("moderate_hr_min", { required: true })}
                  />
                  {errors.moderate_hr_min && (
                    <p className="text-red-500">This field is required</p>
                  )}
                </div>
                <div className="py-3">
                  <label>Moderate Heart Rate (Max)</label>
                  <Input
                    type="number"
                    placeholder="Enter Max HR"
                    {...register("moderate_hr_max", {
                      required: true,
                      validate: (value) =>
                        parseInt(value) > parseInt(moderate_hr_min) ||
                        "Max moderate heart rate must be more than min moderate heart rate",
                    })}
                  />
                  {errors.moderate_hr_max && (
                    <p className="text-red-500">
                      {errors.moderate_hr_max.message ||
                        "This field is required"}
                    </p>
                  )}
                </div>
                <div className="py-3">
                  <label>Vigorous Heart Rate (Min)</label>
                  <Input
                    type="number"
                    placeholder="Enter Min Vigorous HR"
                    {...register("vigorous_hr_min", { required: true })}
                  />
                  {errors.vigorous_hr_min && (
                    <p className="text-red-500">This field is required</p>
                  )}
                </div>
                <div className="py-3">
                  <label>Vigorous Heart Rate (Max)</label>
                  <Input
                    type="number"
                    placeholder="Enter Max Vigorous HR"
                    {...register("vigorous_hr_max", {
                      required: true,
                      validate: (value) =>
                        parseInt(value) > parseInt(vigorous_hr_min) ||
                        "Max vigorous heart rate must be more than min vigorous heart rate",
                    })}
                  />
                  {errors.vigorous_hr_max && (
                    <p className="text-red-500">
                      {errors.vigorous_hr_max.message ||
                        "This field is required"}
                    </p>
                  )}
                </div>
                <div className="py-3">
                  <label>Target Duration (Week)</label>
                  <Input
                    type="number"
                    placeholder="Enter Target Duration"
                    {...register("target_duration_week", { required: true })}
                  />
                  {errors.target_duration_week && (
                    <p className="text-red-500">This field is required</p>
                  )}
                </div>
                <div className="py-3">
                  <label>Prompt Times</label>
                  <Input
                    placeholder="Enter Prompt Times (comma-separated)"
                    {...register("prompt_times", { required: true })}
                  />
                  {errors.prompt_times && (
                    <p className="text-red-500">This field is required</p>
                  )}
                </div>
                <div className="py-3">
                  <label>Medical Condition</label>
                  <Input
                    placeholder="Enter Medical Condition"
                    {...register("medical_condition", { required: true })}
                  />
                  {errors.medical_condition && (
                    <p className="text-red-500">This field is required</p>
                  )}
                </div>
                <div className="py-3">
                  <label>Disability Level</label>
                  <select
                    {...register("disability_level", { required: true })}
                    className="bg-white border rounded-md p-2 w-full"
                  >
                    <option value="">Select Disability Level</option>
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                  </select>
                  {errors.disability_level && (
                    <p className="text-red-500">This field is required</p>
                  )}
                </div>

                <div className="py-3">
                  <label>Upload Files</label>
                  <FileUpload onFilesUploaded={handleFilesUploaded} />
                </div>

                <div className="flex gap-3 items-center justify-end mt-5">
                  <Button type="submit">Save</Button>
                  <Button onClick={() => setOpen(false)} variant="ghost">
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AddNewPatient;
