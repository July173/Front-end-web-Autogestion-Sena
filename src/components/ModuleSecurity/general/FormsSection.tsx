import React, { useState } from 'react';
import useForms from '../../../hook/useForms';
import Paginator from '../../Paginator';
import ModalFormGeneric from '../ModalFormGeneric';
import NotificationModal from '../../NotificationModal';
import { Form as FormType } from '../../../Api/types/entities/form.types';

interface FormsSectionProps {
  open: boolean;
  onToggle: () => void;
}

const cardsPerPage = 9;

const FormsSection = ({ open, onToggle }: FormsSectionProps) => {
  const { forms, loading, error, refresh, createForm, applyFilter } = useForms();
  const [page, setPage] = useState(1);
  const [showFormModal, setShowFormModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<Partial<FormType> | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifType, setNotifType] = useState<'success' | 'info' | 'warning'>('success');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const totalPages = Math.ceil(forms.length / cardsPerPage);
  const paginated = forms.slice((page - 1) * cardsPerPage, page * cardsPerPage);

  const formFields = [
    { name: 'name', label: 'Nombre del Formulario', type: 'text', placeholder: 'Ej : gestion.' },
    { name: 'path', label: 'Direccion del Formulario', type: 'text', placeholder: 'Ej : src/user/form' },
    { name: 'description', label: 'Descripcion', type: 'text', placeholder: 'Describe que hace', maxLength: 200 },
    { name: 'active', label: 'Activo', type: 'checkbox' },
  ];

  const handleSubmitForm = (values: Partial<FormType>) => {
    setPendingFormData(values);
    setShowFormModal(true);
  };

  const handleConfirmCreate = async () => {
    if (!pendingFormData) return;
    try {
      await createForm(pendingFormData);
      setShowFormModal(false);
      setPendingFormData(null);
      setNotifType('success');
      setNotifTitle('Formulario creado');
      setNotifMessage('El formulario se creó correctamente.');
      setNotifOpen(true);
      setPage(1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setNotifType('warning');
      setNotifTitle('Error al crear formulario');
      setNotifMessage(msg);
      setNotifOpen(true);
    }
  };

  const handleFilter = async () => {
    setPage(1);
    await applyFilter({ search: search || undefined, active: activeFilter });
  };

  if (loading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="mb-8 border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between"
      >
        <div>
          <h3 className="font-semibold text-lg">Formularios</h3>
          <p className="text-sm text-gray-500">Administración de formularios del sistema ({forms.length})</p>
        </div>
        <div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowFormModal(true); }}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >+ Formulario</button>
        </div>
      </button>

      {open && (
        <div className="p-6">
          <div className="flex gap-2 mb-4">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="border p-2 rounded flex-1" />
            <select value={activeFilter} onChange={e => setActiveFilter(e.target.value)} className="border p-2 rounded">
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
            <button onClick={handleFilter} className="bg-gray-800 text-white px-3 py-2 rounded">Filtrar</button>
            <button onClick={async () => { setSearch(''); setActiveFilter(''); await refresh(); }} className="border px-3 py-2 rounded">Limpiar</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((f) => (
              <div key={f.id} className="bg-white rounded-lg shadow p-4 border">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{f.name}</h4>
                  <div className={`text-xs px-2 py-1 rounded ${f.active ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>{f.active ? 'Activo' : 'Inactivo'}</div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{f.description}</p>
                <p className="text-xs text-gray-400 mt-2">Ruta: {f.path}</p>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4">
              <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}

          <ModalFormGeneric
            isOpen={showFormModal}
            title="Agregar Formulario"
            fields={formFields}
            onClose={() => { setShowFormModal(false); setPendingFormData(null); }}
            onSubmit={handleSubmitForm}
            submitText="Registrar"
            cancelText="Cancelar"
            customRender={undefined}
            onProgramChange={undefined}
          />

          <NotificationModal isOpen={notifOpen} onClose={() => setNotifOpen(false)} type={notifType} title={notifTitle} message={notifMessage} />
        </div>
      )}
    </div>
  );
};

export default FormsSection;
