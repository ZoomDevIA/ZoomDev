import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';
import './hud.css';
import './zoomdoc.css';
import { iniciar as iniciarTema } from './lib/tema.js';

// O tema é aplicado antes do primeiro quadro. Feito dentro de um efeito de
// componente, a tela pisca no padrão e só depois troca, e é esse pisca que
// denuncia que a personalização é postiça.
iniciarTema();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
