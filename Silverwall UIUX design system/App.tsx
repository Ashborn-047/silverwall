import { useState } from 'react';
import Landing from './pages/Landing';
import TelemetryLive from './pages/TelemetryLive';
import DesignSystem from './pages/DesignSystem';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'telemetry' | 'design-system'>('landing');

  const navigateToTelemetry = () => {
    setCurrentPage('telemetry');
  };

  const navigateToLanding = () => {
    setCurrentPage('landing');
  };

  const navigateToDesignSystem = () => {
    setCurrentPage('design-system');
  };

  if (currentPage === 'telemetry') {
    return <TelemetryLive onBack={navigateToLanding} />;
  }

  if (currentPage === 'design-system') {
    return <DesignSystem onBack={navigateToLanding} />;
  }

  return <Landing onNavigate={navigateToTelemetry} onNavigateToDesignSystem={navigateToDesignSystem} />;
}