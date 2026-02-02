
import React, { useState } from 'react';
import { ExerciseTemplate } from '../types';
import { PlusIcon } from './icons/PlusIcon';

interface SelectExerciseModalProps {
  templates: ExerciseTemplate[];
  onSelect: (template: ExerciseTemplate) => void;
  onClose: () => void;
  onStartCreate: () => void;
}

const SelectExerciseModal: React.FC<SelectExerciseModalProps> = ({ templates, onSelect, onClose, onStartCreate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-white">Choisir un Exercice</h2>
        <input 
            type="text"
            placeholder="Rechercher un exercice..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 mb-4 text-white focus:ring-emerald-500 focus:border-emerald-500"
        />
        <div className="overflow-y-auto space-y-2 flex-grow mb-4">
            {filteredTemplates.length > 0 ? filteredTemplates.map(template => (
                <div key={template.id} onClick={() => onSelect(template)} className="bg-gray-700/50 p-3 rounded-lg cursor-pointer hover:bg-emerald-500/20 transition">
                    <p className="font-semibold">{template.name}</p>
                </div>
            )) : (
                <p className="text-gray-400 text-center py-8">Aucun exercice trouvé.</p>
            )}
        </div>
        <div className="border-t border-gray-600 pt-4 space-y-3">
             <button onClick={onStartCreate} className="w-full flex justify-center items-center gap-2 p-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition">
                <PlusIcon className="w-5 h-5" /> Créer un nouvel exercice
            </button>
            <button type="button" onClick={onClose} className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition">Fermer</button>
        </div>
      </div>
    </div>
  );
};

export default SelectExerciseModal;
