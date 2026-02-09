import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { EmployerPointsProvider } from './contexts/EmployerPointsContext';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <EmployerPointsProvider>
            <App />
          </EmployerPointsProvider>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
