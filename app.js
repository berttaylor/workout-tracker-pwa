// Workout Tracker PWA - Main Application Logic

class WorkoutTracker {
    constructor() {
        this.sessionNumber = 1;
        this.repsQueue = [];
        this.weightQueue = [];
        this.exerciseStates = {};
        this.currentWorkout = null;
        this.workoutHistory = [];
        
        this.init();
    }

    init() {
        this.loadData();
        this.registerServiceWorker();
        this.render();
    }

    // Configuration with your specific exercises
    getDefaultConfig() {
        return {
            workouts: [
                {
                    name: "Workout A",
                    exercises: [
                        {
                            name: "Shoulder press",
                            startWeight: 30,
                            repRange: [5, 10],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5
                        },
                        {
                            name: "Pectoral machine",
                            startWeight: 40,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5
                        },
                        {
                            name: "Chest incline",
                            startWeight: 40,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5
                        },
                        {
                            name: "Tricep pulldowns",
                            startWeight: 20,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5
                        },
                        {
                            name: "Calf raises",
                            startWeight: 7.5,
                            repRange: [8, 10],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5
                        },
                        {
                            name: "Cross trainer",
                            startWeight: 10,
                            repRange: [10, 15],
                            increment: 1,
                            unit: "m",
                            sets: 1
                        }
                    ]
                },
                {
                    name: "Workout B",
                    exercises: [
                        {
                            name: "Vertical traction machine",
                            startWeight: 50,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5
                        },
                        {
                            name: "Seated row",
                            startWeight: 50,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5
                        },
                        {
                            name: "Upper back machine",
                            startWeight: 30,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5
                        },
                        {
                            name: "Biceps on cable",
                            startWeight: 25,
                            repRange: [5, 6],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5
                        },
                        {
                            name: "Hip abduction machine",
                            startWeight: 89,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5
                        },
                        {
                            name: "Cross trainer",
                            startWeight: 10,
                            repRange: [10, 15],
                            increment: 1,
                            unit: "m",
                            sets: 1
                        }
                    ]
                },
                {
                    name: "Cardio Day",
                    exercises: [
                        {
                            name: "Run or swim",
                            startWeight: 60,
                            repRange: [60, 90],
                            increment: 5,
                            unit: "m",
                            sets: 1
                        }
                    ]
                }
            ]
        };
    }

    loadData() {
        // Load configuration
        const configData = localStorage.getItem('workoutConfig');
        this.config = configData ? JSON.parse(configData) : this.getDefaultConfig();
        
        // Load session data
        const sessionData = localStorage.getItem('workoutSession');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            this.sessionNumber = session.sessionNumber || 1;
            this.repsQueue = session.repsQueue || [];
            this.weightQueue = session.weightQueue || [];
            this.exerciseStates = session.exerciseStates || {};
        }

        // Load workout history
        const historyData = localStorage.getItem('workoutHistory');
        this.workoutHistory = historyData ? JSON.parse(historyData) : [];

