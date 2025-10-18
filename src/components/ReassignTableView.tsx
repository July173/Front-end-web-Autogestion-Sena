import React, { useState } from "react";

/**
 * Data structure for a single row in the reassign table.
 * Contains all information about an apprentice that may need instructor reassignment.
 */
export interface ReassignTableRow {
  /** Unique identifier for the apprentice record */
  id: number;
  /** Full name of the apprentice */
  nombre: string;
  /** Type of identification document */
  tipoIdentificacion: string;
  /** Identification document number */
  numeroIdentificacion: string;
  /** Date when the request was made */
  fechaSolicitud: string;
  /** Contact phone number */
  telefono?: string;
  /** Contact email address */
  correo?: string;
  /** Company or organization name */
  empresa?: string;
  /** Company tax identification number */
  nitEmpresa?: string;
  /** Name of the immediate supervisor */
  jefeInmediato?: string;
  /** Email of the immediate supervisor */
  correoJefe?: string;
  /** Company location or address */
  ubicacionEmpresa?: string;
  /** Currently assigned instructor name */
  instructor?: string;
  /** Email of the assigned instructor */
  correoInstructor?: string;
  /** Training program code or identifier */
  ficha?: string;
  /** Training program name */
  programa?: string;
  /** Regional office or location */
  regional?: string;
  /** Training center name */
  centro?: string;
  /** Phone number of the immediate supervisor */
  telefonoJefe?: string;
  /** Start date of practical training stage */
  fechaInicioPractica?: string;
}

/**
 * Props interface for the ReassignTableView component.
 * Defines the properties needed to render the expandable table.
 */
interface ReassignTableViewProps {
  /** Array of apprentice records to display in the table */
  rows: ReassignTableRow[];
  /** Optional callback function called when action button is clicked */
  onAction?: (row: ReassignTableRow) => void;
  /** Label text for the action button. Defaults to "Reasignar" */
  actionLabel?: string;
}

/**
 * ReassignTableView component - Expandable table for instructor reassignment management.
 *
 * This component displays a table of apprentices who may need instructor reassignment.
 * Each row shows basic information and can be expanded to reveal complete details.
 * The table includes an action button for each apprentice to trigger reassignment workflows.
 *
 * Features:
 * - Expandable rows with detailed apprentice information
 * - Fixed header with column labels
 * - Action button for each apprentice (customizable label)
 * - Responsive design with proper spacing
 * - Visual indicators for expandable state
 * - Comprehensive apprentice data display
 *
 * The table shows apprentices with their basic info (ID, name, identification, request date)
 * and allows expansion to view complete company, instructor, and program details.
 *
 * @param props - The component props
 * @returns An expandable table component for instructor reassignment
 *
 * @example
 * ```tsx
 * const apprenticeData: ReassignTableRow[] = [
 *   {
 *     id: 1,
 *     nombre: "Juan Pérez",
 *     tipoIdentificacion: "Cédula",
 *     numeroIdentificacion: "123456789",
 *     fechaSolicitud: "2024-01-15",
 *     instructor: "María García",
 *     programa: "Desarrollo de Software"
 *   }
 * ];
 *
 * <ReassignTableView
 *   rows={apprenticeData}
 *   onAction={(row) => handleReassign(row)}
 *   actionLabel="Reasignar Instructor"
 * />
 * ```
 */
