import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await getOrCreateUser();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-muted-foreground">Update your profile and photo.</p>
      </div>
      <ProfileForm user={user} />
    </div>
  );
}
