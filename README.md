# Flow App Builder

A drag-and-drop visual application builder with dynamic block creation based on JSON definitions.

## Features

✅ **Drag & Drop Interface** - Drag blocks from the sidebar onto the canvas
✅ **Dynamic Block System** - Define new block types via JSON configuration
✅ **Visible Connection Handles** - Input/output connectors are always visible
✅ **Multiple Connection Types** - Support for 0 to many input/output connections
✅ **Property Editor** - Edit block properties in the right panel
✅ **Clone Blocks** - Duplicate existing blocks with one click
✅ **Zoom Controls** - Zoom in/out and fit view
✅ **Export/Import** - Save and load flows as JSON
✅ **Connection Validation** - Prevents invalid connections
✅ **Minimap** - Overview of entire flow
✅ **100% Open Source** - React Flow, React, Vite

## Block Types Included

1. **Start** (▶️) - Entry point, 0 inputs, up to 5 outputs
2. **Audio Playback** (🔊) - Play audio files, 1 input, up to 3 outputs
3. **Text to Speech** (💬) - Convert text to speech, 1 input, 2 outputs
4. **If/Else** (🔀) - Conditional logic, 1 input, 2 outputs (true/false)
5. **HTTP Request** (🌐) - API calls, 1 input, 2 outputs (success/error)
6. **End** (⏹️) - Termination point, up to 10 inputs, 0 outputs
7. **Merge** (🔗) - Merge multiple inputs, unlimited inputs, 1 output

## How to Add New Block Types

Edit `src/blockDefinitions.json`:

```json
{
  "blockTypes": {
    "your_block": {
      "id": "your_block",
      "name": "Your Block Name",
      "category": "custom",
      "icon": "🎯",
      "color": "#FF5722",
      "inputs": {
        "min": 1,
        "max": 3,
        "labels": ["input1", "input2", "input3"]
      },
      "outputs": {
        "min": 1,
        "max": 2,
        "labels": ["success", "error"]
      },
      "properties": [
        {
          "key": "propertyName",
          "label": "Property Label",
          "type": "text",
          "placeholder": "Enter value...",
          "required": true
        }
      ]
    }
  }
}
```

### Supported Property Types

- `text` - Single line text input
- `textarea` - Multi-line text input
- `number` - Numeric input with min/max/step
- `boolean` - Checkbox
- `select` - Dropdown with options

### Unlimited Connections

To allow unlimited inputs or outputs on a block, set `max` to `-1`:

```json
"inputs": {
  "min": 1,
  "max": -1,   // Unlimited inputs!
  "labels": ["input"]
}
```

The UI will display `∞` to indicate unlimited connections. Useful for blocks like:
- Merge blocks (combine many inputs)
- Broadcast blocks (send to many outputs)
- Logger blocks (accept any number of inputs)

## Installation

```bash
npm install
```

## Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Build for Production

```bash
npm run build
```

## Usage

1. **Add Blocks**: Drag blocks from the left sidebar onto the canvas
2. **Connect Blocks**: Click and drag from an output handle to an input handle
3. **Edit Properties**: Select a block to edit its properties in the right panel
4. **Clone Block**: Select a block and click "Clone Block" in the property panel
5. **Delete Block**: Select a block and click "Delete Block"
6. **Export Flow**: Click the download icon in the toolbar to save as JSON
7. **Import Flow**: Click the upload icon to load a saved flow
8. **Zoom**: Use the zoom controls or mouse wheel

## JSON Export Format

```json
{
  "version": "1.0",
  "blocks": [
    {
      "id": "node-1",
      "type": "start",
      "position": { "x": 100, "y": 100 },
      "properties": {}
    }
  ],
  "connections": [
    {
      "id": "edge-1",
      "from": "node-1",
      "to": "node-2",
      "sourceHandle": "output-0",
      "targetHandle": "input-0"
    }
  ]
}
```

## Tech Stack

- **React 18** - UI library
- **React Flow 11** - Node-based graph editor
- **Vite** - Build tool
- **Lucide React** - Icons

## License

Open Source (MIT)
