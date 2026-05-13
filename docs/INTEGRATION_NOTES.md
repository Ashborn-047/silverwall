# SilverWall Landing Page — Developer Integration Notes

## 📋 Overview
This landing page serves as the entry point for the SilverWall telemetry platform. It features a sophisticated AMG "Surgical Engineering" aesthetic with animated elements, live UTC clock, and a comprehensive race information card.

---

## 🗂️ File Structure

```
/pages/Landing.tsx          # Main landing page with integrated components
/styles/globals.css         # Design tokens and global styles
/App.tsx                    # Entry point
```

---

## 🔗 Routing Integration

### Current Setup
The landing page is currently set as the default route in `/App.tsx`.

### Integration with React Router
If you're using React Router, update your routing configuration:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import TelemetryViewer from './pages/TelemetryViewer'; // Your existing viewer

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/telemetry/live" element={<TelemetryViewer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### CTA Navigation
The primary CTA button navigates to:
```
/telemetry/live?gp=abu_dhabi_2024
```

In your telemetry viewer component, parse the `gp` query parameter:

```tsx
const searchParams = new URLSearchParams(window.location.search);
const gpIdentifier = searchParams.get('gp'); // "abu_dhabi_2024"
```

---

## 🎨 Design Tokens

All design tokens are defined in `/styles/globals.css`:

### Color Palette
```css
--color-bg-primary: #050608;
--color-accent-primary: #00D2BE;
--color-text-primary: #E0E0E0;
--color-text-secondary: #9CA3AF;
--color-border-subtle: rgba(0, 210, 190, 0.15);
--color-alert-negative: #FF3B30;
```

### Typography
- **Headings**: Inter SemiBold, ALL CAPS, +2% letter-spacing
- **Body**: Inter Regular
- **Data/Numeric**: JetBrains Mono with tabular numbers

### Spacing
```css
--spacing-section: 2.5rem;  /* Vertical spacing between sections */
--spacing-card: 1.5rem;     /* Internal card padding */
```

---

## 🎯 Key Features

### 1. **Background Grid Mesh**
Subtle engineering texture using CSS gradients:
```css
backgroundImage: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), 
                 linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
backgroundSize: 40px 40px
```

### 2. **Live UTC Clock**
Real-time clock in the race card header:
```tsx
const [currentTime, setCurrentTime] = useState(new Date());
useEffect(() => {
  const timer = setInterval(() => setCurrentTime(new Date()), 1000);
  return () => clearInterval(timer);
}, []);
```

### 3. **System Status Indicator**
Animated pulse indicator showing system operational status in header

### 4. **Metric Preview Pills**
Six telemetry metrics displayed as pill badges:
- SPEED_KPH
- RPM
- DRS_STATUS
- THROTTLE_%
- BRAKE_PSI
- GEAR

### 5. **Animated CTA Button**
- Hover glow effect with shadow
- Chevron icon slides right on hover
- Vertical translation on hover

### 6. **Race Card Features**
- Decorative corner markers (engineering-style borders)
- Live UTC time display
- 4-point data grid (Date, Laps, Location, Data Source)
- Yas Marina circuit silhouette with radial grid background
- Sector labels

---

## 🧩 Component Structure

The landing page is a single-file component with three internal components:

### Main Component: `Landing()`
Handles state management, navigation, and overall layout

### `RaceCard` Component
```tsx
const RaceCard = ({ currentTime }: { currentTime: Date }) => { ... }
```
Displays race information with live clock and track visualization

### `DataPoint` Component
```tsx
const DataPoint = ({ 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  sub: string 
}) => { ... }
```
Reusable data display component for race card grid

---

## 📱 Responsive Behavior

- **Desktop (≥1024px)**: 12-column grid with 7/5 split (content/race card)
- **Tablet/Mobile (<1024px)**: Single column, race card stacks below CTA
- **Max container width**: 1400px, centered
- **Minimum padding**: 24px (1.5rem) on mobile

### Layout Grid
```tsx
grid-cols-1 lg:grid-cols-12
gap-12 lg:gap-20
```

Left column (7/12): Value proposition and CTA  
Right column (5/12): Race card

---

## 🔧 Customization

### Updating Race Information
Edit the hardcoded values in the `RaceCard` component within `/pages/Landing.tsx`:

