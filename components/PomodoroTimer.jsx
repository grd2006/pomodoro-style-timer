'use client';

import React, { useState, useEffect, useRef } from 'react';

// Timer durations in seconds
const POMODORO_DURATION = 25 * 60;
const SHORT_BREAK_DURATION = 5 * 60;
const LONG_BREAK_DURATION = 15 * 60;
const POMODOROS_UNTIL_LONG_BREAK = 4;

export default function PomodoroTimer() {
  // Timer state
  const [mode, setMode] = useState('pomodoro');
  const [timeLeft, setTimeLeft] = useState(POMODORO_DURATION);
  const [isActive, setIsActive] = useState(false);
  
  // Session and goal tracking state
  const [pomodorosInSession, setPomodorosInSession] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(0); // 0 means no goal is set
  const [pomodorosToday, setPomodorosToday] = useState(0);
  const [goalInput, setGoalInput] = useState("4"); // For the input field

  // Sound and persistence state
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const intervalRef = useRef(null);
  const alarmSoundRef = useRef(null);
  
  // --- LOCAL STORAGE & INITIALIZATION ---
  useEffect(() => {
    // This effect runs once on component mount to load data from localStorage
    const savedData = localStorage.getItem('pomodoroData');
    const today = new Date().toISOString().split('T')[0]; // Get date in YYYY-MM-DD format

    if (savedData) {
      const data = JSON.parse(savedData);
      
      // If the saved date is today, load the progress
      if (data.date === today) {
        setDailyGoal(data.goal || 0);
        setPomodorosToday(data.pomodoros || 0);
      } else {
        // It's a new day, reset daily progress but keep the goal
        setDailyGoal(data.goal || 0);
        setPomodorosToday(0);
        // Update localStorage for the new day
        localStorage.setItem('pomodoroData', JSON.stringify({ ...data, date: today, pomodoros: 0 }));
      }
      
      // Load sound preference, default to true if not set
      setIsSoundEnabled(data.soundEnabled !== undefined ? data.soundEnabled : true);
    }
  }, []);

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      clearInterval(intervalRef.current);
      setIsActive(false);
      
      if (isSoundEnabled && alarmSoundRef.current) {
        alarmSoundRef.current.play();
      }

      if (mode === 'pomodoro') {
        const newPomodorosInSession = pomodorosInSession + 1;
        const newPomodorosToday = pomodorosToday + 1;

        setPomodorosInSession(newPomodorosInSession);
        setPomodorosToday(newPomodorosToday);

        // Save progress to localStorage
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('pomodoroData', JSON.stringify({
            date: today,
            goal: dailyGoal,
            pomodoros: newPomodorosToday,
            soundEnabled: isSoundEnabled
        }));

        if (newPomodorosInSession % POMODOROS_UNTIL_LONG_BREAK === 0) {
          switchMode('longBreak');
        } else {
          switchMode('shortBreak');
        }
      } else {
        switchMode('pomodoro');
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, timeLeft, mode, pomodorosInSession, dailyGoal, pomodorosToday, isSoundEnabled]);

  // Update document title with time
  useEffect(() => {
    document.title = `${formatTime(timeLeft)} - ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
  }, [timeLeft, mode]);

  // --- CONTROL FUNCTIONS ---
  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setIsActive(false);
    setTimeLeft(
      mode === 'pomodoro' ? POMODORO_DURATION :
      mode === 'shortBreak' ? SHORT_BREAK_DURATION :
      LONG_BREAK_DURATION
    );
  };

  const switchMode = (newMode) => {
    clearInterval(intervalRef.current);
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(
      newMode === 'pomodoro' ? POMODORO_DURATION :
      newMode === 'shortBreak' ? SHORT_BREAK_DURATION :
      LONG_BREAK_DURATION
    );
  };
  
  const handleSetGoal = () => {
    const newGoal = parseInt(goalInput, 10);
    if (!isNaN(newGoal) && newGoal >= 0) {
      setDailyGoal(newGoal);
      const today = new Date().toISOString().split('T')[0];
      const savedData = JSON.parse(localStorage.getItem('pomodoroData') || '{}');
      localStorage.setItem('pomodoroData', JSON.stringify({ ...savedData, date: today, goal: newGoal }));
    }
  };

  const handleSoundToggle = () => {
    const newSoundState = !isSoundEnabled;
    setIsSoundEnabled(newSoundState);
    const savedData = JSON.parse(localStorage.getItem('pomodoroData') || '{}');
    localStorage.setItem('pomodoroData', JSON.stringify({ ...savedData, soundEnabled: newSoundState }));
  }

  // --- HELPER & STYLING FUNCTIONS ---
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercentage = dailyGoal > 0 ? (pomodorosToday / dailyGoal) * 100 : 0;
  
  const getModeButtonClass = (bMode) => `px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === bMode ? 'bg-white text-gray-900' : 'bg-transparent text-white hover:bg-white/10'}`;
  const getBackgroundColor = () => mode === 'pomodoro' ? 'bg-red-500' : mode === 'shortBreak' ? 'bg-green-500' : 'bg-blue-500';

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-500 ${getBackgroundColor()}`}>
        {/* Sound Toggle Button */}
        <button onClick={handleSoundToggle} className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition">
          {isSoundEnabled ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
          )}
        </button>

      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white/10 backdrop-blur-sm rounded-lg shadow-2xl">
        <div className="flex justify-center space-x-2 sm:space-x-4">
          <button onClick={() => switchMode('pomodoro')} className={getModeButtonClass('pomodoro')}>Pomodoro</button>
          <button onClick={() => switchMode('shortBreak')} className={getModeButtonClass('shortBreak')}>Short Break</button>
          <button onClick={() => switchMode('longBreak')} className={getModeButtonClass('longBreak')}>Long Break</button>
        </div>

        <div className="text-center">
          <h1 className="text-8xl md:text-9xl font-mono font-bold text-white tracking-tighter">
            {formatTime(timeLeft)}
          </h1>
        </div>

        <div className="flex justify-center space-x-4 sm:space-x-6">
          <button onClick={toggleTimer} className="w-32 px-6 py-4 text-xl sm:text-2xl font-bold text-gray-900 bg-white rounded-md uppercase tracking-wider shadow-lg hover:bg-gray-200 transition-transform transform hover:scale-105">
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button onClick={resetTimer} className="w-32 px-6 py-4 text-lg text-white bg-transparent rounded-md hover:bg-white/20 transition-colors">
            Reset
          </button>
        </div>
      </div>

      {/* Daily Goal and Progress Section */}
      <div className="w-full max-w-md p-6 mt-6 bg-white/10 backdrop-blur-sm rounded-lg shadow-2xl text-white">
        <h2 className="text-xl font-bold text-center mb-4">Daily Goal</h2>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <label htmlFor="goal" className="text-sm">Pomodoros:</label>
          <input
            id="goal"
            type="number"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            className="w-16 p-1 text-center bg-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button onClick={handleSetGoal} className="px-3 py-1 bg-white text-gray-900 text-sm font-bold rounded-md hover:bg-gray-200 transition">Set Goal</button>
        </div>
        
        {dailyGoal > 0 && (
          <div className="space-y-2">
            <p className="text-center font-medium">Progress: {pomodorosToday} / {dailyGoal}</p>
            <div className="w-full bg-white/20 rounded-full h-4">
              <div 
                className="bg-white h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            {pomodorosToday >= dailyGoal && <p className="text-center text-lg font-bold mt-2">🎉 Goal Achieved! Keep going! 🎉</p>}
          </div>
        )}
      </div>

      <audio ref={alarmSoundRef} src="/alarm.mp3" preload="auto"></audio>
    </div>
  );
}