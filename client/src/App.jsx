import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Results from './pages/Results';

import BusRoutes from './pages/BusRoutes';
import TrainRoutes from './pages/TrainRoutes';
import About from './pages/About';
import Contact from './pages/Contact';
import Explore from './pages/Explore'; // [NEW]
import SEOPage from './pages/SEOPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/results" element={<Results />} />
            <Route path="/bus-routes" element={<BusRoutes />} />
            <Route path="/explore" element={<Explore />} /> {/* [NEW] */}
            <Route path="/train-routes" element={<TrainRoutes />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
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
          </Routes>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
