"use server";

import { redirect } from "next/navigation";

export async function signOutAction() {
  // Server-side sign out by redirecting to sign-in page
  // The client-side session will be cleared by the middleware
  redirect("/sign-in");
}
