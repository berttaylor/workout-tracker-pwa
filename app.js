// Workout Tracker PWA - Main Application Logic

class WorkoutTracker {
    constructor() {
        // Version information
        this.APP_VERSION = '1.1.0';
        this.DATA_VERSION = 1;
        this.MIN_SUPPORTED_DATA_VERSION = 1;
        
        // Build timestamp for cache busting
        this.BUILD_TIMESTAMP = '2025-06-28-22-11';
        this.LAST_UPDATE_CHECK = null;
        
        // App state
        this.sessionNumber = 1;
        this.exerciseStates = {};
        this.currentWorkout = null;
        this.workoutHistory = [];
        this.workoutLogs = [];
        this.sessionStates = {}; // Temporary states during current workout
        this.updateAvailable = false;
        this.editMode = false; // Track if we're in edit mode
        this.editingWorkout = null; // Track which workout we're editing
        this.recentlyUpdatedWorkout = null; // Track recently updated workout for notification
        
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

    // Generate unique ID for exercises
    generateId() {
        return 'ex_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateWorkoutId() {
        return 'wo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Default configuration - beginner-friendly Push/Pull/Legs split
    getDefaultConfig() {
        return {
            workouts: [
                {
                    id: 'wo_default_push',
                    name: "Push Day",
                    exercises: [
                        {
                            id: 'ex_default_benchpress',
                            name: "Bench Press",
                            startWeight: 40,
                            minimumWeight: 20,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 3,
                            progressionType: "rep",
                            active: true
                        },
                        {
                            id: 'ex_default_shoulderpress',
                            name: "Shoulder Press",
                            startWeight: 20,
                            minimumWeight: 10,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 3,
                            progressionType: "rep",
                            active: true
                        },
                        {
                            id: 'ex_default_tricepext',
                            name: "Tricep Extensions",
                            startWeight: 15,
                            minimumWeight: 5,
                            repRange: [8, 10],
                            increment: 2.5,
                            unit: "kg",
                            sets: 3,
                            progressionType: "rep",
                            active: true
                        },
                        {
                            id: 'ex_default_lateralraise',
                            name: "Lateral Raises",
                            startWeight: 10,
                            minimumWeight: 5,
                            repRange: [10, 12],
                            increment: 2.5,
                            unit: "kg",
                            sets: 3,
                            progressionType: "rep",
                            active: true
                        }
                    ]
                },
                {
                    id: 'wo_default_pull',
                    name: "Pull Day",
                    exercises: [
                        {
                            id: 'ex_default_latpulldown',
                            name: "Lat Pulldowns",
                            startWeight: 40,
                            minimumWeight: 20,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 3,
                            progressionType: "rep",
                            active: true
                        },
                        {
                            id: 'ex_default_seatedrow',
                            name: "Seated Rows",
                            startWeight: 35,
                            minimumWeight: 20,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 3,
                            progressionType: "rep",
                            active: true
                        },
                        {
                            id: 'ex_default_bicepcurl',
                            name: "Bicep Curls",
                            startWeight: 15,
                            minimumWeight: 5,
                            repRange: [8, 10],
                            increment: 2.5,
                            unit: "kg",
                            sets: 3,
                            progressionType: "rep",
                            active: true
                        },
                        {
                            id: 'ex_default_facepull',
                            name: "Face Pulls",
                            startWeight: 20,
                            minimumWeight: 10,
                            repRange: [12, 15],
                            increment: 2.5,
                            unit: "kg",
                            sets: 3,
                            progressionType: "rep",
                            active: true
                        }
                    ]
                },
                {
                    id: 'wo_default_legs',
                    name: "Legs Day",
                    exercises: [
                        {
                            id: 'ex_default_squats',
                            name: "Squats",
                            startWeight: 40,
                            minimumWeight: 20,
                            repRange: [5, 8],
                            increment: 2.5,
                            unit: "kg",
                            sets: 3,
                            progressionType: "rep",
                            active: true
                        },
                        {
                            id: 'ex_default_legpress',
                            name: "Leg Press",
                            startWeight: 80,
                            minimumWeight: 40,
                            repRange: [8, 10],
                            increment: 5,
                            unit: "kg",
                            sets: 3,
                            progressionType: "rep",
                            active: true
                        },
                        {
                            id: 'ex_default_legcurl',
                            name: "Leg Curls",
                            startWeight: 25,
                            minimumWeight: 10,
                            repRange: [10, 12],
                            increment: 2.5,
                            unit: "kg",
                            sets: 3,
                            progressionType: "rep",
                            active: true
                        },
                        {
                            id: 'ex_default_calfraise',
                            name: "Calf Raises",
                            startWeight: 20,
                            minimumWeight: 10,
                            repRange: [12, 15],
                            increment: 2.5,
                            unit: "kg",
                            sets: 3,
                            progressionType: "simple",
                            active: true
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
        
        // Check if intro questionnaire is needed for new users
        this.checkIntroQuestionnaire();
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
                // If user has existing workouts, migrate them to new format
                if (saved.workouts && saved.workouts.length > 0) {
                    console.log('Migrating existing user workouts to new format');
                    this.config = this.migrateExistingWorkouts(saved);
                } else {
                    // No existing workouts - start with empty config to trigger questionnaire
                    console.log('Existing user with no workouts, will trigger questionnaire');
                    this.config = { workouts: [] };
                }
            } catch (e) {
                console.warn('Error loading config, starting with empty config:', e);
                this.config = { workouts: [] };
            }
        } else {
            // First time user - check if they have old workout history
            const hasOldHistory = localStorage.getItem('workout_history') || localStorage.getItem('user_state');
            if (hasOldHistory) {
                console.log('Detected existing user data, creating empty config for migration');
                this.config = { workouts: [] };
            } else {
                console.log('Brand new user, starting with empty config to trigger questionnaire');
                this.config = { workouts: [] };
            }
        }
    }
    
    migrateExistingWorkouts(savedConfig) {
        console.log('Migrating workouts:', savedConfig.workouts.map(w => w.name));
        
        const migratedConfig = {
            workouts: savedConfig.workouts.map(workout => {
                // Add IDs if missing
                const migratedWorkout = {
                    id: workout.id || this.generateWorkoutId(),
                    name: workout.name,
                    active: workout.active !== false, // Default to active unless explicitly false
                    exercises: workout.exercises.map(exercise => ({
                        id: exercise.id || this.generateId(),
                        name: exercise.name,
                        startWeight: exercise.startWeight,
                        minimumWeight: exercise.minimumWeight,
                        repRange: exercise.repRange,
                        increment: exercise.increment,
                        unit: exercise.unit || 'kg',
                        sets: exercise.sets,
                        progressionType: exercise.progressionType,
                        active: exercise.active !== false // Default to active unless explicitly false
                    }))
                };
                
                return migratedWorkout;
            })
        };
        
        console.log('Migration complete. Preserved workouts:', migratedConfig.workouts.map(w => w.name));
        return migratedConfig;
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
        
        // Clear recently updated notification when leaving home screen
        this.recentlyUpdatedWorkout = null;
        
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
            appVersion: this.APP_VERSION,
            dataVersion: this.DATA_VERSION,
            exportTimestamp: new Date().toISOString(),
            sessionNumber: this.sessionNumber,
            exerciseStates: this.exerciseStates,
            config: this.config,
            workoutHistory: this.workoutHistory,
            workoutLogs: this.workoutLogs,
            darkMode: localStorage.getItem('darkMode'),
            metadata: {
                totalWorkouts: this.config.workouts?.length || 0,
                activeWorkouts: this.config.workouts?.filter(w => w.active !== false).length || 0,
                totalExercises: this.config.workouts?.reduce((total, w) => total + (w.exercises?.length || 0), 0) || 0,
                workoutHistoryEntries: this.workoutHistory?.length || 0,
                workoutLogEntries: this.workoutLogs?.length || 0
            }
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    toggleDarkMode() {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDarkMode.toString());
        
        // Update the button text and icon immediately
        const toggleButton = document.querySelector('.dark-mode-toggle-footer');
        if (toggleButton) {
            toggleButton.innerHTML = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
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
                
                ${this.editMode ? this.renderEditMode() : this.renderWorkoutSelection()}
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
        if (this.currentWorkout || this.editMode) return '';
        
        return `
            <div class="session-counter">S${this.sessionNumber}</div>
            <h1><span class="app-name">g<span class="ai-highlight">ai</span>n</span></h1>
            <p class="app-tagline">multi algorithm training progression</p>
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
                    Copyright © 2025 gain. All rights reserved.
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
    
    renderWorkoutButton(workout) {
        const isRecentlyUpdated = this.recentlyUpdatedWorkout === workout.id;
        return `
            <div class="workout-button-container">
                <button class="btn btn-primary" onclick="tracker.startWorkout('${workout.name}')">
                    ${workout.name}
                    ${isRecentlyUpdated ? '<span class="updated-badge">Updated</span>' : ''}
                </button>
                <div class="workout-options">
                    <button class="btn-small btn-secondary" onclick="tracker.enterEditMode('${workout.id}')" title="Edit workout">
                        ✏️
                    </button>
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
                <div class="actions">
                    ${this.config.workouts.filter(w => w.active !== false).map(workout => 
                        this.renderWorkoutButton(workout)
                    ).join('')}
                    <button class="btn btn-secondary" onclick="tracker.addNewWorkout()" style="margin-top: 15px;">
                        + Add Workout
                    </button>
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
                    </div>
                    <div class="progression-status-container">
                        <select class="progression-status-selector ${statusInfo.class}" onchange="tracker.setProgressionType('${exercise.name}', this.value)">
                            <option value="rep" ${exercise.progressionType === 'rep' ? 'selected' : ''}>Rep+ ${exerciseStatus === 'completed' ? '✓' : exerciseStatus === 'failed' ? '✗' : ''}</option>
                            <option value="simple" ${exercise.progressionType === 'simple' ? 'selected' : ''}>Basic ${exerciseStatus === 'completed' ? '✓' : exerciseStatus === 'failed' ? '✗' : ''}</option>
                            <option value="none" ${exercise.progressionType === 'none' ? 'selected' : ''}>Static ${exerciseStatus === 'completed' ? '✓' : exerciseStatus === 'failed' ? '✗' : ''}</option>
                        </select>
                    </div>
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
                <h3>Backup & Restore</h3>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">
                    <button class="btn btn-primary" onclick="tracker.showExportData()">Export Backup</button>
                    <button class="btn btn-secondary" onclick="tracker.showImportData()">Import Backup</button>
                    <button class="btn btn-danger" onclick="tracker.resetAllData()">Reset All Data</button>
                </div>
                <div id="exportData" class="export-data" style="display: none;"></div>
                <div id="importData" class="import-section" style="display: none;">
                    <h4>Import Backup Data</h4>
                    <p>Paste your backup JSON data below:</p>
                    <textarea id="importTextarea" class="import-textarea" placeholder="Paste your exported backup data here..."></textarea>
                    <div style="margin-top: 10px;">
                        <button class="btn btn-primary" onclick="tracker.importData()">Import Data</button>
                        <button class="btn btn-secondary" onclick="tracker.hideImportData()">Cancel</button>
                    </div>
                </div>
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
    
    showImportData() {
        const importDiv = document.getElementById('importData');
        importDiv.style.display = importDiv.style.display === 'none' ? 'block' : 'none';
        
        // Hide export data if open
        const exportDiv = document.getElementById('exportData');
        if (exportDiv.style.display === 'block') {
            exportDiv.style.display = 'none';
        }
    }
    
    hideImportData() {
        const importDiv = document.getElementById('importData');
        importDiv.style.display = 'none';
        
        // Clear textarea
        const textarea = document.getElementById('importTextarea');
        if (textarea) {
            textarea.value = '';
        }
    }
    
    importData() {
        const textarea = document.getElementById('importTextarea');
        if (!textarea || !textarea.value.trim()) {
            alert('Please paste your backup data in the text area.');
            return;
        }
        
        try {
            const importData = JSON.parse(textarea.value.trim());
            
            // Validate the imported data structure
            if (!importData.config || !importData.config.workouts) {
                throw new Error('Invalid backup data: missing workout configuration');
            }
            
            // Show confirmation with import details
            const metadata = importData.metadata || {};
            const confirmMessage = `Import backup from ${importData.exportTimestamp ? new Date(importData.exportTimestamp).toLocaleString() : 'unknown date'}?\n\n` +
                `This will replace all current data with:\n` +
                `- ${metadata.activeWorkouts || 0} workouts\n` +
                `- ${metadata.totalExercises || 0} exercises\n` +
                `- ${metadata.workoutHistoryEntries || 0} workout history entries\n` +
                `- ${metadata.workoutLogEntries || 0} progress log entries\n\n` +
                `This action cannot be undone.`;
            
            if (!confirm(confirmMessage)) {
                return;
            }
            
            // Import all data
            this.sessionNumber = importData.sessionNumber || 1;
            this.exerciseStates = importData.exerciseStates || {};
            this.config = importData.config;
            this.workoutHistory = importData.workoutHistory || [];
            this.workoutLogs = importData.workoutLogs || [];
            
            // Import dark mode preference if available
            if (importData.darkMode !== undefined) {
                localStorage.setItem('darkMode', importData.darkMode);
                const isDarkMode = importData.darkMode === 'true';
                document.body.classList.toggle('dark-mode', isDarkMode);
            }
            
            // Save imported data
            this.saveData();
            
            // Hide import UI and re-render
            this.hideImportData();
            this.render();
            
            alert('Backup imported successfully!');
            
        } catch (error) {
            console.error('Import failed:', error);
            alert(`Import failed: ${error.message}\n\nPlease check that you've pasted valid backup data.`);
        }
    }
    
    resetAllData() {
        if (confirm('Are you sure you want to reset all data? This will clear all progress and cannot be undone.')) {
            // Clear all localStorage data
            localStorage.clear();
            
            // Force reload to start fresh and trigger questionnaire
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
    
    // === EDITING FUNCTIONALITY ===
    
    addNewWorkout() {
        const workoutName = prompt('Enter workout name:');
        if (!workoutName || workoutName.trim() === '') return;
        
        // Check if workout name already exists
        if (this.config.workouts.find(w => w.name.toLowerCase() === workoutName.toLowerCase())) {
            alert('A workout with this name already exists!');
            return;
        }
        
        const newWorkout = {
            id: this.generateWorkoutId(),
            name: workoutName.trim(),
            exercises: []
        };
        
        this.config.workouts.push(newWorkout);
        this.saveData();
        this.render();
    }
    
    removeWorkout(workoutId) {
        const workout = this.config.workouts.find(w => w.id === workoutId);
        if (!workout) return;
        
        if (!confirm(`Are you sure you want to remove "${workout.name}"?\n\nThis will hide the workout but preserve your exercise history.`)) {
            return;
        }
        
        // Mark workout as inactive instead of deleting
        workout.active = false;
        
        // Exit edit mode and return to home
        this.editMode = false;
        this.editingWorkout = null;
        
        this.saveData();
        this.render();
    }
    
    editWorkoutName(workoutId) {
        const workout = this.config.workouts.find(w => w.id === workoutId);
        if (!workout) return;
        
        const newName = prompt('Enter new workout name:', workout.name);
        if (!newName || newName.trim() === '' || newName === workout.name) return;
        
        // Check if new name already exists
        if (this.config.workouts.find(w => w.id !== workoutId && w.name.toLowerCase() === newName.toLowerCase())) {
            alert('A workout with this name already exists!');
            return;
        }
        
        workout.name = newName.trim();
        this.saveData();
        this.render();
    }
    
    addExerciseToWorkout(workoutId) {
        const workout = this.config.workouts.find(w => w.id === workoutId);
        if (!workout) return;
        
        const exerciseName = prompt('Enter exercise name:');
        if (!exerciseName || exerciseName.trim() === '') return;
        
        // Check if exercise already exists in this workout
        if (workout.exercises.find(e => e.name.toLowerCase() === exerciseName.toLowerCase() && e.active !== false)) {
            alert('An exercise with this name already exists in this workout!');
            return;
        }
        
        const newExercise = {
            id: this.generateId(),
            name: exerciseName.trim(),
            startWeight: 20,
            minimumWeight: 10,
            repRange: [5, 8],
            increment: 2.5,
            unit: "kg",
            sets: 3,
            progressionType: "rep",
            active: true
        };
        
        workout.exercises.push(newExercise);
        
        // Initialize exercise state
        this.exerciseStates[exerciseName.trim()] = {
            currentWeight: newExercise.startWeight,
            targetReps: newExercise.repRange[0],
            failCount: 0,
            lastSession: 0,
            currentSet: 1,
            completedSets: 0,
            progressionPhase: 'reps',
            previousWeight: newExercise.startWeight,
            previousReps: newExercise.repRange[0],
            lastWeightIncrease: 0
        };
        
        this.saveData();
        this.render();
    }
    
    removeExercise(workoutId, exerciseId) {
        const workout = this.config.workouts.find(w => w.id === workoutId);
        if (!workout) return;
        
        const exercise = workout.exercises.find(e => e.id === exerciseId);
        if (!exercise) return;
        
        if (!confirm(`Are you sure you want to remove "${exercise.name}"?\n\nThis will hide the exercise but preserve your exercise history.`)) {
            return;
        }
        
        // Mark exercise as inactive instead of deleting
        exercise.active = false;
        
        this.saveData();
        this.render();
    }
    
    validateInput(exerciseId, property, newValue) {
        let exercise = null;
        
        // Find the exercise
        for (const workout of this.config.workouts) {
            exercise = workout.exercises.find(e => e.id === exerciseId);
            if (exercise) break;
        }
        
        if (!exercise) return { valid: false, error: 'Exercise not found' };
        
        // Validate based on property type
        switch (property) {
            case 'name':
                if (!newValue || newValue.trim() === '') {
                    return { valid: false, error: 'Exercise name cannot be empty' };
                }
                if (newValue.length > 30) {
                    return { valid: false, error: 'Exercise name must be under 30 characters' };
                }
                return { valid: true, value: newValue.trim() };
                
            case 'startWeight':
            case 'minimumWeight':
            case 'increment':
                const numValue = parseFloat(newValue);
                if (isNaN(numValue)) {
                    return { valid: false, error: `Invalid value for ${exercise.name} - ${property}: "${newValue}"` };
                }
                if (numValue < 0) {
                    return { valid: false, error: `${property} cannot be negative` };
                }
                return { valid: true, value: numValue };
                
            case 'sets':
                const setsValue = parseInt(newValue);
                if (isNaN(setsValue)) {
                    return { valid: false, error: `Invalid value for ${exercise.name} - sets: "${newValue}"` };
                }
                if (setsValue < 1 || setsValue > 10) {
                    return { valid: false, error: 'Sets must be between 1 and 10' };
                }
                return { valid: true, value: setsValue };
                
            case 'repRangeMin':
                const minReps = parseInt(newValue);
                if (isNaN(minReps)) {
                    return { valid: false, error: `Invalid value for ${exercise.name} - minimum reps: "${newValue}"` };
                }
                if (minReps < 1 || minReps > exercise.repRange[1]) {
                    return { valid: false, error: 'Minimum reps must be between 1 and maximum reps' };
                }
                return { valid: true, value: minReps };
                
            case 'repRangeMax':
                const maxReps = parseInt(newValue);
                if (isNaN(maxReps)) {
                    return { valid: false, error: `Invalid value for ${exercise.name} - maximum reps: "${newValue}"` };
                }
                if (maxReps < exercise.repRange[0] || maxReps > 50) {
                    return { valid: false, error: 'Maximum reps must be between minimum reps and 50' };
                }
                return { valid: true, value: maxReps };
                
            case 'unit':
                const validUnits = ['kg', 'lb', 'm', 'pl', 'level'];
                if (!validUnits.includes(newValue)) {
                    return { valid: false, error: `Invalid unit: "${newValue}". Must be one of: ${validUnits.join(', ')}` };
                }
                return { valid: true, value: newValue };
        }
        
        return { valid: false, error: 'Unknown property' };
    }
    
    editExerciseProperty(exerciseId, property, newValue) {
        const validation = this.validateInput(exerciseId, property, newValue);
        
        if (!validation.valid) {
            alert(validation.error);
            this.render(); // Re-render to reset invalid input
            return;
        }
        
        let exercise = null;
        
        // Find the exercise across all workouts
        for (const workout of this.config.workouts) {
            exercise = workout.exercises.find(e => e.id === exerciseId);
            if (exercise) break;
        }
        
        if (!exercise) return;
        
        // Apply validated value
        switch (property) {
            case 'name':
                const oldName = exercise.name;
                const newName = validation.value;
                
                exercise.name = newName;
                
                // Transfer exercise state from old name to new name
                if (this.exerciseStates[oldName] && oldName !== newName) {
                    this.exerciseStates[newName] = this.exerciseStates[oldName];
                    delete this.exerciseStates[oldName];
                }
                break;
                
            case 'startWeight':
            case 'minimumWeight':
            case 'increment':
            case 'sets':
                exercise[property] = validation.value;
                break;
                
            case 'repRangeMin':
                exercise.repRange[0] = validation.value;
                break;
                
            case 'repRangeMax':
                exercise.repRange[1] = validation.value;
                break;
                
            case 'unit':
                exercise.unit = validation.value;
                break;
        }
        
        this.saveData();
        this.render();
    }
    
    enterEditMode(workoutId) {
        const workout = this.config.workouts.find(w => w.id === workoutId);
        if (!workout) return;
        
        this.editMode = true;
        this.editingWorkout = workout;
        this.render();
    }
    
    exitEditMode() {
        this.editMode = false;
        this.editingWorkout = null;
        this.render();
    }
    
    saveAndStartWorkout(workoutId) {
        // Save data first
        this.saveData();
        
        // Exit edit mode
        this.editMode = false;
        this.editingWorkout = null;
        
        // Find and start the workout
        const workout = this.config.workouts.find(w => w.id === workoutId);
        if (workout) {
            this.startWorkout(workout.name);
        }
    }
    
    saveAndReturnHome(workoutId) {
        // Save data first
        this.saveData();
        
        // Mark this workout as recently updated for notification
        const workout = this.config.workouts.find(w => w.id === workoutId);
        if (workout) {
            this.recentlyUpdatedWorkout = workout.id;
        }
        
        // Exit edit mode and return to home
        this.editMode = false;
        this.editingWorkout = null;
        
        this.render();
    }
    
    moveExerciseUp(workoutId, exerciseId) {
        const workout = this.config.workouts.find(w => w.id === workoutId);
        if (!workout) return;
        
        const exerciseIndex = workout.exercises.findIndex(e => e.id === exerciseId);
        if (exerciseIndex <= 0) return; // Already at top or not found
        
        // Swap with previous exercise
        [workout.exercises[exerciseIndex - 1], workout.exercises[exerciseIndex]] = 
        [workout.exercises[exerciseIndex], workout.exercises[exerciseIndex - 1]];
        
        this.saveData();
        this.render();
    }
    
    moveExerciseDown(workoutId, exerciseId) {
        const workout = this.config.workouts.find(w => w.id === workoutId);
        if (!workout) return;
        
        const exerciseIndex = workout.exercises.findIndex(e => e.id === exerciseId);
        if (exerciseIndex === -1 || exerciseIndex >= workout.exercises.length - 1) return; // Already at bottom or not found
        
        // Swap with next exercise
        [workout.exercises[exerciseIndex], workout.exercises[exerciseIndex + 1]] = 
        [workout.exercises[exerciseIndex + 1], workout.exercises[exerciseIndex]];
        
        this.saveData();
        this.render();
    }
    
    renderEditMode() {
        if (!this.editingWorkout) return '';
        
        const workout = this.editingWorkout;
        const activeExercises = workout.exercises.filter(e => e.active !== false);
        
        return `
            <div class="workout-section">
                <div class="workout-header">
                    <div class="workout-name">Editing: ${workout.name}</div>
                    <div class="workout-edit-buttons">
                        <button class="btn btn-primary" onclick="tracker.saveAndReturnHome('${workout.id}')" title="Save changes">
                            💾 Save
                        </button>
                        <button class="btn btn-secondary" onclick="tracker.exitEditMode()">← Back</button>
                    </div>
                </div>
                
                <div class="edit-workout-name-section">
                    <h3>Workout Name</h3>
                    <input type="text" class="workout-name-input" value="${workout.name}" 
                           onchange="tracker.editWorkoutName('${workout.id}', this.value)" 
                           placeholder="Enter workout name">
                </div>
                
                <div class="edit-exercises-section">
                    <h3>Exercises</h3>
                    ${activeExercises.length > 0 ? `
                        <div class="exercises">
                            ${activeExercises.map(exercise => this.renderEditableExercise(exercise, workout.id)).join('')}
                        </div>
                    ` : '<p>No exercises in this workout.</p>'}
                    
                    <button class="btn btn-primary" onclick="tracker.addExerciseToWorkout('${workout.id}')" style="margin-top: 15px;">
                        + Add Exercise
                    </button>
                </div>
                
                <div class="edit-workout-actions">
                    <button class="btn btn-danger" onclick="tracker.removeWorkout('${workout.id}')">
                        Delete Workout
                    </button>
                </div>
            </div>
        `;
    }
    
    renderEditableExercise(exercise, workoutId) {
        return `
            <div class="exercise edit-exercise">
                <div class="exercise-header">
                    <div class="exercise-controls">
                        <button class="btn-small btn-secondary" onclick="tracker.moveExerciseUp('${workoutId}', '${exercise.id}')" title="Move up">
                            ↑
                        </button>
                        <button class="btn-small btn-secondary" onclick="tracker.moveExerciseDown('${workoutId}', '${exercise.id}')" title="Move down">
                            ↓
                        </button>
                    </div>
                    <input type="text" class="exercise-name-input" value="${exercise.name}" 
                           onchange="tracker.editExerciseProperty('${exercise.id}', 'name', this.value)" 
                           placeholder="Exercise name">
                    <button class="btn-small btn-danger" onclick="tracker.removeExercise('${workoutId}', '${exercise.id}')" title="Remove exercise">
                        🗑️
                    </button>
                </div>
                
                <div class="exercise-edit-grid">
                    <div class="edit-field">
                        <label>Start Weight (${exercise.unit})</label>
                        <input type="number" step="0.5" value="${exercise.startWeight}" 
                               onchange="tracker.editExerciseProperty('${exercise.id}', 'startWeight', this.value)">
                    </div>
                    
                    <div class="edit-field">
                        <label>Min Weight (${exercise.unit})</label>
                        <input type="number" step="0.5" value="${exercise.minimumWeight}" 
                               onchange="tracker.editExerciseProperty('${exercise.id}', 'minimumWeight', this.value)">
                    </div>
                    
                    <div class="edit-field">
                        <label>Increment (${exercise.unit})</label>
                        <input type="number" step="0.5" value="${exercise.increment}" 
                               onchange="tracker.editExerciseProperty('${exercise.id}', 'increment', this.value)">
                    </div>
                    
                    <div class="edit-field">
                        <label>Min Reps</label>
                        <input type="number" min="1" max="50" value="${exercise.repRange[0]}" 
                               onchange="tracker.editExerciseProperty('${exercise.id}', 'repRangeMin', this.value)">
                    </div>
                    
                    <div class="edit-field">
                        <label>Max Reps</label>
                        <input type="number" min="1" max="50" value="${exercise.repRange[1]}" 
                               onchange="tracker.editExerciseProperty('${exercise.id}', 'repRangeMax', this.value)">
                    </div>
                    
                    <div class="edit-field">
                        <label>Sets</label>
                        <input type="number" min="1" max="10" value="${exercise.sets}" 
                               onchange="tracker.editExerciseProperty('${exercise.id}', 'sets', this.value)">
                    </div>
                    
                    <div class="edit-field">
                        <label>Unit</label>
                        <select onchange="tracker.editExerciseProperty('${exercise.id}', 'unit', this.value)">
                            <option value="kg" ${exercise.unit === 'kg' ? 'selected' : ''}>kg</option>
                            <option value="lb" ${exercise.unit === 'lb' ? 'selected' : ''}>lb</option>
                            <option value="m" ${exercise.unit === 'm' ? 'selected' : ''}>m</option>
                            <option value="pl" ${exercise.unit === 'pl' ? 'selected' : ''}>pl</option>
                            <option value="level" ${exercise.unit === 'level' ? 'selected' : ''}>level</option>
                        </select>
                    </div>
                    
                    <div class="edit-field">
                        <label>Progression</label>
                        <select onchange="tracker.setProgressionType('${exercise.name}', this.value)">
                            <option value="rep" ${exercise.progressionType === 'rep' ? 'selected' : ''}>Rep+</option>
                            <option value="simple" ${exercise.progressionType === 'simple' ? 'selected' : ''}>Basic</option>
                            <option value="none" ${exercise.progressionType === 'none' ? 'selected' : ''}>Static</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }
    
    checkIntroQuestionnaire() {
        // Check if this is truly a new user (no workouts at all or empty array)
        const hasWorkouts = this.config.workouts && this.config.workouts.length > 0 && this.config.workouts.some(w => w.active !== false);
        const hasSeenQuestionnaire = localStorage.getItem('intro_questionnaire_shown');
        
        console.log('Checking intro questionnaire:', { 
            hasWorkouts, 
            workoutsLength: this.config.workouts?.length, 
            hasSeenQuestionnaire,
            config: this.config
        });
        
        // Only show questionnaire if no workouts AND haven't seen questionnaire before
        if (!hasWorkouts && !hasSeenQuestionnaire) {
            console.log('Showing intro questionnaire...');
            setTimeout(() => {
                // Mark that we've shown the questionnaire
                localStorage.setItem('intro_questionnaire_shown', 'true');
                
                const addProgram = confirm('Add program?\n\nChoose OK for Push/Pull/Legs split, or Cancel to build from scratch.\n\n(Note: Workouts can be edited at any time.)');
                if (addProgram) {
                    // Use default configuration
                    this.config = this.getDefaultConfig();
                    console.log('User chose Push/Pull/Legs split');
                } else {
                    // Start with an empty configuration
                    this.config = { workouts: [] };
                    console.log('User chose to build from scratch');
                }
                
                this.saveData();
                this.render();
            }, 1000); // Longer delay to ensure UI is ready
        }
    }
    
    attachEventListeners() {
        // Event listeners are handled via onclick attributes in the HTML
        // This method is kept for potential future use
    }
}

// Initialize the app
const tracker = new WorkoutTracker();

// Service worker registration is handled in the constructor
