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

/* =====================
   MERGE / CONFLICT RESOLUTION
   - 1 item = 1 id
   - on garde l'item le plus récent (updatedAt)
===================== */
function getUpdatedAt(x: any): number {
  const v = x?.updatedAt ?? x?.updated_at ?? null;
  const t = v ? Date.parse(v) : 0;
  return Number.isFinite(t) ? t : 0;
}

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

function nowIso() {
  return new Date().toISOString();
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
     ☁️ SYNC REFS (discrets)
  ===================== */
  const pullingRef = useRef(false);
  const didLoginPullRef = useRef(false);
  const didFirstInteractionPullRef = useRef(false);
  const lastAppliedCloudUpdatedAtRef = useRef<number>(0);

  /* =====================
     ✅ CALLBACKS (no hooks in conditional)
  ===================== */
  const handleSelectSession = useCallback((id: string) => {
    setSelectedSessionId(id);
    setCurrentView("SESSION_DETAIL");
  }, []);

  // Stamp updatedAt à chaque modification locale
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

  /* =====================
     APPLY CLOUD (merge discret)
  ===================== */
  const applyCloudData = useCallback(
    (cloudSessions: any[], cloudTemplates: any[], cloudUpdatedAt: string | null) => {
      const cloudUpdatedAtNum = cloudUpdatedAt ? Date.parse(cloudUpdatedAt) : 0;

      // Ignore si cloud pas plus récent
      if (cloudUpdatedAtNum && cloudUpdatedAtNum <= lastAppliedCloudUpdatedAtRef.current) {
        return;
      }

      setSessions((prev) => mergeById<WorkoutSession>(prev as any[], cloudSessions as any[]));
      setTemplates((prev) =>
        mergeById<ExerciseTemplate>(prev as any[], cloudTemplates as any[])
      );

      lastAppliedCloudUpdatedAtRef.current = cloudUpdatedAtNum || Date.now();
    },
    [setSessions, setTemplates]
  );

  /* =====================
     PULL DISCRET (avec lock)
  ===================== */
  const safePull = useCallback(async () => {
    if (pullingRef.current) return;
    pullingRef.current = true;
    try {
      const cloud = await pullUserData();
      applyCloudData(cloud.sessions, cloud.templates, cloud.updated_at);
    } catch {
      // silencieux
    } finally {
      pullingRef.current = false;
    }
  }, [applyCloudData]);

  /* =====================
     PUSH (uniquement via bouton "Sauvegarder")
  ===================== */
  const handleSaveToCloud = useCallback(async () => {
    try {
      await pushUserData(sessions as any, templates as any);
      // invisible : pas de message UI
    } catch {
      // invisible : pas de message UI
      // (si tu veux, on peut logger console.error)
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
     ✅ PULL à la connexion (1 fois)
  ===================== */
  useEffect(() => {
    if (!ready || !signedIn) return;
    if (didLoginPullRef.current) return;
    didLoginPullRef.current = true;

    safePull();
  }, [ready, signedIn, safePull]);

  /* =====================
     ✅ PULL au premier clic/tap (1 fois)
     (utile si cloud change pendant que l'app est ouverte)
  ===================== */
  useEffect(() => {
    if (!ready || !signedIn) return;

    const onFirstInteraction = () => {
      if (didFirstInteractionPullRef.current) return;
      didFirstInteractionPullRef.current = true;
      safePull();
    };

    window.addEventListener("pointerdown", onFirstInteraction, { passive: true });
    window.addEventListener("keydown", onFirstInteraction);

    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };
  }, [ready, signedIn, safePull]);

  /* =====================
     ⛔ GUARDS
  ===================== */
  if (!ready) return null;
  if (!signedIn) return <Auth />;

  /* =====================
     VIEW SWITCH (pull discret au changement d’onglet)
  ===================== */
  const setViewWithPull = (v: View) => {
    setCurrentView(v);
    // pull discret à chaque changement de tab
    safePull();
  };

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
              onClick={handleSaveToCloud}
              className="text-sm px-3 py-2 rounded-xl bg-emerald-500 text-gray-900 font-semibold hover:bg-emerald-400 transition"
              title="Envoie tes données vers le cloud"
            >
              Sauvegarder
            </button>

            <button
              onClick={async () => {
                // reset flags pour confirmer une sync propre à la prochaine connexion
                didLoginPullRef.current = false;
                didFirstInteractionPullRef.current = false;
                lastAppliedCloudUpdatedAtRef.current = 0;
                await supabase.auth.signOut();
              }}
              className="text-sm px-3 py-2 rounded-xl border border-gray-700 hover:bg-gray-700/50 transition"
            >
              Déconnexion
            </button>
          </div>
        </div>

        <nav className="flex justify-center gap-4 border-t border-gray-700">
          <button
            onClick={() => setViewWithPull("SESSIONS_LIST")}
            className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 ${
              currentView === "SESSIONS_LIST"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <CalendarIcon /> Séances
          </button>

          <button
            onClick={() => setViewWithPull("HISTORY")}
            className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 ${
              currentView === "HISTORY"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <HistoryIcon /> Historique
          </button>

          <button
            onClick={() => setViewWithPull("EXERCISE_LIBRARY")}
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
