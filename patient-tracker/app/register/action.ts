"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import createClient from "@/utils/supabase/server";

export async function signup(formData: FormData) {
  const supabase = createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  // Get form data
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const full_name = formData.get("name") as string; // Get full_name from form data

  // Sign up the user with email, password, and metadata
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name, // Include full_name in the user metadata
      },
    },
  });

  if (error) {
    console.error("Register Error:", error);
    return { error: "User Already Exists" };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
