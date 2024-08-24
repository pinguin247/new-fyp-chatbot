"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "./action";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import ClipLoader from "react-spinners/ClipLoader"; // Import the spinner

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Loading state

  const handleLogin = async (formData: FormData) => {
    setIsLoading(true); // Start loading
    const result = await login(formData);
    setIsLoading(false); // Stop loading after the login process is complete
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
          Welcome Back
        </h1>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isLoading ? ( // Conditionally render the spinner
          <div className="flex justify-center">
            <ClipLoader color="#36d7b7" />
          </div>
        ) : (
          <form
            className="space-y-8"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleLogin(formData);
            }}
          >
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
                placeholder="Enter your password"
              />
            </div>
            <div className="w-full mt-4">
              <Button
                className="w-full py-2 text-white hover:bg-blue-900 rounded-lg transition-all duration-300 ease-in-out"
                type="submit"
              >
                Log In
              </Button>
            </div>
          </form>
        )}
        <div className="text-center">
          <span>Don't have an account? Register </span>
          <Link href="/register">
            <span className="text-blue-600 hover:underline cursor-pointer">
              here
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
