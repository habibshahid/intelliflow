import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode from './components/CustomNode';
import Sidebar from './components/Sidebar';
import PropertyPanel from './components/PropertyPanel';
import Toolbar from './components/Toolbar';
import blockDefinitions from './blockDefinitions.json';

const nodeTypes = {
  custom: CustomNode,
};

let nodeId = 1;

function FlowCanvas() {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  const blockTypes = blockDefinitions.blockTypes;

  // Handle connection validation
  const isValidConnection = useCallback((connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    if (!sourceNode || !targetNode) return false;

    const sourceBlockDef = sourceNode.data?.blockDef;
    const targetBlockDef = targetNode.data?.blockDef;
    
    if (!sourceBlockDef || !targetBlockDef) return false;

    // Count existing connections
    const sourceConnections = edges.filter(e => 
      e.source === connection.source && e.sourceHandle === connection.sourceHandle
    ).length;
    
    const targetConnections = edges.filter(e => 
      e.target === connection.target && e.targetHandle === connection.targetHandle
    ).length;

    // Check max limits (-1 means unlimited)
    if (sourceBlockDef.outputs.max !== -1 && sourceConnections >= sourceBlockDef.outputs.max) return false;
    if (targetBlockDef.inputs.max !== -1 && targetConnections >= targetBlockDef.inputs.max) return false;

    return true;
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params) => {
      if (isValidConnection(params)) {
        setEdges((eds) => addEdge({ ...params, animated: true }, eds));
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

      const newNode = {
        id: `node-${nodeId++}`,
        type: 'custom',
        position,
        data: { 
          blockDef,
          properties: {}
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
        properties: node.data.properties || {}
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
              properties: block.properties || {}
            }
          }));
          
          const importedEdges = flow.connections.map(conn => ({
            id: conn.id,
            source: conn.from,
            target: conn.to,
            sourceHandle: conn.sourceHandle,
            targetHandle: conn.targetHandle,
            animated: true
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
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
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
          isValidConnection={isValidConnection}
          fitView
        >
          <Background variant="dots" gap={16} size={1} />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              return node.data.blockDef.color;
            }}
            style={{
              background: '#f8f9fa',
            }}
          />
        </ReactFlow>
      </div>
      
      <PropertyPanel
        selectedNode={selectedNode}
        blockTypes={blockTypes}
        onUpdateNode={onUpdateNode}
        onDeleteNode={onDeleteNode}
        onCloneNode={onCloneNode}
      />
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
