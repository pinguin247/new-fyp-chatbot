"use client";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
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
  name: string;
  email: string;
};

function AddNewPatient() {
  const [open, setOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [patientID, setPatientID] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files);
  };

  const fetchPatientID = async (fullName: string) => {
    try {
      const response = await fetch(
        `http://${window.location.hostname}:${
          process.env.NEXT_PUBLIC_API_PORT || 3000
        }/api/data/get-profile-id`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName }),
        }
      );

      const { profileId, error } = await response.json();
      if (!response.ok || error) {
        toast.error(error || "Failed to fetch patient");
        return false;
      }
      setPatientID(profileId);
      return true;
    } catch (error) {
      console.error("Error fetching patient ID:", error);
      toast.error("An error occurred while fetching the patient ID.");
      return false;
    }
  };

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    const patientIdFetched = await fetchPatientID(data.name); // Fetch the patient ID first

    // If fetching the patient ID failed, exit early
    if (!patientIdFetched) {
      return;
    }

    if (uploadedFiles.length > 0 && patientID) {
      const formData = new FormData();

      // Append form fields
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("profileID", patientID);

      // Append uploaded files with the field name 'files'
      uploadedFiles.forEach((file) => {
        formData.append("files", file);
      });

      try {
        const response = await fetch(
          `http://${window.location.hostname}:${
            process.env.NEXT_PUBLIC_API_PORT || 3000
          }/parser/parse-and-upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (response.ok) {
          const result = await response.json();
          toast.success("Files parsed and uploaded successfully.");
          console.log(result);
        } else {
          const errorText = await response.text();
          toast.error(`Failed to parse and upload files: ${errorText}`);
        }
      } catch (error) {
        console.error("Error uploading files:", error);
        toast.error("An error occurred while uploading the files.");
      }

      setOpen(false);
    } else {
      toast.error("Please select files or enter a valid patient name.");
    }
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Add New Patient</Button>
      <Dialog open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="py-3">
                  <label>Full Name</label>
                  <Input
                    placeholder="Enter Name"
                    {...register("name", { required: true })}
                  />
                </div>
                <div className="py-3">
                  <label>Contact Number</label>
                  <Input
                    type="number"
                    placeholder="Enter Number"
                    {...register("email", { required: true })}
                  />
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
