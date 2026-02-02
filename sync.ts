import { supabase } from "./supabaseClient";

export async function pullUserData() {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_data")
    .select("sessions, templates")
    .eq("user_id", user.id)
    .single();

  // Première connexion → aucune ligne encore
  if (error && error.code === "PGRST116") {
    return { sessions: [], templates: [] };
  }

  if (error) throw error;

  return {
    sessions: data.sessions ?? [],
    templates: data.templates ?? [],
  };
}

export async function pushUserData(
  sessions: any[],
  templates: any[]
) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("user_data").upsert(
    {
      user_id: user.id,
      sessions,
      templates,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}
