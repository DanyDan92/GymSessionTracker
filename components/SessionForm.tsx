
import React, { useState, useEffect } from 'react';
import { WorkoutSession } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface SessionFormProps {
  sessionToEdit: Partial<WorkoutSession> | null;
  onSave: (session: WorkoutSession) => void;
  onClose: () => void;
}

const SessionForm: React.FC<SessionFormProps> = ({ sessionToEdit, onSave, onClose }) => {
  const [session, setSession] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    notes: '',
  });

  useEffect(() => {
    if (sessionToEdit) {
      setSession(prev => ({ ...prev, ...sessionToEdit }));
    }
  }, [sessionToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSession(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.name || !session.date) return;
    onSave({
        ...session,
        id: sessionToEdit?.id || uuidv4(),
        exercises: sessionToEdit?.exercises || [],
        isCompleted: sessionToEdit?.isCompleted || false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-white">{sessionToEdit ? 'Modifier' : 'Nouvelle'} Séance</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nom de la séance</label>
            <input type="text" name="name" id="name" value={session.name} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Date</label>
            <input type="date" name="date" id="date" value={session.date} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">Notes (optionnel)</label>
            <textarea name="notes" id="notes" value={session.notes} onChange={handleChange} rows={4} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-emerald-500 focus:border-emerald-500"></textarea>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition">Annuler</button>
            <button type="submit" className="px-4 py-2 bg-emerald-500 text-white font-semibold rounded-md hover:bg-emerald-600 transition">Sauvegarder</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionForm;
