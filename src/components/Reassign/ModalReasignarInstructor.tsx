import React from "react";

/**
 * Props interface for the ModalReasignarInstructor component.
 * Defines the optional callback for canceling the modal.
 */
import { useEffect, useState } from 'react';
import ConfirmModal from '../ConfirmModal';
import useFilteredInstructors from '@/hook/useFilteredInstructors';
import { InstructorCustomList } from '@/Api/types/entities/instructor.types';
import { AssignTableRow, ReassignInstructorPayload } from '@/Api/types/Modules/assign.types';

interface ModalReasignarInstructorProps {
  onCancel?: () => void;
  /** The request row being reassigned */
  requestRow?: AssignTableRow | null;
  /** Called when the reassign operation succeeds. Receives payload used. */
  onReassign?: (resp: ReassignInstructorPayload) => void;
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
const ModalReasignarInstructor: React.FC<ModalReasignarInstructorProps> = ({ onCancel, requestRow, onReassign }) => {
  const { instructors, loading, fetchInstructors } = useFilteredInstructors();
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorCustomList | null>(null);
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  const handleConfirm = async () => {
    if (!selectedInstructor) return setError('Selecciona un instructor');
    setError(null);
    setShowConfirm(false);
    try {
      // Build payload using provided minimal shape
      const payload = {
        asignation_instructor: requestRow?.id ?? 0,
        new_instructor_id: Number(selectedInstructor.id),
        message: reason || '',
      };
      // dynamic import to avoid circular deps
      const { reassignInstructor } = await import('@/Api/Services/AssignationInstructor');
      await reassignInstructor(payload);
      if (onReassign) onReassign(payload);
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : String(err);
      setError(m || 'Error al reasignar');
    }
  };

  return (
    <div className="bg-white overflow-y-auto fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-[10px] shadow-lg p-0 w-full max-w-5xl max-h-[90vh] z-50 border border-[#ffa577]">
      {/* Modal header with title and description */}
      <div className="border-b border-dashed border-[#ffa577] px-8 pt-6 pb-2">
        <h2 className="text-2xl font-extrabold text-black mb-1">Reasignar Instructor de seguimiento</h2>
        <p className="text-base text-gray-600">Selecciona un nuevo instructor para el seguimiento del aprendiz</p>
        {/* Left column: Current information and reassignment reason */}
        <div className="flex flex-col gap-4 w-1/2">
          {/* Current apprentice and instructor information */}
          <div className="border border-dashed border-[#ffa577] rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-orange-700 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 bg-[#ffd2a2] rounded-full flex items-center justify-center">

              </span>
              Información actual
            </h3>
            {/* Apprentice data currently unavailable - placeholders for future endpoint */}
            <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Tipo:</span> </div>
            <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Aprendiz:</span> </div>
            <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Identificación:</span> </div>
            <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Ficha:</span> </div>
            <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Fecha de solicitud:</span> </div>
            <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Fecha inicio de etapa práctica:</span> </div>
            <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Instructor actual:</span> </div>
            <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Programa:</span> </div>
          </div>

          {/* Reassignment reason input */}
          <div className="border border-dashed border-[#ffa577] rounded-lg p-4">
            <label className="block text-orange-700 font-semibold mb-2">Motivo de Reasignación*</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-lg border border-[#ffa577] p-2 text-sm" rows={4} placeholder="Escribe el motivo de la reasignación..." />
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

            {/* Scrollable instructor list populated from API */}
            <div className="flex flex-col gap-3 max-h-[265px] overflow-y-auto pr-2">
              {loading ? (
                <div className="text-center text-gray-600 py-6">Cargando instructores...</div>
              ) : instructors.length === 0 ? (
                <div className="text-center text-gray-600 py-6">No hay instructores disponibles</div>
              ) : (
                instructors.map((inst) => {
                  const assigned = inst.assigned_learners ?? 0;
                  const capacity = inst.max_assigned_learners ?? 80;
                  const pct = Math.round((Number(assigned) / Number(capacity || 1)) * 100);
                  const isSelected = selectedInstructor && Number(selectedInstructor.id) === Number(inst.id);
                  return (
                    <div
                      key={inst.id}
                      className={`bg-white rounded-lg border ${isSelected ? 'border-[#ffa577] shadow-[0_4px_10px_rgba(255,165,100,0.25)]' : 'border-[#e0e0e0]'} p-3 flex items-center justify-between cursor-pointer`}
                      onClick={() => setSelectedInstructor(inst)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">{inst.name ? inst.name.charAt(0) : 'U'}</div>
                        <div>
                          <p className="font-semibold text-black">{inst.name || inst.first_name}</p>
                          <p className="text-sm text-gray-600">{inst.knowledge_area || ''}</p>
                          <p className="text-sm text-gray-600">{inst.email || ''}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${pct < 60 ? 'bg-[#7bcc7f] text-[#2a4c36]' : 'bg-[#ffe9a2] text-[#af4209]'}`}>{`${assigned}/${capacity} Asignados`}</span>
                    </div>
                  );
                })
              )}
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
        <button
          className="bg-[#ffa577] text-white px-6 py-2 rounded-lg font-medium border border-[#ffa577]"
          onClick={() => setShowConfirm(true)}
        >
          Reasignar Instructor
        </button>
      </div>
      {error && <div className="text-sm text-red-600 px-8 pb-4">{error}</div>}

      <ConfirmModal
        isOpen={showConfirm}
        title="Confirmar reasignación"
        message="¿Estás seguro de reasignar al instructor seleccionado?"
        confirmText="Sí, reasignar"
        cancelText="Cancelar"
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};

export default ModalReasignarInstructor;
