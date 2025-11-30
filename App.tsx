import React from 'react';
import { ImageProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';

const App: React.FC = () => {
  return (
    <ImageProvider>
      <AppLayout />
    </ImageProvider>
  );
};

export default App;
