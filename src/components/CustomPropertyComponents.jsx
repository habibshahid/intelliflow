import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Loader2, Database, Variable, Clock, Save, RefreshCw } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================
// SHARED MODAL COMPONENT
// ============================================
const Modal = ({ isOpen, onClose, title, children, icon: Icon }) => {
  if (!isOpen) return null;

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
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {Icon && <Icon size={20} color="#3b82f6" />}
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          >
            <X size={20} color="#6b7280" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Shared input styles
const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  fontSize: '14px',
  boxSizing: 'border-box',
};

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  background: '#fff',
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '500',
  color: '#374151',
  marginBottom: '6px',
};

const buttonStyle = {
  padding: '10px 20px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
};

// ============================================
// DATABASE COMPONENT
// ============================================
export const DatabasePropertyComponent = ({ 
  value, 
  onChange, 
  onLabelChange,
  flowContext = {},
  prop 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    db_type: 'mysql',
    name: '',
    host: 'localhost',
    port: '3306',
    username: '',
    password: '',
  });

  const DB_TYPES = [
    { value: 'mysql', label: 'MySQL' },
    { value: 'sql', label: 'SQL Server' },
    { value: 'mongo', label: 'MongoDB' },
  ];

  // Fetch existing databases (full records for edit/delete)
  const fetchDatabases = async () => {
    if (!flowContext.intelliflowId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/query-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `SELECT id, name, db_type, host, port, username, password FROM yovo_tbl_ivr_databases WHERE ivr_id = ${flowContext.intelliflowId}`,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setDatabases(data.rows || []);
      }
    } catch (err) {
      console.error('Failed to fetch databases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, [flowContext.intelliflowId]);

  const resetForm = () => {
    setFormData({
      db_type: 'mysql',
      name: '',
      host: 'localhost',
      port: '3306',
      username: '',
      password: '',
    });
    setEditingId(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.username) {
      setError('Database name and username are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const endpoint = editingId ? '/api/update-record' : '/api/create-record';
      const recordData = {
        db_type: formData.db_type,
        name: formData.name,
        host: formData.host,
        port: formData.port,
        username: formData.username,
        password: formData.password,
      };

      const payload = editingId
        ? { table: 'yovo_tbl_ivr_databases', data: recordData, where: { id: editingId } }
        : { table: 'yovo_tbl_ivr_databases', data: { ...recordData, ivr_id: flowContext.intelliflowId || 0 } };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Auto-select the new database
        if (!editingId && result.insertId) {
          const label = `${formData.name} (${DB_TYPES.find(t => t.value === formData.db_type)?.label || formData.db_type})`;
          onChange(String(result.insertId), label);
        }
        setIsModalOpen(false);
        resetForm();
        fetchDatabases();
      } else {
        setError(result.error || 'Failed to save database');
      }
    } catch (err) {
      setError('Failed to save database: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (db) => {
    setEditingId(db.id);
    setFormData({
      db_type: db.db_type || 'mysql',
      name: db.name || '',
      host: db.host || 'localhost',
      port: db.port || '3306',
      username: db.username || '',
      password: db.password || '',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/delete-record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'yovo_tbl_ivr_databases',
          where: { id }
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        fetchDatabases();
        if (String(value) === String(id)) {
          onChange('');
          onLabelChange && onLabelChange('');
        }
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  // Get display label for a database
  const getDbLabel = (db) => `${db.name} (${DB_TYPES.find(t => t.value === db.db_type)?.label || db.db_type})`;

  return (
    <div>
      {/* Select existing database */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <select
          value={String(value || '')}
          onChange={(e) => {
            const selected = databases.find(d => String(d.id) === e.target.value);
            const label = selected ? getDbLabel(selected) : '';
            onChange(e.target.value, label);
          }}
          style={{ ...selectStyle, flex: 1 }}
        >
          <option value="">-- Select Database --</option>
          {databases.map(db => (
            <option key={db.id} value={String(db.id)}>{getDbLabel(db)}</option>
          ))}
        </select>
        <button
          onClick={() => fetchDatabases()}
          style={{ ...buttonStyle, padding: '8px', background: '#f3f4f6', border: '1px solid #e5e7eb' }}
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Existing databases list with Edit/Delete */}
      {databases.length > 0 && (
        <div style={{ 
          marginBottom: '12px', 
          maxHeight: '150px', 
          overflowY: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
        }}>
          {databases.map(db => (
            <div 
              key={db.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: '1px solid #f3f4f6',
                fontSize: '13px',
                background: String(value) === String(db.id) ? '#eff6ff' : 'transparent',
              }}
            >
              <div 
                style={{ flex: 1, cursor: 'pointer' }}
                onClick={() => {
                  onChange(String(db.id), getDbLabel(db));
                }}
              >
                <span style={{ fontWeight: '500' }}>{db.name}</span>
                <span style={{ color: '#6b7280', marginLeft: '8px', fontSize: '11px' }}>
                  ({DB_TYPES.find(t => t.value === db.db_type)?.label || db.db_type})
                </span>
                <div style={{ color: '#9ca3af', fontSize: '11px' }}>
                  {db.host}:{db.port}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(db); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                  title="Edit"
                >
                  <Edit2 size={14} color="#6b7280" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(db.id, db.name); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                  title="Delete"
                >
                  <Trash2 size={14} color="#ef4444" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create new button */}
      <button
        onClick={() => {
          resetForm();
          setIsModalOpen(true);
        }}
        style={{
          ...buttonStyle,
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          width: '100%',
          justifyContent: 'center',
        }}
      >
        <Plus size={16} /> Create New Database Connection
      </button>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={editingId ? 'Edit Database Connection' : 'Create Database Connection'}
        icon={Database}
      >
        {error && (
          <div style={{ 
            background: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: '6px', 
            padding: '10px', 
            marginBottom: '16px',
            color: '#dc2626',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Database Type</label>
            <select
              value={formData.db_type}
              onChange={(e) => setFormData({ ...formData, db_type: e.target.value })}
              style={selectStyle}
            >
              {DB_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Database Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., my_database"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Host</label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                placeholder="localhost"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Port</label>
              <input
                type="text"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                placeholder="3306"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Username *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="db_user"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => { setIsModalOpen(false); resetForm(); }}
            style={{ ...buttonStyle, background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ ...buttonStyle, background: '#3b82f6', color: '#fff', border: 'none', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? <Loader2 size={16} /> : <Save size={16} />}
            {saving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
          </button>
        </div>
      </Modal>
    </div>
  );
};

// ============================================
// VARIABLES COMPONENT
// ============================================
export const VariablesPropertyComponent = ({ 
  value, 
  onChange, 
  onLabelChange,
  flowContext = {},
  prop 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    variable_type: 'global',
  });

  const VARIABLE_TYPES = [
    { value: 'global', label: 'Global Variable' },
    { value: 'channel', label: 'Channel Variable' },
    { value: 'agent_cti', label: 'CTI Variable' },
    { value: 'agent_cti_arr', label: 'CTI Array (in-memory)' },
    { value: 'agent_cti_json', label: 'CTI Json' },
  ];

  // Fetch existing variables
  const fetchVariables = async () => {
    if (!flowContext.intelliflowId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/query-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `SELECT id, name, variable_type FROM yovo_tbl_ivr_variables WHERE ivr_id = ${flowContext.intelliflowId}`,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setVariables(data.rows || []);
      }
    } catch (err) {
      console.error('Failed to fetch variables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariables();
  }, [flowContext.intelliflowId]);

  const handleSave = async () => {
    if (!formData.name) {
      setError('Variable name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const endpoint = editingId ? '/api/update-record' : '/api/create-record';
      const payload = editingId 
        ? {
            table: 'yovo_tbl_ivr_variables',
            data: { name: formData.name, variable_type: formData.variable_type },
            where: { id: editingId }
          }
        : {
            table: 'yovo_tbl_ivr_variables',
            data: {
              ivr_id: flowContext.intelliflowId || 0,
              name: formData.name,
              variable_type: formData.variable_type,
            }
          };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Auto-select the new variable
        if (!editingId && result.insertId) {
          onChange(formData.name, formData.name);
        }
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ name: '', variable_type: 'global' });
        fetchVariables();
      } else {
        setError(result.error || 'Failed to save variable');
      }
    } catch (err) {
      setError('Failed to save variable: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (variable) => {
    setEditingId(variable.id);
    setFormData({ name: variable.name, variable_type: variable.variable_type || 'global' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm('Are you sure you want to delete this variable?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/delete-record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'yovo_tbl_ivr_variables',
          where: { id }
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        fetchVariables();
        if (value === name) {
          onChange('');
          onLabelChange && onLabelChange('');
        }
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  return (
    <div>
      {/* Select existing variable */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <select
          value={String(value || '')}
          onChange={(e) => {
            const selected = variables.find(v => v.name === e.target.value);
            const label = selected?.name || '';
            onChange(e.target.value, label);
          }}
          style={{ ...selectStyle, flex: 1 }}
        >
          <option value="">-- Select Variable --</option>
          {variables.map(v => (
            <option key={v.id} value={String(v.name)}>
              {v.name} ({VARIABLE_TYPES.find(t => t.value === v.variable_type)?.label || v.variable_type})
            </option>
          ))}
        </select>
        <button
          onClick={() => fetchVariables()}
          style={{ ...buttonStyle, padding: '8px', background: '#f3f4f6', border: '1px solid #e5e7eb' }}
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Existing variables list */}
      {variables.length > 0 && (
        <div style={{ 
          marginBottom: '12px', 
          maxHeight: '150px', 
          overflowY: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
        }}>
          {variables.map(v => (
            <div 
              key={v.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: '1px solid #f3f4f6',
                fontSize: '13px',
                background: v.name === value ? '#eff6ff' : 'transparent',
              }}
            >
              <div 
                style={{ flex: 1, cursor: 'pointer' }}
                onClick={() => {
                  onChange(v.name, v.name);
                }}
              >
                <span style={{ fontWeight: '500' }}>{v.name}</span>
                <span style={{ color: '#6b7280', marginLeft: '8px', fontSize: '11px' }}>
                  ({VARIABLE_TYPES.find(t => t.value === v.variable_type)?.label || v.variable_type || 'global'})
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(v); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                  title="Edit"
                >
                  <Edit2 size={14} color="#6b7280" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(v.id, v.name); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                  title="Delete"
                >
                  <Trash2 size={14} color="#ef4444" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create new button */}
      <button
        onClick={() => {
          setEditingId(null);
          setFormData({ name: '', variable_type: 'global' });
          setIsModalOpen(true);
        }}
        style={{
          ...buttonStyle,
          background: '#10b981',
          color: '#fff',
          border: 'none',
          width: '100%',
          justifyContent: 'center',
        }}
      >
        <Plus size={16} /> Create New Variable
      </button>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingId(null); setError(null); }}
        title={editingId ? 'Edit Variable' : 'Create Variable'}
        icon={Variable}
      >
        {error && (
          <div style={{ 
            background: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: '6px', 
            padding: '10px', 
            marginBottom: '16px',
            color: '#dc2626',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Variable Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., customer_id"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Variable Type</label>
            <select
              value={formData.variable_type}
              onChange={(e) => setFormData({ ...formData, variable_type: e.target.value })}
              style={selectStyle}
            >
              {VARIABLE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => { setIsModalOpen(false); setEditingId(null); setError(null); }}
            style={{ ...buttonStyle, background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ ...buttonStyle, background: '#10b981', color: '#fff', border: 'none', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? <Loader2 size={16} /> : <Save size={16} />}
            {saving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
          </button>
        </div>
      </Modal>
    </div>
  );
};

// ============================================
// TIMESTAMP COMPONENT (for gotoiftime & gotoiftimemulti)
// ============================================
export const TimestampPropertyComponent = ({ 
  value, 
  onChange, 
  onLabelChange,
  flowContext = {},
  prop,
  isMulti = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timestamps, setTimestamps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  // Form uses start/end for user convenience, will combine to ranges on save
  const [formData, setFormData] = useState({
    name: '',
    time_start: '00:00:00',
    time_end: '23:59:59',
    weekday_start: 'mon',
    weekday_end: 'sun',
    monthday_start: '1',
    monthday_end: '31',
    month_start: 'jan',
    month_end: 'dec',
  });

  const WEEKDAYS = [
    { value: 'mon', label: 'Monday' },
    { value: 'tue', label: 'Tuesday' },
    { value: 'wed', label: 'Wednesday' },
    { value: 'thu', label: 'Thursday' },
    { value: 'fri', label: 'Friday' },
    { value: 'sat', label: 'Saturday' },
    { value: 'sun', label: 'Sunday' },
  ];

  const MONTHS = [
    { value: 'jan', label: 'January' },
    { value: 'feb', label: 'February' },
    { value: 'mar', label: 'March' },
    { value: 'apr', label: 'April' },
    { value: 'may', label: 'May' },
    { value: 'jun', label: 'June' },
    { value: 'jul', label: 'July' },
    { value: 'aug', label: 'August' },
    { value: 'sep', label: 'September' },
    { value: 'oct', label: 'October' },
    { value: 'nov', label: 'November' },
    { value: 'dec', label: 'December' },
  ];

  // Generate monthday options (1-31)
  const MONTHDAYS = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));

  // Helper to parse range string (e.g., "09:00:00-17:00:00" -> {start: "09:00:00", end: "17:00:00"})
  const parseRange = (rangeStr, defaultStart, defaultEnd) => {
    if (!rangeStr || rangeStr === '*') {
      return { start: defaultStart, end: defaultEnd };
    }
    const parts = rangeStr.split('-');
    if (parts.length === 2) {
      return { start: parts[0], end: parts[1] };
    }
    return { start: defaultStart, end: defaultEnd };
  };

  // Fetch existing timestamps
  const fetchTimestamps = async () => {
    if (!flowContext.intelliflowId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/query-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `SELECT id, name, time_range, weekday_range, monthday_range, month_range FROM yovo_tbl_ivr_timestamps WHERE ivr_id = ${flowContext.intelliflowId}`,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setTimestamps(data.rows || []);
      }
    } catch (err) {
      console.error('Failed to fetch timestamps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimestamps();
  }, [flowContext.intelliflowId]);

  const handleSave = async () => {
    if (!formData.name) {
      setError('Timestamp name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const endpoint = editingId ? '/api/update-record' : '/api/create-record';
      
      // Combine start/end values into range format
      const recordData = {
        name: formData.name,
        time_range: `${formData.time_start}-${formData.time_end}`,
        weekday_range: `${formData.weekday_start}-${formData.weekday_end}`,
        monthday_range: `${formData.monthday_start}-${formData.monthday_end}`,
        month_range: `${formData.month_start}-${formData.month_end}`,
      };

      const payload = editingId 
        ? { table: 'yovo_tbl_ivr_timestamps', data: recordData, where: { id: editingId } }
        : { table: 'yovo_tbl_ivr_timestamps', data: { ...recordData, ivr_id: flowContext.intelliflowId || 0 } };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Auto-select the new timestamp
        if (!editingId && result.insertId) {
          onChange(String(result.insertId), formData.name);
        }
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({
          name: '',
          time_start: '00:00:00',
          time_end: '23:59:59',
          weekday_start: 'mon',
          weekday_end: 'sun',
          monthday_start: '1',
          monthday_end: '31',
          month_start: 'jan',
          month_end: 'dec',
        });
        fetchTimestamps();
      } else {
        setError(result.error || 'Failed to save timestamp');
      }
    } catch (err) {
      setError('Failed to save timestamp: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ts) => {
    setEditingId(ts.id);
    
    // Parse range columns back to start/end values
    const timeRange = parseRange(ts.time_range, '00:00:00', '23:59:59');
    const weekdayRange = parseRange(ts.weekday_range, 'mon', 'sun');
    const monthdayRange = parseRange(ts.monthday_range, '1', '31');
    const monthRange = parseRange(ts.month_range, 'jan', 'dec');
    
    setFormData({
      name: ts.name || '',
      time_start: timeRange.start,
      time_end: timeRange.end,
      weekday_start: weekdayRange.start,
      weekday_end: weekdayRange.end,
      monthday_start: monthdayRange.start,
      monthday_end: monthdayRange.end,
      month_start: monthRange.start,
      month_end: monthRange.end,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this timestamp?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/delete-record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'yovo_tbl_ivr_timestamps',
          where: { id }
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        fetchTimestamps();
        if (String(value) === String(id)) {
          onChange('');
          onLabelChange && onLabelChange('');
        }
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  // Helper to display time range nicely
  const getTimeDisplay = (ts) => {
    const timeRange = ts.time_range || '*';
    const weekdayRange = ts.weekday_range || '*';
    return `${timeRange} | ${weekdayRange}`;
  };

  return (
    <div>
      {/* Select existing timestamp */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <select
          value={String(value || '')}
          onChange={(e) => {
            const selected = timestamps.find(t => String(t.id) === e.target.value);
            const label = selected?.name || '';
            onChange(e.target.value, label);
          }}
          style={{ ...selectStyle, flex: 1 }}
        >
          <option value="">-- Select Timestamp --</option>
          {timestamps.map(ts => (
            <option key={ts.id} value={String(ts.id)}>
              {ts.name} ({ts.time_range || '*'})
            </option>
          ))}
        </select>
        <button
          onClick={() => fetchTimestamps()}
          style={{ ...buttonStyle, padding: '8px', background: '#f3f4f6', border: '1px solid #e5e7eb' }}
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Existing timestamps list */}
      {timestamps.length > 0 && (
        <div style={{ 
          marginBottom: '12px', 
          maxHeight: '150px', 
          overflowY: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
        }}>
          {timestamps.map(ts => (
            <div 
              key={ts.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: '1px solid #f3f4f6',
                fontSize: '12px',
                background: String(value) === String(ts.id) ? '#eff6ff' : 'transparent',
              }}
            >
              <div 
                style={{ flex: 1, cursor: 'pointer' }}
                onClick={() => {
                  onChange(String(ts.id), ts.name);
                }}
              >
                <div style={{ fontWeight: '500' }}>{ts.name}</div>
                <div style={{ color: '#6b7280', fontSize: '11px' }}>
                  {getTimeDisplay(ts)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(ts); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                  title="Edit"
                >
                  <Edit2 size={14} color="#6b7280" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(ts.id); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                  title="Delete"
                >
                  <Trash2 size={14} color="#ef4444" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create new button */}
      <button
        onClick={() => {
          setEditingId(null);
          setFormData({
            name: '',
            time_start: '00:00:00',
            time_end: '23:59:59',
            weekday_start: 'mon',
            weekday_end: 'sun',
            monthday_start: '1',
            monthday_end: '31',
            month_start: 'jan',
            month_end: 'dec',
          });
          setError(null);
          setIsModalOpen(true);
        }}
        style={{
          ...buttonStyle,
          background: '#8b5cf6',
          color: '#fff',
          border: 'none',
          width: '100%',
          justifyContent: 'center',
        }}
      >
        <Plus size={16} /> Create New Timestamp
      </button>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingId(null); setError(null); }}
        title={editingId ? 'Edit Timestamp' : 'Create Timestamp'}
        icon={Clock}
      >
        {error && (
          <div style={{ 
            background: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: '6px', 
            padding: '10px', 
            marginBottom: '16px',
            color: '#dc2626',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Timestamp Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Business Hours"
              style={inputStyle}
            />
          </div>

          {/* Time Range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Time Start (HH:MM:SS)</label>
              <input
                type="time"
                step="1"
                value={formData.time_start}
                onChange={(e) => setFormData({ ...formData, time_start: e.target.value || '00:00:00' })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Time End (HH:MM:SS)</label>
              <input
                type="time"
                step="1"
                value={formData.time_end}
                onChange={(e) => setFormData({ ...formData, time_end: e.target.value || '23:59:59' })}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Weekday Range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Weekday Start</label>
              <select
                value={formData.weekday_start}
                onChange={(e) => setFormData({ ...formData, weekday_start: e.target.value })}
                style={selectStyle}
              >
                {WEEKDAYS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Weekday End</label>
              <select
                value={formData.weekday_end}
                onChange={(e) => setFormData({ ...formData, weekday_end: e.target.value })}
                style={selectStyle}
              >
                {WEEKDAYS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthday Range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Monthday Start (1-31)</label>
              <select
                value={formData.monthday_start}
                onChange={(e) => setFormData({ ...formData, monthday_start: e.target.value })}
                style={selectStyle}
              >
                {MONTHDAYS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Monthday End (1-31)</label>
              <select
                value={formData.monthday_end}
                onChange={(e) => setFormData({ ...formData, monthday_end: e.target.value })}
                style={selectStyle}
              >
                {MONTHDAYS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Month Range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Month Start</label>
              <select
                value={formData.month_start}
                onChange={(e) => setFormData({ ...formData, month_start: e.target.value })}
                style={selectStyle}
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Month End</label>
              <select
                value={formData.month_end}
                onChange={(e) => setFormData({ ...formData, month_end: e.target.value })}
                style={selectStyle}
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => { setIsModalOpen(false); setEditingId(null); setError(null); }}
            style={{ ...buttonStyle, background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ ...buttonStyle, background: '#8b5cf6', color: '#fff', border: 'none', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? <Loader2 size={16} /> : <Save size={16} />}
            {saving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default {
  DatabasePropertyComponent,
  VariablesPropertyComponent,
  TimestampPropertyComponent,
};
