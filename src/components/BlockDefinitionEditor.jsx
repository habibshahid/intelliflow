import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Save, Download, Upload, Copy, ChevronDown, ChevronRight,
  ArrowUp, ArrowDown, AlertCircle, CheckCircle, X, Eye, EyeOff, Settings,
  Play, Database, Loader2, Table, Code
} from 'lucide-react';

// API URL for SQL testing
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Property type options
const PROPERTY_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Checkbox (Boolean)' },
  { value: 'select', label: 'Static Select' },
  { value: 'select_database', label: 'Database Select' },
];

// Category options
const CATEGORIES = [
  { value: 'intelliflow_globals', label: 'IntelliFlow Globals' },
  { value: 'call_control', label: 'Call Control' },
  { value: 'playback', label: 'Playback' },
  { value: 'functions', label: 'Functions' },
  { value: 'applications', label: 'Applications' },
  { value: 'chat_management', label: 'Chat Management' },
  { value: 'whatsapp_management', label: 'WhatsApp Management' },
  { value: 'ecommerce', label: 'eCommerce' },
  { value: 'cx9_apps', label: 'CX9 Apps' },
  { value: 'custom', label: 'Custom' },
];

// Output modes
const OUTPUT_MODES = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'dynamic', label: 'Dynamic (User can add)' },
];

// Common emoji icons
const COMMON_ICONS = [
  '📞', '🔊', '💬', '🎵', '📝', '🔀', '🌐', '⏹️', '▶️', '🔗',
  '📧', '💾', '⚙️', '🔔', '📱', '💳', '🛒', '👤', '🏢', '📊',
  '🤖', '🎯', '⏰', '📅', '🔒', '🔓', '✅', '❌', '⚠️', '💡',
];

// Default new block template
const NEW_BLOCK_TEMPLATE = {
  id: '',
  name: '',
  category: 'custom',
  icon: '📦',
  color: '#6366f1',
  inputs: { min: 1, max: 1, labels: ['input'] },
  outputs: { min: 1, max: 1, mode: 'fixed', labels: ['next'] },
  properties: [],
};

// Default new property template
const NEW_PROPERTY_TEMPLATE = {
  key: '',
  label: '',
  type: 'text',
  placeholder: '',
  required: false,
};

