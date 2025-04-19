import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LiveRenderer from './components/LiveRenderer';
import LandingPage from './components/LandingPage';
import './styles/LiveRenderer.css';
import './styles/GlobalStyles.css';

function App() {
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('light-mode', isLightMode);
  }, [isLightMode]);

  const toggleMode = () => {
    setIsLightMode(!isLightMode);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage isLightMode={isLightMode} />} />
        <Route 
          path="/create" 
          element={
            <div className="App" style={{ 
              height: '100vh', 
              overflow: 'hidden',
              backgroundColor: 'var(--background-color)',
              color: 'var(--text-color)'
            }}>
              <div style={{
                padding: '5px 20px',
              }}>
                <h1 style={{ 
                  margin: '2px 0',
                  color: 'var(--heading-color)',
                  fontSize: 'clamp(20px, 4vw, 28px)',
                  fontWeight: '600',
                  letterSpacing: '0.5px'
                }}>
                  InstantCraft
                </h1>
              </div>
              <LiveRenderer toggleMode={toggleMode} isLightMode={isLightMode} />
            </div>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;