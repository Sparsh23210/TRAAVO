import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Results from './pages/Results';

import BusRoutes from './pages/BusRoutes';
import TrainRoutes from './pages/TrainRoutes';
import About from './pages/About';
import Contact from './pages/Contact';
import Explore from './pages/Explore'; // [NEW]
import Navbar from './components/Navbar';

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
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
