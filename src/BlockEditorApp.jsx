import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import BlockDefinitionEditor from './components/BlockDefinitionEditor';
import blockDefinitions from './blockDefinitions.json';
import './index.css';

function BlockEditorApp() {
  const [definitions, setDefinitions] = useState(blockDefinitions);
  
  const handleSave = (newDefinitions) => {
    // In a real app, this would send to a backend API
    // For now, download as JSON file
    const blob = new Blob([JSON.stringify(newDefinitions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blockDefinitions.json';
    a.click();
    URL.revokeObjectURL(url);
    
    setDefinitions(newDefinitions);
    alert('Block definitions exported! Replace src/blockDefinitions.json with the downloaded file.');
  };

  return (
    <BlockDefinitionEditor 
      initialDefinitions={definitions}
      onSave={handleSave}
    />
  );
}

// Mount the app
const rootElement = document.getElementById('block-editor-root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BlockEditorApp />
    </React.StrictMode>
  );
}

export default BlockEditorApp;
