import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import TelemetryLive from './pages/TelemetryLive';
import DesignSystem from './pages/DesignSystem';

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/telemetry/live" element={<TelemetryLive />} />
            <Route path="/design-system" element={<DesignSystem />} />
        </Routes>
    );
}
