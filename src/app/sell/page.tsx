import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SellForm from "./SellForm";

export const metadata = { title: "Sell an item — CampusBin" };

export default async function SellPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: categories }, { data: profile }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase.from("profiles").select("phone_number").eq("id", user.id).single(),
  ]);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sell an item</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Your listing will only be visible to students on your own campus.
      </p>
      <SellForm categories={categories ?? []} savedPhoneNumber={profile?.phone_number ?? ""} />
    </div>
  );
}
