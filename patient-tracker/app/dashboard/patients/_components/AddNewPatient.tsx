"use client";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

type Inputs = {
  name: string;
  email: string;
};

function AddNewPatient() {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = (data) => console.log(data);
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
                <div className="flex flex-col py-2">
                  <label>Select Condition</label>
                  <select
                    className="p-3 border rounded-lg bg-white"
                    {...register("email", { required: true })}
                  >
                    <option value={"Diabetes"}>Diabetes</option>
                    <option value={"High Blood Pressure"}>
                      High Blood Pressure
                    </option>
                  </select>
                </div>

                <div className="flex gap-3 items-center justify-end mt-5">
                  <Button
                    type="submit"
                    onClick={() => {
                      toast("New Patient Added");
                      setOpen(false);
                    }}
                  >
                    Save
                  </Button>
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
