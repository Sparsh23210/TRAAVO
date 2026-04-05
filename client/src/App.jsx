import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Home from './pages/Home';
import Results from './pages/Results';

import BusRoutes from './pages/BusRoutes';
import TrainRoutes from './pages/TrainRoutes';
import About from './pages/About';
import Contact from './pages/Contact';
import Explore from './pages/Explore'; // [NEW]
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import SEOPage from './pages/SEOPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
        <ScrollToTop />
        <div className="app-layout">
          <Navbar />
          <main id="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/results" element={<Results />} />
              <Route path="/bus-routes" element={<BusRoutes />} />
              <Route path="/explore" element={<Explore />} /> {/* [NEW] */}
              <Route path="/train-routes" element={<TrainRoutes />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/missed-train-what-to-do" element={<SEOPage slug="missed-train-what-to-do" />} />
              <Route path="/how-to-travel-from-city-a-to-city-b" element={<SEOPage slug="how-to-travel-from-city-a-to-city-b" />} />
              <Route path="/diwali-holi-emergency-travel" element={<SEOPage slug="diwali-holi-emergency-travel" />} />
              <Route path="/best-transit-hubs-switch-train-bus" element={<SEOPage slug="best-transit-hubs-switch-train-bus" />} />
              <Route path="/delhi-to-patna-plan-b-travel-guide" element={<SEOPage slug="delhi-to-patna-plan-b-travel-guide" />} />
              <Route path="/urgent-travel-medical-emergencies" element={<SEOPage slug="urgent-travel-medical-emergencies" />} />
              <Route path="/explore-state-under-budget" element={<SEOPage slug="explore-state-under-budget" />} />
              <Route path="/why-indirect-route-is-faster" element={<SEOPage slug="why-indirect-route-is-faster" />} />
              <Route path="/hidden-adventure-spots-accessible-by-bus" element={<SEOPage slug="hidden-adventure-spots-accessible-by-bus" />} />
              <Route path="/weekend-getaways-students-pune" element={<SEOPage slug="weekend-getaways-students-pune" />} />
              <Route path="/backup-routes-cancelled-train-bus" element={<SEOPage slug="backup-routes-cancelled-train-bus" />} />
              <Route path="/waitlisted-ticket-cant-board" element={<SEOPage slug="waitlisted-ticket-cant-board" />} />
              <Route path="/mumbai-pune-status-2026" element={<SEOPage slug="mumbai-pune-status-2026" />} />
              <Route path="/delhi-mumbai-guide-2026" element={<SEOPage slug="delhi-mumbai-guide-2026" />} />
              <Route path="/delhi-varanasi-backup" element={<SEOPage slug="delhi-varanasi-backup" />} />
              <Route path="/seat-chain-booking-trick" element={<SEOPage slug="seat-chain-booking-trick" />} />
              <Route path="/vande-bharat-alternatives" element={<SEOPage slug="vande-bharat-alternatives" />} />
              <Route path="/exam-travel-last-minute" element={<SEOPage slug="exam-travel-last-minute" />} />
              <Route path="/tier-2-tier-3-planner" element={<SEOPage slug="tier-2-tier-3-planner" />} />
              <Route path="/long-weekend-2026-guide" element={<SEOPage slug="long-weekend-2026-guide" />} />
              <Route path="/pnr-waitlist-status-guide" element={<SEOPage slug="pnr-waitlist-status-guide" />} />
              <Route path="/msrtc-ksrtc-bus-train-combo" element={<SEOPage slug="msrtc-ksrtc-bus-train-combo" />} />
              <Route path="/nearby-station-availability-trick" element={<SEOPage slug="nearby-station-availability-trick" />} />
              <Route path="/no-train-ticket-guide-2026" element={<SEOPage slug="no-train-ticket-guide-2026" />} />
              <Route path="/railone-app-guide-india" element={<SEOPage slug="railone-app-guide-india" />} />
              <Route path="/vande-bharat-sleeper-routes-2026" element={<SEOPage slug="vande-bharat-sleeper-routes-2026" />} />
              <Route path="/irctc-new-cancellation-rules-2026" element={<SEOPage slug="irctc-new-cancellation-rules-2026" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
