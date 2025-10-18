import React from 'react';
import type { KnowledgeArea } from '../../../Api/types/Modules/general.types';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Props for the AreasSection component
 */
interface AreasSectionProps {
  /** Array of knowledge areas to display */
  knowledgeAreas: KnowledgeArea[];
  /** Whether the section is expanded or collapsed */
  sectionOpen: boolean;
  /** Callback to toggle section visibility */
  onToggleSection: () => void;
  /** Callback to toggle area active status */
  onToggleArea: (id: number) => void;
  /** Callback to edit an area */
  onEditArea: (id: number) => void;
}

/**
 * InfoCard component for displaying individual knowledge area information
 * Shows area details with toggle and edit buttons
 */
const InfoCard = ({ title, subtitle, isActive, onToggle, onEdit }: {
  /** Main title of the card */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Whether the area is currently active */
  isActive: boolean;
  /** Callback when toggle button is clicked */
  onToggle: () => void;
  /** Callback when edit button is clicked */
  onEdit: () => void;
}) => (
  <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      {/* Status indicator showing active/inactive state */}
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Activo' : 'Inactivo'}
      </div>
    </div>
    <div className="flex gap-2">
      {/* Edit button to modify area details */}
      <button
        onClick={onEdit}
        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
      >
        Ajustar
      </button>
      {/* Toggle button to enable/disable area */}
      <button
        onClick={onToggle}
        className={`px-3 py-1 text-sm rounded transition-colors ${
          isActive
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {isActive ? 'Deshabilitar' : 'Habilitar'}
      </button>
    </div>
  </div>
);

/**
 * AreasSection component for managing knowledge areas
 * Displays a collapsible section with knowledge areas in a grid layout
 * Each area can be toggled active/inactive and edited
 */
const AreasSection: React.FC<AreasSectionProps> = ({
  knowledgeAreas,
  sectionOpen,
  onToggleSection,
  onToggleArea,
  onEditArea
}) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Section header with toggle button and record count */}
      <button
        onClick={onToggleSection}
        className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Áreas de Conocimiento</h3>
          <span className="bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded-full">
            {knowledgeAreas.length} registros
          </span>
        </div>
        {/* Chevron icon indicating expand/collapse state */}
        {sectionOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {/* Expandable content showing knowledge areas grid */}
      {sectionOpen && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {knowledgeAreas.map((area) => (
            <InfoCard
              key={area.id}
              title={area.name || `Área ${area.id}`}
              subtitle={area.description}
              isActive={area.active}
              onToggle={() => onToggleArea(area.id)}
              onEdit={() => onEditArea(area.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AreasSection;
