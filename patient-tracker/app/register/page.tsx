"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "./action";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent the default form submission behavior

    const formData = new FormData(event.currentTarget as HTMLFormElement);

    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="h-screen w-screen flex justify-center items-center bg-gray-100">
      <div className="shadow-2xl px-10 pb-10 pt-14 bg-white rounded-2xl space-y-8 max-w-md w-full">
        <h1 className="font-bold text-3xl text-gray-800 text-center">
          Create an Account
        </h1>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form className="space-y-8" onSubmit={handleRegister}>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="name" className="text-gray-700 text-lg">
              Full Name:
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your full name"
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email" className="text-gray-700 text-lg">
              Email:
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="password" className="text-gray-700 text-lg">
              Password:
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Create a password"
            />
          </div>
          <div className="w-full mt-4">
            <Button
              className="w-full py-2 text-white hover:bg-blue-900  rounded-lg transition-all duration-300 ease-in-out"
              type="submit"
            >
              Sign Up
            </Button>
          </div>
        </form>
        <div className="text-center">
          <span>Already have an account? Log in </span>
          <Link href="/login">
            <span className="text-blue-600 hover:underline cursor-pointer">
              here
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
