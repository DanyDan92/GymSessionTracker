import React, { useState, useCallback, useEffect, useRef } from "react";
import { WorkoutSession, ExerciseTemplate } from "./types";
import useLocalStorage from "./hooks/useLocalStorage";

import SessionList from "./components/SessionList";
import SessionDetail from "./components/SessionDetail";
import ExerciseLibrary from "./components/ExerciseLibrary";

import { CalendarIcon } from "./components/icons/CalendarIcon";
import { DumbbellIcon } from "./components/icons/DumbbellIcon";
import { HistoryIcon } from "./components/icons/HistoryIcon";

import { supabase } from "./supabaseClient";
import { Auth } from "./Auth";
import { pullUserData, pushUserData } from "./sync";

type View = "SESSIONS_LIST" | "SESSION_DETAIL" | "EXERCISE_LIBRARY" | "HISTORY";

// ---------- helpers (merge & timestamps) ----------
function nowIso() {
  return new Date().toISOString();
}

function getUpdatedAt(x: any): number {
  const v = x?.updatedAt ?? x?.updated_at ?? null;
  const t = v ? Date.parse(v) : 0;
  return Number.isFinite(t) ? t : 0;
}

// Merge par id : conserve l’item le plus récent (updatedAt)
// + ajoute les items manquants
function mergeById<T extends { id: string }>(localArr: any[], cloudArr: any[]): T[] {
  const map = new Map<string, any>();

  for (const item of localArr ?? []) {
    if (item?.id) map.set(item.id, item);
  }

  for (const c of cloudArr ?? []) {
    if (!c?.id) continue;
    const l = map.get(c.id);
    if (!l) {
      map.set(c.id, c);
    } else {
      const keepCloud = getUpdatedAt(c) > getUpdatedAt(l);
      map.set(c.id, keepCloud ? c : l);
    }
  }

  return Array.from(map.values());
}

