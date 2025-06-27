# Workout Tracker PWA

A Progressive Web App for tracking gym workouts with intelligent progression algorithms and offline functionality.

## 🏋️ Features

### **Three Progression Types**
- **Rep+**: Increases reps first (5→6), then weight with reset to baseline reps
- **Basic**: Direct weight increases on successful completion
- **Static**: No progression (for cardio exercises)

### **Smart Failure Handling**
- **Buffer System**: At increased reps, failure drops to baseline without weight penalty
- **2-Strike Rule**: Two consecutive failures trigger weight reduction
- **Minimum Weight Protection**: Prevents weight going below safe minimums

### **Workout Management**
- **Push + Calfs**: Shoulder press, Pectoral machine, Chest incline, Tricep pulldowns, Calf raises, Cross trainer
- **Pull + Glutes**: Vertical traction, Seated row, Upper back, Biceps cable, Hip abduction, Cross trainer
- **Cardio Day**: Run or swim sessions

### **Progress Tracking**
- **Detailed Progress Log**: Shows weight increases, rep progressions, and failures with clear reasoning
- **Session History**: Track every workout with date stamps and progression changes
- **Incomplete Exercise Handling**: Warns when ending workouts early

### **Mobile Optimized**
- **PWA Installation**: Add to iPhone home screen for offline use
- **Touch-Friendly**: Optimized for iPhone 13 mini and similar devices
- **No Zoom Issues**: Prevents accidental zoom on rapid button taps

## 📱 Installation

### **iPhone Setup**
1. Open Safari and go to: `https://berttaylor.github.io/workout-tracker-pwa`
2. Tap the Share button (box with arrow)
3. Select "Add to Home Screen"
4. Name it "Workout" and tap "Add"
5. Use the app icon from your home screen (works offline!)

### **Desktop Setup**
Simply visit: `https://berttaylor.github.io/workout-tracker-pwa`

## 🎯 How to Use

### **Starting a Workout**
1. Select your workout type (Push + Calfs, Pull + Glutes, or Cardio Day)
2. Each exercise shows current weight, target reps, and progression type
3. Complete sets by tapping "Add Set" or "Complete"
4. Mark failures with "Fail (X/2)" button

### **Understanding Progression Types**
- **Rep+**: Green badge - alternates between rep increases and weight increases
- **Basic**: Blue badge - increases weight directly on success
- **Static**: Gray badge - no automatic progression

### **Set Tracking**
- Progress counter shows completed sets (e.g., "3/5 Sets")
- Exercises turn green when all sets completed
- Failed exercises turn gray and are blocked from further attempts

### **Ending Workouts**
- Tap "End Workout" at bottom of exercise list
- App warns if exercises are incomplete
- All progression changes apply only when ending workout

## 📊 Progress Log

The Progress Log shows detailed workout history:

**Example Entry:**
```
Thu, 27 Jun                    Push + Calfs
Shoulder press: 30kg → 32.5kg (5 reps)
Pectoral machine: 5 → 6 reps
Tricep pulldowns: Failed (2/2) - 22.5kg → 20kg
Calf raises: Incomplete
```

### **Log Entry Types**
- **Weight increases**: `30kg → 32.5kg (5 reps)`
- **Rep increases**: `5 → 6 reps`
- **Failures with penalties**: `Failed (2/2) - 22.5kg → 20kg`
- **Buffer protection**: `Failed (2/2) - 6 → 5 reps`
- **Incomplete exercises**: `Incomplete`

## ⚙️ Configuration

### **Exercise Configuration**
Each exercise includes:
- `startWeight`: Initial weight/duration
- `minimumWeight`: Safety floor (can go below start weight)
- `repRange`: [min, max] rep targets
- `increment`: Amount to increase weight
- `sets`: Number of sets required
- `progressionType`: "rep", "simple", or "none"

### **Customization**
- Edit `getDefaultConfig()` in `app.js` to modify exercises
- All data stored locally in browser localStorage
- Export function provides JSON backup of all data

## 🔧 Technical Details

### **Built With**
- Vanilla JavaScript (no frameworks)
- CSS Grid and Flexbox for responsive layout
- Service Worker for offline functionality
- localStorage for data persistence

### **Browser Support**
- Safari (iOS) - Primary target
- Chrome/Edge/Firefox - Full support
- Works offline after initial load

### **Data Storage**
- **Exercise States**: Current weights, reps, fail counts, progression phases
- **Workout History**: Detailed logs of every set and exercise
- **Session Data**: Temporary states during active workouts
- **Progress Logs**: Human-readable workout summaries

## 🚀 Development

### **Local Development**
```bash
git clone https://github.com/berttaylor/workout-tracker-pwa.git
cd workout-tracker-pwa
python3 -m http.server 8080
# Visit http://localhost:8080
```

### **Deployment**
- Hosted on GitHub Pages
- Automatic deployment on push to main branch
- Service worker cache versioning for updates

### **Cache Management**
- Update `CACHE_NAME` in `sw.js` for each deployment
- Forces PWA refresh on mobile devices
- Version format: `workout-tracker-v{number}`

## 🎯 Workout Philosophy

This app implements a **double progression** system inspired by proven strength training methodologies:

1. **Progressive Overload**: Gradual increases in weight or reps
2. **Autoregulation**: Progression based on performance, not calendar
3. **Deload Protection**: Buffer system prevents excessive weight reduction
4. **Minimum Effective Dose**: Only progress when warranted

### **Progression Examples**

**Rep+ Exercise (Shoulder Press):**
- Week 1: 30kg × 5 reps ✓ → 30kg × 6 reps
- Week 2: 30kg × 6 reps ✓ → 32.5kg × 5 reps
- Week 3: 32.5kg × 5 reps ✓ → 32.5kg × 6 reps

**Basic Exercise (Calf Raises):**
- Week 1: 7.5kg × 8 reps ✓ → 10kg × 8 reps
- Week 2: 10kg × 8 reps ✓ → 12.5kg × 8 reps

## 📄 License

MIT License - Feel free to fork and modify for your own use.

## 🤝 Contributing

This is a personal workout tracker, but suggestions and improvements are welcome via GitHub issues.

---

**Happy lifting! 💪**
