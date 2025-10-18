import React, { useState } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import Paginator from "../../Paginator";
import ModalFormGeneric from ".././ModalFormGeneric";
import ConfirmModal from "../../ConfirmModal";
import CancelModal from "../../DescriptionModal";
import NotificationModal from "../../NotificationModal";
import { getSedes, createSede, updateSede, softDeleteSede } from "../../../Api/Services/Sede";
import { Sede } from "../../../Api/types/Modules/general.types";
import { Center } from "../../../Api/types/Modules/general.types";
import { getCenters } from "../../../Api/Services/Center";

const cardsPerPage = 9;

/**
 * Props interface for SedeSection component
 * @interface SedeSectionProps
 */
interface SedeSectionProps {
  open: boolean;
  onToggle: () => void;
}

/**
 * SedeSection component for managing training center locations (sedes).
 * Provides comprehensive CRUD operations for sede management including creation,
 * editing, enable/disable functionality, and address display with truncation.
 * Features collapsible section, pagination, confirmation modals, and notifications.
 *
 * @param {SedeSectionProps} props - Component props
 * @param {boolean} props.open - Whether the section is expanded
 * @param {() => void} props.onToggle - Function to toggle section visibility
 * @returns {JSX.Element} Rendered component
 */
const SedeSection = ({ open, onToggle }: SedeSectionProps) => {
  // Main data states for sedes list
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Modal states for adding new sede
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingData, setPendingData] = useState<Sede | null>(null);
  const [showAddConfirm, setShowAddConfirm] = useState(false);

  // Modal states for editing existing sede
  const [editData, setEditData] = useState<Sede | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pendingEditData, setPendingEditData] = useState<Sede | null>(null);
  const [showEditConfirm, setShowEditConfirm] = useState(false);

  // Modal states for disable/enable confirmation
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [pendingDisable, setPendingDisable] = useState<Sede | null>(null);

  // Modal states for address description display
  const [showDescModal, setShowDescModal] = useState(false);
  const [descModalText, setDescModalText] = useState("");
  // Centers data for select dropdown
  const [centers, setCenters] = useState<{ value: string; label: string }[]>([]);
  // Notification modal states
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifType, setNotifType] = useState<'success' | 'info' | 'warning' | 'password-changed' | 'email-sent' | 'pending' | 'completed'>('success');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');

  /**
   * Refresh sedes list from server
   */
  const refresh = async () => {
    setLoading(true);
    try {
      const data = await getSedes();
      setSedes(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar sedes");
    }
    setLoading(false);
  };

  React.useEffect(() => {
    // Initial data loading: fetch sedes and centers for form select
    refresh();
    // Load centers for select dropdown in parallel
    (async () => {
      try {
        const data = await getCenters();
        // Transform center data to select options format { value, label }
        const opts = Array.isArray(data)
          ? data.map((c: Center) => ({ value: String(c.id), label: c.name || `Centro ${c.id}` }))
          : [];
        setCenters(opts);
      } catch (e) {
        setCenters([]);
      }
    })();
  }, []);

  /**
   * InfoCard component for displaying individual sede information
   * Features address truncation with expand modal, status indicator, and action buttons
   * @param {Object} props - Component props
   * @param {any} props.sede - Sede object with id, name, address, active status
   * @returns {JSX.Element} Rendered card component
   */
  const InfoCard = ({ sede }: { sede: Sede }) => (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 relative">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          {/* Sede name display */}
          <h3 className="font-semibold text-gray-900">{sede.name || `Sede ${sede.id}`}</h3>
          {sede.address && (
            <div className="relative">
              {/* Address display with truncation and expand button */}
              <p
                className="text-sm text-gray-600 mt-1 max-h-16 overflow-hidden text-ellipsis whitespace-pre-line break-words"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  wordBreak: "break-word",
                }}
              >
                {sede.address}
              </p>
              {/* Show expand button if address is long */}
              {sede.address.length > 120 && (
                <button
                  className="absolute bottom-0 right-4 bg-white px-2 py-0.5 rounded-full shadow text-gray-500 text-lg hover:bg-gray-100"
                  style={{ zIndex: 2 }}
                  onClick={() => {
                    setDescModalText(sede.address);
                    setShowDescModal(true);
                  }}
                  title="Ver más"
                >
                  ...
                </button>
              )}
            </div>
          )}
        </div>
        {/* Active/inactive status badge */}
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${sede.active ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}>
          {sede.active ? "Activo" : "Inactivo"}
        </div>
      </div>
      {/* Action buttons: Edit and Enable/Disable */}
      <div className="flex gap-2">
        <button
          onClick={() => { setEditData(sede); setShowEditModal(true); }}
          className="px-5 py-1 text-base rounded-3xl border border-gray-400 bg-gray-100 text-gray-800 font-semibold transition-colors hover:bg-gray-200"
        >
          Editar
        </button>
        <button
          onClick={() => { setPendingDisable(sede); setShowDisableConfirm(true); }}
          className={`px-5 py-1 text-base rounded-3xl border font-semibold transition-colors ${sede.active ? "bg-red-100 text-red-900 border-red-700 hover:bg-red-200" : "bg-green-100 text-green-900 border-green-700 hover:bg-green-200"}`}
        >
          {sede.active ? "Deshabilitar" : "Habilitar"}
        </button>
      </div>
    </div>
  );

  /**
   * Opens the add sede modal
   */
  const handleAdd = () => setShowAddModal(true);

  /**
   * Handles form submission for adding new sede - stores data for confirmation
   * @param {any} values - Form values from the modal
   */
  const handleSubmitAdd = (values: Sede) => { setPendingData(values); setShowAddConfirm(true); };

  /**
   * Confirms and executes the sede creation
   * Converts center field to number and calls API, then refreshes data and shows notification
   */
  const handleConfirmAdd = async () => {
    try {
      // Ensure center field is converted to number for API
      const payload = { ...pendingData, center: pendingData?.center ? Number(pendingData.center) : pendingData.center };
      await createSede(payload);
      // Close modals and reset state
      setShowAddModal(false);
      setShowAddConfirm(false);
      setPendingData(null);
      await refresh();
      // Show success notification
      setNotifType('success');
      setNotifTitle('Éxito');
      setNotifMessage('Sede creada correctamente.');
      setNotifOpen(true);
    } catch (e: unknown) {
      // Show error notification
      setNotifType('warning');
      setNotifTitle('Error');
      setNotifMessage(e instanceof Error ? e.message : 'Error al crear sede');
      setNotifOpen(true);
    }
  };

  /**
   * Handles form submission for editing sede - stores data for confirmation
   * @param {any} values - Form values from the edit modal
   */
  const handleSubmitEdit = (values: Sede) => { setPendingEditData(values); setShowEditConfirm(true); };

  /**
   * Confirms and executes the sede update
   * Converts center field to number and calls API, then refreshes data and shows notification
   */
  const handleConfirmEdit = async () => {
    try {
      const payload = { ...pendingEditData, center_id: pendingEditData?.center ? Number(pendingEditData.center) : pendingEditData.center };
      await updateSede(editData.id, payload);
      // Close modals and reset state
      setShowEditModal(false);
      setShowEditConfirm(false);
      setPendingEditData(null);
      setEditData(null);
      await refresh();
      setNotifType('success');
      setNotifTitle('Éxito');
      setNotifMessage('Sede actualizada correctamente.');
      setNotifOpen(true);
    } catch (e: unknown) {
      setNotifType('warning');
      setNotifTitle('Error');
      setNotifMessage(e instanceof Error ? e.message : 'Error al actualizar sede');
      setNotifOpen(true);
    }
  };

  /**
   * Confirms and executes the sede disable/enable action (soft delete)
   * Calls soft delete API which toggles active status, then refreshes data
   */
  const handleConfirmDisable = async () => {
    try {
      await softDeleteSede(pendingDisable.id);
      // Close modal and reset state
      setShowDisableConfirm(false);
      setPendingDisable(null);
      await refresh();
      setNotifType('success');
      setNotifTitle('Éxito');
      setNotifMessage('Acción realizada correctamente.');
      setNotifOpen(true);
    } catch (e: unknown) {
      setNotifType('warning');
      setNotifTitle('Error');
      setNotifMessage(e instanceof Error ? e.message : 'Error al deshabilitar sede');
      setNotifOpen(true);
    }
  };

  // Loading and error states
  if (loading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    // Main container with collapsible section styling
    <div className="mb-8 border border-gray-200 rounded-lg overflow-hidden">
      {/* Section header with toggle button and record count */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Sedes</h3>
          <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">{sedes.length} registros</span>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </button>

      {/* Expandable content section */}
      {open && (
        <>
          {/* Add new sede button section */}
          <div className="flex items-center gap-4 mb-6 justify-between px-6 pt-6">
            <button onClick={handleAdd} className="flex items-center gap-2 text-white px-4 py-2 rounded font-semibold shadow transition-all duration-300 bg-[linear-gradient(to_bottom_right,_#43A047,_#2E7D32)] hover:bg-green-700 hover:shadow-lg">
              <Plus className="w-4 h-4" /> Agregar Sede
            </button>
          </div>

          {/* Sedes grid display with pagination */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Render paginated sedes as InfoCard components */}
            {sedes.slice((page - 1) * cardsPerPage, page * cardsPerPage).map((sede) => (
              <InfoCard key={sede.id} sede={sede} />
            ))}

            {/* Edit sede modal */}
            <ModalFormGeneric
              isOpen={showEditModal}
              title="Editar Sede"
              fields={[
                { label: "Nombre", name: "name", type: "text", placeholder: "Ingrese el nombre", required: true },
                { label: "Código", name: "codeSede", type: "number", placeholder: "Código de la sede", required: true },
                { label: "Dirección", name: "address", type: "text", placeholder: "Ingrese la dirección", required: true },
                { label: "Teléfono", name: "phoneSede", type: "text", placeholder: "Teléfono", required: true },
                { label: "Email de contacto", name: "emailContact", type: "text", placeholder: "Email de contacto", required: true },
                { label: "Centro", name: "center", type: "select", customSelect: true, options: centers, placeholder: "Seleccione el centro", required: true },
              ]}
              onClose={() => { setShowEditModal(false); setEditData(null); setPendingEditData(null); }}
              onSubmit={handleSubmitEdit}
              submitText="Actualizar"
              cancelText="Cancelar"
              initialValues={editData || {}}
              customRender={undefined}
              onProgramChange={undefined}
            />

            {/* Edit confirmation modal */}
            <ConfirmModal
              isOpen={showEditConfirm}
              title="¿Confirmar actualización?"
              message="¿Estás seguro de que deseas actualizar esta sede?"
              confirmText="Sí, actualizar"
              cancelText="Cancelar"
              onConfirm={handleConfirmEdit}
              onCancel={() => { setShowEditConfirm(false); setPendingEditData(null); }}
            />

            {/* Disable/enable confirmation modal */}
            <ConfirmModal
              isOpen={showDisableConfirm}
              title="¿Confirmar acción?"
              message="¿Estás seguro de que deseas deshabilitar esta sede?"
              confirmText="Sí, continuar"
              cancelText="Cancelar"
              onConfirm={handleConfirmDisable}
              onCancel={() => { setShowDisableConfirm(false); setPendingDisable(null); }}
            />

          </div>

          {/* Pagination component - only show if multiple pages needed */}
          {Math.ceil(sedes.length / cardsPerPage) > 1 && (
            <Paginator page={page} totalPages={Math.ceil(sedes.length / cardsPerPage)} onPageChange={setPage} className="mt-4 px-6" />
          )}

          {/* Add new sede modal */}
          <ModalFormGeneric
            isOpen={showAddModal}
            title="Agregar Sede"
            fields={[
              { label: "Nombre", name: "name", type: "text", placeholder: "Ingrese el nombre", required: true },
              { label: "Código", name: "codeSede", type: "number", placeholder: "Código de la sede", required: true },
              { label: "Dirección", name: "address", type: "text", placeholder: "Ingrese la dirección", required: true },
              { label: "Teléfono", name: "phoneSede", type: "text", placeholder: "Teléfono", required: true },
              { label: "Email de contacto", name: "emailContact", type: "text", placeholder: "Email de contacto", required: true },
              { label: "Centro", name: "center", type: "select", customSelect: true, options: centers, placeholder: "Seleccione el centro", required: true },
            ]}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleSubmitAdd}
            submitText="Registrar"
            cancelText="Cancelar"
            customRender={undefined}
            onProgramChange={undefined}
          />

          {/* Add confirmation modal */}
          <ConfirmModal
            isOpen={showAddConfirm}
            title="¿Confirmar registro?"
            message="¿Estás seguro de que deseas registrar esta sede?"
            confirmText="Sí, registrar"
            cancelText="Cancelar"
            onConfirm={handleConfirmAdd}
            onCancel={() => { setShowAddConfirm(false); setPendingData(null); }}
          />

          {/* Address description modal for long addresses */}
          <CancelModal isOpen={showDescModal} title="Dirección completa" message={descModalText} buttonText="Cerrar" onClose={() => setShowDescModal(false)} />

          {/* Global notification modal for success/error messages */}
          <NotificationModal
            isOpen={notifOpen}
            onClose={() => setNotifOpen(false)}
            type={notifType}
            title={notifTitle}
            message={notifMessage}
          />
        </>
      )}
    </div>
  );
};

export default SedeSection;
