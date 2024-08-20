"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import createClient from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Attempt to sign in the user
  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.error("Login Error:", error);
    return { error: "Invalid email or password. Please try again." };
  }

  revalidatePath("/", "page");
  redirect("/dashboard");
}
