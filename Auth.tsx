import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signUp() {
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    setMsg(error ? error.message : "Compte créé. Tu peux te connecter.");
  }

  async function signIn() {
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setMsg(error.message);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-emerald-400 tracking-wide">
              Gym Session Tracker
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              Connecte-toi pour synchroniser tes séances sur iPhone & PC
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-gray-300">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: toi@mail.com"
                autoCapitalize="none"
                autoComplete="email"
                className="mt-1 w-full rounded-xl bg-gray-900 border border-gray-700 px-4 py-3 outline-none
                           focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">Mot de passe</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
                className="mt-1 w-full rounded-xl bg-gray-900 border border-gray-700 px-4 py-3 outline-none
                           focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400"
              />
              <p className="text-xs text-gray-500 mt-2">
                Astuce : choisis un mot de passe solide. Tu pourras te connecter depuis n’importe quel appareil.
              </p>
            </div>

            {msg && (
              <div className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm">
                {msg}
              </div>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                signIn();
              }}
              disabled={loading || !email || !password}
              className="w-full rounded-xl bg-emerald-500 text-gray-900 font-semibold py-3
                         hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Chargement..." : "Se connecter"}
            </button>

           <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                signUp();
              }}
              disabled={loading || !email || !password}
              className="w-full rounded-xl border border-gray-700 text-gray-200 py-3
                         hover:bg-gray-700/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Créer un compte
            </button>

            <p className="text-xs text-gray-500 text-center mt-2">
              Tes données restent privées : chaque utilisateur ne voit que ses séances.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          © {new Date().getFullYear()} Gym Session Tracker
        </p>
      </div>
    </div>
  );
}
