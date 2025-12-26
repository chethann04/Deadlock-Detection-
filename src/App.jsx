import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BankersAlgorithm from './BankersAlgorithm';
import GraphViewer from './GraphViewer';
import './animations.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BankersAlgorithm />} />
        <Route path="/graph-viewer" element={<GraphViewer />} />
      </Routes>
    </Router>
  );
}

export default App;