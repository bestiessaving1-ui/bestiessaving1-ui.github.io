import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import BestiesApp from './BestiesApp'; // 👈 exact match

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BestiesApp />
  </React.StrictMode>
);
