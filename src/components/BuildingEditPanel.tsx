import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { X, Save, RotateCcw, Layers, Palette, ChevronDown, ChevronRight } from 'lucide-react';
import { BuildingData, BuildingConfig } from '../types/building';

const colorOptions = [
  { name: 'Blue', value: 0x3b82f6 },
  { name: 'Green', value: 0x10b981 },
  { name: 'Purple', value: 0x8b5cf6 },
  { name: 'Orange', value: 0xf59e0b },
  { name: 'Red', value: 0xef4444 },
  { name: 'Cyan', value: 0x06b6d4 },
  { name: 'Pink', value: 0xec4899 },
  { name: 'Gray', value: 0x6b7280 }
];

const wallOptions = [
  'Default Wall', 'Concrete', 'Brick', 'Wood', 'Steel'
];
const floorOptions = [
  'Default Floor', 'Concrete Slab', 'Raised Floor'
];
const roofOptions = [
  'Default Roof', 'Flat Roof', 'Pitched Roof'
];
const windowOptions = [
  'Default Window', 'Double Glazed', 'Triple Glazed'
];
const programOptions = [
  'Office', 'Residential', 'Retail', 'School', 'Hospital'
];
const hvacOptions = [
  'Default HVAC', 'VAV', 'CAV', 'Radiant', 'Split System'
];

interface BuildingEditPanelProps {
  building: BuildingData;
  onClose: () => void;
  onSave: (updates: Partial<BuildingData> & { config?: BuildingConfig }) => void;
}

