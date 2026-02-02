import { useState } from "react";
import { supabase } from "./supabaseClient";

export function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signUp() {
    setLoading(true); setMsg(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    setMsg(error ? error.message : "Compte créé. Tu peux te connecter.");
  }

  async function signIn() {
    setLoading(true); setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setMsg(error.message);
  }

  return (
    <div style={{ maxWidth: 360, margin: "40px auto", fontFamily: "system-ui" }}>
      <h2>Connexion</h2>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        autoCapitalize="none"
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe"
        type="password"
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />
      <button onClick={signIn} disabled={loading} style={{ width: "100%", padding: 10, marginTop: 12 }}>
        Se connecter
      </button>
      <button onClick={signUp} disabled={loading} style={{ width: "100%", padding: 10, marginTop: 8 }}>
        Créer un compte
      </button>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}
