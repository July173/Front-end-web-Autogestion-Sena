import React, { useEffect, useState } from 'react';

/**
 * OperationSofiaDashboardView
 * - Layout: two stacked white panels
 *   1) Welcome box
 *   2) Chart card showing monthly evolution (placeholder)
 *
 * Exported: default OperationSofiaDashboardView and RoleGuardOperationSofia
 * RoleGuardOperationSofia reads `user_dashboard` or `user_data` from localStorage
 * and renders the dashboard only when role === 5.
 */

const MonthBars: React.FC = () => {
  // simple static bars to mimic the image (green tall bar + small blue bar)
  const months = [
    { m: 'Ene', g: 45, b: 10 },
    { m: 'Feb', g: 52, b: 6 },
    { m: 'Mar', g: 60, b: 12 },
    { m: 'Abr', g: 55, b: 9 },
    { m: 'May', g: 68, b: 18 },
    { m: 'Jun', g: 75, b: 14 },
  ];

  return (
    <div className="w-full">
      <div className="w-full h-56 flex items-end gap-4 px-4">
        {months.map((it) => (
          <div key={it.m} className="flex flex-col items-center gap-2">
            <div className="relative flex items-end justify-center">
              <div
                className="bg-green-500 rounded-t-md"
                style={{ width: 36, height: `${it.g}px`, boxShadow: '0 4px 8px rgba(0,0,0,0.06)' }}
              />
              <div
                className="bg-blue-500 rounded-t-md absolute"
                style={{ width: 16, height: `${it.b}px`, bottom: 0, transform: 'translateY(-100%)', left: 10 }}
              />
            </div>
            <div className="text-sm text-gray-600 mt-2">{it.m}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 justify-center mt-3 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-sm inline-block" /> Subidos
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" /> Pendientes
        </div>
      </div>
    </div>
  );
};

const OperationSofiaDashboardView: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('user_dashboard') || localStorage.getItem('user_data');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // try common locations for name
        const name = parsed?.person?.first_name || parsed?.person?.name || parsed?.email || parsed?.user?.email;
        setUserName(name || null);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  return (
    <div className="w-full flex flex-col items-center px-4 py-6">
      {/* Welcome box (white) */}
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-green-700 text-3xl md:text-4xl font-bold text-center">BIENVENIDO A AUTOGESTIÓN SENA</h1>
        <p className="text-center text-gray-600 mt-2">{userName ? `Hola, ${userName}` : 'Hola, bienvenido'}</p>
      </div>

      {/* Chart card (white) */}
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-gray-800 font-semibold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-green-600">
              <path d="M4 12l4-4 4 4 8-8" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Evolución Mensual de Procesos</span>
          </div>

          <div>
            <select className="border rounded-md px-3 py-2 text-sm">
              <option>2024</option>
              <option>2025</option>
              <option>2023</option>
            </select>
          </div>
        </div>

        {/* Chart placeholder */}
        <div className="w-full bg-white rounded-md p-4">
          <MonthBars />
        </div>
      </div>
    </div>
  );
};

/**
 * RoleGuardOperationSofia
 * Renders the dashboard only when role === 5
 */
export const RoleGuardOperationSofia: React.FC = () => {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    try {
      const keysToCheck = ['user_dashboard', 'user_data', 'user'];
      let parsed: any = null;
      for (const k of keysToCheck) {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        try {
          parsed = JSON.parse(raw);
          if (parsed) break;
        } catch (_) {
          // not JSON, skip
        }
      }

      if (!parsed) return setAllowed(false);

      // support either a flat object { role: 5 } or nested { user: { role: 5 } }
      const maybeRole = parsed?.role ?? parsed?.user?.role ?? parsed?.role_id ?? parsed?.user?.role_id;
      setAllowed(Number(maybeRole) === 5);
    } catch (e) {
      setAllowed(false);
    }
  }, []);

  if (!allowed) return null;
  return <OperationSofiaDashboardView />;
};

export default OperationSofiaDashboardView;