```tsx
<h3>Abu Dhabi Grand Prix</h3>
<span>Yas Marina Circuit</span>

<DataPoint label="DATE" value="DEC 07, 2024" sub="18:30 IST" />
<DataPoint label="LAPS" value="58" sub="5.281 KM" />
<DataPoint label="LOCATION" value="ABU DHABI" sub="UAE" />
```

### Dynamic Race Data (Recommended for Production)
Create an API or config to fetch next race:

```tsx
interface NextRace {
  name: string;
  circuit: string;
  date: string;
  time: string;
  laps: number;
  distance: string;
  location: string;
  country: string;
}

// Fetch from API or config
const nextRace = await fetchNextRace();
```

### Customizing Metric Pills
Edit the array in the metric preview section:

```tsx
const metrics = ['SPEED_KPH', 'RPM', 'DRS_STATUS', 'THROTTLE_%', 'BRAKE_PSI', 'GEAR'];
```

### Creating Additional Track Silhouettes
Track silhouettes are SVG paths. To add a new circuit:

1. Create a path in a 200×150 viewBox
2. Use stroke color: `#00D2BE`
3. strokeWidth: `1.5`
4. No fill, only strokes
5. Add start/finish line marker

Example structure:
```tsx
<svg viewBox="0 0 200 150">
  <path 
    d="M ... your path ..." 
    fill="none" 
    stroke="#00D2BE" 
    strokeWidth="1.5"
  />
  <line x1="..." y1="..." x2="..." y2="..." stroke="white" strokeWidth="2" />
</svg>
```

---

## 🎯 Design Principles

This page follows the **AMG Surgical Engineering** visual language:

1. **Minimal Visual Noise**: Clean backgrounds with subtle grid textures
2. **Data-First**: Information is structured, hierarchical, and scannable
3. **High Contrast**: Dark backgrounds (#050608) with teal accents (#00D2BE)
4. **Tabular Precision**: Monospace fonts for all numeric/data values
5. **Cold & Elite Tone**: Professional engineering language, not fan-oriented
6. **Surgical Borders**: Corner markers and precise border treatments
7. **Animated Feedback**: Subtle hover states and transitions

---

## ⚠️ Important Notes

1. **Font Loading**: Ensure Inter and JetBrains Mono are loaded:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
   ```

2. **Lucide React Icons**: The page uses multiple icons from `lucide-react`:
   - ChevronRight, Activity, Cpu, ShieldAlert, Terminal, Clock, MapPin, Flag
   
   Install if needed:
   ```bash
   npm install lucide-react
   ```

3. **CSS Variables**: All components use CSS custom properties. Do not hardcode colors.

4. **Button Navigation**: Currently uses `window.location.href`. For SPA routing:
   ```tsx
   import { useNavigate } from 'react-router-dom';
   const navigate = useNavigate();
   navigate('/telemetry/live?gp=abu_dhabi_2024');
   ```

5. **Session ID Generation**: Footer displays random session ID on each page load

6. **Selection Styling**: Custom text selection colors matching brand:
   ```css
   selection:bg-[#00D2BE] selection:text-[#050608]
   ```

---

## 🚀 Next Steps

1. **Integrate with React Router** (if using client-side routing)
2. **Connect to OpenF1 API** to fetch dynamic race data
3. **Add loading states** for async race data fetching
4. **Implement error boundaries** for race data failures
5. **Test responsive behavior** on actual mobile devices
6. **Add accessibility** (ARIA labels, keyboard navigation)
7. **Connect telemetry viewer** to handle `gp` query parameter
8. **Add analytics** tracking for CTA clicks

---

## 🏁 Race Data Format

Expected format for dynamic race data:

```json
{
  "grandPrix": "Abu Dhabi Grand Prix",
  "circuit": "Yas Marina Circuit",
  "date": "DEC 07, 2024",
  "time": "18:30 IST",
  "laps": 58,
  "distance": "5.281 KM",
  "location": "ABU DHABI",
  "country": "UAE",
  "gpIdentifier": "abu_dhabi_2024"
}
```

---

**Questions or issues?** Refer to the design tokens in `/styles/globals.css` and the reference implementation in `/pages/Landing.tsx` for consistency across the SilverWall platform.