        // Initialize exercise states if not present
        this.config.workouts.forEach(workout => {
            workout.exercises.forEach(exercise => {
                if (!this.exerciseStates[exercise.name]) {
                    this.exerciseStates[exercise.name] = {
                        currentWeight: exercise.startWeight,
                        targetReps: exercise.repRange[0],
                        failCount: 0,
                        lastSession: 0,
                        currentSet: 1,
                        completedSets: 0
                    };
                } else {
                    // Ensure new properties exist for existing exercises
                    if (typeof this.exerciseStates[exercise.name].currentSet === 'undefined') {
                        this.exerciseStates[exercise.name].currentSet = 1;
                    }
                    if (typeof this.exerciseStates[exercise.name].completedSets === 'undefined') {
                        this.exerciseStates[exercise.name].completedSets = 0;
                    }
                }
                // Set initial fail count for Shoulder press based on your current status
                if (exercise.name === "Shoulder press" && this.exerciseStates[exercise.name].failCount === 0 && this.sessionNumber === 1) {
                    this.exerciseStates[exercise.name].failCount = 1;
                }
            });
        });
    }

    saveData() {
        const sessionData = {
            sessionNumber: this.sessionNumber,
            repsQueue: this.repsQueue,
            weightQueue: this.weightQueue,
            exerciseStates: this.exerciseStates
        };
        localStorage.setItem('workoutSession', JSON.stringify(sessionData));
        localStorage.setItem('workoutConfig', JSON.stringify(this.config));
        localStorage.setItem('workoutHistory', JSON.stringify(this.workoutHistory));
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        }
    }

    // Set completion logic
    completeSet(exerciseName) {
        const state = this.exerciseStates[exerciseName];
        const exercise = this.findExercise(exerciseName);
        
        // Log set completion
        this.logWorkoutResult(exerciseName, 'set_complete', state.currentWeight, state.targetReps);
        
        state.completedSets++;
        
        // If all sets completed, handle exercise success
        if (state.completedSets >= exercise.sets) {
            this.handleExerciseComplete(exerciseName, true);
        } else {
            // Move to next set
            state.currentSet++;
        }
        
        this.saveData();
        this.render();
    }
    
    failSet(exerciseName) {
        const state = this.exerciseStates[exerciseName];
        const exercise = this.findExercise(exerciseName);
        
        // Log set failure
        this.logWorkoutResult(exerciseName, 'set_failed', state.currentWeight, state.targetReps);
        
        // Mark exercise as failed for this session
        this.handleExerciseComplete(exerciseName, false);
        
        this.saveData();
        this.render();
    }
    
    handleExerciseComplete(exerciseName, success) {
        const state = this.exerciseStates[exerciseName];
        const exercise = this.findExercise(exerciseName);
        
        // Reset sets for next workout
        state.currentSet = 1;
        state.completedSets = 0;
        state.lastSession = this.sessionNumber;
        
        if (success) {
            // Reset fail count on success
            state.failCount = 0;
            
            // Check if exercise is already in queues for this session
            const alreadyInRepsQueue = this.repsQueue.includes(exerciseName);
            const alreadyInWeightQueue = this.weightQueue.includes(exerciseName);

            if (alreadyInRepsQueue || alreadyInWeightQueue) {
                // Already processed this session, no action
                return;
            }

            // Add to reps queue first
            if (state.targetReps < exercise.repRange[1]) {
                this.repsQueue.push(exerciseName);
            } else {
                // At max reps, go to weight queue
                this.weightQueue.push(exerciseName);
            }
        } else {
            // Handle failure
            state.failCount++;
            
            // Remove from any queues
            this.repsQueue = this.repsQueue.filter(name => name !== exerciseName);
            this.weightQueue = this.weightQueue.filter(name => name !== exerciseName);

            // Deload after 2 consecutive failures
            if (state.failCount >= 2) {
                const deloadAmount = exercise.increment * 2; // 10% deload approximation
                state.currentWeight = Math.max(exercise.startWeight, state.currentWeight - deloadAmount);
                state.targetReps = exercise.repRange[0]; // Reset to minimum reps
                state.failCount = 0; // Reset fail count after deload
            }
        }
    }

    // Process queues (called at start of new workout)
    processQueues() {
        // Process reps queue (FIFO)
        this.repsQueue.forEach(exerciseName => {
            const state = this.exerciseStates[exerciseName];
            const exercise = this.findExercise(exerciseName);
            
            if (state.targetReps < exercise.repRange[1]) {
                state.targetReps++;
            }
            
            // If now at max reps, move to weight queue
            if (state.targetReps >= exercise.repRange[1]) {
                this.weightQueue.push(exerciseName);
            }
        });

        // Process weight queue (FIFO)
        this.weightQueue.forEach(exerciseName => {
            const state = this.exerciseStates[exerciseName];
            const exercise = this.findExercise(exerciseName);
            
            state.currentWeight += exercise.increment;
            state.targetReps = exercise.repRange[0]; // Reset to minimum reps
        });

        // Clear queues
        this.repsQueue = [];
        this.weightQueue = [];
        
        this.saveData();
    }

    findExercise(exerciseName) {
        for (const workout of this.config.workouts) {
            const exercise = workout.exercises.find(ex => ex.name === exerciseName);
            if (exercise) return exercise;
        }
        return null;
    }

    startWorkout(workoutName) {
        this.currentWorkout = this.config.workouts.find(w => w.name === workoutName);
        this.sessionNumber++;
        this.processQueues();
        
        // Reset sets for all exercises in this workout
        this.currentWorkout.exercises.forEach(exercise => {
            const state = this.exerciseStates[exercise.name];
            if (state) {
                state.currentSet = 1;
                state.completedSets = 0;
            }
        });
        
        this.saveData();
        this.render();
    }

    logWorkoutResult(exerciseName, result, weight, reps) {
        const exercise = this.findExercise(exerciseName);
        const unit = exercise ? exercise.unit || 'kg' : 'kg';
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            sessionNumber: this.sessionNumber,
            workoutName: this.currentWorkout ? this.currentWorkout.name : 'Unknown',
            exerciseName: exerciseName,
            result: result,
            weight: weight,
            targetReps: reps,
            unit: unit
        };
        
        this.workoutHistory.push(logEntry);
        
        // Keep only last 1000 entries to prevent excessive storage
        if (this.workoutHistory.length > 1000) {
            this.workoutHistory = this.workoutHistory.slice(-1000);
        }
    }

    exportData() {
        const exportData = {
            sessionNumber: this.sessionNumber,
            exerciseStates: this.exerciseStates,
            repsQueue: this.repsQueue,
            weightQueue: this.weightQueue,
            config: this.config,
            workoutHistory: this.workoutHistory,
            timestamp: new Date().toISOString()
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    render() {
        const app = document.getElementById('app');
        
        let html = `
            <div class="container">
                <div class="session-counter">S${this.sessionNumber}</div>
                
                ${this.renderWorkoutSelection()}
                ${this.renderCurrentWorkout()}
                ${this.renderQueuesInfo()}
                ${this.renderExportSection()}
            </div>
        `;
        
        app.innerHTML = html;
        this.attachEventListeners();
    }

    renderWorkoutSelection() {
        if (this.currentWorkout) return '';
        
        return `
            <div class="workout-section">
                <h2>Select Workout</h2>
                <div class="actions">
                    ${this.config.workouts.map(workout => 
                        `<button class="btn btn-primary" onclick="tracker.startWorkout('${workout.name}')">
                            ${workout.name}
                        </button>`
                    ).join('')}
                </div>
            </div>
        `;
    }

    renderCurrentWorkout() {
        if (!this.currentWorkout) return '';
        
        return `
            <div class="workout-section">
                <div class="workout-header">
                    <div class="workout-name">${this.currentWorkout.name}</div>
                    <button class="btn btn-secondary" onclick="tracker.endWorkout()">End Workout</button>
                </div>
                
                <div class="exercises">
                    ${this.currentWorkout.exercises.map(exercise => this.renderExercise(exercise)).join('')}
                </div>
            </div>
        `;
    }

    renderExercise(exercise) {
        const state = this.exerciseStates[exercise.name];
        const inRepsQueue = this.repsQueue.includes(exercise.name);
        const inWeightQueue = this.weightQueue.includes(exercise.name);
        
        let exerciseState = 'Ready';
        if (inRepsQueue) exerciseState = 'In Reps Queue';
        if (inWeightQueue) exerciseState = 'In Weight Queue';
        if (state.failCount > 0) exerciseState = `Failed ${state.failCount}x`;
        if (state.completedSets >= exercise.sets) exerciseState = 'Complete';
        
        const isComplete = state.completedSets >= exercise.sets;
        
        return `
            <div class="exercise ${isComplete ? 'exercise-complete' : ''}">
                <div class="exercise-header">
                    <div class="exercise-name">${exercise.name}</div>
                    <div class="exercise-state">${exerciseState}</div>
                </div>
                
                <div class="exercise-info">
                    <div class="current-weight">${state.currentWeight}${exercise.unit || 'kg'}</div>
                    <div class="target-reps">${state.targetReps} reps</div>
                    <div class="set-info">Set ${state.currentSet}/${exercise.sets}</div>
                    ${state.failCount > 0 ? `<div class="fail-count">Fails: ${state.failCount}</div>` : ''}
                </div>
                
                <div class="actions">
                    ${!isComplete ? `
                        <button class="btn btn-success" onclick="tracker.completeSet('${exercise.name}')">
                            Complete Set
                        </button>
                        <button class="btn btn-danger" onclick="tracker.failSet('${exercise.name}')">
                            Fail Exercise
                        </button>
                    ` : `
                        <div class="completion-message">✓ Exercise Complete</div>
                    `}
                </div>
            </div>
        `;
    }

    renderQueuesInfo() {
        if (this.repsQueue.length === 0 && this.weightQueue.length === 0) return '';
        
        return `
            <div class="queue-info">
                <strong>Progression Queues:</strong>
                ${this.repsQueue.length > 0 ? `<div class="queue-list">Reps: ${this.repsQueue.join(', ')}</div>` : ''}
                ${this.weightQueue.length > 0 ? `<div class="queue-list">Weight: ${this.weightQueue.join(', ')}</div>` : ''}
            </div>
        `;
    }

    renderExportSection() {
        return `
            <div class="export-section">
                <h3>Export Data</h3>
                <button class="btn btn-primary" onclick="tracker.showExportData()">Show Export Data</button>
                <div id="exportData" class="export-data" style="display: none;"></div>
            </div>
        `;
    }

    endWorkout() {
        this.currentWorkout = null;
        this.render();
    }

    showExportData() {
        const exportDiv = document.getElementById('exportData');
        exportDiv.textContent = this.exportData();
        exportDiv.style.display = exportDiv.style.display === 'none' ? 'block' : 'none';
    }

    attachEventListeners() {
        // Event listeners are handled via onclick attributes in the HTML
        // This method is kept for potential future use
    }
}

// Initialize the app
const tracker = new WorkoutTracker();

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