export const BuildingEditPanel: React.FC<BuildingEditPanelProps> = ({
  building,
  onClose,
  onSave
}) => {
  // Collapsible state
  const [sections, setSections] = useState({
    general: true,
    form: true,
    construction: false,
    program: false,
    hvac: false
  });

  // All editable fields
  const [edited, setEdited] = useState<BuildingConfig & { name: string; description: string }>({
    name: building.name || '',
    description: building.description || '',
    floors: building.floors,
    floorHeight: building.floorHeight,
    color: building.color || 0x3b82f6,
    window_to_wall_ratio: building.window_to_wall_ratio ?? 0.4,
    window_overhang: building.window_overhang ?? false,
    window_overhang_depth: building.window_overhang_depth ?? 0.0,
    wall_construction: building.wall_construction || 'Default Wall',
    floor_construction: building.floor_construction || 'Default Floor',
    roof_construction: building.roof_construction || 'Default Roof',
    window_construction: building.window_construction || 'Default Window',
    building_program: building.building_program || 'Office',
    hvac_system: building.hvac_system || 'Default HVAC',
    natural_ventilation: building.natural_ventilation ?? false
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Compare all fields for changes
    const orig = {
      name: building.name || '',
      description: building.description || '',
      floors: building.floors,
      floorHeight: building.floorHeight,
      color: building.color || 0x3b82f6,
      window_to_wall_ratio: building.window_to_wall_ratio ?? 0.4,
      window_overhang: building.window_overhang ?? false,
      window_overhang_depth: building.window_overhang_depth ?? 0.0,
      wall_construction: building.wall_construction || 'Default Wall',
      floor_construction: building.floor_construction || 'Default Floor',
      roof_construction: building.roof_construction || 'Default Roof',
      window_construction: building.window_construction || 'Default Window',
      building_program: building.building_program || 'Office',
      hvac_system: building.hvac_system || 'Default HVAC',
      natural_ventilation: building.natural_ventilation ?? false
    };
    setHasChanges(JSON.stringify(orig) !== JSON.stringify(edited));
  }, [edited, building]);

  const updateField = (field: keyof typeof edited, value: any) => {
    setEdited(prev => ({ ...prev, [field]: value }));
    if (field === 'color' && building.mesh && building.mesh.material && building.mesh.userData.buildingId && !building.mesh.userData.isPreview && !building.mesh.userData.isDrawingElement) {
      const material = building.mesh.material as THREE.MeshLambertMaterial;
      material.color.setHex(value);
    }
  };

  const handleSave = () => {
    const updates: Partial<BuildingData> & { config: BuildingConfig } = {
      name: edited.name,
      description: edited.description,
      floors: edited.floors,
      floorHeight: edited.floorHeight,
      color: edited.color,
      window_to_wall_ratio: edited.window_to_wall_ratio,
      window_overhang: edited.window_overhang,
      window_overhang_depth: edited.window_overhang_depth,
      wall_construction: edited.wall_construction,
      floor_construction: edited.floor_construction,
      roof_construction: edited.roof_construction,
      window_construction: edited.window_construction,
      building_program: edited.building_program,
      hvac_system: edited.hvac_system,
      natural_ventilation: edited.natural_ventilation,
      config: { ...edited }
    };
    onSave(updates);
  };

  const handleReset = () => {
    setEdited({
      name: building.name || '',
      description: building.description || '',
      floors: building.floors,
      floorHeight: building.floorHeight,
      color: building.color || 0x3b82f6,
      window_to_wall_ratio: building.window_to_wall_ratio ?? 0.4,
      window_overhang: building.window_overhang ?? false,
      window_overhang_depth: building.window_overhang_depth ?? 0.0,
      wall_construction: building.wall_construction || 'Default Wall',
      floor_construction: building.floor_construction || 'Default Floor',
      roof_construction: building.roof_construction || 'Default Roof',
      window_construction: building.window_construction || 'Default Window',
      building_program: building.building_program || 'Office',
      hvac_system: building.hvac_system || 'Default HVAC',
      natural_ventilation: building.natural_ventilation ?? false
    });
    if (building.mesh && building.mesh.material && building.mesh.userData.buildingId && !building.mesh.userData.isPreview && !building.mesh.userData.isDrawingElement) {
      const material = building.mesh.material as THREE.MeshLambertMaterial;
      material.color.setHex(building.color || 0x3b82f6);
    }
  };

  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Drawer backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-gray-900/95 shadow-2xl border-l border-gray-700/70 z-50 flex flex-col pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-white">Edit Building</h2>
            <p className="text-xs text-gray-400">{building.name || 'Unnamed Building'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* GENERAL */}
          <Section title="General" open={sections.general} onToggle={() => toggleSection('general')}>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Name</label>
              <input
                type="text"
                value={edited.name}
                onChange={e => updateField('name', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter building name"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Description</label>
              <textarea
                value={edited.description}
                onChange={e => updateField('description', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description"
                rows={2}
              />
            </div>
          </Section>
          {/* FORM */}
          <Section title="Form" open={sections.form} onToggle={() => toggleSection('form')}>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Floors: {edited.floors}</label>
              <input
                type="range"
                min="1"
                max="50"
                value={edited.floors}
                onChange={e => updateField('floors', parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>1</span>
                <span>50</span>
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Floor Height: {edited.floorHeight}m</label>
              <input
                type="range"
                min="2.5"
                max="6"
                step="0.1"
                value={edited.floorHeight}
                onChange={e => updateField('floorHeight', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>2.5m</span>
                <span>6.0m</span>
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Color</label>
              <div className="grid grid-cols-4 gap-1.5">
                {colorOptions.map(color => (
                  <button
                    key={color.value}
                    onClick={() => updateField('color', color.value)}
                    className={`w-full h-8 rounded-lg border-2 transition-all ${
                      edited.color === color.value ? 'border-white scale-105' : 'border-gray-600 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: `#${color.value.toString(16).padStart(6, '0')}` }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Window to Wall Ratio</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={edited.window_to_wall_ratio}
                onChange={e => updateField('window_to_wall_ratio', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="mb-3 flex items-center space-x-2">
              <input
                type="checkbox"
                checked={!!edited.window_overhang}
                onChange={e => updateField('window_overhang', e.target.checked)}
                className="form-checkbox rounded text-blue-600"
                id="window_overhang"
              />
              <label htmlFor="window_overhang" className="text-xs font-medium text-gray-300">Window Overhang</label>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Overhang Depth (m)</label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.05"
                value={edited.window_overhang_depth}
                onChange={e => updateField('window_overhang_depth', parseFloat(e.target.value))}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs"
              />
            </div>
          </Section>
          {/* CONSTRUCTION */}
          <Section title="Construction" open={sections.construction} onToggle={() => toggleSection('construction')}>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Wall Construction</label>
              <select
                value={edited.wall_construction}
                onChange={e => updateField('wall_construction', e.target.value)}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs"
              >
                {wallOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Floor Construction</label>
              <select
                value={edited.floor_construction}
                onChange={e => updateField('floor_construction', e.target.value)}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs"
              >
                {floorOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Roof Construction</label>
              <select
                value={edited.roof_construction}
                onChange={e => updateField('roof_construction', e.target.value)}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs"
              >
                {roofOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Window Construction</label>
              <select
                value={edited.window_construction}
                onChange={e => updateField('window_construction', e.target.value)}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs"
              >
                {windowOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </Section>
          {/* PROGRAM */}
          <Section title="Program" open={sections.program} onToggle={() => toggleSection('program')}>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Building Program</label>
              <select
                value={edited.building_program}
                onChange={e => updateField('building_program', e.target.value)}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs"
              >
                {programOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </Section>
          {/* HVAC */}
          <Section title="HVAC" open={sections.hvac} onToggle={() => toggleSection('hvac')}>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-300 mb-1.5">HVAC System</label>
              <select
                value={edited.hvac_system}
                onChange={e => updateField('hvac_system', e.target.value)}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs"
              >
                {hvacOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="mb-3 flex items-center space-x-2">
              <input
                type="checkbox"
                checked={!!edited.natural_ventilation}
                onChange={e => updateField('natural_ventilation', e.target.checked)}
                className="form-checkbox rounded text-blue-600"
                id="natural_ventilation"
              />
              <label htmlFor="natural_ventilation" className="text-xs font-medium text-gray-300">Natural Ventilation</label>
            </div>
          </Section>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 font-medium text-sm"
            >
              <Save className="w-3 h-3" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Collapsible section helper
const Section: React.FC<{ title: string; open: boolean; onToggle: () => void; children: React.ReactNode }> = ({ title, open, onToggle, children }) => (
  <div className="mb-2">
    <button
      type="button"
      className="flex items-center w-full text-left text-xs font-bold text-gray-200 uppercase tracking-wide mb-2 focus:outline-none"
      onClick={onToggle}
    >
      {open ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
      {title}
    </button>
    {open && <div>{children}</div>}
  </div>
);