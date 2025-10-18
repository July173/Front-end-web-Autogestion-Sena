import React, { useState } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import Paginator from "../../Paginator";
import ModalFormGeneric from ".././ModalFormGeneric";
import ConfirmModal from "../../ConfirmModal";
import NotificationModal from "../../NotificationModal";
import { useGeneralData } from "../../../hook/useGeneralData";
import type { Program, Ficha } from "../../../Api/types/Modules/general.types";

const cardsPerPage = 9;

/**
 * Props for FichaSection component
 */
interface FichaSectionProps {
  /** Whether the section is expanded */
  open: boolean;
  /** Callback to toggle section visibility */
  onToggle: () => void;
}

/**
 * FichaSection component for managing training program sheets (fichas)
 * Displays a collapsible section with fichas in a paginated grid
 * Supports CRUD operations: create, read, update, delete
 */
const FichaSection = ({ open, onToggle }: FichaSectionProps) => {
  // Custom hook for general data management (fichas, programs)
  const {
    fichas,
    programs,
    loading,
    error,
    createFicha,
    updateFicha,
    deleteFicha,
    refreshFichas,
  } = useGeneralData();

  // Pagination state
  const [fichasPage, setFichasPage] = useState(1);

  // Modal states for adding fichas
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [pendingFichaData, setPendingFichaData] = useState<Partial<Ficha> | null>(null);
  const [showFichaConfirm, setShowFichaConfirm] = useState(false);

  // Modal states for editing fichas
  // editFicha includes a temporary 'programa' key used by the form
  const [editFicha, setEditFicha] = useState<Partial<Ficha> & { programa?: number } | null>(null);
  const [showEditFicha, setShowEditFicha] = useState(false);
  const [pendingEditFicha, setPendingEditFicha] = useState<Partial<Ficha> | null>(null);
  const [showEditFichaConfirm, setShowEditFichaConfirm] = useState(false);

  // Modal states for disabling fichas
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [pendingDisable, setPendingDisable] = useState<Ficha | null>(null);

  /**
   * InfoCard component for displaying individual ficha information
   * Shows ficha number, associated program, and action buttons
   */
  interface InfoCardProps {
    title: string;
    subtitle?: string;
    isActive: boolean;
    onEdit: () => void;
    onToggle: () => void;
  }

  const InfoCard = ({ title, subtitle, isActive, onEdit, onToggle }: InfoCardProps) => (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        {/* Status indicator showing active/inactive state */}
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}>{isActive ? "Activo" : "Inactivo"}</div>
      </div>
      <div className="flex gap-2">
        {/* Edit button to modify ficha details */}
        <button onClick={onEdit} className="px-5 py-1 text-base rounded-3xl border border-gray-400 bg-gray-100 text-gray-800 font-semibold transition-colors hover:bg-gray-200">Editar</button>
        {/* Toggle button to enable/disable ficha */}
        <button onClick={onToggle} className={`px-5 py-1 text-base rounded-3xl border font-semibold transition-colors ${isActive ? "bg-red-100 text-red-900 border-red-700 hover:bg-red-200" : "bg-green-100 text-green-900 border-green-700 hover:bg-green-200"}`}>{isActive ? "Deshabilitar" : "Habilitar"}</button>
      </div>
    </div>
  );

  // Handler functions for add operations
  const handleAddFicha = () => setShowFichaModal(true);
  type FormValues = Partial<Ficha> & { programa?: number; type_modality?: string };
  const handleSubmitFicha = (values: FormValues) => {
    // Transform data: rename 'programa' to 'program' for API
    const fichaData: Partial<Ficha> = { ...values } as Partial<Ficha>;
    if (values.programa !== undefined) {
      fichaData.program = values.programa;
      // remove temporary key if present
      delete (fichaData as unknown as { programa?: number }).programa;
    }
    setPendingFichaData(fichaData);
    setShowFichaConfirm(true);
  };
  const handleConfirmFicha = async () => {
    try {
      if (!pendingFichaData) throw new Error('No hay datos de ficha');
      await createFicha(pendingFichaData as Partial<Ficha>);
      setShowFichaModal(false);
      setShowFichaConfirm(false);
      setPendingFichaData(null);
      await refreshFichas();
      setNotifType('success');
      setNotifTitle('Éxito');
      setNotifMessage('Ficha creada correctamente.');
      setNotifOpen(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err ?? 'Error al crear ficha');
      setNotifType('warning');
      setNotifTitle('Error');
      setNotifMessage(msg);
      setNotifOpen(true);
    }
  };

  // Handler functions for edit operations
  const handleEdit = (ficha: Ficha) => {
    // Prepare edit data: rename 'program' to 'programa' for form
    setEditFicha({ ...ficha, programa: ficha.program, type_modality: ficha.type_modality ?? '' });
    setShowEditFicha(true);
  };
  const handleSubmitEditFicha = (values: FormValues) => {
    // Transform data: rename 'programa' to 'program' for API
    const data: Partial<Ficha> = { ...values } as Partial<Ficha>;
    if (values.programa !== undefined) {
      data.program = values.programa;
      delete (data as unknown as { programa?: number }).programa;
    }
    setPendingEditFicha(data);
    setShowEditFichaConfirm(true);
  };
  const handleConfirmEditFicha = async () => {
    try {
      if (!editFicha) throw new Error('No se seleccionó la ficha');
      await updateFicha(editFicha.id as number, pendingEditFicha as Partial<Ficha>);
      setShowEditFicha(false);
      setShowEditFichaConfirm(false);
      setPendingEditFicha(null);
      setEditFicha(null);
      await refreshFichas();
      setNotifType('success');
      setNotifTitle('Éxito');
      setNotifMessage('Ficha actualizada correctamente.');
      setNotifOpen(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err ?? 'Error al actualizar ficha');
      setNotifType('warning');
      setNotifTitle('Error');
      setNotifMessage(msg);
      setNotifOpen(true);
    }
  };

  // Handler functions for toggle operations
  const handleToggle = (ficha: Ficha) => {
    setPendingDisable(ficha);
    setShowDisableConfirm(true);
  };
  const handleConfirmDisable = async () => {
    try {
      if (!pendingDisable) throw new Error('No se seleccionó la ficha');
      await deleteFicha(pendingDisable.id);
      setShowDisableConfirm(false);
      setPendingDisable(null);
      await refreshFichas();
      setNotifType('success');
      setNotifTitle('Éxito');
      setNotifMessage('Ficha deshabilitada correctamente.');
      setNotifOpen(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err ?? 'Error al deshabilitar ficha');
      setNotifType('warning');
      setNotifTitle('Error');
      setNotifMessage(msg);
      setNotifOpen(true);
    }
  };

  // Notification modal state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifType, setNotifType] = useState<'success'|'info'|'warning'|'password-changed'|'email-sent'|'pending'|'completed'>('success');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');

  // Loading and error states
  if (loading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="mb-8 border border-gray-200 rounded-lg overflow-hidden">
      {/* Section header with toggle button and record count */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Fichas</h3>
          <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
            {fichas.length} registros
          </span>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {open && (
        <>
          {/* Add ficha button */}
          <div className="flex items-center gap-4 mb-6 justify-between px-6 pt-6">
            <button onClick={handleAddFicha} className="flex items-center gap-2 text-white px-4 py-2 rounded font-semibold shadow transition-all duration-300 bg-[linear-gradient(to_bottom_right,_#43A047,_#2E7D32)] hover:bg-green-700 hover:shadow-lg">
              <Plus className="w-4 h-4" /> Agregar Ficha
            </button>
          </div>
          {/* Fichas grid with pagination */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fichas.slice((fichasPage - 1) * cardsPerPage, fichasPage * cardsPerPage).map((ficha: Ficha) => {
              // Find associated program name
              const programObj = programs.find((p: Program) => p.id === ficha.program);
              const programName = programObj ? programObj.name : String(ficha.program);
              return (
                <InfoCard
                  key={ficha.id}
                  title={`Ficha #${ficha.file_number || ficha.id}`}
                  subtitle={`Programa: ${programName}`}
                  isActive={ficha.active}
                  onEdit={() => handleEdit(ficha)}
                  onToggle={() => handleToggle(ficha)}
                />
              );
            })}
            {/* Edit modal */}
            <ModalFormGeneric
              isOpen={showEditFicha}
              title="Editar Ficha"
              fields={[
                { label: "Número de Ficha", name: "file_number", type: "number", placeholder: "Ingrese el número de ficha", required: true },
                {
                  label: "Programa",
                  name: "programa",
                  type: "select",
                  options: programs.map((p: Program) => ({ value: p.id, label: p.name })),
                  required: true,
                  customSelect: true,
                },
                {
                  label: "Modalidad",
                  name: "type_modality",
                  type: "select",
                  options: [
                    { value: 'presencial', label: 'Presencial' },
                    { value: 'virtual', label: 'Virtual' },
                  ],
                  required: true,
                  customSelect: true,
                },
              ]}
              onClose={() => { setShowEditFicha(false); setEditFicha(null); setPendingEditFicha(null); }}
              onSubmit={handleSubmitEditFicha}
              submitText="Actualizar Ficha"
              cancelText="Cancelar"
              initialValues={editFicha || {}}
              customRender={undefined}
              onProgramChange={undefined}
            />
            {/* Edit confirmation modal */}
            <ConfirmModal
              isOpen={showEditFichaConfirm}
              title="¿Confirmar actualización de ficha?"
              message="¿Estás seguro de que deseas actualizar esta ficha?"
              confirmText="Sí, actualizar ficha"
              cancelText="Cancelar"
              onConfirm={handleConfirmEditFicha}
              onCancel={() => { setShowEditFichaConfirm(false); setPendingEditFicha(null); }}
            />
            {/* Disable confirmation modal */}
            <ConfirmModal
              isOpen={showDisableConfirm}
              title="¿Confirmar acción?"
              message="¿Estás seguro de que deseas deshabilitar esta ficha?"
              confirmText="Sí, continuar"
              cancelText="Cancelar"
              onConfirm={handleConfirmDisable}
              onCancel={() => { setShowDisableConfirm(false); setPendingDisable(null); }}
            />
          </div>
          {/* Pagination component */}
          {Math.ceil(fichas.length / cardsPerPage) > 1 && (
            <Paginator
              page={fichasPage}
              totalPages={Math.ceil(fichas.length / cardsPerPage)}
              onPageChange={setFichasPage}
              className="mt-4 px-6"
            />
          )}

          {/* Add modal */}
            <ModalFormGeneric
            isOpen={showFichaModal}
            title="Agregar Ficha"
            fields={[
              { label: "Número de Ficha", name: "file_number", type: "number", placeholder: "Ingrese el número de ficha", required: true },
              {
                label: "Programa",
                name: "programa",
                  type: "select",
                  options: programs.filter((p: Program) => p.active).map((p: Program) => ({ value: p.id, label: p.name })),
                required: true,
                customSelect: true,
              },
                {
                  label: "Modalidad",
                  name: "type_modality",
                  type: "select",
                  options: [
                    { value: 'presencial', label: 'Presencial' },
                    { value: 'virtual', label: 'Virtual' },
                  ],
                  required: true,
                  customSelect: true,
                },
            ]}
            onClose={() => setShowFichaModal(false)}
            onSubmit={handleSubmitFicha}
            submitText="Registrar Ficha"
            cancelText="Cancelar"
            customRender={undefined}
            onProgramChange={undefined}
          />
          {/* Add confirmation modal */}
          <ConfirmModal
            isOpen={showFichaConfirm}
            title="¿Confirmar registro de ficha?"
            message="¿Estás seguro de que deseas crear esta ficha?"
            confirmText="Sí, crear ficha"
            cancelText="Cancelar"
            onConfirm={handleConfirmFicha}
            onCancel={() => {
              setShowFichaConfirm(false);
              setPendingFichaData(null);
            }}
          />
          {/* Notification modal */}
          <NotificationModal isOpen={notifOpen} onClose={() => setNotifOpen(false)} type={notifType} title={notifTitle} message={notifMessage} />
        </>
      )}
    </div>
  );
};

export default FichaSection;
