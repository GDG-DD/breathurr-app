import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IoIosPlay, IoIosRefresh } from 'react-icons/io';

import { Container } from '../container';

import { padNumber } from '@/helpers/number';

import styles from './app.module.css';
import { useLocalStorage } from '@/hooks/use-local-storage';

type Exercise =
  | 'Box Breathing'
  | 'Resonant Breathing'
  | '4-7-8 Breathing'
  | 'Pursed Lip Breathing'
  | 'Diaphragmatic Breathing'
  | 'Custom';

type Phase = 'inhale' | 'exhale' | 'holdInhale' | 'holdExhale';

const EXERCISE_PHASES: Record<Exercise, Phase[]> = {
  '4-7-8 Breathing': ['inhale', 'holdInhale', 'exhale'],
  'Box Breathing': ['inhale', 'holdInhale', 'exhale', 'holdExhale'],
  Custom: ['inhale', 'holdInhale', 'exhale', 'holdExhale'],
  'Diaphragmatic Breathing': ['inhale', 'exhale'],
  'Pursed Lip Breathing': ['inhale', 'exhale'],
  'Resonant Breathing': ['inhale', 'exhale'],
};

const EXERCISE_DURATIONS: Record<Exercise, Partial<Record<Phase, number>>> = {
  '4-7-8 Breathing': { exhale: 8, holdInhale: 7, inhale: 4 },
  'Box Breathing': { exhale: 4, holdExhale: 4, holdInhale: 4, inhale: 4 },
  Custom: {},
  'Diaphragmatic Breathing': { exhale: 6, inhale: 4 },
  'Pursed Lip Breathing': { exhale: 4, inhale: 2 },
  'Resonant Breathing': { exhale: 5, inhale: 5 },
};

const PHASE_LABELS: Record<Phase, string> = {
  exhale: 'Exhale',
  holdExhale: 'Hold',
  holdInhale: 'Hold',
  inhale: 'Inhale',
};

const DESC: Record<Exercise, string> = {
  '4-7-8 Breathing':
    'Inhale for 4 seconds, hold the breath for 7 seconds, and exhale for 8 seconds. This technique helps reduce stress and promote relaxation.',
  'Box Breathing':
    'Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds, and hold again for 4 seconds. It enhances focus and calms the mind.',
  Custom: 'Create your own custom breathing exercise.',
  'Diaphragmatic Breathing':
    'Inhale deeply, expanding the diaphragm, for 4 seconds, and exhale for 6 seconds. This exercise improves lung efficiency and reduces stress.',
  'Pursed Lip Breathing':
    'Inhale through the nose for 2 seconds, exhale slowly through pursed lips for 4 seconds. It helps slow down breathing and promotes relaxation.',
  'Resonant Breathing':
    'Breathe in and out evenly, usually around 6 breaths per minute. This method balances the nervous system and improves emotional well-being.',
};

export function App() {
  const [selectedExercise, setSelectedExercise] =
    useState<Exercise>('4-7-8 Breathing');

  const [customDurations, setCustomDurations] = useLocalStorage<
    Partial<Record<Phase, number>>
  >('calmness-custom-durations', {
    exhale: 4,
    holdExhale: 4,
    holdInhale: 4,
    inhale: 4,
  });

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [timer, setTimer] = useState(0);

  const durations = useMemo(() => {
    if (selectedExercise === 'Custom') {
      return customDurations;
    }
    return EXERCISE_DURATIONS[selectedExercise];
  }, [selectedExercise, customDurations]);

  const phases = useMemo(
    () =>
      EXERCISE_PHASES[selectedExercise].filter(
        phase => (durations[phase] || 0) > 0,
      ),
    [selectedExercise, customDurations],
  );

  const currentPhase = phases[phaseIndex];

  const animationVariants = useMemo(
    () => ({
      exhale: {
        transform: 'translate(-50%, -50%) scale(1)',
        transition: { duration: durations.exhale },
      },
      holdExhale: {
        transform: 'translate(-50%, -50%) scale(1)',
        transition: { duration: durations.holdExhale },
      },
      holdInhale: {
        transform: 'translate(-50%, -50%) scale(1.5)',
        transition: { duration: durations.holdInhale },
      },
      inhale: {
        transform: 'translate(-50%, -50%) scale(1.5)',
        transition: { duration: durations.inhale },
      },
    }),
    [durations],
  );

  const resetExercise = useCallback(() => {
    setPhaseIndex(0);
    setRunning(false);
  }, []);

  const updatePhase = useCallback(() => {
    if (running) {
      setPhaseIndex(prevIndex => (prevIndex + 1) % phases.length);
    }
  }, [phases.length, running]);

  useEffect(() => {
    resetExercise();
  }, [selectedExercise, resetExercise]);

  useEffect(() => {
    if (running) {
      const intervalDuration = (durations[currentPhase] || 4) * 1000;
      const interval = setInterval(updatePhase, intervalDuration);

      return () => clearInterval(interval);
    }
  }, [running, currentPhase, durations, updatePhase]);

  useEffect(() => {
    if (running) {
      const interval = setInterval(() => setTimer(prev => prev + 1), 1000);

      return () => clearInterval(interval);
    }
  }, [running]);

  return (
    <Container>
      <div className={styles.exercise}>
        <div className={styles.timer}>
          {padNumber(Math.floor(timer / 60))}:{padNumber(timer % 60)}
        </div>

        {running && (
          <motion.div
            animate={currentPhase}
            className={styles.circle}
            key={selectedExercise}
            variants={animationVariants}
          />
        )}

        <p className={styles.phase}>
          {running ? PHASE_LABELS[currentPhase] : 'Paused'}
        </p>

        <div className={styles.selectWrapper}>
          <select
            className={styles.selectBox}
            disabled={running}
            value={selectedExercise}
            onChange={e => setSelectedExercise(e.target.value as Exercise)}
          >
            {Object.keys(EXERCISE_PHASES)
              .filter(phase => phase !== 'Custom')
              .map(exercise => (
                <option key={exercise} value={exercise}>
                  {exercise}
                </option>
              ))}
            <option value="Custom">Custom</option>
          </select>

          <button
            className={styles.controlButton}
            onClick={() => {
              if (running) {
                resetExercise();
              } else {
                setRunning(true);
              }
            }}
          >
            {running ? <IoIosRefresh /> : <IoIosPlay />}
          </button>
        </div>
      </div>

      {selectedExercise === 'Custom' && (
        <div className={styles.customForm}>
          {['inhale', 'holdInhale', 'exhale', 'holdExhale'].map(phase => (
            <div className={styles.field} key={phase}>
              <label htmlFor={phase}>
                {PHASE_LABELS[phase as Phase]} Duration:
              </label>
              <input
                disabled={running}
                id={phase}
                min="0"
                type="number"
                value={customDurations[phase as Phase]}
                onChange={e =>
                  setCustomDurations(prev => ({
                    ...prev,
                    [phase]: Number(e.target.value),
                  }))
                }
              />
            </div>
          ))}
        </div>
      )}

      {selectedExercise !== 'Custom' && (
        <div className={styles.desc}>
          <span>{selectedExercise}:</span> {DESC[selectedExercise]}
        </div>
      )}
    </Container>
  );
}
