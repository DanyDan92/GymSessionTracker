import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signUp() {
    setLoading(true);
    setMsg("Création du compte...");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setMsg("Erreur : " + error.message);
        return;
      }

      if (!data.session) {
        setMsg("Compte créé ✅ Vérifie tes emails pour confirmer.");
      } else {
        setMsg("Compte créé et connecté ✅");
      }
    } catch (e: any) {
      setMsg("Erreur inattendue : " + (e?.message ?? String(e)));
    } finally {
      setLoading(false);
    }
  }

  async function signIn() {
    setLoading(true);
    setMsg("Connexion...");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMsg("Erreur : " + error.message);
        return;
      }

      setMsg("Connecté ✅");
    } catch (e: any) {
      setMsg("Erreur inattendue : " + (e?.message ?? String(e)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-800/70 border border-gray-700 rounded-2xl shadow-xl p-6">
        <h1 className="text-2xl font-bold text-emerald-400 text-center">
          Gym Session Tracker
        </h1>

        <div className="mt-6 space-y-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="w-full rounded-xl bg-gray-900 border border-gray-700 px-4 py-3 outline-none"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-xl bg-gray-900 border border-gray-700 px-4 py-3 outline-none"
          />

          {msg && (
            <div className="text-sm text-center text-gray-300">{msg}</div>
          )}

          <button
            type="button"
            onClick={signIn}
            disabled={loading || !email || !password}
            className="w-full rounded-xl bg-emerald-500 text-gray-900 py-3 font-semibold"
          >
            Se connecter
          </button>

          <button
            type="button"
            onClick={signUp}
            disabled={loading || !email || !password}
            className="w-full rounded-xl border border-gray-700 py-3"
          >
            Créer un compte
          </button>
        </div>
      </div>
    </div>
  );
}
