import React from "react";

/**
 * Props interface for the ModalReasignarInstructor component.
 * Defines the optional callback for canceling the modal.
 */
interface ModalReasignarInstructorProps {
  /** Optional callback function called when the cancel button is clicked */
  onCancel?: () => void;
}

/**
 * ModalReasignarInstructor component - Modal for reassigning follow-up instructors to apprentices.
 *
 * This modal component provides an interface for changing the assigned instructor
 * for an apprentice during their practical training. It displays current apprentice
 * and instructor information, allows specifying reassignment reasons, and provides
 * a list of available instructors with their current workload status.
 *
 * Features:
 * - Two-column layout with current information and instructor selection
 * - Current apprentice details (ID, name, program, dates, current instructor)
 * - Reassignment reason input field
 * - Instructor selection with workload indicators (color-coded assignment status)
 * - Cancel and reassign action buttons
 *
 * The instructor list shows assignment status with color coding:
 * - Green: Low workload (good for new assignments)
 * - Yellow/Orange: Medium workload (approaching capacity)
 *
 * @example
 * ```tsx
 * <ModalReasignarInstructor
 *   onCancel={() => console.log('Modal canceled')}
 * />
 * ```
 *
 * @param props - The component props
 * @returns A modal dialog for instructor reassignment
 */
const ModalReasignarInstructor: React.FC<ModalReasignarInstructorProps> = ({ onCancel }) => {
  return (
  <div className="bg-white overflow-y-auto fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-[10px] shadow-lg p-0 w-full max-w-5xl max-h-[90vh] z-50 border border-[#ffa577]">
      {/* Modal header with title and description */}
      <div className="border-b border-dashed border-[#ffa577] px-8 pt-6 pb-2">
        <h2 className="text-2xl font-extrabold text-black mb-1">Reasignar Instructor de seguimiento</h2>
        <p className="text-base text-gray-600">Selecciona un nuevo instructor para el seguimiento del aprendiz</p>
      </div>

      <div className="flex flex-row gap-4 px-8 py-6">
        {/* Left column: Current information and reassignment reason */}
        <div className="flex flex-col gap-4 w-1/2">
          {/* Current apprentice and instructor information */}
          <div className="border border-dashed border-[#ffa577] rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-orange-700 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 bg-[#ffd2a2] rounded-full flex items-center justify-center">

              </span>
              Información actual
            </h3>
            <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Tipo:</span> Tarjeta de identidad</div>
            <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Aprendiz:</span> Daniela Polania Quintero</div>
            <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Identificación:</span> 10234564504</div>
            <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Ficha:</span> 2901817</div>
            <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Fecha de solicitud:</span> 10/05/2025</div>
            <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Fecha inicio de etapa práctica:</span> 10/05/2025</div>
            <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Instructor actual:</span> Carlos Bonilla</div>
            <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Programa:</span> Análisis y desarrollo de software</div>
          </div>

          {/* Reassignment reason input */}
          <div className="border border-dashed border-[#ffa577] rounded-lg p-4">
            <label className="block text-orange-700 font-semibold mb-2">Motivo de Reasignación*</label>
            <textarea className="w-full rounded-lg border border-[#ffa577] p-2 text-sm" rows={4} placeholder="Escribe el motivo de la reasignación..." />
          </div>
        </div>

        {/* Right column: Instructor selection */}
        <div className="flex flex-col gap-4 w-1/2">
          <div className="border border-dashed border-[#ffa577] rounded-lg p-4">
            <h3 className="text-lg font-semibold text-black mb-2">Seleccionar instructor</h3>
            <p className="text-sm text-gray-600 mb-4">Busca y selecciona un instructor disponible para el seguimiento</p>

            {/* Program filter dropdown */}
            <select className="mb-4 px-3 py-2 border border-[#ffa577] rounded-lg text-sm">
              <option>Todos los programas</option>
            </select>

            {/* Scrollable instructor list */}
            <div className="flex flex-col gap-3 max-h-[265px] overflow-y-auto pr-2">
              {/* Example instructor cards with workload status */}
              <div className="bg-white rounded-lg border border-[#e0e0e0] shadow p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">

                  <div>
                    <p className="font-semibold text-black">Paola Guerrero Mendoza</p>
                    <p className="text-sm text-gray-600">Desarrollo de software</p>
                    <p className="text-sm text-gray-600">paola_guerrero@sena.edu.co</p>
                  </div>
                </div>
                {/* Workload indicator - green for low workload */}
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#7bcc7f] text-[#2a4c36]">8/80 Asignados</span>
              </div>

              <div className="bg-white rounded-lg border border-[#e0e0e0] shadow p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">

                  <div>
                    <p className="font-semibold text-black">Paola Guerrero Mendoza</p>
                    <p className="text-sm text-gray-600">Desarrollo de software</p>
                    <p className="text-sm text-gray-600">paola_guerrero@sena.edu.co</p>
                  </div>
                </div>
                {/* Workload indicator - yellow/orange for medium workload */}
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#ffe9a2] text-[#af4209]">54/80 Asignados</span>
              </div>

              <div className="bg-white rounded-lg border border-[#e0e0e0] shadow p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-black">Paola Guerrero Mendoza</p>
                    <p className="text-sm text-gray-600">Desarrollo de software</p>
                    <p className="text-sm text-gray-600">paola_guerrero@sena.edu.co</p>
                  </div>
                </div>
                {/* Workload indicator - yellow/orange for medium workload */}
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#ffe9a2] text-[#af4209]">54/80 Asignados</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-4 px-8 pb-6">
        <button
          className="bg-gray-200 text-black px-6 py-2 rounded-lg font-medium border border-[#ababab]"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button className="bg-[#ffa577] text-white px-6 py-2 rounded-lg font-medium border border-[#ffa577]">Reasignar Instructor</button>
      </div>
    </div>
  );
};

export default ModalReasignarInstructor;