const BlockDefinitionEditor = ({ 
  initialDefinitions = null, 
  onSave = null,
  onClose = null 
}) => {
  const [blockTypes, setBlockTypes] = useState({});
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [editingBlock, setEditingBlock] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    inputs: true,
    outputs: true,
    properties: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // SQL Tester state
  const [showSqlTester, setShowSqlTester] = useState(false);
  const [sqlTesterQuery, setSqlTesterQuery] = useState('');
  const [sqlTesterValueField, setSqlTesterValueField] = useState('');
  const [sqlTesterLabelField, setSqlTesterLabelField] = useState('');
  const [sqlTesterPreviewField, setSqlTesterPreviewField] = useState('');
  const [sqlTesterResults, setSqlTesterResults] = useState(null);
  const [sqlTesterLoading, setSqlTesterLoading] = useState(false);
  const [sqlTesterError, setSqlTesterError] = useState(null);
  const [sqlTesterRawResults, setSqlTesterRawResults] = useState(null);
  const [sqlTesterShowRaw, setSqlTesterShowRaw] = useState(false);

  // Load initial definitions
  useEffect(() => {
    if (initialDefinitions) {
      setBlockTypes(initialDefinitions.blockTypes || {});
    }
  }, [initialDefinitions]);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // SQL Tester functions
  const openSqlTester = (query = '', valueField = '', labelField = '', previewField = '') => {
    setSqlTesterQuery(query || '');
    setSqlTesterValueField(valueField || '');
    setSqlTesterLabelField(labelField || '');
    setSqlTesterPreviewField(previewField || '');
    setSqlTesterResults(null);
    setSqlTesterRawResults(null);
    setSqlTesterError(null);
    setSqlTesterShowRaw(false);
    setShowSqlTester(true);
  };

  const executeSqlTest = async () => {
    if (!sqlTesterQuery.trim()) {
      setSqlTesterError('Please enter a SQL query');
      return;
    }

    setSqlTesterLoading(true);
    setSqlTesterError(null);
    setSqlTesterResults(null);
    setSqlTesterRawResults(null);

    try {
      // First try to get raw results
      const rawResponse = await fetch(`${API_BASE_URL}/api/query-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlTesterQuery }),
      });
      
      const rawData = await rawResponse.json();
      
      if (rawData.success) {
        setSqlTesterRawResults(rawData.rows);
      }

      // Then get formatted options if valueField and labelField are set
      if (sqlTesterValueField && sqlTesterLabelField) {
        const response = await fetch(`${API_BASE_URL}/api/select-options`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: sqlTesterQuery,
            valueField: sqlTesterValueField,
            labelField: sqlTesterLabelField,
            previewField: sqlTesterPreviewField || null,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to execute query');
        }

        setSqlTesterResults(data.options);
      } else if (!rawData.success) {
        throw new Error(rawData.error || 'Failed to execute query');
      }
    } catch (error) {
      setSqlTesterError(error.message);
    } finally {
      setSqlTesterLoading(false);
    }
  };

  const applySqlTesterToProperty = (propIndex) => {
    if (sqlTesterQuery) {
      updateProperty(propIndex, 'query', sqlTesterQuery);
    }
    if (sqlTesterValueField) {
      updateProperty(propIndex, 'valueField', sqlTesterValueField);
    }
    if (sqlTesterLabelField) {
      updateProperty(propIndex, 'labelField', sqlTesterLabelField);
    }
    if (sqlTesterPreviewField) {
      updateProperty(propIndex, 'previewField', sqlTesterPreviewField);
    }
    setShowSqlTester(false);
    showNotification('Query applied to property');
  };

  // Validate block
  const validateBlock = (block) => {
    const errors = [];
    
    if (!block.id) errors.push('Block ID is required');
    if (!block.name) errors.push('Block name is required');
    if (!/^[a-z][a-z0-9_]*$/.test(block.id)) {
      errors.push('Block ID must start with lowercase letter and contain only lowercase letters, numbers, and underscores');
    }
    
    if (block.inputs.max !== -1 && block.inputs.min > block.inputs.max) {
      errors.push('Inputs min cannot be greater than max');
    }
    if (block.outputs.max !== -1 && block.outputs.min > block.outputs.max) {
      errors.push('Outputs min cannot be greater than max');
    }
    
    block.properties.forEach((prop, idx) => {
      if (!prop.key) errors.push(`Property ${idx + 1}: Key is required`);
      if (!prop.label) errors.push(`Property ${idx + 1}: Label is required`);
      if (!/^[a-z][a-z0-9_]*$/.test(prop.key)) {
        errors.push(`Property ${idx + 1}: Key must be lowercase with underscores`);
      }
    });
    
    return errors;
  };

  // Select block for editing
  const handleSelectBlock = (blockId) => {
    if (hasChanges && editingBlock) {
      if (!confirm('You have unsaved changes. Discard them?')) {
        return;
      }
    }
    setSelectedBlockId(blockId);
    setEditingBlock(JSON.parse(JSON.stringify(blockTypes[blockId])));
    setValidationErrors([]);
    setHasChanges(false);
  };

  // Create new block
  const handleCreateBlock = () => {
    const newBlock = { ...NEW_BLOCK_TEMPLATE };
    const timestamp = Date.now();
    newBlock.id = `new_block_${timestamp}`;
    newBlock.name = 'New Block';
    
    setEditingBlock(newBlock);
    setSelectedBlockId(null);
    setValidationErrors([]);
    setHasChanges(true);
  };

  // Duplicate block
  const handleDuplicateBlock = (blockId) => {
    const original = blockTypes[blockId];
    const newBlock = JSON.parse(JSON.stringify(original));
    newBlock.id = `${original.id}_copy`;
    newBlock.name = `${original.name} (Copy)`;
    
    setEditingBlock(newBlock);
    setSelectedBlockId(null);
    setValidationErrors([]);
    setHasChanges(true);
  };

  // Save block
  const handleSaveBlock = () => {
    const errors = validateBlock(editingBlock);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    // Check for ID collision (if creating new or changing ID)
    if (editingBlock.id !== selectedBlockId && blockTypes[editingBlock.id]) {
      setValidationErrors([`Block ID "${editingBlock.id}" already exists`]);
      return;
    }
    
    const newBlockTypes = { ...blockTypes };
    
    // If ID changed, remove old entry
    if (selectedBlockId && selectedBlockId !== editingBlock.id) {
      delete newBlockTypes[selectedBlockId];
    }
    
    newBlockTypes[editingBlock.id] = editingBlock;
    setBlockTypes(newBlockTypes);
    setSelectedBlockId(editingBlock.id);
    setHasChanges(false);
    setValidationErrors([]);
    showNotification('Block saved successfully!');
  };

  // Delete block
  const handleDeleteBlock = (blockId) => {
    if (!confirm(`Are you sure you want to delete "${blockTypes[blockId].name}"?`)) {
      return;
    }
    
    const newBlockTypes = { ...blockTypes };
    delete newBlockTypes[blockId];
    setBlockTypes(newBlockTypes);
    
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
      setEditingBlock(null);
    }
    showNotification('Block deleted');
  };

  // Update editing block field
  const updateField = (path, value) => {
    setEditingBlock(prev => {
      const updated = { ...prev };
      const parts = path.split('.');
      let current = updated;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (Array.isArray(current[parts[i]])) {
          current[parts[i]] = [...current[parts[i]]];
        } else {
          current[parts[i]] = { ...current[parts[i]] };
        }
        current = current[parts[i]];
      }
      
      current[parts[parts.length - 1]] = value;
      return updated;
    });
    setHasChanges(true);
  };

  // Add property
  const addProperty = () => {
    const newProp = { ...NEW_PROPERTY_TEMPLATE };
    newProp.key = `property_${editingBlock.properties.length + 1}`;
    newProp.label = `Property ${editingBlock.properties.length + 1}`;
    
    setEditingBlock(prev => ({
      ...prev,
      properties: [...prev.properties, newProp]
    }));
    setHasChanges(true);
  };

  // Remove property
  const removeProperty = (index) => {
    setEditingBlock(prev => ({
      ...prev,
      properties: prev.properties.filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };

  // Move property up/down
  const moveProperty = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= editingBlock.properties.length) return;
    
    setEditingBlock(prev => {
      const newProps = [...prev.properties];
      [newProps[index], newProps[newIndex]] = [newProps[newIndex], newProps[index]];
      return { ...prev, properties: newProps };
    });
    setHasChanges(true);
  };

  // Update property
  const updateProperty = (index, field, value) => {
    setEditingBlock(prev => {
      const newProps = [...prev.properties];
      newProps[index] = { ...newProps[index], [field]: value };
      return { ...prev, properties: newProps };
    });
    setHasChanges(true);
  };

  // Export to JSON
  const handleExport = () => {
    const exportData = {
      blockTypes,
      systemVariables: initialDefinitions?.systemVariables || [],
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blockDefinitions.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Exported blockDefinitions.json');
  };

  // Import from JSON
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.blockTypes) {
            setBlockTypes(data.blockTypes);
            setSelectedBlockId(null);
            setEditingBlock(null);
            showNotification(`Imported ${Object.keys(data.blockTypes).length} blocks`);
          } else {
            throw new Error('Invalid format');
          }
        } catch (err) {
          showNotification('Failed to import: ' + err.message, 'error');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };

  // Filter blocks by search
  const filteredBlocks = Object.entries(blockTypes).filter(([id, block]) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      block.name.toLowerCase().includes(term) ||
      block.id.toLowerCase().includes(term) ||
      block.category.toLowerCase().includes(term)
    );
  });

  // Group filtered blocks by category
  const groupedBlocks = filteredBlocks.reduce((acc, [id, block]) => {
    if (!acc[block.category]) acc[block.category] = [];
    acc[block.category].push([id, block]);
    return acc;
  }, {});

  // Toggle section
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Styles
  const styles = {
    container: {
      display: 'flex',
      height: '100vh',
      background: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    sidebar: {
      width: '320px',
      background: '#fff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
    },
    sidebarHeader: {
      padding: '16px',
      borderBottom: '1px solid #e5e7eb',
    },
    searchInput: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '13px',
      outline: 'none',
    },
    blockList: {
      flex: 1,
      overflowY: 'auto',
      padding: '8px',
    },
    blockItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 12px',
      borderRadius: '8px',
      cursor: 'pointer',
      marginBottom: '4px',
      border: '1px solid transparent',
      transition: 'all 0.15s ease',
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 20px',
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
    },
    editor: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px',
    },
    section: {
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      marginBottom: '16px',
      overflow: 'hidden',
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px',
      background: '#f9fafb',
      borderBottom: '1px solid #e5e7eb',
      cursor: 'pointer',
    },
    sectionContent: {
      padding: '16px',
    },
    formGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '6px',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box',
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      background: '#fff',
      cursor: 'pointer',
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      border: 'none',
      transition: 'all 0.15s ease',
    },
    primaryButton: {
      background: '#3b82f6',
      color: '#fff',
    },
    secondaryButton: {
      background: '#f3f4f6',
      color: '#374151',
      border: '1px solid #e5e7eb',
    },
    dangerButton: {
      background: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca',
    },
    propertyCard: {
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '14px',
      marginBottom: '12px',
    },
    iconPicker: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      marginTop: '8px',
    },
    iconOption: {
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      cursor: 'pointer',
      background: '#fff',
    },
    notification: {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
  };

  return (
    <div style={styles.container}>
      {/* Notification */}
      {notification && (
        <div style={{
          ...styles.notification,
          background: notification.type === 'error' ? '#fef2f2' : '#ecfdf5',
          color: notification.type === 'error' ? '#dc2626' : '#059669',
          border: `1px solid ${notification.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
        }}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {notification.message}
        </div>
      )}

      {/* SQL Tester Modal */}
      {showSqlTester && (
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
            maxWidth: '1000px',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={22} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>SQL Query Tester</h3>
              </div>
              <button
                onClick={() => setShowSqlTester(false)}
                style={{ ...styles.button, padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {/* Query Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ ...styles.label, fontSize: '13px' }}>SQL Query</label>
                <textarea
                  value={sqlTesterQuery}
                  onChange={(e) => setSqlTesterQuery(e.target.value)}
                  placeholder="SELECT id, name FROM your_table WHERE status = 1"
                  rows={5}
                  style={{
                    ...styles.input,
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Field Configuration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ ...styles.label, fontSize: '13px' }}>Value Field</label>
                  <input
                    type="text"
                    value={sqlTesterValueField}
                    onChange={(e) => setSqlTesterValueField(e.target.value)}
                    placeholder="id"
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={{ ...styles.label, fontSize: '13px' }}>Label Field</label>
                  <input
                    type="text"
                    value={sqlTesterLabelField}
                    onChange={(e) => setSqlTesterLabelField(e.target.value)}
                    placeholder="name"
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={{ ...styles.label, fontSize: '13px' }}>Preview Field (optional)</label>
                  <input
                    type="text"
                    value={sqlTesterPreviewField}
                    onChange={(e) => setSqlTesterPreviewField(e.target.value)}
                    placeholder="file_path"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Execute Button */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <button
                  onClick={executeSqlTest}
                  disabled={sqlTesterLoading}
                  style={{
                    ...styles.button,
                    ...styles.primaryButton,
                    opacity: sqlTesterLoading ? 0.7 : 1,
                  }}
                >
                  {sqlTesterLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play size={16} /> Execute Query
                    </>
                  )}
                </button>
                
                {(sqlTesterResults || sqlTesterRawResults) && (
                  <button
                    onClick={() => setSqlTesterShowRaw(!sqlTesterShowRaw)}
                    style={{ ...styles.button, ...styles.secondaryButton }}
                  >
                    {sqlTesterShowRaw ? <Table size={16} /> : <Code size={16} />}
                    {sqlTesterShowRaw ? 'Show Formatted' : 'Show Raw Data'}
                  </button>
                )}
              </div>

              {/* Error Display */}
              {sqlTesterError && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <AlertCircle size={18} color="#dc2626" />
                  <span style={{ color: '#991b1b', fontSize: '13px' }}>{sqlTesterError}</span>
                </div>
              )}

              {/* Results Display */}
              {!sqlTesterShowRaw && sqlTesterResults && (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '12px' 
                  }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                      Formatted Options ({sqlTesterResults.length} rows)
                    </h4>
                  </div>
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Value</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Label</th>
                          {sqlTesterPreviewField && (
                            <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Preview</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {sqlTesterResults.slice(0, 50).map((option, idx) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6' }}>{option.value}</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6' }}>{option.label}</td>
                            {sqlTesterPreviewField && (
                              <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6' }}>
                                {option.preview || '-'}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {sqlTesterResults.length > 50 && (
                      <div style={{ padding: '10px', textAlign: 'center', background: '#f9fafb', color: '#6b7280', fontSize: '12px' }}>
                        Showing 50 of {sqlTesterResults.length} rows
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Raw Results Display */}
              {sqlTesterShowRaw && sqlTesterRawResults && (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '12px' 
                  }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                      Raw Query Results ({sqlTesterRawResults.length} rows)
                    </h4>
                  </div>
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    overflow: 'auto',
                    maxHeight: '400px',
                  }}>
                    {sqlTesterRawResults.length > 0 && (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                            {Object.keys(sqlTesterRawResults[0]).map((key) => (
                              <th key={key} style={{ 
                                padding: '10px 12px', 
                                textAlign: 'left', 
                                borderBottom: '1px solid #e5e7eb', 
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                              }}>
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sqlTesterRawResults.slice(0, 100).map((row, idx) => (
                            <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                              {Object.values(row).map((value, vIdx) => (
                                <td key={vIdx} style={{ 
                                  padding: '8px 12px', 
                                  borderBottom: '1px solid #f3f4f6',
                                  maxWidth: '300px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {value === null ? <span style={{ color: '#9ca3af' }}>NULL</span> : String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {sqlTesterRawResults.length > 100 && (
                      <div style={{ padding: '10px', textAlign: 'center', background: '#f9fafb', color: '#6b7280', fontSize: '12px' }}>
                        Showing 100 of {sqlTesterRawResults.length} rows
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No results yet */}
              {!sqlTesterResults && !sqlTesterRawResults && !sqlTesterError && !sqlTesterLoading && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#6b7280',
                }}>
                  <Database size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <div>Enter a SQL query and click Execute to test</div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              background: '#f8fafc',
            }}>
              <button
                onClick={() => setShowSqlTester(false)}
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - Block List */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '700' }}>
            Block Definitions
          </h2>
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <button
            onClick={handleCreateBlock}
            style={{ ...styles.button, ...styles.primaryButton, width: '100%', marginTop: '12px', justifyContent: 'center' }}
          >
            <Plus size={16} /> New Block
          </button>
        </div>
        
        <div style={styles.blockList}>
          {Object.entries(groupedBlocks).map(([category, blocks]) => (
            <div key={category} style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                color: '#6b7280',
                padding: '8px 12px',
                letterSpacing: '0.05em',
              }}>
                {CATEGORIES.find(c => c.value === category)?.label || category}
                <span style={{ marginLeft: '6px', color: '#9ca3af' }}>({blocks.length})</span>
              </div>
              
              {blocks.map(([id, block]) => (
                <div
                  key={id}
                  onClick={() => handleSelectBlock(id)}
                  style={{
                    ...styles.blockItem,
                    background: selectedBlockId === id ? '#eff6ff' : 'transparent',
                    borderColor: selectedBlockId === id ? '#3b82f6' : 'transparent',
                  }}
                >
                  <span style={{
                    fontSize: '18px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${block.color}20`,
                    borderRadius: '6px',
                  }}>
                    {block.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1f2937' }}>
                      {block.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      {block.id}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDuplicateBlock(id); }}
                    style={{ ...styles.button, padding: '4px', background: 'transparent' }}
                    title="Duplicate"
                  >
                    <Copy size={14} color="#6b7280" />
                  </button>
                </div>
              ))}
            </div>
          ))}
          
          {filteredBlocks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
              {searchTerm ? 'No blocks match your search' : 'No blocks defined yet'}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Toolbar */}
        <div style={styles.toolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} color="#6b7280" />
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
              {editingBlock ? (selectedBlockId ? 'Edit Block' : 'New Block') : 'Block Definition Editor'}
            </span>
            {hasChanges && (
              <span style={{
                fontSize: '11px',
                background: '#fef3c7',
                color: '#92400e',
                padding: '2px 8px',
                borderRadius: '10px',
              }}>
                Unsaved
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => openSqlTester()}
              style={{ ...styles.button, background: '#0284c7', color: '#fff' }}
              title="Open SQL Query Tester"
            >
              <Database size={16} /> SQL Tester
            </button>
            <button onClick={handleImport} style={{ ...styles.button, ...styles.secondaryButton }}>
              <Upload size={16} /> Import
            </button>
            <button onClick={handleExport} style={{ ...styles.button, ...styles.secondaryButton }}>
              <Download size={16} /> Export
            </button>
            {onSave && (
              <button 
                onClick={() => onSave({ blockTypes, systemVariables: initialDefinitions?.systemVariables || [] })}
                style={{ ...styles.button, ...styles.primaryButton }}
              >
                <Save size={16} /> Save All
              </button>
            )}
            {onClose && (
              <button onClick={onClose} style={{ ...styles.button, ...styles.secondaryButton }}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Editor */}
        <div style={styles.editor}>
          {editingBlock ? (
            <>
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <AlertCircle size={18} color="#dc2626" />
                    <span style={{ fontWeight: '600', color: '#dc2626' }}>Validation Errors</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '24px', color: '#991b1b', fontSize: '13px' }}>
                    {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              {/* Basic Info Section */}
              <div style={styles.section}>
                <div style={styles.sectionHeader} onClick={() => toggleSection('basic')}>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>Basic Information</span>
                  {expandedSections.basic ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
                {expandedSections.basic && (
                  <div style={styles.sectionContent}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Block ID *</label>
                        <input
                          type="text"
                          value={editingBlock.id}
                          onChange={(e) => updateField('id', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                          placeholder="e.g., app_my_block"
                          style={styles.input}
                        />
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                          Lowercase letters, numbers, underscores only
                        </div>
                      </div>
                      
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Display Name *</label>
                        <input
                          type="text"
                          value={editingBlock.name}
                          onChange={(e) => updateField('name', e.target.value)}
                          placeholder="e.g., My Custom Block"
                          style={styles.input}
                        />
                      </div>
                      
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Category</label>
                        <select
                          value={editingBlock.category}
                          onChange={(e) => updateField('category', e.target.value)}
                          style={styles.select}
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Color</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="color"
                            value={editingBlock.color}
                            onChange={(e) => updateField('color', e.target.value)}
                            style={{ width: '50px', height: '38px', padding: '2px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                          />
                          <input
                            type="text"
                            value={editingBlock.color}
                            onChange={(e) => updateField('color', e.target.value)}
                            style={{ ...styles.input, flex: 1 }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Icon</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '28px',
                          background: `${editingBlock.color}20`,
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                        }}>
                          {editingBlock.icon}
                        </div>
                        <input
                          type="text"
                          value={editingBlock.icon}
                          onChange={(e) => updateField('icon', e.target.value)}
                          placeholder="Paste emoji"
                          style={{ ...styles.input, width: '100px' }}
                        />
                      </div>
                      <div style={styles.iconPicker}>
                        {COMMON_ICONS.map(icon => (
                          <button
                            key={icon}
                            onClick={() => updateField('icon', icon)}
                            style={{
                              ...styles.iconOption,
                              borderColor: editingBlock.icon === icon ? '#3b82f6' : '#e5e7eb',
                              background: editingBlock.icon === icon ? '#eff6ff' : '#fff',
                            }}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Inputs Section */}
              <div style={styles.section}>
                <div style={styles.sectionHeader} onClick={() => toggleSection('inputs')}>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>Inputs Configuration</span>
                  {expandedSections.inputs ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
                {expandedSections.inputs && (
                  <div style={styles.sectionContent}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Minimum Inputs</label>
                        <input
                          type="number"
                          min="0"
                          value={editingBlock.inputs.min}
                          onChange={(e) => updateField('inputs.min', parseInt(e.target.value) || 0)}
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Maximum Inputs (-1 = unlimited)</label>
                        <input
                          type="number"
                          min="-1"
                          value={editingBlock.inputs.max}
                          onChange={(e) => updateField('inputs.max', parseInt(e.target.value) || 0)}
                          style={styles.input}
                        />
                      </div>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Input Labels (comma-separated)</label>
                      <input
                        type="text"
                        value={(editingBlock.inputs.labels || []).join(', ')}
                        onChange={(e) => updateField('inputs.labels', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        placeholder="e.g., input, trigger"
                        style={styles.input}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Outputs Section */}
              <div style={styles.section}>
                <div style={styles.sectionHeader} onClick={() => toggleSection('outputs')}>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>Outputs Configuration</span>
                  {expandedSections.outputs ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
                {expandedSections.outputs && (
                  <div style={styles.sectionContent}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Minimum Outputs</label>
                        <input
                          type="number"
                          min="0"
                          value={editingBlock.outputs.min}
                          onChange={(e) => updateField('outputs.min', parseInt(e.target.value) || 0)}
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Maximum Outputs (-1 = unlimited)</label>
                        <input
                          type="number"
                          min="-1"
                          value={editingBlock.outputs.max}
                          onChange={(e) => updateField('outputs.max', parseInt(e.target.value) || 0)}
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Output Mode</label>
                        <select
                          value={editingBlock.outputs.mode || 'fixed'}
                          onChange={(e) => updateField('outputs.mode', e.target.value)}
                          style={styles.select}
                        >
                          {OUTPUT_MODES.map(mode => (
                            <option key={mode.value} value={mode.value}>{mode.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Output Labels (comma-separated)</label>
                      <input
                        type="text"
                        value={(editingBlock.outputs.labels || []).join(', ')}
                        onChange={(e) => updateField('outputs.labels', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        placeholder="e.g., success, error"
                        style={styles.input}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Properties Section */}
              <div style={styles.section}>
                <div style={styles.sectionHeader} onClick={() => toggleSection('properties')}>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>
                    Properties ({editingBlock.properties.length})
                  </span>
                  {expandedSections.properties ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
                {expandedSections.properties && (
                  <div style={styles.sectionContent}>
                    {editingBlock.properties.map((prop, index) => (
                      <div key={index} style={styles.propertyCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>
                            Property {index + 1}: {prop.label || '(unnamed)'}
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => moveProperty(index, -1)}
                              disabled={index === 0}
                              style={{ ...styles.button, padding: '4px', opacity: index === 0 ? 0.5 : 1 }}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              onClick={() => moveProperty(index, 1)}
                              disabled={index === editingBlock.properties.length - 1}
                              style={{ ...styles.button, padding: '4px', opacity: index === editingBlock.properties.length - 1 ? 0.5 : 1 }}
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              onClick={() => removeProperty(index)}
                              style={{ ...styles.button, ...styles.dangerButton, padding: '4px' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ ...styles.label, fontSize: '12px' }}>Key *</label>
                            <input
                              type="text"
                              value={prop.key}
                              onChange={(e) => updateProperty(index, 'key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                              style={{ ...styles.input, fontSize: '13px', padding: '8px 10px' }}
                            />
                          </div>
                          <div>
                            <label style={{ ...styles.label, fontSize: '12px' }}>Label *</label>
                            <input
                              type="text"
                              value={prop.label}
                              onChange={(e) => updateProperty(index, 'label', e.target.value)}
                              style={{ ...styles.input, fontSize: '13px', padding: '8px 10px' }}
                            />
                          </div>
                          <div>
                            <label style={{ ...styles.label, fontSize: '12px' }}>Type</label>
                            <select
                              value={prop.type}
                              onChange={(e) => updateProperty(index, 'type', e.target.value)}
                              style={{ ...styles.select, fontSize: '13px', padding: '8px 10px' }}
                            >
                              {PROPERTY_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                          <div>
                            <label style={{ ...styles.label, fontSize: '12px' }}>Placeholder</label>
                            <input
                              type="text"
                              value={prop.placeholder || ''}
                              onChange={(e) => updateProperty(index, 'placeholder', e.target.value)}
                              style={{ ...styles.input, fontSize: '13px', padding: '8px 10px' }}
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', paddingBottom: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={prop.required || false}
                                onChange={(e) => updateProperty(index, 'required', e.target.checked)}
                              />
                              <span style={{ fontSize: '13px' }}>Required</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={prop.showPredefinedVariables || false}
                                onChange={(e) => updateProperty(index, 'showPredefinedVariables', e.target.checked)}
                              />
                              <span style={{ fontSize: '13px' }}>Show Variables</span>
                            </label>
                          </div>
                        </div>
                        
                        {/* Type-specific fields */}
                        {prop.type === 'select' && (
                          <div style={{ marginTop: '12px' }}>
                            <label style={{ ...styles.label, fontSize: '12px' }}>Options (one per line: value|label)</label>
                            <textarea
                              value={(prop.options || []).map(o => typeof o === 'object' ? `${o.value}|${o.label}` : o).join('\n')}
                              onChange={(e) => {
                                const lines = e.target.value.split('\n');
                                const options = lines.map(line => {
                                  const [value, label] = line.split('|');
                                  return label ? { value: value.trim(), label: label.trim() } : { value: line.trim(), label: line.trim() };
                                }).filter(o => o.value);
                                updateProperty(index, 'options', options);
                              }}
                              placeholder="value1|Label 1&#10;value2|Label 2"
                              rows={4}
                              style={{ ...styles.input, fontSize: '12px', fontFamily: 'monospace' }}
                            />
                          </div>
                        )}
                        
                        {prop.type === 'select_database' && (
                          <div style={{ marginTop: '12px', display: 'grid', gap: '12px', background: '#f0f9ff', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Database size={16} color="#0284c7" />
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#0284c7' }}>Database Query Configuration</span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Toggle between simple and groups mode
                                    if (prop.groups && prop.groups.length > 0) {
                                      // Convert first group to simple mode
                                      const firstGroup = prop.groups[0];
                                      updateProperty(index, 'query', firstGroup.query || '');
                                      updateProperty(index, 'valueField', firstGroup.valueField || '');
                                      updateProperty(index, 'labelField', firstGroup.labelField || '');
                                      updateProperty(index, 'previewField', firstGroup.previewField || '');
                                      updateProperty(index, 'groups', undefined);
                                    } else {
                                      // Convert to groups mode
                                      const newGroup = {
                                        label: 'Group 1',
                                        query: prop.query || '',
                                        valueField: prop.valueField || '',
                                        labelField: prop.labelField || '',
                                        previewField: prop.previewField || '',
                                      };
                                      updateProperty(index, 'groups', [newGroup]);
                                      updateProperty(index, 'query', undefined);
                                      updateProperty(index, 'valueField', undefined);
                                      updateProperty(index, 'labelField', undefined);
                                      updateProperty(index, 'previewField', undefined);
                                    }
                                  }}
                                  style={{
                                    ...styles.button,
                                    background: prop.groups ? '#7c3aed' : '#e5e7eb',
                                    color: prop.groups ? '#fff' : '#374151',
                                    padding: '4px 10px',
                                    fontSize: '11px',
                                  }}
                                >
                                  {prop.groups ? '📑 Groups Mode' : '📄 Simple Mode'}
                                </button>
                              </div>
                            </div>

                            {/* Simple Mode - Single Query */}
                            {!prop.groups && (
                              <>
                                <div>
                                  <label style={{ ...styles.label, fontSize: '12px' }}>SQL Query</label>
                                  <textarea
                                    value={prop.query || ''}
                                    onChange={(e) => updateProperty(index, 'query', e.target.value)}
                                    placeholder="SELECT id, name FROM table WHERE status = 1"
                                    rows={4}
                                    style={{ ...styles.input, fontSize: '12px', fontFamily: 'monospace', background: '#fff' }}
                                  />
                                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                                    Use {'{{param}}'} for URL parameters, {'{{field}}'} for parent values, {'{{field.column}}'} for parent columns
                                  </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                  <div>
                                    <label style={{ ...styles.label, fontSize: '12px' }}>Value Field *</label>
                                    <input
                                      type="text"
                                      value={prop.valueField || ''}
                                      onChange={(e) => updateProperty(index, 'valueField', e.target.value)}
                                      placeholder="id"
                                      style={{ ...styles.input, fontSize: '13px', padding: '8px 10px', background: '#fff' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ ...styles.label, fontSize: '12px' }}>Label Field *</label>
                                    <input
                                      type="text"
                                      value={prop.labelField || ''}
                                      onChange={(e) => updateProperty(index, 'labelField', e.target.value)}
                                      placeholder="name"
                                      style={{ ...styles.input, fontSize: '13px', padding: '8px 10px', background: '#fff' }}
                                    />
                                  </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                  <div>
                                    <label style={{ ...styles.label, fontSize: '12px' }}>Preview Field (optional)</label>
                                    <input
                                      type="text"
                                      value={prop.previewField || ''}
                                      onChange={(e) => updateProperty(index, 'previewField', e.target.value)}
                                      placeholder="file_url"
                                      style={{ ...styles.input, fontSize: '13px', padding: '8px 10px', background: '#fff' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ ...styles.label, fontSize: '12px' }}>Depends On (parent field)</label>
                                    <input
                                      type="text"
                                      value={prop.dependsOn || ''}
                                      onChange={(e) => updateProperty(index, 'dependsOn', e.target.value)}
                                      placeholder="parent_field_key"
                                      style={{ ...styles.input, fontSize: '13px', padding: '8px 10px', background: '#fff' }}
                                    />
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={prop.searchable || false}
                                      onChange={(e) => updateProperty(index, 'searchable', e.target.checked)}
                                    />
                                    <span style={{ fontSize: '13px' }}>Searchable</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => openSqlTester(prop.query, prop.valueField, prop.labelField, prop.previewField)}
                                    style={{
                                      ...styles.button,
                                      background: '#0284c7',
                                      color: '#fff',
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                    }}
                                  >
                                    <Play size={14} /> Test Query
                                  </button>
                                </div>
                              </>
                            )}

                            {/* Groups Mode - Multiple Option Groups */}
                            {prop.groups && (
                              <>
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                                  Groups mode allows multiple option groups (optgroups) in one dropdown. Each group has its own query.
                                </div>
                                
                                {/* Render each group */}
                                {prop.groups.map((group, groupIdx) => (
                                  <div 
                                    key={groupIdx} 
                                    style={{ 
                                      background: '#fff', 
                                      border: '1px solid #e0e7ff', 
                                      borderRadius: '8px', 
                                      padding: '12px',
                                      position: 'relative',
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#4f46e5' }}>
                                        Group {groupIdx + 1}: {group.label || '(unnamed)'}
                                      </span>
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                          type="button"
                                          onClick={() => openSqlTester(group.query, group.valueField, group.labelField, group.previewField)}
                                          style={{ ...styles.button, padding: '4px 8px', fontSize: '11px', background: '#0284c7', color: '#fff' }}
                                          title="Test this group's query"
                                        >
                                          <Play size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newGroups = prop.groups.filter((_, i) => i !== groupIdx);
                                            updateProperty(index, 'groups', newGroups.length > 0 ? newGroups : undefined);
                                            if (newGroups.length === 0) {
                                              // Switch back to simple mode
                                              updateProperty(index, 'query', group.query || '');
                                              updateProperty(index, 'valueField', group.valueField || '');
                                              updateProperty(index, 'labelField', group.labelField || '');
                                            }
                                          }}
                                          style={{ ...styles.button, ...styles.dangerButton, padding: '4px 8px', fontSize: '11px' }}
                                          title="Remove group"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                      <div>
                                        <label style={{ ...styles.label, fontSize: '11px' }}>Group Label</label>
                                        <input
                                          type="text"
                                          value={group.label || ''}
                                          onChange={(e) => {
                                            const newGroups = [...prop.groups];
                                            newGroups[groupIdx] = { ...newGroups[groupIdx], label: e.target.value };
                                            updateProperty(index, 'groups', newGroups);
                                          }}
                                          placeholder="e.g., Audio Files"
                                          style={{ ...styles.input, fontSize: '12px', padding: '6px 8px' }}
                                        />
                                      </div>
                                      
                                      <div>
                                        <label style={{ ...styles.label, fontSize: '11px' }}>SQL Query</label>
                                        <textarea
                                          value={group.query || ''}
                                          onChange={(e) => {
                                            const newGroups = [...prop.groups];
                                            newGroups[groupIdx] = { ...newGroups[groupIdx], query: e.target.value };
                                            updateProperty(index, 'groups', newGroups);
                                          }}
                                          placeholder="SELECT id, name FROM table"
                                          rows={3}
                                          style={{ ...styles.input, fontSize: '11px', fontFamily: 'monospace', padding: '6px 8px' }}
                                        />
                                      </div>
                                      
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div>
                                          <label style={{ ...styles.label, fontSize: '11px' }}>Value Field</label>
                                          <input
                                            type="text"
                                            value={group.valueField || ''}
                                            onChange={(e) => {
                                              const newGroups = [...prop.groups];
                                              newGroups[groupIdx] = { ...newGroups[groupIdx], valueField: e.target.value };
                                              updateProperty(index, 'groups', newGroups);
                                            }}
                                            placeholder="id"
                                            style={{ ...styles.input, fontSize: '12px', padding: '6px 8px' }}
                                          />
                                        </div>
                                        <div>
                                          <label style={{ ...styles.label, fontSize: '11px' }}>Label Field</label>
                                          <input
                                            type="text"
                                            value={group.labelField || ''}
                                            onChange={(e) => {
                                              const newGroups = [...prop.groups];
                                              newGroups[groupIdx] = { ...newGroups[groupIdx], labelField: e.target.value };
                                              updateProperty(index, 'groups', newGroups);
                                            }}
                                            placeholder="name"
                                            style={{ ...styles.input, fontSize: '12px', padding: '6px 8px' }}
                                          />
                                        </div>
                                      </div>
                                      
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div>
                                          <label style={{ ...styles.label, fontSize: '11px' }}>Preview Field (optional)</label>
                                          <input
                                            type="text"
                                            value={group.previewField || ''}
                                            onChange={(e) => {
                                              const newGroups = [...prop.groups];
                                              newGroups[groupIdx] = { ...newGroups[groupIdx], previewField: e.target.value };
                                              updateProperty(index, 'groups', newGroups);
                                            }}
                                            placeholder="file_url"
                                            style={{ ...styles.input, fontSize: '12px', padding: '6px 8px' }}
                                          />
                                        </div>
                                        <div>
                                          <label style={{ ...styles.label, fontSize: '11px' }}>Property Type (optional)</label>
                                          <select
                                            value={group.propertyType || ''}
                                            onChange={(e) => {
                                              const newGroups = [...prop.groups];
                                              newGroups[groupIdx] = { ...newGroups[groupIdx], propertyType: e.target.value || undefined };
                                              updateProperty(index, 'groups', newGroups);
                                            }}
                                            style={{ ...styles.select, fontSize: '12px', padding: '6px 8px' }}
                                          >
                                            <option value="">None</option>
                                            <option value="media_audio">Media Audio (🔊 preview)</option>
                                            <option value="media_image">Media Image (🖼️ preview)</option>
                                            <option value="media_video">Media Video (🎬 preview)</option>
                                          </select>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                
                                {/* Add Group Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newGroups = [...(prop.groups || []), {
                                      label: `Group ${(prop.groups?.length || 0) + 1}`,
                                      query: '',
                                      valueField: '',
                                      labelField: '',
                                    }];
                                    updateProperty(index, 'groups', newGroups);
                                  }}
                                  style={{
                                    ...styles.button,
                                    ...styles.secondaryButton,
                                    width: '100%',
                                    justifyContent: 'center',
                                    padding: '8px',
                                    fontSize: '12px',
                                  }}
                                >
                                  <Plus size={14} /> Add Option Group
                                </button>
                                
                                {/* Common settings for groups */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #e0e7ff' }}>
                                  <div>
                                    <label style={{ ...styles.label, fontSize: '12px' }}>Depends On (parent field)</label>
                                    <input
                                      type="text"
                                      value={prop.dependsOn || ''}
                                      onChange={(e) => updateProperty(index, 'dependsOn', e.target.value)}
                                      placeholder="parent_field_key"
                                      style={{ ...styles.input, fontSize: '13px', padding: '8px 10px', background: '#fff' }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '8px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                      <input
                                        type="checkbox"
                                        checked={prop.searchable || false}
                                        onChange={(e) => updateProperty(index, 'searchable', e.target.checked)}
                                      />
                                      <span style={{ fontSize: '13px' }}>Searchable</span>
                                    </label>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        
                        {prop.type === 'number' && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginTop: '12px' }}>
                            <div>
                              <label style={{ ...styles.label, fontSize: '12px' }}>Min</label>
                              <input
                                type="number"
                                value={prop.min ?? ''}
                                onChange={(e) => updateProperty(index, 'min', e.target.value ? parseFloat(e.target.value) : undefined)}
                                style={{ ...styles.input, fontSize: '13px', padding: '8px 10px' }}
                              />
                            </div>
                            <div>
                              <label style={{ ...styles.label, fontSize: '12px' }}>Max</label>
                              <input
                                type="number"
                                value={prop.max ?? ''}
                                onChange={(e) => updateProperty(index, 'max', e.target.value ? parseFloat(e.target.value) : undefined)}
                                style={{ ...styles.input, fontSize: '13px', padding: '8px 10px' }}
                              />
                            </div>
                            <div>
                              <label style={{ ...styles.label, fontSize: '12px' }}>Step</label>
                              <input
                                type="number"
                                value={prop.step ?? ''}
                                onChange={(e) => updateProperty(index, 'step', e.target.value ? parseFloat(e.target.value) : undefined)}
                                style={{ ...styles.input, fontSize: '13px', padding: '8px 10px' }}
                              />
                            </div>
                            <div>
                              <label style={{ ...styles.label, fontSize: '12px' }}>Default</label>
                              <input
                                type="number"
                                value={prop.default ?? ''}
                                onChange={(e) => updateProperty(index, 'default', e.target.value ? parseFloat(e.target.value) : undefined)}
                                style={{ ...styles.input, fontSize: '13px', padding: '8px 10px' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <button
                      onClick={addProperty}
                      style={{ ...styles.button, ...styles.secondaryButton, width: '100%', justifyContent: 'center' }}
                    >
                      <Plus size={16} /> Add Property
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingBottom: '40px' }}>
                {selectedBlockId && (
                  <button
                    onClick={() => handleDeleteBlock(selectedBlockId)}
                    style={{ ...styles.button, ...styles.dangerButton }}
                  >
                    <Trash2 size={16} /> Delete Block
                  </button>
                )}
                <button
                  onClick={() => setShowJsonPreview(!showJsonPreview)}
                  style={{ ...styles.button, ...styles.secondaryButton }}
                >
                  {showJsonPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showJsonPreview ? 'Hide' : 'Preview'} JSON
                </button>
                <button
                  onClick={handleSaveBlock}
                  disabled={!hasChanges}
                  style={{
                    ...styles.button,
                    ...styles.primaryButton,
                    opacity: hasChanges ? 1 : 0.5,
                    cursor: hasChanges ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Save size={16} /> Save Block
                </button>
              </div>
              
              {/* JSON Preview */}
              {showJsonPreview && (
                <div style={{
                  background: '#1e293b',
                  color: '#e2e8f0',
                  padding: '16px',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '400px',
                  marginBottom: '40px',
                }}>
                  <pre style={{ margin: 0 }}>
                    {JSON.stringify(editingBlock, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#6b7280',
            }}>
              <Settings size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                Block Definition Editor
              </div>
              <div style={{ fontSize: '14px', marginBottom: '24px' }}>
                Select a block to edit or create a new one
              </div>
              <button
                onClick={handleCreateBlock}
                style={{ ...styles.button, ...styles.primaryButton }}
              >
                <Plus size={16} /> Create New Block
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockDefinitionEditor;
