import React, { useEffect, useState } from 'react';
import { getFormRequestById, getRequestAsignationById, postMessageRequest } from '@/Api/Services/RequestAssignaton';
import ConfirmModal from '@/components/ConfirmModal';
import NotificationModal from '@/components/NotificationModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import ModalReject from '@/components/assing/ModalReject';

// Interface similar to ModalAssign's apprentice shape
interface ApprenticeData {
  name: string;
  type_identification: number;
  number_identification: string;
  file_number: string;
  date_start_production_stage?: string;
  program?: string;
  request_date?: string;
  request_id?: number;
  modality_productive_stage?: string;
}

interface AssignReviewModalProps {
  apprentice: ApprenticeData;
  isOpen: boolean;
  onClose: () => void;
  // callbacks invoked after a successful API call (no payload required)
  onApprove?: () => void;
  onReject?: () => void;
}

export default function AssignReviewModal({ apprentice, isOpen, onClose, onApprove, onReject }: AssignReviewModalProps) {
  const [coordinatorMessage, setCoordinatorMessage] = useState('');
  const [valuationMessage, setValuationMessage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<{ coordinator?: string; dates?: string; valuation?: string }>({});
  const [loading, setLoading] = useState(false);
  const [fetchedDetail, setFetchedDetail] = useState<any | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifType, setNotifType] = useState<'success' | 'warning'>('success');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    // reset on open
    setCoordinatorMessage('');
    setValuationMessage('');
    setStartDate('');
    setEndDate('');
    setErrors({});
    setFetchedDetail(null);

    // fetch request detail and raw assignation to extract coordinator message
    (async () => {
      if (!apprentice.request_id) return;
      setLoading(true);
      try {
        const [formResp, rawResp] = await Promise.all([
          getFormRequestById(Number(apprentice.request_id)),
          getRequestAsignationById(Number(apprentice.request_id)),
        ]);
        setFetchedDetail(formResp.data || null);

        // rawResp likely includes messages array
        const raw = rawResp?.data || rawResp;
        const messages = Array.isArray(raw?.messages) ? raw.messages : (raw?.messages || []);
        const coord = messages.find((m: any) => String(m.whose_message || '').toUpperCase() === 'COORDINADOR');
        if (coord) setCoordinatorMessage(coord.content || coord.message || '');
      } catch (e) {
        console.error('Error fetching request detail for modal:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  const validateAll = () => {
    const next: typeof errors = {};
    if (!startDate) next.dates = 'Fecha de inicio es obligatoria.';
    if (!endDate) next.dates = (next.dates ? next.dates + ' ' : '') + 'Fecha de fin es obligatoria.';
    if (startDate && endDate && endDate < startDate) next.dates = 'La fecha fin no puede ser anterior a la fecha inicio.';
    if (!valuationMessage.trim()) next.valuation = 'El mensaje de valoración es obligatorio.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleApprove = () => {
    if (!validateAll()) return;
    // open confirmation modal for approve
    setConfirmAction('approve');
    setConfirmOpen(true);
  };

  const handleReject = () => {
    // require coordinator message and valuation for rejection as well
    const next: typeof errors = {};
    if (!valuationMessage.trim()) next.valuation = 'El mensaje de valoración es obligatorio.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    // open the dedicated reject modal (collects rejection reason)
    setShowRejectModal(true);
  };

  const performConfirmedAction = async () => {
    if (!confirmAction || !apprentice.request_id) return;
    setConfirmOpen(false);
    setLoading(true);
    try {
      const payload = {
        content: valuationMessage,
        type_message: confirmAction === 'approve' ? 'APROBADO' : 'RECHAZADO',
        whose_message: 'INSTRUCTOR',
        fecha_inicio_contrato: startDate || undefined,
        fecha_fin_contrato: endDate || undefined,
        request_state: 'PRE-APROBADO',
      } as any;

      await postMessageRequest(Number(apprentice.request_id), payload);
      setNotifType('success');
      setNotifTitle(confirmAction === 'approve' ? 'Aprobación enviada' : 'Rechazo enviado');
      setNotifMessage('La acción se envió correctamente.');
      setNotifOpen(true);
      if (confirmAction === 'approve' && onApprove) onApprove();
      if (confirmAction === 'reject' && onReject) onReject();
      onClose();
    } catch (e: any) {
      console.error('Error performing confirmed action:', e);
      setNotifType('warning');
      setNotifTitle('Error');
      const msg = e?.message || 'Ocurrió un error al procesar la acción';
      setNotifMessage(msg);
      setNotifOpen(true);
      // also set inline error for valuation field
      setErrors((s) => ({ ...s, valuation: 'Error al enviar la solicitud. Intenta nuevamente.' }));
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  // Handler passed to ModalReject: receives rejectionMessage and performs API call
  const handleRejectConfirm = async (rejectionMessage: string) => {
    setShowRejectModal(false);
    if (!apprentice.request_id) return;
    setLoading(true);
    try {
      const payload = {
        content: rejectionMessage,
        type_message: 'RECHAZADO',
        whose_message: 'INSTRUCTOR',
        // no dates for rejection
        request_state: 'PRE-APROBADO',
      } as any;

      await postMessageRequest(Number(apprentice.request_id), payload);
      setNotifType('success');
      setNotifTitle('Rechazo enviado');
      setNotifMessage('La solicitud fue rechazada correctamente.');
      setNotifOpen(true);
      if (onReject) onReject();
      onClose();
    } catch (e: any) {
      console.error('Error sending rejection:', e);
      setNotifType('warning');
      setNotifTitle('Error');
      setNotifMessage(e?.message || 'Ocurrió un error al enviar el rechazo');
      setNotifOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const getFullName = () => {
    return apprentice.name || 'Sin nombre';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <LoadingOverlay isOpen={loading} message="Enviando..." />
      <NotificationModal
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        type={notifType === 'success' ? 'success' : 'warning'}
        title={notifTitle}
        message={notifMessage}
      />
      <ConfirmModal
        isOpen={confirmOpen}
        title={confirmAction === 'approve' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
        message={confirmAction === 'approve' ? '¿Deseas aprobar la solicitud?' : '¿Deseas rechazar la solicitud?'}
        confirmText={confirmAction === 'approve' ? 'Aprobar' : 'Rechazar'}
        cancelText={'Cancelar'}
        onConfirm={performConfirmedAction}
        onCancel={() => setConfirmOpen(false)}
        errorMessage={null}
      />
      {showRejectModal && (
        <ModalReject
          apprenticeName={apprentice.name}
          requestId={Number(apprentice.request_id || 0)}
          onClose={() => setShowRejectModal(false)}
          onConfirm={(msg) => handleRejectConfirm(msg)}
        />
      )}
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} />
      <div className="bg-white rounded-[10px] shadow-lg max-w-3xl w-full mx-4 p-6 relative z-10" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#fff" viewBox="0 0 16 16">
              <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM6.5 11.5L3 8l1-1 2.5 2.5L12 4l1 1-6.5 6.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold">Asignación - Revisión</h3>
            <p className="text-sm text-neutral-600">Revisa y completa la información requerida antes de aprobar o rechazar</p>
          </div>
        </div>

        {/* Apprentice info card */}
        <div className="border rounded-lg p-4 mb-4 bg-white">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#22c55e" viewBox="0 0 16 16">
                <path d="M8 0a5 5 0 100 10A5 5 0 008 0zM2 14s1-1 6-1 6 1 6 1v1H2v-1z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-xl font-semibold">{getFullName()}</div>
              <div className="text-sm text-neutral-500 mt-1">Información del aprendiz</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-neutral-600">
            <div>
              <div className="font-medium">Identificación</div>
              <div className="text-neutral-500">{apprentice.number_identification || '-'}</div>
            </div>
            <div>
              <div className="font-medium">Tipo</div>
              <div className="text-neutral-500">{apprentice.type_identification ?? '-'}</div>
            </div>
            <div>
              <div className="font-medium">Ficha</div>
                <div className="text-neutral-500">{fetchedDetail?.numero_ficha || fetchedDetail?.ficha || apprentice.file_number || '-'}</div>
            </div>
            <div>
              <div className="font-medium">Fecha de solicitud</div>
              <div className="text-neutral-500">{apprentice.request_date || '-'}</div>
            </div>
            <div className="col-span-2 mt-2">
              <div className="font-medium">Programa</div>
              <div className="text-neutral-500">{fetchedDetail?.program || apprentice.program || '-'}</div>
            </div>
            <div className="col-span-2 mt-2">
              <div className="font-medium">Modalidad etapa práctica</div>
              <div className="text-neutral-500">{apprentice.modality_productive_stage || '-'}</div>
            </div>
          </div>
        </div>

        {/* Coordinator message (read-only, taken from request messages when available) */}
        <div className="mb-4">
          <label className="font-semibold">Mensaje del Coordinador</label>
          <div className="w-full mt-2 border rounded-lg p-3 text-sm bg-gray-50 text-neutral-700">
            {loading ? 'Cargando...' : (coordinatorMessage ? coordinatorMessage : 'No hay mensaje del coordinador')}
          </div>
        </div>

        {/* Dates */}
        <div className="mb-4">
          <div className="font-semibold mb-2">Fechas de tipo de modalidad</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Fecha inicio</label>
              <input
                type="date"
                className="w-full mt-2 border rounded-lg p-2"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  // if endDate exists and becomes earlier, clear endDate to force re-entry
                  if (endDate && e.target.value && endDate < e.target.value) setEndDate('');
                }}
              />
            </div>
            <div>
              <label className="text-sm">Fecha fin</label>
              <input
                type="date"
                className="w-full mt-2 border rounded-lg p-2"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          {errors.dates && <div className="text-sm text-red-600 mt-2">{errors.dates}</div>}
        </div>

        {/* Valuation message */}
        <div className="mb-4">
          <label className="font-semibold">Mensaje de valoración</label>
          <textarea
            className="w-full mt-2 border rounded-lg p-3 text-sm"
            rows={4}
            value={valuationMessage}
            onChange={(e) => setValuationMessage(e.target.value)}
            placeholder="Escribe la valoración (obligatorio)"
          />
          {errors.valuation && <div className="text-sm text-red-600 mt-1">{errors.valuation}</div>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-between mt-4">
          <button
            className="bg-[#fb8383] border border-[#773939] text-white font-bold px-4 py-2 rounded-[10px] flex items-center gap-2 hover:bg-[#fbbcbc]"
            onClick={handleReject}
          >
            Rechazar solicitud
          </button>

          <div className="flex items-center gap-3">
            <button className="bg-white border border-[#a39f9f] text-black font-bold px-6 py-2 rounded-[10px] hover:bg-gray-100" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="bg-[#7bcc7f] border border-[#c0fbcd] text-white font-bold px-4 py-2 rounded-[10px] hover:bg-[#a6e6ad] disabled:opacity-50"
              onClick={handleApprove}
            >
              Aprobar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
