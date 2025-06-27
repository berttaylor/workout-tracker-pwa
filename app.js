// Workout Tracker PWA - Main Application Logic

class WorkoutTracker {
    constructor() {
        this.sessionNumber = 1;
        this.exerciseStates = {};
        this.currentWorkout = null;
        this.workoutHistory = [];
        this.workoutLogs = [];
        this.sessionStates = {}; // Temporary states during current workout
        
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
                            minimumWeight: 10,
                            repRange: [5, 10],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5,
                            progressionType: "rep"
                        },
                        {
                            name: "Pectoral machine",
                            startWeight: 40,
                            minimumWeight: 15,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5,
                            progressionType: "rep"
                        },
                        {
                            name: "Chest incline",
                            startWeight: 40,
                            minimumWeight: 15,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5,
                            progressionType: "rep"
                        },
                        {
                            name: "Tricep pulldowns",
                            startWeight: 20,
                            minimumWeight: 5,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5,
                            progressionType: "rep"
                        },
                        {
                            name: "Calf raises",
                            startWeight: 7.5,
                            minimumWeight: 0,
                            repRange: [8, 10],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5,
                            progressionType: "simple"
                        },
                        {
                            name: "Cross trainer",
                            startWeight: 10,
                            repRange: [10, 15],
                            increment: 1,
                            unit: "m",
                            sets: 1,
                            progressionType: "none"
                        }
                    ]
                },
                {
                    name: "Workout B",
                    exercises: [
                        {
                            name: "Vertical traction machine",
                            startWeight: 50,
                            minimumWeight: 20,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5,
                            progressionType: "rep"
                        },
                        {
                            name: "Seated row",
                            startWeight: 50,
                            minimumWeight: 20,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5,
                            progressionType: "rep"
                        },
                        {
                            name: "Upper back machine",
                            startWeight: 30,
                            minimumWeight: 10,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5,
                            progressionType: "rep"
                        },
                        {
                            name: "Biceps on cable",
                            startWeight: 25,
                            minimumWeight: 5,
                            repRange: [5, 6],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5,
                            progressionType: "rep"
                        },
                        {
                            name: "Hip abduction machine",
                            startWeight: 89,
                            minimumWeight: 40,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 5,
                            progressionType: "rep"
                        },
                        {
                            name: "Cross trainer",
                            startWeight: 10,
                            minimumWeight: 5,
                            repRange: [10, 15],
                            increment: 1,
                            unit: "m",
                            sets: 1,
                            progressionType: "none"
                        }
                    ]
                },
                {
                    name: "Cardio Day",
                    exercises: [
                        {
                            name: "Run or swim",
                            startWeight: 60,
                            minimumWeight: 30,
                            repRange: [60, 90],
                            increment: 5,
                            unit: "m",
                            sets: 1,
                            progressionType: "none"
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
            this.exerciseStates = session.exerciseStates || {};
        }

        // Load workout history
        const historyData = localStorage.getItem('workoutHistory');
        this.workoutHistory = historyData ? JSON.parse(historyData) : [];
        
        // Load workout logs
        const logsData = localStorage.getItem('workoutLogs');
        this.workoutLogs = logsData ? JSON.parse(logsData) : [];

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
                        completedSets: 0,
                        progressionPhase: 'reps', // 'reps' or 'weight' for rep progression
                        previousWeight: exercise.startWeight,
                        previousReps: exercise.repRange[0],
                        lastWeightIncrease: 0 // Track when weight was last increased
                    };
                } else {
                    // Ensure new properties exist for existing exercises
                    if (typeof this.exerciseStates[exercise.name].currentSet === 'undefined') {
                        this.exerciseStates[exercise.name].currentSet = 1;
                    }
                    if (typeof this.exerciseStates[exercise.name].completedSets === 'undefined') {
                        this.exerciseStates[exercise.name].completedSets = 0;
                    }
                    if (typeof this.exerciseStates[exercise.name].progressionPhase === 'undefined') {
                        this.exerciseStates[exercise.name].progressionPhase = 'reps';
                    }
                    if (typeof this.exerciseStates[exercise.name].previousWeight === 'undefined') {
                        this.exerciseStates[exercise.name].previousWeight = this.exerciseStates[exercise.name].currentWeight;
                    }
                    if (typeof this.exerciseStates[exercise.name].previousReps === 'undefined') {
                        this.exerciseStates[exercise.name].previousReps = this.exerciseStates[exercise.name].targetReps;
                    }
                    if (typeof this.exerciseStates[exercise.name].lastWeightIncrease === 'undefined') {
                        this.exerciseStates[exercise.name].lastWeightIncrease = 0;
                    }
                }
            });
        });
    }

    saveData() {
        const sessionData = {
            sessionNumber: this.sessionNumber,
            exerciseStates: this.exerciseStates
        };
        localStorage.setItem('workoutSession', JSON.stringify(sessionData));
        localStorage.setItem('workoutConfig', JSON.stringify(this.config));
        localStorage.setItem('workoutHistory', JSON.stringify(this.workoutHistory));
        localStorage.setItem('workoutLogs', JSON.stringify(this.workoutLogs));
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

    // Set completion logic - only updates temporary session state
    completeSet(exerciseName) {
        if (!this.sessionStates[exerciseName]) {
            this.sessionStates[exerciseName] = { status: 'pending', completedSets: 0, currentSet: 1 };
        }
        
        const sessionState = this.sessionStates[exerciseName];
        const exercise = this.findExercise(exerciseName);
        const totalSets = exercise.sets || 5;
        
        sessionState.completedSets++;
        
        // If all sets completed, mark as completed
        if (sessionState.completedSets >= totalSets) {
            sessionState.status = 'completed';
        } else {
            // Move to next set
            sessionState.currentSet++;
        }
        
        this.render();
    }
    
    failSet(exerciseName) {
        if (!this.sessionStates[exerciseName]) {
            this.sessionStates[exerciseName] = { status: 'pending', completedSets: 0, currentSet: 1 };
        }
        
        // Mark exercise as failed for this session
        this.sessionStates[exerciseName].status = 'failed';
        
        this.render();
    }
    
    // Apply progression changes only when ending workout
    applyWorkoutProgression() {
        const changes = [];
        const workoutDate = new Date().toLocaleDateString('en-GB', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
        });
        
        this.currentWorkout.exercises.forEach(exercise => {
            const sessionState = this.sessionStates[exercise.name];
            const state = this.exerciseStates[exercise.name];
            
            if (!sessionState || sessionState.status === 'pending') {
                // Exercise was not completed or failed - mark as incomplete
                changes.push(`${exercise.name}: Incomplete`);
            } else if (sessionState.status === 'completed') {
                // Apply success progression
                this.applySuccessProgression(exercise.name, changes);
            } else if (sessionState.status === 'failed') {
                // Apply failure progression
                this.applyFailureProgression(exercise.name, changes);
            }
            
            // Reset session-specific data
            state.currentSet = 1;
            state.completedSets = 0;
            state.lastSession = this.sessionNumber;
        });
        
        // Create workout log entry
        if (changes.length > 0) {
            const logEntry = {
                date: workoutDate,
                workoutName: this.currentWorkout.name,
                changes: changes,
                timestamp: new Date().toISOString()
            };
            this.workoutLogs.unshift(logEntry); // Add to beginning for latest first
        }
        
        // Clear session states
        this.sessionStates = {};
    }
    
    applySuccessProgression(exerciseName, changes) {
        const state = this.exerciseStates[exerciseName];
        const exercise = this.findExercise(exerciseName);
        
        // Reset fail count on success
        state.failCount = 0;
        
        // Store previous state for tracking changes
        const oldWeight = state.currentWeight;
        const oldReps = state.targetReps;
        
        // Apply progression based on type
        switch (exercise.progressionType) {
            case 'none':
                changes.push(`${exercise.name}: Completed`);
                break;
                
                    case 'simple':
                        state.currentWeight += exercise.increment;
                        state.lastWeightIncrease = this.sessionNumber; // Mark when weight was increased
                        changes.push(`${exercise.name}: ${oldWeight}${exercise.unit} → ${state.currentWeight}${exercise.unit}`);
                        break;
                
            case 'rep':
                // Simplified rep progression: alternating between baseline and baseline+1
                if (state.targetReps === exercise.repRange[0]) {
                    // At baseline reps: increase to baseline+1
                    state.targetReps = exercise.repRange[0] + 1;
                    state.progressionPhase = 'weight';
                    changes.push(`${exercise.name}: ${oldReps} → ${state.targetReps} reps`);
                } else {
                    // At baseline+1 reps: increase weight, back to baseline
                    state.currentWeight += exercise.increment;
                    state.targetReps = exercise.repRange[0];
                    state.progressionPhase = 'reps';
                    state.lastWeightIncrease = this.sessionNumber; // Mark when weight was increased
                    changes.push(`${exercise.name}: ${oldWeight}${exercise.unit} → ${state.currentWeight}${exercise.unit} (${state.targetReps} reps)`);
                }
                break;
        }
    }
    
    applyFailureProgression(exerciseName, changes) {
        const state = this.exerciseStates[exerciseName];
        const exercise = this.findExercise(exerciseName);
        
        state.failCount++;
        
        if (exercise.progressionType === 'none') {
            // No progression exercises: just track failures, no penalties
            changes.push(`${exercise.name}: Failed (${state.failCount})`);
        } else {
            // Progression exercises: apply penalties after 2 failures
            if (state.failCount >= 2) {
                const oldWeight = state.currentWeight;
                const oldReps = state.targetReps;
                
                state.failCount = 0; // Reset fail count after applying penalty
                
                switch (exercise.progressionType) {
                    case 'simple':
                        const newSimpleWeight = Math.max(exercise.minimumWeight || exercise.startWeight, state.currentWeight - exercise.increment);
                        if (newSimpleWeight < state.currentWeight) {
                            state.currentWeight = newSimpleWeight;
                            changes.push(`${exercise.name}: Failed (2/2) - ${oldWeight}${exercise.unit} → ${state.currentWeight}${exercise.unit}`);
                        } else {
                            changes.push(`${exercise.name}: Failed (2/2) - already at minimum weight (${state.currentWeight}${exercise.unit})`);
                        }
                        break;
                        
                    case 'rep':
                        if (state.targetReps > exercise.repRange[0]) {
                            // At increased reps: drop to baseline reps (buffer protection)
                            const oldTargetReps = state.targetReps;
                            state.targetReps = exercise.repRange[0];
                            state.progressionPhase = 'reps';
                            changes.push(`${exercise.name}: Failed (2/2) - ${oldTargetReps} → ${state.targetReps} reps`);
                        } else {
                            // At baseline reps: reduce weight
                            const newRepWeight = Math.max(exercise.minimumWeight || exercise.startWeight, state.currentWeight - exercise.increment);
                            if (newRepWeight < state.currentWeight) {
                                state.currentWeight = newRepWeight;
                                changes.push(`${exercise.name}: Failed (2/2) - ${oldWeight}${exercise.unit} → ${state.currentWeight}${exercise.unit}`);
                            } else {
                                changes.push(`${exercise.name}: Failed (2/2) - already at minimum weight (${state.currentWeight}${exercise.unit})`);
                            }
                        }
                        break;
                }
            } else {
                changes.push(`${exercise.name}: Failed (${state.failCount}/2)`);
            }
        }
    }

    // No more queue processing needed with new progression system

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
                ${this.currentWorkout ? '' : this.renderExportSection()}
            </div>
        `;
        
        app.innerHTML = html;
        this.attachEventListeners();
    }

    renderWorkoutLogs() {
        if (this.workoutLogs.length === 0) return '';
        
        return `
            <div class="workout-section">
                <h2>Progress Log</h2>
                <div class="workout-logs">
                    ${this.workoutLogs.slice(0, 5).map(log => `
                        <div class="workout-log-entry">
                            <div class="log-header">
                                <span class="log-date">${log.date}</span>
                                <span class="log-workout">${log.workoutName}</span>
                            </div>
                            <div class="log-changes">
                                ${log.changes.map(change => `<div class="log-change">${change}</div>`).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
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
            ${this.renderWorkoutLogs()}
        `;
    }

    renderCurrentWorkout() {
        if (!this.currentWorkout) return '';
        
        return `
            <div class="workout-section">
                <div class="workout-header">
                    <div class="workout-name">${this.currentWorkout.name}</div>
                    <button class="btn btn-secondary" onclick="tracker.backToHome()">← Back</button>
                </div>
                
                <div class="exercises">
                    ${this.currentWorkout.exercises.map(exercise => this.renderExercise(exercise)).join('')}
                </div>
                
                <div class="workout-footer">
                    <button class="btn btn-primary" onclick="tracker.endWorkout()">End Workout</button>
                </div>
            </div>
        `;
    }

    renderExercise(exercise) {
        const state = this.exerciseStates[exercise.name];
        const sessionState = this.sessionStates[exercise.name];
        
        // Ensure sets is defined with a default
        const totalSets = exercise.sets || 5;
        
        // Use session state for current workout, fallback to saved state
        let currentSet, completedSets, exerciseStatus;
        
        if (sessionState) {
            currentSet = sessionState.currentSet || 1;
            completedSets = sessionState.completedSets || 0;
            exerciseStatus = sessionState.status || 'pending';
        } else {
            currentSet = state.currentSet || 1;
            completedSets = state.completedSets || 0;
            exerciseStatus = 'pending';
        }
        
        // Get progression type info
        let progressionInfo = {
            type: 'Unknown',
            description: '',
            class: 'progression-unknown'
        };
        
        switch (exercise.progressionType) {
            case 'none':
                progressionInfo = {
                    type: 'Static',
                    description: 'No progression',
                    class: 'progression-none'
                };
                break;
            case 'simple':
                progressionInfo = {
                    type: 'Basic',
                    description: 'Weight increases only',
                    class: 'progression-simple'
                };
                break;
            case 'rep':
                progressionInfo = {
                    type: 'Rep+',
                    description: 'Reps then weight progression',
                    class: 'progression-rep'
                };
                break;
        }
        
        // Determine exercise status - show progression type instead of fail count
        let statusInfo = {
            text: progressionInfo.type,
            class: 'status-progression'
        };
        
        if (exerciseStatus === 'completed') {
            statusInfo = { text: 'Complete', class: 'status-complete' };
        } else if (exerciseStatus === 'failed') {
            statusInfo = { text: 'Failed', class: 'status-failed' };
        }
        
        // Show if this is a new weight (only on first attempt at this weight)
        const isNewWeight = state.lastWeightIncrease === this.sessionNumber;
        
        const isComplete = exerciseStatus === 'completed';
        const isFailed = exerciseStatus === 'failed';
        
        return `
            <div class="exercise ${isComplete ? 'exercise-complete' : ''} ${isFailed ? 'exercise-failed' : ''}">
                <div class="exercise-header">
                    <div class="exercise-title">
                        <div class="exercise-name">${exercise.name}</div>
                    </div>
                    <div class="exercise-status ${statusInfo.class}">${statusInfo.text}</div>
                </div>
                
                <div class="exercise-metrics">
                    <div class="metric-group">
                        <div class="metric-label">Weight</div>
                        <div class="metric-value weight-value">
                            ${state.currentWeight}${exercise.unit || 'kg'}
                            ${isNewWeight ? '<span class="new-badge">NEW</span>' : ''}
                        </div>
                    </div>
                    <div class="metric-group">
                        <div class="metric-label">Target Reps</div>
                        <div class="metric-value reps-value ${state.targetReps > exercise.repRange[0] ? 'increased-reps' : ''}">
                            ${state.targetReps > exercise.repRange[0] ? '⭐ ' : ''}${state.targetReps}
                        </div>
                    </div>
                    ${!isFailed ? `
                        <div class="metric-group">
                            <div class="metric-label">Progress</div>
                            <div class="metric-value sets-value">${completedSets}/${totalSets}${totalSets > 1 ? ' Sets' : ''}</div>
                        </div>
                    ` : ''}
                </div>
                
                ${!isComplete && !isFailed ? `
                    <div class="exercise-actions">
                        <button class="btn btn-complete" onclick="tracker.completeSet('${exercise.name}')">
                            ${totalSets > 1 ? 'Add Set' : 'Complete'}
                        </button>
                        <button class="btn btn-fail" onclick="tracker.failSet('${exercise.name}')">
                            ${exercise.progressionType === 'none' ? 
                                `Fail (${state.failCount + 1})` : 
                                `Fail (${state.failCount + 1}/2)`
                            }
                        </button>
                    </div>
                ` : isComplete ? `
                    <div class="exercise-result success-result">✓ Exercise Complete</div>
                ` : `
                    <div class="exercise-result failed-result">✗ Exercise Failed</div>
                `}
            </div>
        `;
    }

    renderQueuesInfo() {
        // No more queue info needed with new progression system
        return '';
    }

    renderExportSection() {
        return `
            <div class="export-section">
                <h3>Export Data</h3>
                <button class="btn btn-primary" onclick="tracker.showExportData()">Show Export Data</button>
                <button class="btn btn-danger" onclick="tracker.resetAllData()" style="margin-left: 10px;">Reset All Data</button>
                <div id="exportData" class="export-data" style="display: none;"></div>
            </div>
        `;
    }

    backToHome() {
        // Just go back to homepage without ending workout
        this.currentWorkout = null;
        // Clear session states since we're abandoning the workout
        this.sessionStates = {};
        this.render();
    }
    
    getIncompleteExercises() {
        if (!this.currentWorkout) return [];
        
        return this.currentWorkout.exercises.filter(exercise => {
            const sessionState = this.sessionStates[exercise.name];
            return !sessionState || sessionState.status === 'pending';
        });
    }
    
    endWorkout() {
        // Check for incomplete exercises
        const incompleteExercises = this.getIncompleteExercises();
        
        if (incompleteExercises.length > 0) {
            const exerciseNames = incompleteExercises.map(ex => ex.name).join(', ');
            const confirmMessage = `The following exercises are incomplete: ${exerciseNames}. Do you wish to end the workout?`;
            
            if (!confirm(confirmMessage)) {
                return; // Don't end workout if user cancels
            }
        }
        
        // Apply all progression changes
        this.applyWorkoutProgression();
        
        // Save data
        this.saveData();
        
        // End workout
        this.currentWorkout = null;
        this.render();
    }

    showExportData() {
        const exportDiv = document.getElementById('exportData');
        exportDiv.textContent = this.exportData();
        exportDiv.style.display = exportDiv.style.display === 'none' ? 'block' : 'none';
    }
    
    resetAllData() {
        if (confirm('Are you sure you want to reset all data? This will clear all progress and cannot be undone.')) {
            localStorage.clear();
            location.reload();
        }
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
