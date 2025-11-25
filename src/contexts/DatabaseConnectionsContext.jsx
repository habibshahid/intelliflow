import React, { createContext, useContext, useState, useEffect } from 'react';

const DatabaseConnectionsContext = createContext();

export const useDatabaseConnections = () => {
  const context = useContext(DatabaseConnectionsContext);
  if (!context) {
    throw new Error('useDatabaseConnections must be used within DatabaseConnectionsProvider');
  }
  return context;
};

export const DatabaseConnectionsProvider = ({ children }) => {
  const [connections, setConnections] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('dbConnections');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever connections change
  useEffect(() => {
    localStorage.setItem('dbConnections', JSON.stringify(connections));
  }, [connections]);

  const addConnection = (connection) => {
    const newConnection = {
      ...connection,
      id: `conn-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setConnections([...connections, newConnection]);
    return newConnection.id;
  };

  const updateConnection = (id, updates) => {
    setConnections(connections.map(conn => 
      conn.id === id ? { ...conn, ...updates } : conn
    ));
  };

  const deleteConnection = (id) => {
    setConnections(connections.filter(conn => conn.id !== id));
  };

  const getConnection = (id) => {
    return connections.find(conn => conn.id === id);
  };

  const testConnection = async (connection) => {
    // In real implementation, this would actually test the connection
    // For now, we'll simulate it
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Connection successful (simulated)' });
      }, 1000);
    });
  };

  return (
    <DatabaseConnectionsContext.Provider
      value={{
        connections,
        addConnection,
        updateConnection,
        deleteConnection,
        getConnection,
        testConnection,
      }}
    >
      {children}
    </DatabaseConnectionsContext.Provider>
  );
};
