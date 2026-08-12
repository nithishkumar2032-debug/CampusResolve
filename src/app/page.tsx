import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  redirect(ROLE_HOME[user.role]);
}
