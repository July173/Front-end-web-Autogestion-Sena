import React, { useState } from 'react';
import LoadingOverlay from '../LoadingOverlay';
import NotificationModal from '@/components/NotificationModal';
import ModalReject from './ModalReject';
import { postMessageRequest } from '@/Api/Services/RequestAssignaton';

interface ApprenticeData {
  name: string;
  type_identification: number;
  number_identification: string;
  file_number: string;
  date_start_production_stage: string;
  program: string;
  request_date: string;
  request_id?: number;
  modality_productive_stage?: string;
}

interface ModalPreApproveProps {
  apprentice: ApprenticeData;
  onClose: () => void;
  onAssignmentComplete?: () => void;
  assignedInstructor?: any | null;
  initialMessages?: any[];
}

export default function ModalPreApprove({ apprentice, onClose, onAssignmentComplete, assignedInstructor = null, initialMessages = [] }: ModalPreApproveProps) {
  const [assigning, setAssigning] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState('');
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [resultType, setResultType] = useState<'success' | 'warning'>('success');
  const [messages] = useState<any[]>(initialMessages ?? []);
  const MAX_MESSAGE_LENGTH = 500;

  const requestAsignationId = apprentice.request_id ?? null;

  const handleApprove = async () => {
    if (!requestAsignationId) return;
    if (!message || !message.trim()) {
      setMessageError('El mensaje es obligatorio');
      return;
    }
    setAssigning(true);
    try {
      const payload: any = {
        content: message,
        type_message: 'ASIGNADO',
        whose_message: 'COORDINADOR',
        request_state: 'ASIGNADO',
      };
      if (apprentice.date_start_production_stage) payload.fecha_inicio_contrato = apprentice.date_start_production_stage;
      if ((apprentice as any).date_end_production_stage) payload.fecha_fin_contrato = (apprentice as any).date_end_production_stage;

      const resp = await postMessageRequest(requestAsignationId, payload);
      // Try to extract message
      let msg = 'Se ha llevado a cabo con éxito tu solicitud.';
      let t: 'success' | 'warning' = 'success';
      try {
        const maybe = (resp as { data?: unknown }).data;
        const rawData = maybe ?? resp;
        if (rawData && typeof rawData === 'object') {
          const d = rawData as Record<string, unknown>;
          const statusVal = typeof d.status === 'string' ? d.status.toLowerCase() : undefined;
          if (statusVal === 'error') {
            t = 'warning';
            if (typeof d.detail === 'string') msg = d.detail;
            else if (typeof d.message === 'string') msg = d.message as string;
          } else if (typeof d.detail === 'string') msg = d.detail;
        }
      } catch (e) { }

      setResultType(t);
      setResultMessage(msg);
      setShowResultModal(true);
    } catch (err) {
      console.error('Error aprobar pre-approve:', err);
      setResultType('warning');
      setResultMessage('Error al procesar la aprobación');
      setShowResultModal(true);
    } finally {
      setAssigning(false);
    }
  };

  const handleConfirmReject = async (rejectionMessage: string) => {
    if (!requestAsignationId) return;
    setAssigning(true);
    try {
      const payload = {
        content: rejectionMessage,
        type_message: 'RECHAZO',
        whose_message: 'COORDINADOR',
        request_state: 'RECHAZADO'
      };
      await postMessageRequest(requestAsignationId, payload);
      setResultType('success');
      setResultMessage('Se ha llevado a cabo con éxito tu solicitud.');
      setShowResultModal(true);
    } catch (err) {
      console.error('Error rechazar pre-approve:', err);
      setResultType('warning');
      setResultMessage('Error al procesar el rechazo');
      setShowResultModal(true);
    } finally {
      setAssigning(false);
      setShowRejectModal(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <LoadingOverlay isOpen={assigning} message={assigning ? 'Procesando...' : undefined} zIndex={1000} />
        <div className="absolute inset-0 bg-black bg-opacity-40" style={{ pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()} />
        <div className="bg-white rounded-[10px] shadow-lg max-w-2xl w-full mx-4 p-6 relative flex flex-col gap-6 z-10" style={{ pointerEvents: 'auto', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>

          <div className="flex items-center gap-2 mb-2">
            <div>
              <div className="text-black text-2xl font-extrabold font-['Roboto'] leading-loose text-left">Pre-Aprobado — Aprobar/Rechazar</div>
              <div className="text-black text-base font-normal font-['Roboto'] leading-loose">Revisa la información y aprueba o rechaza la solicitud</div>
            </div>
          </div>

          <div className="border rounded-lg p-5 flex flex-col gap-2 bg-white">
            <div className="flex items-center gap-3 mb-2">
              <div>
                <div className="text-black text-2xl font-semibold font-['Roboto'] leading-loose">{apprentice.name}</div>
                <div className="text-neutral-500 text-base font-normal font-['Roboto'] leading-loose text-left">Información del aprendiz</div>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-x-20 gap-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="text-neutral-500">Identificación:</span> <span className="text-black font-medium">{apprentice.number_identification}</span></div>
                <div className="flex items-center gap-2"><span className="text-neutral-500">Ficha:</span> <span className="text-black font-medium">{apprentice.file_number}</span></div>
                <div className="flex items-center gap-2 col-span-2"><span className="text-neutral-500">Fecha inicio etapa práctica:</span> <span className="text-black font-medium">{apprentice.date_start_production_stage}</span></div>
              </div>
            </div>

            <hr className="my-2 border-t border-gray-200" />
            <div className="text-stone-500 text-base font-medium font-['Roboto'] leading-loose mt-1">Programa: <span className="text-neutral-500 font-normal">{apprentice.program}</span></div>
          </div>

          {/* Assigned instructor */}
          <div className="mt-2">
            <div className="text-black text-lg font-medium mb-2">Instructor asignado</div>
            <div className="border rounded-lg p-4 bg-gray-50">
              {assignedInstructor ? (
                <div className="text-black font-medium">{assignedInstructor.name || assignedInstructor.first_name || 'Sin nombre'}</div>
              ) : (
                <div className="text-neutral-500">No hay instructor asignado</div>
              )}
            </div>
          </div>

          {/* Messages */}
          {messages && messages.length > 0 && (
            <div className="max-w-2xl mx-auto mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-lg font-semibold mb-2">Mensajes</h4>
              <div className="flex flex-col gap-2">
                {messages.map((m, i) => (
                  <div key={i} className="p-2 border rounded bg-white text-sm">
                    <div className="text-neutral-600 text-xs">{m.whose_message ?? m.sender ?? 'Sistema'} - {m.type_message ?? ''}</div>
                    <div className="text-black">{m.content}</div>
                    {m.created_at && <div className="text-neutral-400 text-xs">{m.created_at}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message input */}
          <div className="mt-4 flex flex-col items-start">
            <label className="text-black font-medium mb-2">Mensaje*</label>
            <textarea value={message} onChange={(e) => {
              const v = e.target.value;
              if (v.length > MAX_MESSAGE_LENGTH) {
                setMessage(v.slice(0, MAX_MESSAGE_LENGTH));
                setMessageError(`Máximo ${MAX_MESSAGE_LENGTH} caracteres`);
              } else {
                setMessage(v);
                if (messageError && messageError.startsWith('Máximo')) setMessageError('');
              }
            }} placeholder="Escribe un mensaje " rows={3} className="w-full mt-2 border rounded-lg p-3 text-sm" />
            <div className="w-full flex justify-between items-center"><div />
              <div className="text-sm mt-2"><span className={message.length >= MAX_MESSAGE_LENGTH ? 'text-red-600' : 'text-neutral-500'}>{message.length}/{MAX_MESSAGE_LENGTH}</span></div>
            </div>
            {messageError && <div className="text-sm text-red-600 mt-2">{messageError}</div>}
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-start mt-4">
            <button className="bg-[#fb8383] border border-[#773939] text-[#ffffff] font-bold px-4 py-2 rounded-[10px] hover:bg-[#fbbcbc]" onClick={() => setShowRejectModal(true)}>Rechazar solicitud</button>
            <div className="flex-1" />
            <button className="bg-white border border-[#a39f9f] text-black font-bold px-6 py-2 rounded-[10px] hover:bg-gray-100" onClick={onClose}>Cancelar</button>
            <button className="bg-blue-500 border border-blue-600 text-white font-bold px-4 py-2 rounded-[10px] hover:bg-blue-600" onClick={handleApprove} disabled={assigning || !message || !message.trim()}>Aprobar</button>
          </div>
        </div>
      </div>

      {showRejectModal && requestAsignationId && (
        <ModalReject apprenticeName={apprentice.name} requestId={requestAsignationId} onClose={() => setShowRejectModal(false)} onConfirm={handleConfirmReject} />
      )}

      {showResultModal && (
        <NotificationModal isOpen={showResultModal} onClose={() => { setShowResultModal(false); onAssignmentComplete?.(); onClose(); }} type={resultType} title={resultType === 'success' ? 'Acción completada' : 'Error'} message={resultMessage} />
      )}
    </>
  );
}
