
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SessionExercise, TrackingType, SetProgress } from '../types';
import { PlayIcon } from './icons/PlayIcon';
import TimerDisplay from './TimerDisplay';
import { RepeatIcon } from './icons/RepeatIcon';
import { CheckIcon } from './icons/CheckIcon';
import NumberStepper from './NumberStepper';
import { ImageIcon } from './icons/ImageIcon';
import { VideoIcon } from './icons/VideoIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ExerciseCardProps {
  exercise: SessionExercise;
  onUpdateExercise: (updatedExercise: SessionExercise) => void;
  onDeleteExercise: (exerciseId: string) => void;
  isReadOnly?: boolean;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onUpdateExercise, onDeleteExercise, isReadOnly = false }) => {
  const [isExercising, setIsExercising] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [isLoggingSet, setIsLoggingSet] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentReps, setCurrentReps] = useState(exercise.targetReps || 0);
  const [currentWeight, setCurrentWeight] = useState(exercise.targetWeight || 0);
  const [actualRpe, setActualRpe] = useState(exercise.targetRpe);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const timeLeftOnEarlyFinish = useRef<number | null>(null);
  
  const currentSetNumber = useMemo(() => exercise.setsProgress.length + 1, [exercise.setsProgress]);
  const isFinished = useMemo(() => exercise.setsProgress.length >= exercise.sets, [exercise.setsProgress, exercise.sets]);

  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
  
  useEffect(() => {
    setCurrentReps(exercise.targetReps || 0);
    setActualRpe(exercise.targetRpe);
    setCurrentWeight(exercise.targetWeight || 0);
  }, [currentSetNumber, exercise.targetReps, exercise.targetRpe, exercise.targetWeight]);

  useEffect(() => {
    if (timeLeft > 0 && (isExercising || isResting)) {
      intervalRef.current = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else {
      stopTimer();
      if (isExercising) {
        setIsExercising(false);
        setIsLoggingSet(true);
      }
      if (isResting) setIsResting(false);
    }
    return () => stopTimer();
  }, [timeLeft, isExercising, isResting]);

  const handleStartSet = () => {
    if (isFinished) return;
    if (exercise.trackingType === TrackingType.DURATION && exercise.targetDuration) {
      setIsExercising(true);
      setTimeLeft(exercise.targetDuration);
    } else {
      setIsExercising(true);
    }
  };

  const handleLogSet = () => {
    setIsExercising(false);
    setIsLoggingSet(true);
  };

  const handleFinishEarly = () => {
    timeLeftOnEarlyFinish.current = timeLeft;
    stopTimer();
    setIsExercising(false);
    setIsLoggingSet(true);
  };
  
  const handleStartRest = () => {
    setIsResting(true);
    setTimeLeft(exercise.restTime);
  };

  const handleSkipRest = () => {
    stopTimer();
    setIsResting(false);
  };

  const handleSaveSetAndRest = () => {
    let durationDoneValue: number | undefined;
    if (exercise.trackingType === TrackingType.DURATION) {
      if (timeLeftOnEarlyFinish.current !== null) {
        durationDoneValue = (exercise.targetDuration || 0) - timeLeftOnEarlyFinish.current;
        timeLeftOnEarlyFinish.current = null;
      } else {
        durationDoneValue = exercise.targetDuration;
      }
    }
    
    const newProgress: SetProgress = {
      setNumber: currentSetNumber,
      actualRpe: actualRpe,
      weight: currentWeight,
      ...(exercise.trackingType === TrackingType.REPS && { repsDone: currentReps }),
      ...(exercise.trackingType === TrackingType.DURATION && { durationDone: durationDoneValue }),
    };
    
    const updatedSetsProgress = [...exercise.setsProgress, newProgress];
    onUpdateExercise({ ...exercise, setsProgress: updatedSetsProgress });
    
    setIsLoggingSet(false);

    if (updatedSetsProgress.length < exercise.sets) {
        handleStartRest();
    }
  };


  const progressPercentage = (exercise.setsProgress.length / exercise.sets) * 100;

  const cardStateClass = isExercising ? 'border-emerald-500 ring-2 ring-emerald-500' : isResting ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-700';

  return (
    <div className={`bg-gray-800 rounded-lg shadow-xl overflow-hidden border-2 transition-all duration-300 ${cardStateClass}`}>
      <div className="bg-white/5 h-2">
        <div className="bg-emerald-500 h-2 transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold tracking-tight text-gray-100">{exercise.name}</h3>
            <div className="flex items-center gap-2">
                {exercise.imageUrl && (
                    <button onClick={() => setIsImageModalOpen(true)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full" aria-label="Voir l'image">
                        <ImageIcon />
                    </button>
                )}
                {exercise.videoUrl && (
                    <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full" aria-label="Voir la vidéo">
                        <VideoIcon />
                    </a>
                )}
                {!isReadOnly && (
                    <button onClick={() => onDeleteExercise(exercise.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-full" aria-label="Supprimer l'exercice">
                        <TrashIcon />
                    </button>
                )}
            </div>
        </div>
        
        <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-4 text-center">
          <div className="bg-gray-700/50 p-3 rounded-lg"><p className="text-sm text-gray-400">Séries</p><p className="text-xl font-semibold">{currentSetNumber > exercise.sets ? exercise.sets : currentSetNumber} / {exercise.sets}</p></div>
          <div className="bg-gray-700/50 p-3 rounded-lg"><p className="text-sm text-gray-400">{exercise.trackingType === TrackingType.REPS ? 'Reps Cibles' : 'Durée Cible'}</p><p className="text-xl font-semibold">{exercise.trackingType === TrackingType.REPS ? exercise.targetReps : <TimerDisplay seconds={exercise.targetDuration || 0} />}</p></div>
          <div className="bg-gray-700/50 p-3 rounded-lg"><p className="text-sm text-gray-400">Poids Cible</p><p className="text-xl font-semibold">{exercise.targetWeight || 0} Kg</p></div>
          <div className="bg-gray-700/50 p-3 rounded-lg"><p className="text-sm text-gray-400">Repos</p><p className="text-xl font-semibold"><TimerDisplay seconds={exercise.restTime} /></p></div>
          <div className="bg-gray-700/50 p-3 rounded-lg"><p className="text-sm text-gray-400">RPE Cible</p><p className="text-xl font-semibold">{exercise.targetRpe}</p></div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 flex flex-col items-center justify-center min-h-[150px]">
        {(isFinished || isReadOnly) ? (
          <div className="w-full px-4 text-left overflow-y-auto max-h-48">
            <h4 className="font-bold text-lg text-center mb-2 text-emerald-400">Récapitulatif</h4>
             {exercise.setsProgress.length > 0 ? (
                <ul className="space-y-2">
                    {exercise.setsProgress.map((set) => (
                        <li key={set.setNumber} className="grid grid-cols-3 items-center bg-gray-700/50 p-2 rounded-md text-sm">
                            <span className="font-semibold text-gray-300">Série {set.setNumber}</span>
                            <span className="text-white text-center">
                                {set.repsDone !== undefined ? `${set.repsDone} reps` : <TimerDisplay seconds={set.durationDone || 0} />}
                                {set.weight !== undefined ? ` x ${set.weight} Kg` : ''}
                            </span>
                            <span className="text-gray-400 text-right">@ RPE {set.actualRpe}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 text-center">Aucune série effectuée.</p>
            )}
          </div>
        ) : isExercising ? (
          <div className='text-center'>
            {exercise.trackingType === TrackingType.DURATION ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-lg font-semibold mb-2">En cours : Série {currentSetNumber}</p>
                <TimerDisplay seconds={timeLeft} className="text-6xl font-mono tracking-tighter" />
                <button onClick={handleFinishEarly} className="mt-2 px-6 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition">Terminé</button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <p className="text-lg font-semibold">Série {currentSetNumber}</p>
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentReps(p => Math.max(0, p - 1))} className="w-14 h-14 bg-gray-700 rounded-full text-3xl font-bold">-</button>
                    <span className="text-5xl font-bold w-24 text-center">{currentReps}</span>
                    <button onClick={() => setCurrentReps(p => p + 1)} className="w-14 h-14 bg-gray-700 rounded-full text-3xl font-bold">+</button>
                </div>
                <button onClick={handleLogSet} className="mt-2 flex items-center gap-2 px-6 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition"><CheckIcon /> Valider la série</button>
              </div>
            )}
          </div>
        ) : isLoggingSet ? (
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            {exercise.trackingType === TrackingType.REPS ? (
                 <NumberStepper label={`Répétitions (Série ${currentSetNumber})`} value={currentReps} onChange={setCurrentReps} min={0} />
            ) : ( <p className="font-semibold">Série {currentSetNumber} terminée</p> )}
             <NumberStepper label={`Charge en Kg (Série ${currentSetNumber})`} value={currentWeight} onChange={setCurrentWeight} min={0} step={0.5}/>
            
            <div className="w-full">
                 <label className="block text-sm font-medium text-gray-300 text-center mb-1">RPE Effectué</label>
                 <div className="flex items-center gap-4 w-full">
                    <input type="range" min="1" max="10" value={actualRpe} onChange={e => setActualRpe(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                    <span className="font-bold text-lg text-emerald-400 w-8 text-center">{actualRpe}</span>
                 </div>
            </div>
            <button onClick={handleSaveSetAndRest} className="w-full flex justify-center items-center gap-2 px-6 py-2 mt-2 bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 transition">Terminé</button>
          </div>
        ) : isResting ? (
          <div className='text-center flex flex-col items-center justify-center'>
            <p className="text-lg font-semibold mb-2">Repos</p>
            <div className="flex items-end justify-center gap-3">
              <TimerDisplay seconds={timeLeft} className="text-6xl font-mono tracking-tighter" />
              <button onClick={handleSkipRest} className="mb-2 px-4 py-1 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition text-sm">Passer</button>
            </div>
          </div>
        ) : (
            <button onClick={handleStartSet} className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white font-bold rounded-lg shadow-md hover:bg-emerald-600 transition-transform transform hover:scale-105">
              {exercise.setsProgress.length === 0 ? <><PlayIcon /> Démarrer</> : <><RepeatIcon/> Prochaine Série</>}
            </button>
        )}
      </div>
       {exercise.setsProgress.length > 0 && !isFinished && !isReadOnly && (
        <div className="bg-gray-900/50 p-2 text-xs text-center text-gray-400">
            Dernière série : {exercise.setsProgress.slice(-1)[0].repsDone !== undefined ? `${exercise.setsProgress.slice(-1)[0].repsDone} reps` : <TimerDisplay seconds={exercise.setsProgress.slice(-1)[0].durationDone || 0} />}
            {exercise.setsProgress.slice(-1)[0].weight !== undefined ? ` x ${exercise.setsProgress.slice(-1)[0].weight} Kg` : ''}
             @ RPE {exercise.setsProgress.slice(-1)[0].actualRpe}
        </div>
       )}
       {isImageModalOpen && exercise.imageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4" onClick={() => setIsImageModalOpen(false)}>
            <img src={exercise.imageUrl} alt={exercise.name} className="max-w-full max-h-full rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
            <button onClick={() => setIsImageModalOpen(false)} className="absolute top-4 right-4 text-white text-3xl font-bold">&times;</button>
        </div>
       )}
    </div>
  );
};

export default ExerciseCard;
