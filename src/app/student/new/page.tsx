import { requireUser } from "@/lib/auth";
import { NewComplaintForm } from "@/components/new-complaint-form";

export const dynamic = "force-dynamic";

export default async function NewComplaintPage() {
  const user = await requireUser(["student"]);
  return <NewComplaintForm user={user} />;
}
