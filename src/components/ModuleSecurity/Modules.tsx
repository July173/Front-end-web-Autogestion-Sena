import React, { useEffect, useState } from 'react';
import { ENDPOINTS } from '../../Api/config/ConfigApi';
import Paginator from '../Paginator';
import { getModules, postModule, getModuleForms, putModuleForms, toggleModuleActive } from '../../Api/Services/Module';
import FilterBar from '../FilterBar';
import { getForms } from '../../Api/Services/Form';
import { postForm } from '../../Api/Services/Form';
import { InfoCard } from './CardSecurity';
import ModalFormGeneric from './ModalFormGeneric';
import ConfirmModal from '../ConfirmModal';
import NotificationModal from '../NotificationModal';
import type { InfoCardProps } from '../../Api/types/entities/misc.types';
import type { Module } from '../../Api/types/entities/module.types';

/**
 * Modules component for managing system modules and forms.
 * Provides CRUD operations for modules (with associated forms) and forms,
 * including filtering, pagination, enable/disable functionality, and notifications.
 * Special handling for security module which always includes administration form.
 */
const Modules = () => {
  // Filter states for search and active status
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(''); // '', 'true', 'false'
  // Filtered modules list and loading states
  const [modulesFiltered, setModulesFiltered] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesError, setModulesError] = useState('');
  // Complete modules list
  const [modules, setModules] = useState<Module[]>([]);
  // Pagination state
  const [page, setPage] = useState(1);
  const modulesPerPage = 6;
  // General loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Modal visibility states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  // Forms data for module association
  const [forms, setForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(true);
  // Confirmation modal states for form creation
  const [pendingFormData, setPendingFormData] = useState(null);
  const [showFormConfirm, setShowFormConfirm] = useState(false);
  // Confirmation modal states for module creation
  const [pendingModuleData, setPendingModuleData] = useState(null);
  const [showModuleConfirm, setShowModuleConfirm] = useState(false);
  // Module editing states
  const [editModule, setEditModule] = useState(null); // Complete module data to edit
  const [showEdit, setShowEdit] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  // Confirmation modal states for module editing
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [pendingEditData, setPendingEditData] = useState(null);

  // Notification modal states
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<
    'success' | 'info' | 'warning' | 'password-changed' | 'email-sent' | 'pending' | 'completed'
  >('success');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  // Enable/disable confirmation modal states
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [pendingToggleModule, setPendingToggleModule] = useState(null);

  // Load initial data: modules and forms
  useEffect(() => {
    getModules()
      .then(data => {
        setModules(data);
        setModulesFiltered(data);
      })
      .catch(() => setError('Error al cargar los módulos'))
      .finally(() => setLoading(false));
    getForms()
      .then(setForms)
      .finally(() => setLoadingForms(false));
  }, []);

  /**
   * Filter modules using API endpoint with search and active status parameters
   * @param params - Filter parameters containing search and active status
   */
  const handleFilter = async (params: { search?: string; active?: string }) => {
    setModulesLoading(true);
    setModulesError('');
    const searchValue = params.search ?? search;
    const activeValue = params.active ?? activeFilter;
    setSearch(searchValue);
    setActiveFilter(activeValue);
    try {
      // Build query parameters for API call
      const query = [];
      if (searchValue) query.push(`search=${encodeURIComponent(searchValue)}`);
      if (activeValue !== '') query.push(`active=${activeValue}`);
      const url = `${ENDPOINTS.module.filterModules}${query.length ? '?' + query.join('&') : ''}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Error al filtrar módulos');
      const data = await resp.json();
      setModulesFiltered(data);
      setPage(1); // Reset pagination to first page
    } catch (e) {
      setModulesError(e.message || 'Error al filtrar módulos');
    } finally {
      setModulesLoading(false);
    }
  };

  // Special handling for security module: force administration form to always be included
  useEffect(() => {
    if (showEdit && editModule?.name?.toLowerCase() === 'seguridad') {
      // Force the administration form (id=1) to always be present
      if (editModule.form_ids && !editModule.form_ids.includes('1')) {
        setEditModule(prev => ({
          ...prev,
          form_ids: [...prev.form_ids, '1']
        }));
      }
    }
  }, [showEdit, editModule]);

  // Loading and error states
  if (loading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  // Calculate pagination on filtered modules
  const totalPages = Math.ceil(modulesFiltered.length / modulesPerPage);
  const paginatedModules = modulesFiltered.slice((page - 1) * modulesPerPage, page * modulesPerPage);

  // Form fields configuration for creating new forms
  const formFields = [
    { name: 'name', label: 'Nombre del Formulario', type: 'text', placeholder: 'Ej : gestion.' },
    { name: 'path', label: 'Direccion del Formulario', type: 'text', placeholder: 'Ej : src/user/.formulario a' },
    { name: 'description', label: 'Descripcion', type: 'text', placeholder: 'Describe que es lo que va  a hacer', maxLength: 100 },
  ];

  // Module fields configuration for creating/editing modules with form associations
  const moduleFields = [
    { name: 'name', label: 'Nombre del Modulo', type: 'text', placeholder: 'Ej : seguridad' },
    { name: 'description', label: 'Descripcion', type: 'text', placeholder: 'Describe que es lo que va  a hacer'  , maxLength: 100 },
    {
      name: 'form_ids',
      label: 'Formularios',
      type: 'checkbox-group',
      options: forms.filter(f => f.active).map(f => ({
        value: String(f.id),
        label: f.name,
        disabled: (editModule?.name?.toLowerCase() === 'seguridad' && String(f.id) === '1') // Disable administration in security
      })),
    },
  ];

  /**
   * Handle form creation: prepare data and show confirmation modal
   * @param values - Form field values from modal
   */
  const handleCreateForm = (values) => {
    const data = {
      name: values.name,
      path: values.path,
      description: values.description,
      active: true,
    };
    setPendingFormData(data);
    setShowFormConfirm(true);
  };

  /**
   * Confirm and execute form creation via API
   */
  const handleConfirmCreateForm = async () => {
    if (!pendingFormData) return;
    try {
      await postForm(pendingFormData);
      setShowFormModal(false);
      setShowFormConfirm(false);
      setPendingFormData(null);
      setNotificationType('success');
      setNotificationTitle('Formulario creado');
      setNotificationMessage('El formulario se ha creado exitosamente.');
      setShowNotification(true);
      // Optional: refresh forms if used elsewhere
    } catch (e) {
      setNotificationType('warning');
      setNotificationTitle('Error al crear formulario');
      setNotificationMessage(e.message || 'Error al crear el formulario');
      setShowNotification(true);
    }
  };

  /**
   * Handle module creation: prepare data with form associations and show confirmation
   * @param values - Module field values from modal
   */
  const handleCreateModule = (values) => {
    let selectedForms = [];
    if (Array.isArray(values.form_ids)) {
      selectedForms = values.form_ids.map(Number);
    }
    const data = {
      name: values.name,
      description: values.description,
      form_ids: selectedForms,
    };
    setPendingModuleData(data);
    setShowModuleConfirm(true);
  };

  /**
   * Handle module editing: prepare data with form associations and special security module handling
   * @param values - Module field values from edit modal
   */
  const handleEditModule = (values) => {
    let selectedForms = [];
    if (Array.isArray(values.form_ids)) {
      selectedForms = values.form_ids.map(Number);
      // Special handling: security module must always include administration form (id=1)
      if (editModule?.name?.toLowerCase() === 'seguridad' && !selectedForms.includes(1)) {
        selectedForms.push(1);
      }
    }
    const data = {
      name: values.name,
      description: values.description,
      form_ids: selectedForms,
    };
    setPendingEditData(data);
    setShowEditConfirm(true);
  };

  /**
   * Confirm and execute module creation via API
   */
  const handleConfirmCreateModule = async () => {
    if (!pendingModuleData) return;
    try {
      await postModule(pendingModuleData);
      setShowModuleModal(false);
      setShowModuleConfirm(false);
      setPendingModuleData(null);
      setNotificationType('success');
      setNotificationTitle('Módulo creado');
      setNotificationMessage('El módulo se ha creado exitosamente.');
      setShowNotification(true);
      // Refresh modules list to show new module
      const updated = await getModules();
      setModules(updated);
    } catch (e) {
      setNotificationType('warning');
      setNotificationTitle('Error al crear módulo');
      setNotificationMessage(e.message || 'Error al crear el módulo');
      setShowNotification(true);
    }
  };

  /**
   * Confirm and execute module update via API
   */
  const handleConfirmEditModule = async () => {
    if (!pendingEditData || !editModule) return;
    try {
      await putModuleForms(editModule.id, pendingEditData);
      setShowEdit(false);
      setShowEditConfirm(false);
      setPendingEditData(null);
      setEditModule(null);
      setNotificationType('success');
      setNotificationTitle('Módulo actualizado');
      setNotificationMessage('El módulo se ha actualizado exitosamente.');
      setShowNotification(true);
      // Refresh modules list to show updated module
      const updated = await getModules();
      setModules(updated);
    } catch (e) {
      setNotificationType('warning');
      setNotificationTitle('Error al actualizar módulo');
      setNotificationMessage(e.message || 'Error al actualizar el módulo');
      setShowNotification(true);
    }
  };

  /**
   * Handle enable/disable toggle: prepare module data and show confirmation
   * @param mod - Module object to toggle
   */
  const handleToggleClick = (mod) => {
    setPendingToggleModule(mod);
    setShowToggleConfirm(true);
  };

  /**
   * Confirm and execute module enable/disable toggle via API
   */
  const handleConfirmToggle = async () => {
    if (!pendingToggleModule) return;
    setShowToggleConfirm(false);
    try {
      await toggleModuleActive(pendingToggleModule.id); // Only pass the id
      setNotificationType('success');
      setNotificationTitle(pendingToggleModule.active ? 'Módulo inhabilitado' : 'Módulo habilitado');
      setNotificationMessage(
        pendingToggleModule.active
          ? `El módulo "${pendingToggleModule.name}" ha sido inhabilitado exitosamente.`
          : `El módulo "${pendingToggleModule.name}" ha sido habilitado exitosamente.`
      );
      setShowNotification(true);
      // Refresh modules list to show updated status
      const updated = await getModules();
      setModules(updated);
    } catch (e) {
      setNotificationType('warning');
      setNotificationTitle('Error al cambiar estado');
      setNotificationMessage(e.message || 'No se pudo cambiar el estado del módulo');
      setShowNotification(true);
    }
    setPendingToggleModule(null);
  };

  return (
    <>
      {/* Main container with styling */}
      <div className="bg-white p-8 rounded-lg shadow animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        {/* Header section with title and action buttons */}
        <div className="flex items-center gap-4 mb-6 justify-between">
          <h2 className="text-2xl font-bold">Gestión de Módulos - Sena</h2>
          <div className="flex gap-4">
            {/* Create form button */}
            <button
              className="flex items-center gap-2 text-white px-4 py-2 rounded font-semibold shadow transition-all duration-300 bg-[linear-gradient(to_bottom_right,_#43A047,_#2E7D32)] hover:bg-green-700 hover:shadow-lg animate-in slide-in-from-right delay-200"
              onClick={() => setShowFormModal(true)}
            >
              <span className="text-xl font-bold">+</span>  Formulario
            </button>
            {/* Create module button */}
            <button
              className="flex items-center gap-2 text-white px-4 py-2 rounded font-semibold shadow transition-all duration-300 bg-[linear-gradient(to_bottom_right,_#43A047,_#2E7D32)] hover:bg-green-700 hover:shadow-lg animate-in slide-in-from-right delay-300"
              onClick={() => setShowModuleModal(true)}
            >
              <span className="text-xl font-bold">+</span>  Modulo
            </button>
          </div>
        </div>

        {/* Filter section for search and status */}
        <div className="mb-4">
          <FilterBar
            onFilter={params => handleFilter({ search: params.search, active: params.active })}
            inputWidth="710px"
            searchPlaceholder="Buscar por nombre de módulo"
            selects={[{
              name: 'active',
              value: activeFilter,
              options: [
                { value: 'true', label: 'Activos' },
                { value: 'false', label: 'Inactivos' }
              ],
              placeholder: 'Todos',
            }]}
          />
          {/* Filter loading and error states */}
          {modulesLoading && <div className="mt-2 text-gray-500">Filtrando...</div>}
          {modulesError && <div className="mt-2 text-red-500">{modulesError}</div>}
        </div>

        {/* Modules display section with cards */}
        <div className="flex gap-4 flex-wrap">
          {/* Empty state when no modules found */}
          {paginatedModules.length === 0 ? (
            <div className="w-full text-center text-gray-500 py-12">No hay módulos disponibles</div>
          ) : (
            /* Map through paginated modules to create InfoCard components */
            paginatedModules.map((mod, index) => {
              // Special handling: hide actions for core modules (inicio, seguridad)
              const showAction = !['inicio', 'seguridad'].includes(mod.name?.toLowerCase());
              // Configure card properties for each module
              const cardProps: InfoCardProps = {
                title: mod.name,
                statusLabel: mod.active ? 'Activo' : 'Inhabilitado',
                statusColor: mod.active ? 'green' : 'red',
                description: mod.description,
                count: undefined,
                buttonText: 'Ajustar',
                // Edit button handler: load module data and show edit modal
                onButtonClick: async () => {
                  setEditLoading(true);
                  try {
                    const data = await getModuleForms(mod.id);
                    const selectedFormIds = (data.form_ids || []).map(String);
                    setEditModule({
                      id: mod.id,
                      name: data.name,
                      description: data.description,
                      form_ids: selectedFormIds,
                    });
                    setShowEdit(true);
                  } catch (e) {
                    alert(e.message || 'No se pudo cargar el módulo');
                  } finally {
                    setEditLoading(false);
                  }
                },
                // Enable/disable action button (only for non-core modules)
                actionLabel: showAction ? (mod.active ? 'Inhabilitar' : 'Habilitar') : undefined,
                actionType: showAction ? (mod.active ? 'disable' : 'enable') : undefined,
                onActionClick: showAction ? () => handleToggleClick(mod) : undefined,
              };
              return (
                /* Fixed-size container for consistent card layout */
                <div
                  key={mod.id}
                  style={{ minWidth: '320px', maxWidth: '320px', minHeight: '320px', maxHeight: '320px', height: '320px', display: 'flex' }}
                >
                  <InfoCard {...cardProps} />
                </div>
              );
            })
          )}
          {/* Pagination component when multiple pages exist */}
          {totalPages > 1 && (
            <Paginator
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              className="mt-6"
            />
          )}
        {/* Modal for editing existing modules */}
        <ModalFormGeneric
          isOpen={showEdit}
          title="Editar Modulo-Sena"
          fields={moduleFields}
          onClose={() => { setShowEdit(false); setEditModule(null); setPendingEditData(null); }}
          onSubmit={handleEditModule}
          submitText="Actualizar Modulo"
          cancelText="Cancelar"
          initialValues={editModule ? { ...editModule, form_ids: (editModule.form_ids || []).map(String) } : {}}
          customRender={undefined}
          onProgramChange={undefined}
        />
        {/* Confirmation modal for module edit */}
        <ConfirmModal
          isOpen={showEditConfirm}
          title="¿Confirmar actualización de módulo?"
          message="¿Estás seguro de que deseas actualizar este módulo?"
          confirmText="Sí, actualizar módulo"
          cancelText="Cancelar"
          onConfirm={handleConfirmEditModule}
          onCancel={() => { setShowEditConfirm(false); setPendingEditData(null); }}
        />
        </div>
        {/* Modal for creating new forms */}
        <ModalFormGeneric
          isOpen={showFormModal}
          title="Registrar Nuevo Formulario-Sena"
          fields={formFields}
          onClose={() => setShowFormModal(false)}
          onSubmit={handleCreateForm}
          submitText="Registrar Formulario"
          cancelText="Cancelar"
          customRender={undefined}
          onProgramChange={undefined}
        />
        {/* Modal for creating new modules */}
        <ModalFormGeneric
          isOpen={showModuleModal}
          title="Registrar Nuevo Modulo-Sena"
          fields={moduleFields}
          onClose={() => setShowModuleModal(false)}
          onSubmit={handleCreateModule}
          submitText="Registrar Modulo"
          cancelText="Cancelar"
          customRender={undefined}
          onProgramChange={undefined}
        />
        {/* Confirmation modal for form creation */}
        <ConfirmModal
          isOpen={showFormConfirm}
          title="¿Confirmar registro de formulario?"
          message="¿Estás seguro de que deseas crear este nuevo formulario?"
          confirmText="Sí, crear formulario"
          cancelText="Cancelar"
          onConfirm={handleConfirmCreateForm}
          onCancel={() => { setShowFormConfirm(false); setPendingFormData(null); }}
        />
        {/* Confirmation modal for module creation */}
        <ConfirmModal
          isOpen={showModuleConfirm}
          title="¿Confirmar registro de módulo?"
          message="¿Estás seguro de que deseas crear este nuevo módulo?"
          confirmText="Sí, crear módulo"
          cancelText="Cancelar"
          onConfirm={handleConfirmCreateModule}
          onCancel={() => { setShowModuleConfirm(false); setPendingModuleData(null); }}
        />
        {/* Confirmation modal for enable/disable toggle */}
        <ConfirmModal
          isOpen={showToggleConfirm}
          title={pendingToggleModule?.active ? '¿Inhabilitar módulo?' : '¿Habilitar módulo?'}
          message={pendingToggleModule?.active
            ? `¿Seguro que deseas inhabilitar el módulo "${pendingToggleModule?.name}"?`
            : `¿Seguro que deseas habilitar el módulo "${pendingToggleModule?.name}"?`}
          confirmText="Sí, confirmar"
          cancelText="Cancelar"
          onConfirm={handleConfirmToggle}
          onCancel={() => setShowToggleConfirm(false)}
        />
      </div>
      {/* Global notification modal for success/error messages */}
      <NotificationModal
        isOpen={showNotification}
        onClose={() => setShowNotification(false)}
        type={notificationType}
        title={notificationTitle}
        message={notificationMessage}
      />
    </>
  );
};

export default Modules;
