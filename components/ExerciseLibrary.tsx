
import React, { useState } from 'react';
import { ExerciseTemplate } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import ExerciseForm from './ExerciseForm';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { v4 as uuidv4 } from 'uuid';
import { DuplicateIcon } from './icons/DuplicateIcon';
import { VideoIcon } from './icons/VideoIcon';

interface ExerciseLibraryProps {
  templates: ExerciseTemplate[];
  onSaveTemplate: (template: ExerciseTemplate) => void;
  onDeleteTemplate: (id: string) => void;
}

const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({ templates, onSaveTemplate, onDeleteTemplate }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ExerciseTemplate | null>(null);

  const handleOpenForm = (template: ExerciseTemplate | null = null) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };
  
  const handleCloseForm = () => {
      setEditingTemplate(null);
      setIsFormOpen(false);
  }

  const handleSaveAndClose = (template: ExerciseTemplate) => {
      onSaveTemplate(template);
      handleCloseForm();
  }
  
  const handleDuplicateTemplate = (templateId: string) => {
    const templateToDuplicate = templates.find(t => t.id === templateId);
    if (!templateToDuplicate) return;

    const newTemplate: ExerciseTemplate = {
        ...JSON.parse(JSON.stringify(templateToDuplicate)),
        id: uuidv4(),
        name: `${templateToDuplicate.name} (Copie)`,
    };
    onSaveTemplate(newTemplate);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Bibliothèque d'Exercices</h2>
        <button onClick={() => handleOpenForm()} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 transition">
          <PlusIcon className="w-6 h-6"/> Créer un Exercice
        </button>
      </div>

      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div key={template.id} className="bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
              {template.imageUrl && (
                  <img src={template.imageUrl} alt={template.name} className="w-full h-32 object-cover" />
              )}
              <div className="p-4 flex flex-col flex-grow">
                  <div className="flex-grow">
                      <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg text-emerald-400 flex-grow pr-2">{template.name}</h3>
                          {template.videoUrl && (
                              <a href={template.videoUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white flex-shrink-0">
                                  <VideoIcon />
                              </a>
                          )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                          {template.defaultSets} séries x {template.defaultTrackingType === 'repetitions' ? `${template.defaultTargetReps} reps` : `${template.defaultTargetDuration}s`}
                          {template.defaultWeight ? ` @ ${template.defaultWeight} Kg` : ''}
                      </p>
                  </div>
                  <div className="flex justify-end items-center gap-2 mt-4">
                      <button onClick={() => handleDuplicateTemplate(template.id)} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition"><DuplicateIcon /></button>
                      <button onClick={() => handleOpenForm(template)} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition"><PencilIcon /></button>
                      <button onClick={() => onDeleteTemplate(template.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-gray-700 transition"><TrashIcon /></button>
                  </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-gray-800 rounded-lg shadow-inner">
          <h3 className="text-xl font-semibold text-gray-300">Votre bibliothèque est vide.</h3>
          <p className="text-gray-400 mt-2">Créez votre premier exercice pour le réutiliser dans vos séances.</p>
        </div>
      )}

      {isFormOpen && <ExerciseForm templateToEdit={editingTemplate} onSave={handleSaveAndClose} onClose={handleCloseForm} />}
    </div>
  );
};

export default ExerciseLibrary;