const ReassignTableView: React.FC<ReassignTableViewProps> = ({ rows, onAction, actionLabel = 'Reasignar' }) => {
  // State to track which row is currently expanded
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Toggle expanded state for a specific row
  const handleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="w-full rounded-[5px] outline outline-1 outline-offset-[-1px] outline-stone-300/70 flex flex-col justify-start items-start overflow-hidden">
      {/* Fixed table header with column labels */}
      <div className="self-stretch h-12 relative bg-gray-100 border-b border-gray-200 overflow-hidden">
        <div className="w-7 left-[32px] top-[9px] absolute justify-center text-stone-500 text-sm font-normal font-['Roboto'] leading-loose">#</div>
        <div className="w-40 left-[62px] top-[9px] absolute justify-center text-stone-500 text-sm font-normal font-['Roboto'] leading-loose">Nombre</div>
        <div className="w-40 left-[240px] top-[15px] absolute justify-center text-stone-500 text-sm font-normal font-['Roboto'] leading-tight">Tipo de identificación</div>
        <div className="w-40 left-[421px] top-[9px] absolute justify-center text-stone-500 text-sm font-normal font-['Roboto'] leading-loose">Número de identificación</div>
        <div className="w-32 left-[605px] top-[9px] absolute justify-center text-stone-500 text-sm font-normal font-['Roboto'] leading-loose">Fecha Solicitud</div>
        <div className="w-24 left-[789px] top-[9px] absolute justify-center text-stone-500 text-sm font-normal font-['Roboto'] leading-loose">Acciones</div>
      </div>

      {/* Table body with expandable rows */}
      <div className="w-full px-2.5 flex flex-col justify-start items-start gap-4">
        {rows.map((row) => (
          <div key={row.id} className="self-stretch border-b border-gray-200">
            {/* Expandable row header with basic information */}
            <button
              className="w-full py-3 inline-flex justify-start items-center gap-5 overflow-hidden focus:outline-none"
              onClick={() => handleExpand(row.id)}
              aria-expanded={expandedId === row.id}
              data-node-id="row-expandable"
            >
              {/* Basic information columns */}
              <div className="w-7 flex justify-between items-center">
                <div className="justify-center text-black text-sm font-normal font-['Roboto'] leading-loose">{row.id}</div>
              </div>
              <div className="w-40 justify-center text-black text-sm font-normal font-['Roboto'] leading-loose">{row.nombre}</div>
              <div className="w-40 justify-center text-black text-sm font-normal font-['Roboto'] leading-loose">{row.tipoIdentificacion}</div>
              <div className="w-40 justify-center text-black text-sm font-normal font-['Roboto'] leading-loose">{row.numeroIdentificacion}</div>
              <div className="w-40 justify-center text-black text-sm font-normal font-['Roboto'] leading-loose">{row.fechaSolicitud}</div>

              {/* Action button for reassignment */}
              <div
                className="w-24 h-8 relative bg-orange-600 rounded-[3px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] overflow-hidden flex items-center justify-center cursor-pointer"
                onClick={e => {
                  e.stopPropagation();
                  if (onAction) {
                    onAction(row);
                  }
                }}
              >
                <span className="text-white text-xs font-medium font-['Roboto']">{actionLabel}</span>
              </div>

              {/* Expand/collapse indicator arrow */}
              <span className={`ml-2 transition-transform ${expandedId === row.id ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {/* Expanded details section - shows when row is expanded */}
            {expandedId === row.id && (
              <div className="bg-gray-50 px-8 py-4 rounded-b-[5px] animate-fade-in" data-node-id="row-details">
                {/* Detailed information grid */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-8">
                  <div>
                    <span className="text-gray-500">Teléfono:</span>
                    <span className="ml-2 text-black">{row.telefono}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Correo:</span>
                    <span className="ml-2 text-black">{row.correo}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Empresa:</span>
                    <span className="ml-2 text-black">{row.empresa}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Nit Empresa:</span>
                    <span className="ml-2 text-black">{row.nitEmpresa}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Jefe Inmediato:</span>
                    <span className="ml-2 text-black">{row.jefeInmediato}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Correo Jefe:</span>
                    <span className="ml-2 text-black">{row.correoJefe}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ubicación Empresa:</span>
                    <span className="ml-2 text-black">{row.ubicacionEmpresa}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Instructor designado:</span>
                    <span className="ml-2 text-black">{row.instructor}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Correo instructor:</span>
                    <span className="ml-2 text-black">{row.correoInstructor}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Regional:</span>
                    <span className="ml-2 text-black">{row.regional}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Centro:</span>
                    <span className="ml-2 text-black">{row.centro}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ficha:</span>
                    <span className="ml-2 text-black">{row.ficha}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Programa:</span>
                    <span className="ml-2 text-black">{row.programa}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Teléfono Jefe:</span>
                    <span className="ml-2 text-black">{row.telefonoJefe}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Fecha inicio etapa práctica:</span>
                    <span className="ml-2 text-black">{row.fechaInicioPractica}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReassignTableView;
