import React, { createContext, useState, useEffect, useContext } from 'react';
import ReactDOM from 'react-dom';
import useSound from 'use-sound';
import finishSound from './viki_hmph.mp3'; // import your sound here
import ReactMarkdown from 'react-markdown';

import config from './exercises.yaml';

const App = () => {

  const [playFinishSound] = useSound(finishSound);
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
    if (randomExercise.tags.includes('reroll')) {
      console.log("REROLL!");
      const rerollTime = 5;
      setTimer(rerollTime);
      setTimeout(() => selectRandomExercise(false), rerollTime * 1000);
    } else {
      setTimer((randomExercise > 0 ? randomExercise.time : maxTime) * 60);
    }
  };

  if (timer > 0) {
    setTimeout(() => setTimer(timer - 1), 1000);
  } else if (timer === 0) {
    playFinishSound();
    setTimer(null);
  }

  return (
      <div className="App">
      {!selectedExercise ? (
          <div>
          <label>
          Max Time (in minutes):
          <input type="number" value={maxTime} onChange={(e) => setMaxTime(e.target.value)} />
          </label>
          <br/>
          {/*
          <label>
          Use Audio:
          <input type="checkbox" checked={useAudio} onChange={(e) => setUseAudio(e.target.checked)} />
          </label>
          <br/>
          */}
          <label>
          Partner Exercise:
          <input type="checkbox" checked={usePartner} onChange={(e) => setUsePartner(e.target.checked)} />
          </label>
          <br/>
          <label>
          For hard times?:
          <input type="checkbox" checked={useForHardTimes} onChange={(e) => setUseForHardTimes(e.target.checked)} />
          </label>
          <br/>
          <button onClick={selectRandomExercise}>Start</button>
          </div>
      ) : (
          <div>
          <h1>{selectedExercise.type}</h1>
          <p>Time: {timer} seconds left</p>
          {selectedExercise.audio && <audio controls src={selectedExercise.audioSrc} />}
          {selectedExercise && <ReactMarkdown>{selectedExercise.content}</ReactMarkdown>}
        </div>
      )}
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('app'));
