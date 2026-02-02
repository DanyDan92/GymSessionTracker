
import React, { useState } from 'react';
import { ExerciseTemplate, TrackingType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import NumberStepper from './NumberStepper';

interface ExerciseFormProps {
  templateToEdit: Partial<ExerciseTemplate> | null;
  onSave: (template: ExerciseTemplate) => void;
  onClose: () => void;
}

const InputField: React.FC<{label: string; name: string; value: string|number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; required?: boolean;}> = ({ label, name, value, onChange, ...props }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <input id={name} name={name} value={value} onChange={onChange} {...props} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-emerald-500 focus:border-emerald-500" />
    </div>
);

const ExerciseForm: React.FC<ExerciseFormProps> = ({ templateToEdit, onSave, onClose }) => {
  
  const getInitialState = () => {
    const defaults: Omit<ExerciseTemplate, 'id'> = {
        name: '',
        defaultSets: 3,
        defaultTrackingType: TrackingType.REPS,
        defaultTargetReps: 10,
        defaultTargetDuration: 60,
        defaultRestTime: 90,
        defaultRpe: 7,
        defaultTempo: { eccentric: 3, pause: 1, concentric: 2 },
        defaultWeight: 0,
        imageUrl: '',
        videoUrl: '',
    };
    return { ...defaults, ...templateToEdit };
  };
  
  const [template, setTemplate] = useState(getInitialState);

  const handleValueChange = (name: string, value: any) => {
    if (name.startsWith('defaultTempo.')) {
      const tempoField = name.split('.')[1] as keyof ExerciseTemplate['defaultTempo'];
      setTemplate(prev => ({ ...prev, defaultTempo: { ...prev.defaultTempo, [tempoField]: Number(value) } }));
    } else {
      setTemplate(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            handleValueChange('imageUrl', reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleTypeChange = (type: TrackingType) => {
    setTemplate(prev => ({ ...prev, defaultTrackingType: type }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!template.name) return; // Basic validation
    onSave({ ...template, id: templateToEdit?.id || uuidv4() });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-white">{templateToEdit ? 'Modifier' : 'Créer'} un Exercice</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField label="Nom de l'exercice" name="name" value={template.name} onChange={(e) => handleValueChange('name', e.target.value)} type="text" required/>
          
           <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Image de l'exercice</label>
              <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
              />
              {template.imageUrl ? (
                  <div className="mt-2 relative">
                      <img src={template.imageUrl} alt="Aperçu" className="w-full rounded-lg max-h-52 object-contain bg-gray-900" />
                      <button 
                          type="button"
                          onClick={() => {
                              handleValueChange('imageUrl', '');
                              const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
                              if (fileInput) fileInput.value = '';
                          }} 
                          className="absolute top-2 right-2 bg-red-600/80 backdrop-blur-sm text-white rounded-full h-7 w-7 flex items-center justify-center font-bold text-lg hover:bg-red-500 transition"
                          aria-label="Supprimer l'image"
                      >
                          &times;
                      </button>
                  </div>
              ) : (
                  <label htmlFor="imageUpload" className="mt-1 w-full flex justify-center items-center gap-2 p-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Télécharger une image
                  </label>
              )}
          </div>

          <InputField label="Lien vers une vidéo (URL)" name="videoUrl" value={template.videoUrl || ''} onChange={(e) => handleValueChange('videoUrl', e.target.value)} type="text" />
          
          <NumberStepper label="Séries par défaut" value={template.defaultSets} onChange={(val) => handleValueChange('defaultSets', val)} min={1} />
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Type de suivi par défaut</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleTypeChange(TrackingType.REPS)} className={`flex-1 p-3 rounded-md text-sm font-semibold transition ${template.defaultTrackingType === TrackingType.REPS ? 'bg-emerald-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Répétitions</button>
              <button type="button" onClick={() => handleTypeChange(TrackingType.DURATION)} className={`flex-1 p-3 rounded-md text-sm font-semibold transition ${template.defaultTrackingType === TrackingType.DURATION ? 'bg-emerald-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Durée</button>
            </div>
          </div>

          {template.defaultTrackingType === TrackingType.REPS ? (
            <NumberStepper label="Répétitions par défaut" value={template.defaultTargetReps || 10} onChange={(val) => handleValueChange('defaultTargetReps', val)} min={1} />
          ) : (
            <NumberStepper label="Durée par défaut (secondes)" value={template.defaultTargetDuration || 60} onChange={(val) => handleValueChange('defaultTargetDuration', val)} min={1} step={5} />
          )}
          
          <NumberStepper label="Charge en Kg (par défaut)" value={template.defaultWeight || 0} onChange={(val) => handleValueChange('defaultWeight', val)} min={0} step={0.5} />

          <NumberStepper label="Repos par défaut (secondes)" value={template.defaultRestTime} onChange={(val) => handleValueChange('defaultRestTime', val)} min={0} step={10} />

          <div>
            <label htmlFor="defaultRpe" className="block text-sm font-medium text-gray-300 mb-1">RPE par défaut (1-10)</label>
            <div className="flex items-center gap-4">
              <input id="defaultRpe" name="defaultRpe" value={template.defaultRpe} onChange={(e) => handleValueChange('defaultRpe', Number(e.target.value))} type="range" min={1} max={10} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
              <span className="font-bold text-lg text-emerald-400 w-8 text-center">{template.defaultRpe}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tempo par défaut (X-Y-Z)</label>
            <div className="grid grid-cols-3 gap-3">
              <NumberStepper label="X (Eccentric)" value={template.defaultTempo.eccentric} onChange={(val) => handleValueChange('defaultTempo.eccentric', val)} min={0} />
              <NumberStepper label="Y (Pause)" value={template.defaultTempo.pause} onChange={(val) => handleValueChange('defaultTempo.pause', val)} min={0} />
              <NumberStepper label="Z (Concentric)" value={template.defaultTempo.concentric} onChange={(val) => handleValueChange('defaultTempo.concentric', val)} min={0} />
            </div>
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

export default ExerciseForm;
