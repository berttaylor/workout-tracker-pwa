// Workout Tracker PWA - Main Application Logic

class WorkoutTracker {
    constructor() {
        // Version information
        this.APP_VERSION = '1.1.0';
        this.DATA_VERSION = 1;
        this.MIN_SUPPORTED_DATA_VERSION = 1;
        
        // Build timestamp for cache busting
        this.BUILD_TIMESTAMP = '2025-06-28-16-46';
        this.LAST_UPDATE_CHECK = null;
        
        // App state
        this.sessionNumber = 1;
        this.exerciseStates = {};
        this.currentWorkout = null;
        this.workoutHistory = [];
        this.workoutLogs = [];
        this.sessionStates = {}; // Temporary states during current workout
        this.updateAvailable = false;
        
        this.init();
    }

    async init() {
        // Check for app updates first
        await this.checkForUpdates();
        
        // Load and migrate data if needed
        this.loadData();
        
        // Load dark mode preference
        this.loadDarkMode();
        
        // Register service worker
        this.registerServiceWorker();
        
        // Initial render
        this.render();
    }
    
    async checkForUpdates() {
        try {
            // Check if there's a service worker update available
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    await registration.update();
                    
                    // Check if there's a waiting service worker (new version)
                    if (registration.waiting) {
                        console.log('Update available!');
                        this.updateAvailable = true;
                    }
                    
                    // Listen for updates
                    registration.addEventListener('updatefound', () => {
                        console.log('Update found!');
                        this.updateAvailable = true;
                        this.render(); // Re-render to show update notification
                    });
                }
            }
        } catch (error) {
            console.warn('Failed to check for updates:', error);
        }
    }
    
    applyUpdate() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration && registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                }
            });
        }
    }

    // Configuration with your specific exercises
    getDefaultConfig() {
        return {
            workouts: [
                {
                    name: "Push + Calfs",
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
                    name: "Pull + Glutes",
                    exercises: [
                        {
                            name: "Vertical traction machine",
                            startWeight: 52.5,
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
                            startWeight: 32.5,
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
                            repRange: [8, 10],
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
        // Check and migrate data if needed
        this.checkAndMigrateData();
        
        // Load configuration with version info
        this.loadVersionedConfig();
        
        // Load user state (current weights, reps, etc.)
        this.loadUserState();
        
        // Load workout history (always preserve)
        this.loadWorkoutHistory();
        
        // Load workout logs (always preserve)
        this.loadWorkoutLogs();
        
        // Initialize any missing exercise states
        this.initializeExerciseStates();
    }
    
    checkAndMigrateData() {
        const appVersion = localStorage.getItem('app_version');
        const dataVersion = parseInt(localStorage.getItem('data_version') || '0');
        
        console.log(`Current app: ${this.APP_VERSION}, Data version: ${dataVersion}`);
        
        // Check if this is a first-time user
        if (!appVersion && !dataVersion) {
            console.log('First-time user, setting up fresh data');
            this.setVersions();
            return;
        }
        
        // Check if data version is too old
        if (dataVersion < this.MIN_SUPPORTED_DATA_VERSION) {
            console.warn('Data version too old, resetting');
            this.handleIncompatibleData();
            return;
        }
        
        // Perform migration if needed
        if (dataVersion < this.DATA_VERSION) {
            console.log(`Migrating data from version ${dataVersion} to ${this.DATA_VERSION}`);
            this.migrateData(dataVersion, this.DATA_VERSION);
        }
        
        // Update app version
        this.setVersions();
    }
    
    setVersions() {
        localStorage.setItem('app_version', this.APP_VERSION);
        localStorage.setItem('data_version', this.DATA_VERSION.toString());
    }
    
    migrateData(fromVersion, toVersion) {
        console.log(`Migrating data from v${fromVersion} to v${toVersion}`);
        
        // Future migration logic will go here
        // For now, we're at v1, so no migrations needed
        
        // Example for future migrations:
        // if (fromVersion < 2) {
        //     this.migrateToV2();
        // }
        // if (fromVersion < 3) {
        //     this.migrateToV3();
        // }
    }
    
    handleIncompatibleData() {
        const backup = {
            timestamp: new Date().toISOString(),
            appVersion: localStorage.getItem('app_version'),
            dataVersion: localStorage.getItem('data_version'),
            allData: {}
        };
        
        // Backup all localStorage data
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            backup.allData[key] = localStorage.getItem(key);
        }
        
        // Store backup
        localStorage.setItem('data_backup_incompatible', JSON.stringify(backup));
        
        // Clear incompatible data
        localStorage.clear();
        
        // Set current versions
        this.setVersions();
        
        alert('Your data was created with an incompatible version. A backup has been saved and the app has been reset to defaults.');
    }
    
    loadVersionedConfig() {
        const configData = localStorage.getItem('app_config');
        if (configData) {
            try {
                const saved = JSON.parse(configData);
                // Always use latest config but preserve user customizations if any
                this.config = this.getDefaultConfig();
                console.log('Using latest app config');
            } catch (e) {
                console.warn('Error loading config, using defaults:', e);
                this.config = this.getDefaultConfig();
            }
        } else {
            this.config = this.getDefaultConfig();
        }
    }
    
    loadUserState() {
        const stateData = localStorage.getItem('user_state');
        if (stateData) {
            try {
                const state = JSON.parse(stateData);
                this.sessionNumber = state.sessionNumber || 1;
                this.exerciseStates = state.exerciseStates || {};
            } catch (e) {
                console.warn('Error loading user state:', e);
                this.sessionNumber = 1;
                this.exerciseStates = {};
            }
        } else {
            this.sessionNumber = 1;
            this.exerciseStates = {};
        }
    }
    
    loadWorkoutHistory() {
        const historyData = localStorage.getItem('workout_history');
        this.workoutHistory = historyData ? JSON.parse(historyData) : [];
    }
    
    loadWorkoutLogs() {
        const logsData = localStorage.getItem('workout_logs');
        this.workoutLogs = logsData ? JSON.parse(logsData) : [];
    }
    
    initializeExerciseStates() {
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
                        progressionPhase: 'reps',
                        previousWeight: exercise.startWeight,
                        previousReps: exercise.repRange[0],
                        lastWeightIncrease: 0
                    };
                } else {
                    // Ensure new properties exist for existing exercises
                    this.ensureExerciseProperties(exercise.name);
                }
            });
        });
    }
    
    ensureExerciseProperties(exerciseName) {
        const state = this.exerciseStates[exerciseName];
        if (!state) return;
        
        // Add any missing properties with defaults
        const defaults = {
            currentSet: 1,
            completedSets: 0,
            progressionPhase: 'reps',
            previousWeight: state.currentWeight,
            previousReps: state.targetReps,
            lastWeightIncrease: 0
        };
        
        Object.keys(defaults).forEach(key => {
            if (typeof state[key] === 'undefined') {
                state[key] = defaults[key];
            }
        });
    }

    saveData() {
        // Save user state (current weights, session number, etc.)
        const userState = {
            sessionNumber: this.sessionNumber,
            exerciseStates: this.exerciseStates
        };
        localStorage.setItem('user_state', JSON.stringify(userState));
        
        // Save app config (can be updated with app versions)
        localStorage.setItem('app_config', JSON.stringify(this.config));
        
        // Save workout history (always preserve)
        localStorage.setItem('workout_history', JSON.stringify(this.workoutHistory));
        
        // Save workout logs (always preserve)
        localStorage.setItem('workout_logs', JSON.stringify(this.workoutLogs));
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
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
    
setProgressionType(exerciseName, type) {
        const state = this.exerciseStates[exerciseName];
        const exercise = this.findExercise(exerciseName);

        if (exercise.progressionType !== type) {
            // If changing to non-rep based progression, reset reps to baseline
            if (type !== 'rep') {
                state.targetReps = exercise.repRange[0];
            }

            exercise.progressionType = type;
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
        // Use the selected workout date instead of today
        const selectedDate = new Date(this.workoutDate);
        const workoutDate = selectedDate.toLocaleDateString('en-GB', { 
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
        
        // Move completed workout to end of list
        this.reorderWorkouts();
        
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
        
        // Set default workout date to today
        this.workoutDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
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
    
    toggleDarkMode() {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDarkMode.toString());
    }
    
    loadDarkMode() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        }
    }

    render() {
        const app = document.getElementById('app');
        
        let html = `
            <div class="container">
                ${this.renderUpdateNotification()}
                ${this.renderAppHeader()}
                
                ${this.renderWorkoutSelection()}
                ${this.renderCurrentWorkout()}
                ${this.renderQueuesInfo()}
                ${this.currentWorkout ? '' : this.renderExportSection()}
                ${this.renderVersionInfo()}
                ${this.currentWorkout ? '' : this.renderAppFooter()}
            </div>
        `;
        
        app.innerHTML = html;
        this.attachEventListeners();
    }
    
    renderUpdateNotification() {
        if (!this.updateAvailable) return '';
        
        return `
            <div class="update-notification">
                <div class="update-message">
                    🔄 New version available!
                    <button class="btn btn-primary btn-small" onclick="tracker.applyUpdate()">
                        Update Now
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="tracker.dismissUpdate()">
                        Later
                    </button>
                </div>
            </div>
        `;
    }
    
    renderAppHeader() {
        if (this.currentWorkout) return '';
        
        return `
            <div class="session-counter">S${this.sessionNumber}</div>
            <h1>Progress³</h1>
        `;
    }
    
    renderAppFooter() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        return `
            <div class="app-footer">
                <button onclick="tracker.toggleDarkMode()" class="dark-mode-toggle-footer">
                    ${isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
                <div class="copyright">
                    Copyright © 2025 Progress³. All rights reserved.
                </div>
            </div>
        `;
    }
    
    renderVersionInfo() {
        if (this.currentWorkout) return ''; // Only show on homepage
        
        const appVersion = localStorage.getItem('app_version') || 'Unknown';
        const dataVersion = localStorage.getItem('data_version') || 'Unknown';
        
        return `
            <div class="version-info">
                <small>App v${appVersion} • Data v${dataVersion}</small>
            </div>
        `;
    }
    
    dismissUpdate() {
        this.updateAvailable = false;
        this.render();
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
        
        const incompleteWorkout = this.loadIncompleteWorkout();
        
        return `
            ${incompleteWorkout ? this.renderIncompleteWorkoutNotice(incompleteWorkout) : ''}
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
    
    renderIncompleteWorkoutNotice(incomplete) {
        const timeAgo = this.getTimeAgo(new Date(incomplete.timestamp));
        const completedCount = Object.values(incomplete.sessionStates).filter(state => 
            state.status === 'completed' || state.completedSets > 0
        ).length;
        
        return `
            <div class="workout-section incomplete-workout-notice">
                <h3>⚠️ Incomplete Workout</h3>
                <p><strong>${incomplete.workoutName}</strong> - ${completedCount} exercises started ${timeAgo}</p>
                <div class="actions">
                    <button class="btn btn-primary" onclick="tracker.resumeIncompleteWorkout()">
                        Resume Workout
                    </button>
                    <button class="btn btn-secondary" onclick="tracker.discardIncompleteWorkout()">
                        Discard
                    </button>
                </div>
            </div>
        `;
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMins / 60);
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    }

    renderCurrentWorkout() {
        if (!this.currentWorkout) return '';
        
        return `
            <div class="workout-section">
                <div class="workout-header">
                    <div class="workout-name">${this.currentWorkout.name}</div>
                    <button class="btn btn-secondary" onclick="tracker.backToHome()">← Back</button>
                </div>
                
                <div class="workout-date-section">
                    <label for="workoutDate" class="date-label">Workout Date:</label>
                    <input type="date" id="workoutDate" class="date-input" 
                           value="${this.workoutDate}" 
                           onchange="tracker.updateWorkoutDate(this.value)">
                </div>
                
                <div class="complete-all-section">
                    <button class="btn btn-primary" onclick="tracker.completeAll()">Complete All</button>
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
        
        // Always show progression type, even when complete
        let statusInfo = {
            text: progressionInfo.type,
            class: 'status-progression'
        };
        
        // Add completion indicator alongside progression type
        if (exerciseStatus === 'completed') {
            statusInfo = { 
                text: `${progressionInfo.type} ✓`, 
                class: 'status-complete' 
            };
        } else if (exerciseStatus === 'failed') {
            statusInfo = { 
                text: `${progressionInfo.type} ✗`, 
                class: 'status-failed' 
            };
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
                        <select class="progression-selector" onchange="tracker.setProgressionType('${exercise.name}', this.value)">
                            <option value="rep" ${exercise.progressionType === 'rep' ? 'selected' : ''}>Rep+</option>
                            <option value="simple" ${exercise.progressionType === 'simple' ? 'selected' : ''}>Basic</option>
                            <option value="none" ${exercise.progressionType === 'none' ? 'selected' : ''}>Static</option>
                        </select>
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
                            ${state.targetReps > exercise.repRange[0] ? '↑ ' : ''}${state.targetReps}
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
        // Save incomplete workout state if any progress was made
        if (this.hasWorkoutProgress()) {
            this.saveIncompleteWorkout();
        }
        
        // Go back to homepage
        this.currentWorkout = null;
        this.workoutDate = null;
        this.render();
    }
    
    hasWorkoutProgress() {
        return Object.keys(this.sessionStates).length > 0 && 
               Object.values(this.sessionStates).some(state => 
                   state.completedSets > 0 || state.status !== 'pending'
               );
    }
    
    saveIncompleteWorkout() {
        const incompleteWorkout = {
            workoutName: this.currentWorkout.name,
            sessionStates: { ...this.sessionStates },
            workoutDate: this.workoutDate,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('incompleteWorkout', JSON.stringify(incompleteWorkout));
    }
    
    loadIncompleteWorkout() {
        const saved = localStorage.getItem('incompleteWorkout');
        return saved ? JSON.parse(saved) : null;
    }
    
    resumeIncompleteWorkout() {
        const incomplete = this.loadIncompleteWorkout();
        if (incomplete) {
            this.currentWorkout = this.config.workouts.find(w => w.name === incomplete.workoutName);
            this.sessionStates = incomplete.sessionStates;
            // Restore the workout date if saved, otherwise use today
            this.workoutDate = incomplete.workoutDate || new Date().toISOString().split('T')[0];
            localStorage.removeItem('incompleteWorkout');
            this.render();
        }
    }
    
    discardIncompleteWorkout() {
        localStorage.removeItem('incompleteWorkout');
        // Clear any current session states
        this.sessionStates = {};
        this.currentWorkout = null;
        this.workoutDate = null;
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
        
        // Clear any saved incomplete workout since we're ending properly
        localStorage.removeItem('incompleteWorkout');
        
        // Apply all progression changes
        this.applyWorkoutProgression();
        
        // Save data
        this.saveData();
        
        // End workout
        this.currentWorkout = null;
        this.workoutDate = null;
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

    completeAll() {
        if (!this.currentWorkout) return;
        
        // Mark all exercises as completed
        this.currentWorkout.exercises.forEach(exercise => {
            const totalSets = exercise.sets || 5;
            this.sessionStates[exercise.name] = {
                status: 'completed',
                completedSets: totalSets,
                currentSet: totalSets
            };
        });
        
        this.render();
        
        // Scroll to the bottom to show "End Workout" button
        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
    }

    reorderWorkouts() {
        if (!this.currentWorkout) return;
        
        // Find the current workout in the array
        const workoutIndex = this.config.workouts.findIndex(w => w.name === this.currentWorkout.name);
        
        if (workoutIndex !== -1) {
            // Remove the completed workout from its current position
            const [completedWorkout] = this.config.workouts.splice(workoutIndex, 1);
            
            // Add it to the end of the array
            this.config.workouts.push(completedWorkout);
            
            console.log(`Moved "${completedWorkout.name}" to end of workout list`);
        }
    }

    updateWorkoutDate(newDate) {
        this.workoutDate = newDate;
        // No need to re-render, just update the internal state
    }
    
    attachEventListeners() {
        // Event listeners are handled via onclick attributes in the HTML
        // This method is kept for potential future use
    }
}

// Initialize the app
const tracker = new WorkoutTracker();

// Service worker registration is handled in the constructor
