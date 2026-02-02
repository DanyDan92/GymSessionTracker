import React, { useState, useCallback, useEffect } from 'react';
import { WorkoutSession, ExerciseTemplate } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import SessionList from './components/SessionList';
import SessionDetail from './components/SessionDetail';
import ExerciseLibrary from './components/ExerciseLibrary';
import { CalendarIcon } from './components/icons/CalendarIcon';
import { DumbbellIcon } from './components/icons/DumbbellIcon';
import { HistoryIcon } from './components/icons/HistoryIcon';

import { supabase } from './supabaseClient';
import { Auth } from './Auth';

type View = 'SESSIONS_LIST' | 'SESSION_DETAIL' | 'EXERCISE_LIBRARY' | 'HISTORY';

const App: React.FC = () => {
  /* =====================
     🔐 AUTH STATE
  ===================== */
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  /* =====================
     📦 LOCAL STORAGE
     (⚠️ DOIT rester avant les return conditionnels)
  ===================== */
  const [sessions, setSessions] = useLocalStorage<WorkoutSession[]>('sessions', []);
  const [templates, setTemplates] = useLocalStorage<ExerciseTemplate[]>('exerciseTemplates', []);

  /* =====================
     🧭 NAVIGATION STATE
     (⚠️ DOIT rester avant les return conditionnels)
  ===================== */
  const [currentView, setCurrentView] = useState<View>('SESSIONS_LIST');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // ✅ Maintenant c'est safe : tous les hooks ont déjà été appelés
  if (!ready) return null;
  if (!signedIn) return <Auth />;

  const handleSelectSession = (id: string) => {
    setSelectedSessionId(id);
    setCurrentView('SESSION_DETAIL');
  };

  const handleSaveSession = useCallback((session: WorkoutSession) => {
    setSessions(prev => {
      const exists = prev.some(s => s.id === session.id);
      if (exists) {
        return prev.map(s => (s.id === session.id ? session : s));
      }
      return [...prev, session];
    });
  }, [setSessions]);

  const handleDeleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    setCurrentView('SESSIONS_LIST');
  }, [setSessions]);

  const handleSaveTemplate = useCallback((template: ExerciseTemplate) => {
    setTemplates(prev => {
      const exists = prev.some(t => t.id === template.id);
      if (exists) {
        return prev.map(t => (t.id === template.id ? template : t));
      }
      return [...prev, template];
    });
  }, [setTemplates]);

  const handleDeleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, [setTemplates]);

  const renderView = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingSessions = sessions.filter(
      s => !s.isCompleted && new Date(s.date) >= today
    );
    const pastSessions = sessions.filter(
      s => s.isCompleted || new Date(s.date) < today
    );

    switch (currentView) {
      case 'SESSION_DETAIL':
        if (!selectedSessionId) {
          setCurrentView('SESSIONS_LIST');
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
              const session = sessions.find(s => s.id === selectedSessionId);
              if (session && (session.isCompleted || new Date(session.date) < today)) {
                setCurrentView('HISTORY');
              } else {
                setCurrentView('SESSIONS_LIST');
              }
            }}
          />
        );

      case 'EXERCISE_LIBRARY':
        return (
          <ExerciseLibrary
            templates={templates}
            onSaveTemplate={handleSaveTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        );

      case 'HISTORY':
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

      case 'SESSIONS_LIST':
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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
      <header className="bg-gray-800/70 backdrop-blur-sm sticky top-0 z-20 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-xl md:text-2xl font-bold text-center text-emerald-400 tracking-wider py-4">
            Gym Session Tracker
          </h1>

          <nav className="flex justify-center gap-2 sm:gap-4 border-t border-gray-700">
            <button
              onClick={() => setCurrentView('SESSIONS_LIST')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition ${
                currentView === 'SESSIONS_LIST'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <CalendarIcon /> Séances
            </button>

            <button
              onClick={() => setCurrentView('HISTORY')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition ${
                currentView === 'HISTORY'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <HistoryIcon /> Historique
            </button>

            <button
              onClick={() => setCurrentView('EXERCISE_LIBRARY')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition ${
                currentView === 'EXERCISE_LIBRARY'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <DumbbellIcon /> Exercices
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-4xl mx-auto">{renderView()}</div>
      </main>
    </div>
  );
};

export default App;
