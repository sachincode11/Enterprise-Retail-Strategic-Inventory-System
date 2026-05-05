// src/main.jsx
//connects html to react (app.jsx) into root
import { StrictMode } from 'react'; //highlighting potential issues during development.
import { createRoot } from 'react-dom/client';//Mounts React app into DOM = Document Object Model
import './styles/index.css';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
