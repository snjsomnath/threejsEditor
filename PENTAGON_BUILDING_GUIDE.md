# Pentagon Building Helper Script

This document explains how to use the `add_sample_building.ts` helper script to quickly add pentagon-shaped dummy buildings to your Three.js scene.

## Quick Start

### Basic Usage

```typescript
import { addSamplePentagonBuilding } from './utils/add_sample_building';

// Add a simple pentagon building at the origin
const building = addSamplePentagonBuilding(threeJSCore);
```

### Custom Configuration

```typescript
import { addSamplePentagonBuilding } from './utils/add_sample_building';

// Add a custom pentagon building
const building = addSamplePentagonBuilding(threeJSCore, {
  centerX: 25,           // X position
  centerZ: 15,           // Z position  
  radius: 15,            // Building radius
  floors: 8,             // Number of floors
  floorHeight: 3.2,      // Height per floor
  color: 0x4A90E2,       // Building color (hex)
  name: 'Office Tower',  // Building name
  description: 'A modern office building',
  windowToWallRatio: 0.5,
  buildingProgram: 'Office',
  structuralSystem: 'Steel'
});
```

## Available Functions

### 1. `addSamplePentagonBuilding(threeJSCore, config?)`

Adds a single pentagon building to the scene.

**Parameters:**
- `threeJSCore: ThreeJSCore` - The initialized ThreeJS core instance
- `config?: SamplePentagonConfig` - Optional configuration object

**Configuration Options:**
```typescript
interface SamplePentagonConfig {
  centerX?: number;              // X coordinate (default: 0)
  centerZ?: number;              // Z coordinate (default: 0)
  radius?: number;               // Pentagon radius (default: 12)
  floors?: number;               // Number of floors (default: 5)
  floorHeight?: number;          // Floor height in meters (default: 3.5)
  color?: number;                // Color as hex number (default: theme blue)
  name?: string;                 // Building name (default: 'Pentagon Building')
  description?: string;          // Description (default: auto-generated)
  windowToWallRatio?: number;    // Window ratio (default: 0.4)
  buildingProgram?: string;      // Building type (default: 'Office')
  structuralSystem?: string;     // Structure type (default: 'Concrete')
  addToManager?: boolean;        // Add to building manager (default: true)
}
```

### 2. `addMultiplePentagonBuildings(threeJSCore, count?, spacing?, baseConfig?)`

Creates multiple pentagon buildings in a grid pattern.

**Example:**
```typescript
// Create 9 buildings in a 3x3 grid
const buildings = addMultiplePentagonBuildings(threeJSCore, 9, 40, {
  floors: 6,
  color: 0xff6b6b,
  buildingProgram: 'Residential'
});
```

### 3. `addRandomPentagonBuilding(threeJSCore, bounds?)`

Creates a random pentagon building at a random location.

**Example:**
```typescript
// Add a random building within ±75 units from origin
const randomBuilding = addRandomPentagonBuilding(threeJSCore, 75);
```

## Integration Examples

### In a React Component

```typescript
import React, { useCallback } from 'react';
import { addSamplePentagonBuilding } from '../utils/add_sample_building';

function BuildingControls({ threeJSCore }) {
  const handleAddBuilding = useCallback(() => {
    if (threeJSCore?.isReady()) {
      const building = addSamplePentagonBuilding(threeJSCore, {
        centerX: Math.random() * 50 - 25,
        centerZ: Math.random() * 50 - 25,
        floors: Math.floor(3 + Math.random() * 6),
        color: Math.floor(Math.random() * 0xffffff)
      });
      
      if (building) {
        console.log('Building added:', building.id);
      }
    }
  }, [threeJSCore]);

  return (
    <button onClick={handleAddBuilding}>
      Add Random Pentagon Building
    </button>
  );
}
```

### In the Main App

```typescript
// In SimpleBuildingCreator.tsx or similar
import { addSamplePentagonBuilding } from '../utils/add_sample_building';

// Add during development/testing
useEffect(() => {
  if (isInitialized && scene) {
    // Add some sample buildings for testing
    addSamplePentagonBuilding(threeJSCore, {
      centerX: -30,
      name: 'Sample Office Building',
      buildingProgram: 'Office'
    });
    
    addSamplePentagonBuilding(threeJSCore, {
      centerX: 30,
      name: 'Sample Residential Building', 
      buildingProgram: 'Residential',
      color: 0xe67e22
    });
  }
}, [isInitialized, scene]);
```

### Console Usage (Development)

When the script is loaded, you can also use it from the browser console:

```javascript
// Note: You need to have threeJSCore available
// This is mainly for development/debugging
addSamplePentagonBuilding(window.threeJSCore, {
  centerX: 0,
  centerZ: 0,
  floors: 10,
  name: 'Test Tower'
});
```

## Building Features

The pentagon buildings created by this script include:

✅ **Pentagon-shaped footprint** with 5 equal sides  
✅ **Proper shadow casting and receiving**  
✅ **Windows** automatically placed on all facades  
✅ **Floor lines** for multi-story buildings  
✅ **Interactive footprint** for selection  
✅ **Building properties** (construction types, HVAC, etc.)  
✅ **Theme-aware colors** that adapt to light/dark mode  
✅ **Proper geometry** for raycasting and interaction  

## Error Handling

The script includes comprehensive error handling:

```typescript
const building = addSamplePentagonBuilding(threeJSCore, config);

if (!building) {
  console.error('Failed to create building - check console for details');
} else {
  console.log('Building created successfully:', building.id);
}
```

## Best Practices

1. **Check ThreeJS Ready State**
   ```typescript
   if (threeJSCore.isReady()) {
     addSamplePentagonBuilding(threeJSCore);
   }
   ```

2. **Use Reasonable Parameters**
   ```typescript
   // Good
   addSamplePentagonBuilding(threeJSCore, {
     radius: 15,     // Reasonable building size
     floors: 8       // Practical floor count
   });
   
   // Avoid
   addSamplePentagonBuilding(threeJSCore, {
     radius: 1000,   // Too large
     floors: 100     // Too many floors
   });
   ```

3. **Manage Building Lifecycle**
   ```typescript
   // Keep references if you need to remove buildings later
   const buildings = [];
   buildings.push(addSamplePentagonBuilding(threeJSCore));
   
   // Later, clean up if needed
   buildings.forEach(building => {
     if (building) {
       // Use building manager to remove
       deleteBuildingMethod(building.id);
     }
   });
   ```

## Performance Considerations

- Each building adds geometry, materials, and windows to the scene
- For large numbers of buildings (>50), consider using instanced rendering
- Buildings include shadows which can impact performance on lower-end devices
- Window generation is optimized but still adds complexity

## Troubleshooting

**Building not appearing?**
- Check that `threeJSCore.isReady()` returns `true`
- Verify the camera is positioned to see the building location
- Check browser console for error messages

**Windows not showing?**
- Window service must be initialized in ThreeJS core
- Check window configuration parameters
- Verify building has adequate wall space for windows

**Performance issues?**
- Reduce number of floors or building size
- Disable shadows if needed: `enableShadows: false` in building config
- Use fewer buildings in scene simultaneously
