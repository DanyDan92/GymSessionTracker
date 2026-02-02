
import React, { useState, useMemo, useCallback } from 'react';
import { WorkoutSession, SessionExercise, ExerciseTemplate } from '../types';
import { v4 as uuidv4 } from 'uuid';
import ExerciseCard from './ExerciseCard';
import { PlusIcon } from './icons/PlusIcon';
import SelectExerciseModal from './SelectExerciseModal';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import ExerciseForm from './ExerciseForm';

interface SessionDetailProps {
  sessionId: string;
  sessions: WorkoutSession[];
  exerciseTemplates: ExerciseTemplate[];
  onSaveSession: (session: WorkoutSession) => void;
  onSaveTemplate: (template: ExerciseTemplate) => void;
  onBack: () => void;
}

const SessionDetail: React.FC<SessionDetailProps> = ({ sessionId, sessions, exerciseTemplates, onSaveSession, onSaveTemplate, onBack }) => {
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  const session = useMemo(() => sessions.find(s => s.id === sessionId), [sessions, sessionId]);

  const handleAddExercise = useCallback((template: ExerciseTemplate) => {
    if (!session) return;
    const newExercise: SessionExercise = {
      id: uuidv4(),
      templateId: template.id,
      name: template.name,
      sets: template.defaultSets,
      trackingType: template.defaultTrackingType,
      targetReps: template.defaultTargetReps,
      targetDuration: template.defaultTargetDuration,
      restTime: template.defaultRestTime,
      targetRpe: template.defaultRpe,
      tempo: template.defaultTempo,
      targetWeight: template.defaultWeight,
      imageUrl: template.imageUrl,
      videoUrl: template.videoUrl,
      setsProgress: [],
    };
    onSaveSession({ ...session, exercises: [...session.exercises, newExercise] });
    setIsSelectModalOpen(false);
  }, [session, onSaveSession]);

  const handleUpdateExercise = useCallback((updatedExercise: SessionExercise) => {
    if (!session) return;
    const updatedExercises = session.exercises.map(ex => ex.id === updatedExercise.id ? updatedExercise : ex);
    onSaveSession({ ...session, exercises: updatedExercises });
  }, [session, onSaveSession]);

  const handleDeleteExercise = useCallback((exerciseId: string) => {
      if(!session) return;
      const updatedExercises = session.exercises.filter(ex => ex.id !== exerciseId);
      onSaveSession({...session, exercises: updatedExercises});
  }, [session, onSaveSession]);

  const handleStartCreateTemplate = () => {
    setIsSelectModalOpen(false);
    setIsCreatingTemplate(true);
  };

  const handleSaveNewTemplateAndAddToSession = (newTemplate: ExerciseTemplate) => {
    onSaveTemplate(newTemplate);
    handleAddExercise(newTemplate);
    setIsCreatingTemplate(false);
  };

  const handleFinishSession = () => {
    if (!session) return;
    onSaveSession({ ...session, isCompleted: true });
    onBack();
  };

  if (!session) {
    return <div className="text-center text-red-500">Séance non trouvée.</div>;
  }

  return (
    <div className="space-y-6 pb-24">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-semibold mb-2">
        <ChevronLeftIcon /> Retour
      </button>
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold">{session.name}</h2>
        <p className="text-md text-gray-400">{new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        {session.notes && <p className="mt-2 text-gray-300 whitespace-pre-wrap">{session.notes}</p>}
      </div>

      <div className="space-y-6">
        {session.exercises.map(ex => (
          <ExerciseCard 
            key={ex.id} 
            exercise={ex} 
            onUpdateExercise={handleUpdateExercise} 
            onDeleteExercise={handleDeleteExercise}
            isReadOnly={session.isCompleted}
          />
        ))}
      </div>

      {!session.isCompleted && (
        <>
            <button onClick={() => setIsSelectModalOpen(true)} className="w-full flex justify-center items-center gap-2 mt-6 p-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white hover:border-gray-500 transition">
                <PlusIcon className="w-6 h-6" /> Ajouter un exercice
            </button>
            {session.exercises.length > 0 && (
                 <button onClick={handleFinishSession} className="w-full flex justify-center items-center gap-2 mt-4 p-4 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition">
                    Terminer la séance
                </button>
            )}
        </>
      )}

      {isSelectModalOpen && (
        <SelectExerciseModal 
          templates={exerciseTemplates}
          onSelect={handleAddExercise}
          onClose={() => setIsSelectModalOpen(false)}
          onStartCreate={handleStartCreateTemplate}
        />
      )}
      {isCreatingTemplate && (
        <ExerciseForm 
            templateToEdit={null}
            onSave={handleSaveNewTemplateAndAddToSession}
            onClose={() => setIsCreatingTemplate(false)}
        />
      )}
    </div>
  );
};

export default SessionDetail;
