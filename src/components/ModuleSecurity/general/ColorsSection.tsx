import React, { useState } from "react";
import type { Colors } from '../../../Api/types/Modules/general.types';
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import Paginator from "../../Paginator";
import ModalFormGeneric from ".././ModalFormGeneric";
import ConfirmModal from "../../ConfirmModal";
import NotificationModal from "../../NotificationModal";
import { getColors, createColor, updateColor, softDeleteColor } from "../../../Api/Services/Colors";

const cardsPerPage = 9;

/**
 * Props for ColorsSection component
 */
interface ColorsSectionProps {
  /** Whether the section is expanded */
  open: boolean;
  /** Callback to toggle section visibility */
  onToggle: () => void;
}

/**
 * ColorsSection component for managing color configurations
 * Displays a collapsible section with colors in a paginated grid
 * Supports CRUD operations: create, read, update, soft delete
 */
const ColorsSection = ({ open, onToggle }: ColorsSectionProps) => {
  // State for colors data and loading
  const [colors, setColors] = useState<Colors[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [colorsPage, setColorsPage] = useState(1);

  // Modal states for adding colors
  const [showModal, setShowModal] = useState(false);
  const [pendingData, setPendingData] = useState<Colors | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Modal states for editing colors
  const [editData, setEditData] = useState<Colors | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pendingEditData, setPendingEditData] = useState<Colors | null>(null);
  const [showEditConfirm, setShowEditConfirm] = useState(false);

  // Modal states for disabling colors
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [pendingDisable, setPendingDisable] = useState<Colors | null>(null);

  // Notification modal state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifType, setNotifType] = useState<'success' | 'info' | 'warning' | 'password-changed' | 'email-sent' | 'pending' | 'completed'>("success");
  const [notifTitle, setNotifTitle] = useState<string>("");
  const [notifMessage, setNotifMessage] = useState<string>("");

  /**
   * Fetch colors from server
   */
  const refreshColors = async () => {
    setLoading(true);
    try {
      const data = await getColors();
      setColors(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar colores");
    }
    setLoading(false);
  };

  React.useEffect(() => {
    refreshColors();
  }, []);

  /**
   * InfoCard component for displaying individual color information
   * Shows color name, hex value with visual preview, and action buttons
   */
  const InfoCard = ({ name, hexagonal_value, isActive, onEdit, onToggle }: { name: string; hexagonal_value: string; isActive: boolean; onEdit: () => void; onToggle: () => void }) => (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{name}</h3>
          {hexagonal_value && (
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              Hex: {hexagonal_value}
              {/* Color preview swatch */}
              <span style={{ background: hexagonal_value, width: 24, height: 24, borderRadius: 6, border: '1px solid #ccc', display: 'inline-block' }} />
            </p>
          )}
        </div>
        {/* Status indicator showing active/inactive state */}
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}>{isActive ? "Activo" : "Inactivo"}</div>
      </div>
      <div className="flex gap-2">
        {/* Edit button to modify color details */}
        <button onClick={onEdit} className="px-5 py-1 text-base rounded-3xl border border-gray-400 bg-gray-100 text-gray-800 font-semibold transition-colors hover:bg-gray-200">Editar</button>
        {/* Toggle button to enable/disable color */}
        <button onClick={onToggle} className={`px-5 py-1 text-base rounded-3xl border font-semibold transition-colors ${isActive ? "bg-red-100 text-red-900 border-red-700 hover:bg-red-200" : "bg-green-100 text-green-900 border-green-700 hover:bg-green-200"}`}>{isActive ? "Deshabilitar" : "Habilitar"}</button>
      </div>
    </div>
  );

  // Handler functions for add operations
  const handleAdd = () => setShowModal(true);
  const handleSubmit = (values: Colors) => {
    setPendingData(values);
    setShowConfirm(true);
  };
  const handleConfirm = async () => {
    try {
      await createColor(pendingData);
      setShowModal(false);
      setShowConfirm(false);
      setPendingData(null);
      await refreshColors();
      setNotifType("success");
      setNotifTitle("Éxito");
      setNotifMessage("Color creado correctamente.");
      setNotifOpen(true);
    } catch (e) {
      setNotifType("warning");
      setNotifTitle("Error");
      setNotifMessage(e instanceof Error ? e.message : "Error al crear color");
      setNotifOpen(true);
    }
  };

  // Handler functions for edit operations
  const handleEdit = (color: Colors) => {
    setEditData(color);
    setShowEditModal(true);
  };
  const handleSubmitEdit = (values: Colors) => {
    setPendingEditData(values);
    setShowEditConfirm(true);
  };
  const handleConfirmEdit = async () => {
    try {
      await updateColor(editData.id, pendingEditData);
      setShowEditModal(false);
      setShowEditConfirm(false);
      setPendingEditData(null);
      setEditData(null);
      await refreshColors();
      setNotifType("success");
      setNotifTitle("Éxito");
      setNotifMessage("Color actualizado correctamente.");
      setNotifOpen(true);
    } catch (e) {
      setNotifType("warning");
      setNotifTitle("Error");
      setNotifMessage(e instanceof Error ? e.message : "Error al actualizar color");
      setNotifOpen(true);
    }
  };

  // Handler functions for toggle operations
  const handleToggle = (color: Colors) => {
    setPendingDisable(color);
    setShowDisableConfirm(true);
  };
  const handleConfirmDisable = async () => {
    try {
      await softDeleteColor(pendingDisable.id);
      setShowDisableConfirm(false);
      setPendingDisable(null);
      await refreshColors();
      setNotifType("success");
      setNotifTitle("Éxito");
      setNotifMessage("Estado del color actualizado correctamente.");
      setNotifOpen(true);
    } catch (e) {
      setNotifType("warning");
      setNotifTitle("Error");
      setNotifMessage(e instanceof Error ? e.message : "Error al deshabilitar color");
      setNotifOpen(true);
    }
  };

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
          <h3 className="text-lg font-semibold text-gray-900">Colores</h3>
          <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
            {colors.length} registros
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
          {/* Add color button */}
          <div className="flex items-center gap-4 mb-6 justify-between px-6 pt-6">
            <button onClick={handleAdd} className="flex items-center gap-2 text-white px-4 py-2 rounded font-semibold shadow transition-all duration-300 bg-[linear-gradient(to_bottom_right,_#43A047,_#2E7D32)] hover:bg-green-700 hover:shadow-lg">
              <Plus className="w-4 h-4" /> Agregar Color
            </button>
          </div>
          {/* Colors grid with pagination */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {colors.slice((colorsPage - 1) * cardsPerPage, colorsPage * cardsPerPage).map((color) => (
              <InfoCard
                key={color.id}
                name={color.name}
                hexagonal_value={color.hexagonal_value}
                isActive={color.active}
                onEdit={() => handleEdit(color)}
                onToggle={() => handleToggle(color)}
              />
            ))}
            {/* Edit modal */}
            <ModalFormGeneric
              isOpen={showEditModal}
              title="Editar Color"
              fields={[
                { label: "Nombre", name: "name", type: "text", placeholder: "Ingrese el nombre", required: true },
                { label: "Hexadecimal", name: "hexagonal_value", type: "text", placeholder: "#43A047", required: true },
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
              message="¿Estás seguro de que deseas actualizar este color?"
              confirmText="Sí, actualizar"
              cancelText="Cancelar"
              onConfirm={handleConfirmEdit}
              onCancel={() => { setShowEditConfirm(false); setPendingEditData(null); }}
            />
            {/* Disable confirmation modal */}
            <ConfirmModal
              isOpen={showDisableConfirm}
              title="¿Confirmar acción?"
              message="¿Estás seguro de que deseas deshabilitar este color?"
              confirmText="Sí, continuar"
              cancelText="Cancelar"
              onConfirm={handleConfirmDisable}
              onCancel={() => { setShowDisableConfirm(false); setPendingDisable(null); }}
            />
          </div>
          {/* Pagination component */}
          {Math.ceil(colors.length / cardsPerPage) > 1 && (
            <Paginator
              page={colorsPage}
              totalPages={Math.ceil(colors.length / cardsPerPage)}
              onPageChange={setColorsPage}
              className="mt-4 px-6"
            />
          )}

          {/* Add modal */}
          <ModalFormGeneric
            isOpen={showModal}
            title="Agregar Color"
            fields={[
              { label: "Nombre", name: "name", type: "text", placeholder: "Ingrese el nombre", required: true },
              { label: "Hexadecimal", name: "hexagonal_value", type: "text", placeholder: "#43A047", required: true },
            ]}
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmit}
            submitText="Registrar"
            cancelText="Cancelar"
            customRender={undefined}
            onProgramChange={undefined}
          />
          {/* Add confirmation modal */}
          <ConfirmModal
            isOpen={showConfirm}
            title="¿Confirmar registro?"
            message="¿Estás seguro de que deseas crear este color?"
            confirmText="Sí, crear"
            cancelText="Cancelar"
            onConfirm={handleConfirm}
            onCancel={() => {
              setShowConfirm(false);
              setPendingData(null);
            }}
          />
          {/* Notification modal */}
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

export default ColorsSection;