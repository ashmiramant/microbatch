import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token");

  if (!authToken) {
    redirect("/login");
  }
}