const App: React.FC = () => {
  /* =====================
     🔐 AUTH STATE
  ===================== */
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  /* =====================
     📦 LOCAL STORAGE
  ===================== */
  const [sessions, setSessions] = useLocalStorage<WorkoutSession[]>("sessions", []);
  const [templates, setTemplates] = useLocalStorage<ExerciseTemplate[]>("exerciseTemplates", []);

  /* =====================
     🧭 NAVIGATION STATE
  ===================== */
  const [currentView, setCurrentView] = useState<View>("SESSIONS_LIST");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  /* =====================
     ☁️ SYNC STATE
  ===================== */
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  // évite boucle pull -> push
  const skipNextAutoPushRef = useRef(false);

  // dernier updated_at du cloud qu’on a appliqué
  const lastAppliedCloudUpdatedAtRef = useRef<number>(0);

  /* =====================
     ✅ CALLBACKS
  ===================== */
  const handleSelectSession = useCallback((id: string) => {
    setSelectedSessionId(id);
    setCurrentView("SESSION_DETAIL");
  }, []);

  // IMPORTANT : on “stamp” updatedAt à chaque save
  const handleSaveSession = useCallback(
    (session: WorkoutSession) => {
      const stamped = { ...(session as any), updatedAt: nowIso() } as WorkoutSession;

      setSessions((prev) => {
        const exists = prev.some((s) => s.id === stamped.id);
        if (exists) return prev.map((s) => (s.id === stamped.id ? stamped : s));
        return [...prev, stamped];
      });
    },
    [setSessions]
  );

  const handleDeleteSession = useCallback(
    (id: string) => {
      // (option : tu peux marquer deletedAt plutôt que supprimer,
      // mais on reste simple)
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setCurrentView("SESSIONS_LIST");
    },
    [setSessions]
  );

  const handleSaveTemplate = useCallback(
    (template: ExerciseTemplate) => {
      const stamped = { ...(template as any), updatedAt: nowIso() } as ExerciseTemplate;

      setTemplates((prev) => {
        const exists = prev.some((t) => t.id === stamped.id);
        if (exists) return prev.map((t) => (t.id === stamped.id ? stamped : t));
        return [...prev, stamped];
      });
    },
    [setTemplates]
  );

  const handleDeleteTemplate = useCallback(
    (id: string) => {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    },
    [setTemplates]
  );

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  /* =====================
     ☁️ APPLY CLOUD (merge)
  ===================== */
  const applyCloudData = useCallback(
    (cloudSessions: any[], cloudTemplates: any[], cloudUpdatedAt: string | null) => {
      const cloudUpdatedAtNum = cloudUpdatedAt ? Date.parse(cloudUpdatedAt) : 0;

      // si pas plus récent que ce qu’on a déjà appliqué, on peut ignorer
      if (cloudUpdatedAtNum && cloudUpdatedAtNum <= lastAppliedCloudUpdatedAtRef.current) {
        return;
      }

      // merge cloud -> local (par id & updatedAt)
      const mergedSessions = mergeById<WorkoutSession>(sessions as any[], cloudSessions as any[]);
      const mergedTemplates = mergeById<ExerciseTemplate>(templates as any[], cloudTemplates as any[]);

      // on évite auto-push immédiat causé par setState
      skipNextAutoPushRef.current = true;

      setSessions(mergedSessions);
      setTemplates(mergedTemplates);

      lastAppliedCloudUpdatedAtRef.current = cloudUpdatedAtNum || Date.now();
    },
    [sessions, templates, setSessions, setTemplates]
  );

  /* =====================
     ☁️ SYNC MANUEL (boutons)
  ===================== */
  const handleSyncPull = useCallback(async () => {
    setSyncing(true);
    setSyncMsg("Téléchargement des données...");
    try {
      const cloud = await pullUserData();
      applyCloudData(cloud.sessions, cloud.templates, cloud.updated_at);
      setSyncMsg("✅ Données cloud appliquées (merge)");
      setTimeout(() => setSyncMsg(null), 1500);
    } catch (e: any) {
      setSyncMsg("❌ Erreur sync ↓ : " + (e?.message ?? String(e)));
    } finally {
      setSyncing(false);
    }
  }, [applyCloudData]);

  const handleSyncPush = useCallback(async () => {
    setSyncing(true);
    setSyncMsg("Envoi des données...");
    try {
      await pushUserData(sessions as any, templates as any);
      setSyncMsg("✅ Données envoyées vers le cloud");
      setTimeout(() => setSyncMsg(null), 1500);
    } catch (e: any) {
      setSyncMsg("❌ Erreur sync ↑ : " + (e?.message ?? String(e)));
    } finally {
      setSyncing(false);
    }
  }, [sessions, templates]);

  /* =====================
     🔐 SUPABASE SESSION
  ===================== */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  /* =====================
     ✅ AUTO-PULL au login (avec merge)
  ===================== */
  useEffect(() => {
    if (!ready || !signedIn) return;

    (async () => {
      setSyncing(true);
      setSyncMsg("Synchronisation…");
      try {
        const cloud = await pullUserData();
        applyCloudData(cloud.sessions, cloud.templates, cloud.updated_at);
        setSyncMsg(null);
      } catch (e: any) {
        setSyncMsg("❌ Sync auto: " + (e?.message ?? String(e)));
      } finally {
        setSyncing(false);
      }
    })();
  }, [ready, signedIn, applyCloudData]);

  /* =====================
     ✅ AUTO-PUSH debounced
  ===================== */
  useEffect(() => {
    if (!ready || !signedIn) return;

    if (skipNextAutoPushRef.current) {
      skipNextAutoPushRef.current = false;
      return;
    }

    const t = setTimeout(() => {
      (async () => {
        try {
          await pushUserData(sessions as any, templates as any);
        } catch {
          // silencieux
        }
      })();
    }, 1200);

    return () => clearTimeout(t);
  }, [ready, signedIn, sessions, templates]);

  /* =====================
     ✅ AUTO-PULL périodique (toutes les 20s)
     - Pull cloud
     - Si plus récent : merge dans local
  ===================== */
  useEffect(() => {
    if (!ready || !signedIn) return;

    const interval = setInterval(async () => {
      try {
        const cloud = await pullUserData();
        // merge uniquement si cloud est nouveau
        applyCloudData(cloud.sessions, cloud.templates, cloud.updated_at);
      } catch {
        // silencieux
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [ready, signedIn, applyCloudData]);

  /* =====================
     ⛔ GUARDS
  ===================== */
  if (!ready) return null;
  if (!signedIn) return <Auth />;

  /* =====================
     🖼️ RENDER VIEW
  ===================== */
  const renderView = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingSessions = sessions.filter(
      (s) => !s.isCompleted && new Date(s.date) >= today
    );
    const pastSessions = sessions.filter(
      (s) => s.isCompleted || new Date(s.date) < today
    );

    switch (currentView) {
      case "SESSION_DETAIL":
        if (!selectedSessionId) {
          setCurrentView("SESSIONS_LIST");
          return null;
        }
        return (
          <SessionDetail
            sessionId={selectedSessionId}
            sessions={sessions}
            exerciseTemplates={templates}
            onSaveSession={handleSaveSession}
            onSaveTemplate={handleSaveTemplate}
            onBack={() => {
              const session = sessions.find((s) => s.id === selectedSessionId);
              if (session && (session.isCompleted || new Date(session.date) < today)) {
                setCurrentView("HISTORY");
              } else {
                setCurrentView("SESSIONS_LIST");
              }
            }}
          />
        );

      case "EXERCISE_LIBRARY":
        return (
          <ExerciseLibrary
            templates={templates}
            onSaveTemplate={handleSaveTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        );

      case "HISTORY":
        return (
          <SessionList
            sessions={pastSessions}
            onSelectSession={handleSelectSession}
            onSaveSession={handleSaveSession}
            onDeleteSession={handleDeleteSession}
            title="Historique des Séances"
            hideAddButton
          />
        );

      default:
        return (
          <SessionList
            sessions={upcomingSessions}
            onSelectSession={handleSelectSession}
            onSaveSession={handleSaveSession}
            onDeleteSession={handleDeleteSession}
            title="Vos Prochaines Séances"
          />
        );
    }
  };

  /* =====================
     🧱 UI
  ===================== */
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
      <header className="bg-gray-800/70 backdrop-blur-sm sticky top-0 z-20 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-emerald-400">
            Gym Session Tracker
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncPull}
              disabled={syncing}
              className="text-sm px-3 py-2 rounded-xl border border-gray-700 hover:bg-gray-700/50 disabled:opacity-50"
              title="Récupérer depuis le cloud"
            >
              Sync ↓
            </button>

            <button
              onClick={handleSyncPush}
              disabled={syncing}
              className="text-sm px-3 py-2 rounded-xl border border-gray-700 hover:bg-gray-700/50 disabled:opacity-50"
              title="Envoyer vers le cloud"
            >
              Sync ↑
            </button>

            <button
              onClick={handleSignOut}
              className="text-sm px-3 py-2 rounded-xl border border-gray-700 hover:bg-gray-700/50"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {syncMsg && (
          <div className="max-w-4xl mx-auto px-4 pb-2 text-sm text-gray-300">
            {syncMsg}
          </div>
        )}

        <nav className="flex justify-center gap-4 border-t border-gray-700">
          <button
            onClick={() => setCurrentView("SESSIONS_LIST")}
            className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 ${
              currentView === "SESSIONS_LIST"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <CalendarIcon /> Séances
          </button>

          <button
            onClick={() => setCurrentView("HISTORY")}
            className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 ${
              currentView === "HISTORY"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <HistoryIcon /> Historique
          </button>

          <button
            onClick={() => setCurrentView("EXERCISE_LIBRARY")}
            className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 ${
              currentView === "EXERCISE_LIBRARY"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <DumbbellIcon /> Exercices
          </button>
        </nav>
      </header>

      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-4xl mx-auto">{renderView()}</div>
      </main>
    </div>
  );
};

export default App;
