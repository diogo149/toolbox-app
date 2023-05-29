import React, { createContext, useState, useEffect, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import useSound from 'use-sound';
import finishSound from './viki_hmph_2x.mp3'; // import your sound here
import halfSound from './viki_ding_halftime_2x.mp3';
import ReactMarkdown from 'react-markdown';

import { TextField, Checkbox, FormControlLabel, Slider, Button, Box } from '@mui/material';

import config from './exercises.yaml';

const App = () => {

  const [playFinishSound] = useSound(finishSound);
  const [playHalfSound] = useSound(halfSound);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [maxTime, setMaxTime] = useState(2);
  const [useAudio, setUseAudio] = useState(false);
  const [usePartner, setUsePartner] = useState(false);
  const [useForHardTimes, setUseForHardTimes] = useState(false);
  const [useJournal, setUseJournal] = useState(false);
  const [timer, setTimer] = useState(null);

  const selectRandomExercise = (allowReroll = true) => {
    let validExercises = config.exercises.filter(exercise => {
      return exercise.time <= maxTime &&
        (allowReroll || !exercise.tags.includes('reroll')) &&
        (!usePartner || exercise.tags.includes('partner')) &&
        (!useForHardTimes || exercise.tags.includes('for_hard_times')) &&
        (useAudio === ('audio' in exercise ? exercise.audio : false));
    });

    if (validExercises.length === 0) {
      alert('No valid exercises found with the current criteria.');
      return;
    }

    // Create a weighted list of exercises.
    let weightedExercises = [];
    validExercises.forEach(exercise => {
      if (!(exercise.type in config.weights)) {
        throw new Error(exercise.type + " not in config.weights");
      }
      let weight = config.weights[exercise.type];
      if ('weight' in exercise) {
        weight *= exercise.weight;
      }
      for (let i = 0; i < weight; i++) {
        weightedExercises.push(exercise);
      }
    });

    let randomExercise = weightedExercises[Math.floor(Math.random() * weightedExercises.length)];
    setSelectedExercise(randomExercise);
    // have time of -1 default to maxTime
    let exerciseTime = (randomExercise.time > 0 ? randomExercise.time : maxTime) * 60;
    if (randomExercise.tags.includes('reroll')) {
      console.log("REROLL!");
      const rerollTime = 5;
      setTimer(rerollTime);
      setTimeout(() => selectRandomExercise(false), rerollTime * 1000);
    } else {
      setTimer(exerciseTime);
    }

    // half-time logic
    if (randomExercise.tags.includes('partner') && !randomExercise.tags.includes('reroll')) {
      setTimeout(() => playHalfSound(), 1000 * exerciseTime / 2);
    }
  };

  if (timer > 0) {
    setTimeout(() => setTimer(timer - 1), 1000);
  } else if (timer === 0) {
    playFinishSound();
    setTimer(null);
  }

  const handleSliderChange = (event, newValue) => {
    setMaxTime(newValue);
  };

  return (
      <div className="App">
      <Box
        width="80%"
        border={1}
        borderColor="grey.500"
        borderRadius={2}
        p={2}
        m={2}
        bgcolor="background.paper"
      >
      {!selectedExercise ? (
          <div>
          <h2>Max Time (in minutes):</h2>
          <Slider
            defaultValue={2}
            min={1}
            max={10}
            step={1}
            valueLabelDisplay="on"
            onChange={handleSliderChange}
          />
          <br/>
          <FormControlLabel
            control={
              <Checkbox checked={usePartner} onChange={(e) => setUsePartner(e.target.checked)} />
            }
            label="Partner Exercise"
          />
          <br/>
          <FormControlLabel
            control={
              <Checkbox checked={useForHardTimes} onChange={(e) => setUseForHardTimes(e.target.checked)} />
            }
            label="For hard times?"
          />
          <br/>
          <Button onClick={selectRandomExercise}>Start</Button>
        </div>
      ) : (
          <div>
          <p>Time: {timer} seconds left</p>
          {selectedExercise.audio && <audio controls src={selectedExercise.audioSrc} />}
          {selectedExercise && <ReactMarkdown>{selectedExercise.content}</ReactMarkdown>}
        </div>
      )}
    </Box>
    </div>
  );
};

const root = document.getElementById('app');
createRoot(root).render(<App />);
