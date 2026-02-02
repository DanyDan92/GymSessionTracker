
import React, { useState, useMemo } from 'react';
import { WorkoutSession } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import SessionForm from './SessionForm';
import { v4 as uuidv4 } from 'uuid';
import { DuplicateIcon } from './icons/DuplicateIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

interface SessionListProps {
  sessions: WorkoutSession[];
  onSelectSession: (id: string) => void;
  onSaveSession: (session: WorkoutSession) => void;
  onDeleteSession: (id: string) => void;
  title: string;
  hideAddButton?: boolean;
}

const SessionList: React.FC<SessionListProps> = ({ sessions, onSelectSession, onSaveSession, onDeleteSession, title, hideAddButton = false }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Partial<WorkoutSession> | null>(null);

  const handleOpenForm = (session: Partial<WorkoutSession> | null = null) => {
    setEditingSession(session);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingSession(null);
    setIsFormOpen(false);
  };

  const handleSaveAndClose = (session: WorkoutSession) => {
    onSaveSession(session);
    handleCloseForm();
  };

  const handleDuplicateSession = (sessionId: string) => {
    const sessionToDuplicate = sessions.find(s => s.id === sessionId);
    if (!sessionToDuplicate) return;

    const newSession: WorkoutSession = {
        ...JSON.parse(JSON.stringify(sessionToDuplicate)),
        id: uuidv4(),
        name: `${sessionToDuplicate.name} (Copie)`,
        date: new Date().toISOString().split('T')[0],
        isCompleted: false,
    };
    
    newSession.exercises.forEach(ex => {
        ex.id = uuidv4();
        ex.setsProgress = [];
    });

    onSaveSession(newSession);
  };

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {!hideAddButton && (
          <button onClick={() => handleOpenForm(null)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 transition">
            <PlusIcon className="w-6 h-6" /> Nouvelle Séance
          </button>
        )}
      </div>

      {sortedSessions.length > 0 ? (
        <ul className="space-y-4">
          {sortedSessions.map(session => (
            <li key={session.id} className="bg-gray-800 rounded-lg hover:bg-gray-700/50 transition shadow-md group">
              <div className="p-4 flex justify-between items-center">
                <div onClick={() => onSelectSession(session.id)} className="cursor-pointer flex-grow mr-4">
                  <p className="font-bold text-lg text-emerald-400">{session.name}</p>
                  <p className="text-sm text-gray-400">{new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-4">
                    <p className="text-sm text-gray-300 hidden sm:block">{session.exercises.length} exercice{session.exercises.length > 1 ? 's' : ''}</p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!session.isCompleted && (
                            <button onClick={(e) => { e.stopPropagation(); handleDuplicateSession(session.id); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full" aria-label="Dupliquer la séance">
                                <DuplicateIcon />
                            </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleOpenForm(session); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full" aria-label="Modifier la séance">
                           <PencilIcon />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Êtes-vous sûr de vouloir supprimer cette séance ?')) { onDeleteSession(session.id); }}} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-full" aria-label="Supprimer la séance">
                            <TrashIcon />
                        </button>
                    </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-16 px-6 bg-gray-800 rounded-lg shadow-inner">
          <h3 className="text-xl font-semibold text-gray-300">{hideAddButton ? "Aucune séance dans l'historique." : "Aucune séance planifiée."}</h3>
          {!hideAddButton && <p className="text-gray-400 mt-2">Créez votre première séance pour commencer.</p>}
        </div>
      )}

      {isFormOpen && <SessionForm sessionToEdit={editingSession} onSave={handleSaveAndClose} onClose={handleCloseForm} />}
    </div>
  );
};

export default SessionList;
