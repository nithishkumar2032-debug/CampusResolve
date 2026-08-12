import { requireUser } from "@/lib/auth";
import { NewComplaintForm } from "@/components/new-complaint-form";

export default async function NewComplaintPage() {
  const user = await requireUser(["student"]);
  return <NewComplaintForm user={user} />;
}
