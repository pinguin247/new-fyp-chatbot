"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import createClient from "@/utils/supabase/server";

export async function signup(formData: FormData) {
  const supabase = createClient();

  // Type-casting here for convenience
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const full_name = formData.get("name") as string; // Get full_name from form data

  // Sign up the user with email, password, and metadata
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name, // Include full_name in the user metadata
        role: "doctor", // Explicitly set the role to 'doctor' for web app registrations
      },
    },
  });

  if (error) {
    console.error("Register Error:", error);
    return { error: "User Already Exists" };
  }

  // Check if user creation was successful
  if (data?.user) {
    const userId = data.user.id;

    // Update the user's profile with the 'doctor' role
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "doctor" })
      .eq("id", userId);

    if (profileError) {
      console.error("Profile Update Error:", profileError);
      return { error: "Failed to update user role" };
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
