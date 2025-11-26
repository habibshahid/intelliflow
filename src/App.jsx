import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode from './components/CustomNode';
import CustomEdge from './components/CustomEdge';
import Sidebar from './components/Sidebar';
import PropertyPanel from './components/PropertyPanel';
import Toolbar from './components/Toolbar';
import blockDefinitions from './blockDefinitions.json';

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

let nodeId = 1;

// Extract ALL URL parameters for flow context
const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  const context = {};
  
  // Capture ALL URL parameters
  for (const [key, value] of params.entries()) {
    context[key] = value;
  }
  
  return context;
};

function FlowCanvas() {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // Flow context from URL parameters
  const flowContext = useMemo(() => getUrlParams(), []);

  const blockTypes = blockDefinitions.blockTypes;

  // Listen for edge delete events from CustomEdge
  useEffect(() => {
    const handleDeleteEdge = (event) => {
      const { edgeId } = event.detail;
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    };

    window.addEventListener('deleteEdge', handleDeleteEdge);
    return () => {
      window.removeEventListener('deleteEdge', handleDeleteEdge);
    };
  }, [setEdges]);

  // Handle connection validation
  const isValidConnection = useCallback((connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    if (!sourceNode || !targetNode) return false;

    const sourceBlockDef = sourceNode.data?.blockDef;
    const targetBlockDef = targetNode.data?.blockDef;
    
    if (!sourceBlockDef || !targetBlockDef) return false;

    const sourceConnections = edges.filter(e => 
      e.source === connection.source && e.sourceHandle === connection.sourceHandle
    ).length;
    
    const targetConnections = edges.filter(e => 
      e.target === connection.target && e.targetHandle === connection.targetHandle
    ).length;

    if (sourceBlockDef.outputs.max !== -1 && sourceConnections >= sourceBlockDef.outputs.max) return false;
    if (targetBlockDef.inputs.max !== -1 && targetConnections >= targetBlockDef.inputs.max) return false;

    return true;
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params) => {
      if (isValidConnection(params)) {
        setEdges((eds) => addEdge({
          ...params,
          type: 'custom',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#94a3b8',
          },
        }, eds));
      }
    },
    [isValidConnection, setEdges]
  );

  // Handle drag and drop
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const blockDef = blockTypes[type];
      if (!blockDef) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Initialize outputLabels for dynamic output blocks
      const outputLabels = blockDef.outputs.mode === 'dynamic'
        ? [...(blockDef.outputs.labels || [])]
        : undefined;

      const newNode = {
        id: `node-${nodeId++}`,
        type: 'custom',
        position,
        data: { 
          blockDef,
          properties: {},
          ...(outputLabels && { outputLabels })
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, blockTypes, setNodes]
  );

  // Node selection
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Update node properties
  const onUpdateNode = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: newData };
        }
        return node;
      })
    );
    setSelectedNode(prev => {
      if (prev && prev.id === nodeId) {
        return { ...prev, data: newData };
      }
      return prev;
    });
  }, [setNodes]);

  // Delete node
  const onDeleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  // Clone node
  const onCloneNode = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const newNode = {
      ...node,
      id: `node-${nodeId++}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      data: {
        ...node.data,
        properties: { ...node.data.properties },
        ...(node.data.outputLabels && { outputLabels: [...node.data.outputLabels] }),
        ...(node.data.enabledOutputs && { enabledOutputs: [...node.data.enabledOutputs] })
      }
    };

    setNodes((nds) => nds.concat(newNode));
  }, [nodes, setNodes]);

  // Export to JSON
  const onExport = useCallback(() => {
    const flow = {
      version: '1.0',
      blocks: nodes.map(node => ({
        id: node.id,
        type: node.type === 'custom' ? node.data.blockDef.id : node.type,
        position: node.position,
        properties: node.data.properties || {},
        ...(node.data.outputLabels && { outputLabels: node.data.outputLabels }),
        ...(node.data.enabledOutputs && { enabledOutputs: node.data.enabledOutputs })
      })),
      connections: edges.map(edge => ({
        id: edge.id,
        from: edge.source,
        to: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle
      }))
    };

    const dataStr = JSON.stringify(flow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `flow-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [nodes, edges]);

  // Import from JSON
  const onImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const flow = JSON.parse(event.target.result);
          
          const importedNodes = flow.blocks.map(block => ({
            id: block.id,
            type: 'custom',
            position: block.position,
            data: {
              blockDef: blockTypes[block.type],
              properties: block.properties || {},
              ...(block.outputLabels && { outputLabels: block.outputLabels }),
              ...(block.enabledOutputs && { enabledOutputs: block.enabledOutputs })
            }
          }));
          
          const importedEdges = flow.connections.map(conn => ({
            id: conn.id,
            source: conn.from,
            target: conn.to,
            sourceHandle: conn.sourceHandle,
            targetHandle: conn.targetHandle,
            type: 'custom',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#94a3b8',
            },
          }));
          
          setNodes(importedNodes);
          setEdges(importedEdges);
          
          alert('Flow imported successfully!');
        } catch (error) {
          alert('Error importing flow: ' + error.message);
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  }, [blockTypes, setNodes, setEdges]);

  // Clear all
  const onClear = useCallback(() => {
    if (confirm('Are you sure you want to clear all blocks?')) {
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
    }
  }, [setNodes, setEdges]);

  // Zoom controls
  const onZoomIn = useCallback(() => {
    reactFlowInstance?.zoomIn();
  }, [reactFlowInstance]);

  const onZoomOut = useCallback(() => {
    reactFlowInstance?.zoomOut();
  }, [reactFlowInstance]);

  const onFitView = useCallback(() => {
    reactFlowInstance?.fitView();
  }, [reactFlowInstance]);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f9fafb' }}>
      <Sidebar blockTypes={blockTypes} />
      
      <div ref={reactFlowWrapper} style={{ flex: 1, position: 'relative' }}>
        <Toolbar
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onFitView={onFitView}
          onExport={onExport}
          onImport={onImport}
          onClear={onClear}
        />
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          isValidConnection={isValidConnection}
          deleteKeyCode={['Backspace', 'Delete']}
          edgesFocusable={true}
          edgesUpdatable={true}
          fitView
        >
          <Background 
            variant="dots" 
            gap={16} 
            size={1}
            color="#d1d5db"
          />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              return node.data.blockDef?.color || '#999';
            }}
            style={{
              background: '#f8f9fa',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
            pannable={true}
            zoomable={true}
          />
        </ReactFlow>
      </div>
      
      {selectedNode && (
        <PropertyPanel
          selectedNode={selectedNode}
          blockTypes={blockTypes}
          onUpdateNode={onUpdateNode}
          onDeleteNode={onDeleteNode}
          onCloneNode={onCloneNode}
          flowContext={flowContext}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}

export default App;
