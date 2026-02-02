import { supabase } from "./supabaseClient";

export type CloudUserData = {
  sessions: any[];
  templates: any[];
  updated_at: string | null;
};

export async function pullUserData(): Promise<CloudUserData> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_data")
    .select("sessions, templates, updated_at")
    .eq("user_id", user.id)
    .single();

  // Première connexion → aucune ligne
  if (error && error.code === "PGRST116") {
    return { sessions: [], templates: [], updated_at: null };
  }
  if (error) throw error;

  return {
    sessions: (data.sessions ?? []) as any[],
    templates: (data.templates ?? []) as any[],
    updated_at: (data.updated_at ?? null) as string | null,
  };
}

export async function pushUserData(sessions: any[], templates: any[]) {
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
