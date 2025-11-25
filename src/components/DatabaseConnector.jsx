import React, { useState } from 'react';
import { useDatabaseConnections } from '../contexts/DatabaseConnectionsContext';
import { Database, Plus, Trash2, Check, X, AlertCircle } from 'lucide-react';

const DatabaseConnector = ({ isOpen, onClose }) => {
  const { connections, addConnection, deleteConnection, testConnection } = useDatabaseConnections();
  const [showForm, setShowForm] = useState(false);
  const [testing, setTesting] = useState(null);
  const [testResult, setTestResult] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'mysql',
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    addConnection(formData);
    setFormData({
      name: '',
      type: 'mysql',
      host: '',
      port: '',
      database: '',
      username: '',
      password: '',
    });
    setShowForm(false);
  };

  const handleTest = async (connection) => {
    setTesting(connection.id);
    setTestResult(null);
    const result = await testConnection(connection);
    setTestResult({ id: connection.id, ...result });
    setTesting(null);
  };

  const getDefaultPort = (type) => {
    return type === 'mysql' ? '3306' : '27017';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '80vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Database size={24} color="#3b82f6" />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
              Database Connections
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#6b7280',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}>
          {/* Connections List */}
          {!showForm && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={() => setShowForm(true)}
                  style={{
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Plus size={18} />
                  Add Connection
                </button>
              </div>

              {connections.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#6b7280',
                  fontSize: '14px',
                }}>
                  <Database size={48} color="#d1d5db" style={{ marginBottom: '12px' }} />
                  <p>No database connections configured</p>
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>
                    Click "Add Connection" to get started
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {connections.map(conn => (
                    <div
                      key={conn.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        background: '#fff',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px',
                          }}>
                            <Database size={18} color="#3b82f6" />
                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a1a' }}>
                              {conn.name}
                            </span>
                            <span style={{
                              background: conn.type === 'mysql' ? '#dbeafe' : '#dcfce7',
                              color: conn.type === 'mysql' ? '#1e40af' : '#166534',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                            }}>
                              {conn.type.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.6' }}>
                            <div>{conn.host}:{conn.port}</div>
                            <div>Database: {conn.database}</div>
                            <div>User: {conn.username}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleTest(conn)}
                            disabled={testing === conn.id}
                            style={{
                              background: '#fff',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              cursor: testing === conn.id ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: '#374151',
                            }}
                          >
                            {testing === conn.id ? 'Testing...' : 'Test'}
                          </button>
                          <button
                            onClick={() => deleteConnection(conn.id)}
                            style={{
                              background: '#fff',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              padding: '6px',
                              cursor: 'pointer',
                              color: '#ef4444',
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Test Result */}
                      {testResult && testResult.id === conn.id && (
                        <div style={{
                          marginTop: '12px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: testResult.success ? '#f0fdf4' : '#fef2f2',
                          border: `1px solid ${testResult.success ? '#86efac' : '#fecaca'}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                        }}>
                          {testResult.success ? (
                            <Check size={16} color="#16a34a" />
                          ) : (
                            <AlertCircle size={16} color="#ef4444" />
                          )}
                          <span style={{ color: testResult.success ? '#166534' : '#991b1b' }}>
                            {testResult.message}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Add Connection Form */}
          {showForm && (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px',
                  }}>
                    Connection Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Database"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px',
                  }}>
                    Database Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({
                      ...formData,
                      type: e.target.value,
                      port: getDefaultPort(e.target.value),
                    })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="mysql">MySQL</option>
                    <option value="mongodb">MongoDB</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '6px',
                    }}>
                      Host *
                    </label>
                    <input
                      type="text"
                      value={formData.host}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                      placeholder="localhost"
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '6px',
                    }}>
                      Port *
                    </label>
                    <input
                      type="text"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                      placeholder={getDefaultPort(formData.type)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px',
                  }}>
                    Database Name *
                  </label>
                  <input
                    type="text"
                    value={formData.database}
                    onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                    placeholder="my_database"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px',
                  }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="root"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px',
                  }}>
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    Add Connection
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{
                      flex: 1,
                      background: '#fff',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseConnector;
