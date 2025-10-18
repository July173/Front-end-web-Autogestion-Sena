import React, { useEffect, useState } from 'react';
import { ENDPOINTS } from '../../Api/config/ConfigApi';
import FilterBar from '../FilterBar';
import Paginator from '../Paginator';
import { getRolesUser, toggleRoleActive, postRolPermissions, getRolPermissions, putRolFormPerms } from '../../Api/Services/Rol';
import ConfirmModal from '../ConfirmModal';
import { InfoCard } from './CardSecurity';
import type { InfoCardProps } from '../../Api/types/entities/misc.types';
import type {  RolUser } from '../../Api/types/entities/role.types';
import ModalFormGeneric from './ModalFormGeneric';
import { getForms } from '../../Api/Services/Form';
import { getPermissions } from '../../Api/Services/Permission';
import NotificationModal from '../NotificationModal';

/**
 * Roles component for managing user roles and their permissions.
 * Provides comprehensive CRUD operations for roles including creation, editing,
 * enable/disable functionality, and complex permission assignment by forms.
 * Features advanced filtering, pagination, and custom permission management UI.
 */
const Roles = () => {
  // Filter states for search and active status
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(''); // '', 'true', 'false'
  // Filtered roles list and loading states
  const [rolesFiltered, setRolesFiltered] = useState<RolUser[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState('');
  // Complete roles list
  const [roles, setRoles] = useState<RolUser[]>([]);
  // Pagination state
  const [page, setPage] = useState(1);
  const rolesPerPage = 6;
  // General loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Modal visibility states for toggle confirmation
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingRole, setPendingRole] = useState<RolUser | null>(null);
  // Modal visibility states for role creation
  const [showCreate, setShowCreate] = useState(false);
  // Forms and permissions data for role assignment
  const [forms, setForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  // Confirmation modal states for role creation
  const [pendingRoleData, setPendingRoleData] = useState(null);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  // State for forms accordion in modal (expandable form sections)
  const [openFormId, setOpenFormId] = useState(null);
  // Role editing states
  const [editRole, setEditRole] = useState(null); // Complete role data to edit
  const [showEdit, setShowEdit] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  // Confirmation modal states for role editing
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [pendingEditData, setPendingEditData] = useState(null);
  // Global notification modal states
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'warning' | 'info' | 'completed'>('success');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');


  /**
   * Handle enable/disable toggle action: prepare role data and show confirmation modal
   * @param rol - Role object to toggle active status
   */
  const handleActionClick = (rol: RolUser) => {
    setPendingRole(rol);
    setShowConfirm(true);
  };

  /**
   * Handle role editing: load complete role data with permissions and open edit modal
   * @param rol - Role object to edit
   */
  const handleEditClick = async (rol: RolUser) => {
    setEditLoading(true);
    try {
      const data = await getRolPermissions(rol.id);
      // Adapt data for the form: transform API response to form-compatible structure
      // data: { type_role, description, active, formularios: [{form_id, permission_ids:[]} ...] }
      const formularios_permisos = {};
      (data.formularios || []).forEach(f => {
        formularios_permisos[f.form_id] = f.permission_ids;
      });
      setEditRole({
        id: rol.id,
        type_role: data.type_role,
        description: data.description,
        active: data.active,
        formularios_permisos,
      });
      setShowEdit(true);
    } catch (e) {
      alert(e.message || 'No se pudo cargar el rol');
    } finally {
      setEditLoading(false);
    }
  };

  /**
   * Confirm and execute role enable/disable toggle via API
   */
  const handleConfirmAction = async () => {
    if (!pendingRole) return;
    setShowConfirm(false);
    try {
      await toggleRoleActive(pendingRole.id, pendingRole.active);
      const updated = await getRolesUser();
      setRoles(updated);
      showNotif(
        'success',
        pendingRole.active ? 'Rol inhabilitado' : 'Rol habilitado',
        pendingRole.active
          ? `El rol "${pendingRole.name}" ha sido inhabilitado exitosamente.`
          : `El rol "${pendingRole.name}" ha sido habilitado exitosamente.`
      );
    } catch (e) {
      showNotif('warning', 'Error al cambiar estado', e.message || 'No se pudo cambiar el estado del rol');
    }
    setPendingRole(null);
  };


  // Load initial roles data
  useEffect(() => {
    getRolesUser()
      .then(data => {
        setRoles(data);
        setRolesFiltered(data);
      })
      .catch(() => setError('Error al cargar los roles'))
      .finally(() => setLoading(false));
  }, []);

  /**
   * Filter roles using API endpoint with search and active status parameters
   * @param params - Filter parameters containing search and active status
   */
  const handleFilter = async (params: { search?: string; active?: string }) => {
    setRolesLoading(true);
    setRolesError('');
    const searchValue = params.search ?? search;
    const activeValue = params.active ?? activeFilter;
    setSearch(searchValue);
    setActiveFilter(activeValue);
    try {
      // Build query parameters for API call
      const query = [];
      if (searchValue) query.push(`search=${encodeURIComponent(searchValue)}`);
      if (activeValue !== '') query.push(`active=${activeValue}`);
      const url = `${ENDPOINTS.rol.filterRol}${query.length ? '?' + query.join('&') : ''}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Error al filtrar roles');
      const data = await resp.json();
      setRolesFiltered(data);
      setPage(1); // Reset pagination to first page
    } catch (e) {
      setRolesError(e.message || 'Error al filtrar roles');
    } finally {
      setRolesLoading(false);
    }
  };

  // Load forms and permissions data for role assignment
  useEffect(() => {
    getForms().then(setForms).finally(() => setLoadingForms(false));
    getPermissions().then(setPermissions).finally(() => setLoadingPermissions(false));
  }, []);

  // Loading and error states
  if (loading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;


  // Calculate pagination over filtered roles
  const totalPages = Math.ceil(rolesFiltered.length / rolesPerPage);
  const paginatedRoles = rolesFiltered.slice((page - 1) * rolesPerPage, page * rolesPerPage);

  // Form fields configuration for create/edit role modal with custom permissions assignment
  const roleFields = [
    { name: 'type_role', label: 'Nombre del Rol', type: 'text', placeholder: 'Ej: coordinador, aprendiz.' },
    { name: 'description', label: 'Descripcion', type: 'text', placeholder: 'Describe que es lo que va a administrar ese rol', maxLength: 100 },
    {
      name: 'formularios_permisos',
      label: 'Formularios y Permisos',
      type: 'custom-permissions',
      forms: forms.filter(f => f.active), // only active forms
      permissions: permissions.filter(p => p.active), // only active permissions if applicable
    },
  ];

  /**
   * Handle role creation: prepare data with form-permission associations and show confirmation
   * @param values - Form field values from create modal
   */
  const handleCreateRole = (values) => {
    // Transform form-permission object into API-compatible array structure
    const formularios = Object.entries(values.formularios_permisos || {})
      .filter(([formId, perms]) => Array.isArray(perms) && perms.length > 0)
      .map(([formId, perms]) => ({
        form_id: Number(formId),
        permission_ids: Array.isArray(perms) ? perms.map(Number) : []
      }));
    const data = {
      type_role: values.type_role,
      description: values.description,
      active: true,
      formularios,
    };
    setPendingRoleData(data);
    setShowCreateConfirm(true);
  };

  /**
   * Handle role editing: prepare updated data with form-permission associations and show confirmation
   * @param values - Form field values from edit modal
   */
  const handleEditRole = (values) => {
    // Transform form-permission object into API-compatible array structure
    const formularios = Object.entries(values.formularios_permisos || {})
      .filter(([formId, perms]) => Array.isArray(perms) && perms.length > 0)
      .map(([formId, perms]) => ({
        form_id: Number(formId),
        permission_ids: Array.isArray(perms) ? perms.map(Number) : []
      }));
    const data = {
      type_role: values.type_role,
      description: values.description,
      active: true,
      formularios,
    };
    setPendingEditData(data);
    setShowEditConfirm(true);
  };

  /**
   * Confirm and execute role creation via API
   */
  const handleConfirmCreateRole = async () => {
    if (!pendingRoleData) return;
    try {
      await postRolPermissions(pendingRoleData);
      setShowCreate(false);
      setShowCreateConfirm(false);
      setPendingRoleData(null);
      const updated = await getRolesUser();
      setRoles(updated);
      showNotif('success', 'Rol creado', 'El rol se ha creado exitosamente.');
    } catch (e) {
      showNotif('warning', 'Error al crear rol', e.message || 'Error al crear el rol');
    }
  };

  /**
   * Confirm and execute role update via API
   */
  const handleConfirmEditRole = async () => {
    if (!pendingEditData || !editRole) return;
    try {
      await putRolFormPerms(editRole.id, pendingEditData);
      setShowEdit(false);
      setShowEditConfirm(false);
      setPendingEditData(null);
      setEditRole(null);
      const updated = await getRolesUser();
      setRoles(updated);
      showNotif('success', 'Rol actualizado', 'El rol se ha actualizado exitosamente.');
    } catch (e) {
      showNotif('warning', 'Error al actualizar rol', e.message || 'Error al actualizar el rol');
    }
  };

  /**
   * Custom render component for form-permissions assignment UI.
   * Provides accordion-style interface for assigning permissions to forms,
   * with special handling for administrator role and administration forms.
   * Features expand/collapse sections, select all/deselect all, and individual permission checkboxes.
   * @param values - Current form values
   * @param setValues - Function to update form values
   */
  const renderFormPermissions = ({ values, setValues }) => {
    // Detect if current role being edited is administrator (special restrictions apply)
    const isAdminRole = (editRole?.type_role?.toLowerCase() === 'administrador');

    return (
      <div className="space-y-4">
        {/* Map through each form to create expandable permission sections */}
        {forms.map(form => {
          // Check if form has any permissions assigned
          const formChecked = Array.isArray(values.formularios_permisos?.[form.id]) && values.formularios_permisos[form.id].length > 0;
          // Check if all permissions for this form are selected
          const allPermsChecked = permissions.length > 0 && Array.isArray(values.formularios_permisos?.[form.id]) && permissions.every(perm => values.formularios_permisos[form.id].includes(perm.id));
          // Accordion expansion state
          const isOpen = openFormId === form.id;
          // Special handling for administration forms (restricted for admin role)
          const isAdminForm = form.name?.toLowerCase().includes('administración') || form.id === 1; // Adjust id if necessary

          return (
            <div key={form.id} className="border rounded-lg mb-2 bg-gray-50">
              {/* Form header with expand/collapse and form-level checkbox */}
              <div className="flex items-center p-4 cursor-pointer select-none" onClick={() => setOpenFormId(isOpen ? null : form.id)}>
                {/* Expand/collapse arrow indicator */}
                <span className={`mr-2 transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                {/* Form-level checkbox (select/deselect all permissions for this form) */}
                <input
                  type="checkbox"
                  checked={formChecked}
                  disabled={isAdminRole && isAdminForm}
                  onClick={e => e.stopPropagation()}
                  onChange={e => {
                    if (isAdminRole && isAdminForm) return;
                    setValues(prev => {
                      let newPerms = [];
                      if (e.target.checked) {
                        // Select all permissions for this form
                        newPerms = permissions.map(perm => perm.id);
                      }
                      return {
                        ...prev,
                        formularios_permisos: {
                          ...prev.formularios_permisos,
                          [form.id]: newPerms
                        }
                      };
                    });
                  }}
                />
                {/* Form name display */}
                <span className="font-semibold ml-2">{form.name}</span>
                {/* Select all/deselect all button */}
                <button
                  type="button"
                  className="ml-4 text-xs text-blue-600 underline"
                  disabled={isAdminRole && isAdminForm}
                  onClick={e => {
                    if (isAdminRole && isAdminForm) return;
                    e.stopPropagation();
                    setValues(prev => {
                      const prevPerms = Array.isArray(prev.formularios_permisos?.[form.id]) ? prev.formularios_permisos[form.id] : [];
                      let newPerms = [];
                      if (prevPerms.length < permissions.length) {
                        // Select all permissions
                        newPerms = permissions.map(perm => perm.id);
                      }
                      // If all are selected, deselect all (empty array)
                      return {
                        ...prev,
                        formularios_permisos: {
                          ...prev.formularios_permisos,
                          [form.id]: newPerms
                        }
                      };
                    });
                  }}
                >{allPermsChecked ? 'Desmarcar todos' : 'Marcar todos'}</button>
              </div>
              {/* Expandable permissions section */}
              {isOpen && (
                <div className="flex flex-wrap gap-4 ml-10 pb-4">
                  {/* Individual permission checkboxes */}
                  {permissions.map(perm => (
                    <label key={perm.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Array.isArray(values.formularios_permisos?.[form.id]) ? values.formularios_permisos[form.id].includes(perm.id) : false}
                        disabled={!formChecked || (isAdminRole && isAdminForm)}
                        onChange={e => {
                          if (isAdminRole && isAdminForm) return;
                          setValues(prev => {
                            const prevPerms = Array.isArray(prev.formularios_permisos?.[form.id]) ? prev.formularios_permisos[form.id] : [];
                            let newPerms;
                            if (e.target.checked) {
                              // Add permission to form
                              newPerms = [...prevPerms, perm.id];
                            } else {
                              // Remove permission from form
                              newPerms = prevPerms.filter(pid => pid !== perm.id);
                            }
                            return {
                              ...prev,
                              formularios_permisos: {
                                ...prev.formularios_permisos,
                                [form.id]: newPerms
                            }
                          };
                        });
                      }}
                    />
                    {/* Permission name display */}
                    <span>{perm.type_permission}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
  };

  /**
   * Utility function to show notifications with consistent interface
   * @param type - Notification type (success, warning, info, completed)
   * @param title - Notification title
  /**
   * Utility function to display notifications consistently across the component
   * @param {string} type - Notification type ('success', 'error', 'warning', 'info')
   * @param {string} title - Notification title in Spanish (UI text)
   * @param {string} message - Notification message in Spanish (UI text)
   */
  const showNotif = (type, title, message) => {
    setNotificationType(type);
    setNotificationTitle(title);
    setNotificationMessage(message);
    setShowNotification(true);
  };

  return (
    // Main container with styling and animations
    <div className="bg-white p-8 rounded-lg shadow animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Header section with title and create role button */}
      <div className="flex items-center gap-4 mb-6 justify-between">
        <h2 className="text-2xl font-bold">Gestión de Roles - Sena</h2>
        {/* Create new role button */}
        <button
          className="flex items-center gap-2 text-white px-4 py-2 rounded font-semibold shadow transition-all duration-300 bg-[linear-gradient(to_bottom_right,_#43A047,_#2E7D32)] hover:bg-green-700 hover:shadow-lg"
          onClick={() => setShowCreate(true)}
        >
          <span className="text-xl font-bold">+</span> Registro Rol
        </button>
      </div>

      {/* Filter section for search and status */}
      <div className="mb-4">
        <FilterBar
          onFilter={params => handleFilter({ search: params.search, active: params.active })}
          inputWidth="710px"
          searchPlaceholder="Buscar por nombre de rol"
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
        {rolesLoading && <div className="mt-2 text-gray-500">Filtrando...</div>}
        {rolesError && <div className="mt-2 text-red-500">{rolesError}</div>}
      </div>

      {/* Roles display section with cards grid */}
      <div className="flex gap-4 flex-wrap">
        {/* Map through paginated roles to create role cards */}
        {paginatedRoles.map((rol, index) => {
            // Adapt field names from API response (handle different field naming)
            // If the endpoint returns type_role and description, use those fields
          const nombre = rol.name || rol['type_role'] || '';
          const descripcion = rol.description || rol['description'] || '';
          const cantidadUsuarios = rol.user_count ?? 0;
          // Special handling: administrator role cannot be disabled
          const isAdministrador = nombre.toLowerCase() === 'administrador';
          // Configure card properties for each role
          const cardProps: InfoCardProps = {
            title: nombre,
            statusLabel: rol.active ? cantidadUsuarios.toString() : 'Inhabilitado',
            statusColor: rol.active ? 'green' : 'red',
            description: descripcion,
            count: cantidadUsuarios,
            buttonText: 'Ajustar',
            onButtonClick: () => handleEditClick(rol),
            // Enable/disable action (disabled for administrator role)
            actionLabel: rol.active ? 'Inhabilitar' : 'Habilitar',
            actionType: rol.active ? 'disable' : 'enable',
            onActionClick: isAdministrador ? undefined : () => handleActionClick(rol),
          };
          return (
            /* Role card container with hover animations */
            <div 
              key={rol.id}
              className={`transform transition-all duration-300 hover:scale-105 animate-in slide-in-from-left bg-white rounded-lg shadow-md flex flex-col`}
              style={{ animationDelay: `${index * 150}ms`, minWidth: '320px', maxWidth: '320px', minHeight: '220px', maxHeight: 'auto', height: 'auto', display: 'flex' }}
            >
              <InfoCard {...cardProps} />
            </div>
          );
        })}
      </div>
      {/* Pagination component when multiple pages exist */}
      {totalPages > 1 && (
        <Paginator
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      {/* Modal for editing existing roles */}
      <ModalFormGeneric
        isOpen={showEdit}
        title="Editar Rol-Sena"
        fields={roleFields}
        onClose={() => { setShowEdit(false); setEditRole(null); setPendingEditData(null); }}
        onSubmit={handleEditRole}
        submitText="Actualizar Rol"
        cancelText="Cancelar"
        initialValues={editRole || {}}
        customRender={renderFormPermissions}
        onProgramChange={undefined}
      />

      {/* Confirmation modal for role edit */}
      <ConfirmModal
        isOpen={showEditConfirm}
        title="¿Confirmar actualización de rol?"
        message="¿Estás seguro de que deseas actualizar este rol?"
        confirmText="Sí, actualizar rol"
        cancelText="Cancelar"
        onConfirm={handleConfirmEditRole}
        onCancel={() => { setShowEditConfirm(false); setPendingEditData(null); }}
      />

      {/* Confirmation modal for enable/disable toggle */}
      <ConfirmModal
        isOpen={showConfirm}
        title={pendingRole?.active ? '¿Inhabilitar rol?' : '¿Habilitar rol?'}
        message={pendingRole?.active
          ? `¿Seguro que deseas inhabilitar el rol "${pendingRole?.name}"?`
          : `¿Seguro que deseas habilitar el rol "${pendingRole?.name}"?`}
        confirmText="Sí, confirmar"
        cancelText="Cancelar"
        onConfirm={handleConfirmAction}
        onCancel={() => setShowConfirm(false)}
      />

      {/* Modal for creating new roles */}
      <ModalFormGeneric
        isOpen={showCreate}
        title="Registrar Nuevo Rol-Sena"
        fields={roleFields}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateRole}
        submitText="Registrar Rol"
        cancelText="Cancelar"
        customRender={renderFormPermissions}
        onProgramChange={undefined}
      />

      {/* Confirmation modal for role creation */}
      <ConfirmModal
        isOpen={showCreateConfirm}
        title="¿Confirmar registro de rol?"
        message="¿Estás seguro de que deseas crear este nuevo rol?"
        confirmText="Sí, crear rol"
        cancelText="Cancelar"
        onConfirm={handleConfirmCreateRole}
        onCancel={() => { setShowCreateConfirm(false); setPendingRoleData(null); }}
      />

      {/* Global notification modal for success/error messages */}
      <NotificationModal
        isOpen={showNotification}
        onClose={() => setShowNotification(false)}
        type={notificationType}
        title={notificationTitle}
        message={notificationMessage}
      />
    </div>
  );
};


export default Roles;
