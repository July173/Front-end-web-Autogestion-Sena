import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import useApprenticeDashboard from '@/hook/useApprenticeDashboard';

// Mock services
jest.mock('@/Api/Services/RequestAssignaton', () => ({
  getApprenticeDashboard: jest.fn(),
}));
jest.mock('@/Api/Services/User', () => ({
  getUserById: jest.fn(),
}));
jest.mock('@/Api/Services/Enterprise', () => ({
  getEnterpriseById: jest.fn(),
}));
jest.mock('@/Api/Services/ModalityProductiveStage', () => ({
  getModalityProductiveStages: jest.fn(),
}));

import { getApprenticeDashboard } from '@/Api/Services/RequestAssignaton';
import { getUserById } from '@/Api/Services/User';
import { getEnterpriseById } from '@/Api/Services/Enterprise';
import { getModalityProductiveStages } from '@/Api/Services/ModalityProductiveStage';

// Simple component to expose hook values
const HookConsumer: React.FC<{ apprenticeId?: number }> = ({ apprenticeId }) => {
  const { dashboardData, loading, reload } = useApprenticeDashboard(apprenticeId);

  return (
    <div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="data">{dashboardData ? JSON.stringify(dashboardData) : 'null'}</div>
      <button data-testid="reload" onClick={reload}>reload</button>
    </div>
  );
};

describe('useApprenticeDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.removeItem('user_dashboard');
  });

  it('maps raw dashboard, resolves enterprise and modality, and supports reload', async () => {
    // Arrange mocks
    (getUserById as jest.Mock).mockResolvedValue({ apprentice: { id: 42 } });

    const raw = {
      id: 100,
      enterprise: 200,
      modality_productive_stage: 3,
      request_date: '2025-11-01',
      request_state: 'ASIGNADO',
      instructor_id: 77,
      instructor_first_name: 'Ana',
      instructor_first_last_name: 'Perez',
      instructor_email: 'ana@example.com',
      instructor_phone_number: '555-1234',
    };

    (getApprenticeDashboard as jest.Mock).mockResolvedValue({ data: raw });
    (getEnterpriseById as jest.Mock).mockResolvedValue({ id: 200, name: 'ACME Corp', municipio: 'Bogota' });
    (getModalityProductiveStages as jest.Mock).mockResolvedValue([{ id: 3, name_modality: 'Práctica' }]);

    // Put minimal user in localStorage to trigger getUserById
    localStorage.setItem('user_dashboard', JSON.stringify({ id: 1 }));

    // Act
    const { getByTestId } = render(<HookConsumer />);

    // Wait for load to finish
    await waitFor(() => expect(getByTestId('loading').textContent).toBe('false'));

    // Assert mapping occurred
    const dataText = getByTestId('data').textContent || '';
    expect(dataText).toContain('ACME Corp');
    expect(dataText).toContain('Práctica');
    expect(dataText).toContain('Ana');
    // getApprenticeDashboard should have been called once
    expect(getApprenticeDashboard).toHaveBeenCalledTimes(1);

    // Trigger reload -> should call again
    fireEvent.click(getByTestId('reload'));
    await waitFor(() => expect(getApprenticeDashboard).toHaveBeenCalledTimes(2));
  });

  it('returns no request when no apprentice id present', async () => {
    // Ensure getUserById returns nothing and no localStorage
    (getUserById as jest.Mock).mockResolvedValue(null);
    (getApprenticeDashboard as jest.Mock).mockResolvedValue(null);

    const { getByTestId } = render(<HookConsumer />);

    await waitFor(() => expect(getByTestId('loading').textContent).toBe('false'));
    const dataText = getByTestId('data').textContent || '';
    const ok = dataText.includes('null') || dataText.includes('has_request');
    expect(ok).toBe(true);
  });

  it('handles RECHAZADO state normalization and no instructor shown', async () => {
    (getUserById as jest.Mock).mockResolvedValue({ apprentice: { id: 11 } });

    const raw = {
      id: 10,
      request_state: 'RECHAZADO',
      instructor_id: null,
    };

    (getApprenticeDashboard as jest.Mock).mockResolvedValue({ data: raw });

    localStorage.setItem('user_dashboard', JSON.stringify({ id: 2 }));

    const { getByTestId } = render(<HookConsumer />);
    await waitFor(() => expect(getByTestId('loading').textContent).toBe('false'));

    const dataText = getByTestId('data').textContent || '';
    expect(dataText).toContain('RECHAZADO');
    // instructor should be null
    expect(dataText).toContain('"instructor":null');
  });

  it('normalizes unknown state to EN_REVISION', async () => {
    (getUserById as jest.Mock).mockResolvedValue({ apprentice: { id: 12 } });

    const raw = {
      id: 20,
      state: 'SOMETHING',
    };

    (getApprenticeDashboard as jest.Mock).mockResolvedValue({ data: raw });
    localStorage.setItem('user_dashboard', JSON.stringify({ id: 3 }));

    const { getByTestId } = render(<HookConsumer />);
    await waitFor(() => expect(getByTestId('loading').textContent).toBe('false'));

    const dataText = getByTestId('data').textContent || '';
    expect(dataText).toContain('EN_REVISION');
  });

  it('resolves enterprise lookup and numeric modality to name', async () => {
    (getUserById as jest.Mock).mockResolvedValue({ apprentice: { id: 13 } });

    const raw = {
      id: 30,
      enterprise: 300,
      modality_productive_stage: 5,
      request_date: '2025-11-01',
    };

    (getApprenticeDashboard as jest.Mock).mockResolvedValue({ data: raw });
    (getEnterpriseById as jest.Mock).mockResolvedValue({ id: 300, name: 'Empresa X', municipio: 'Cali' });
    (getModalityProductiveStages as jest.Mock).mockResolvedValue([{ id: 5, name_modality: 'Modalidad X' }]);

    localStorage.setItem('user_dashboard', JSON.stringify({ id: 4 }));

    const { getByTestId } = render(<HookConsumer />);
    await waitFor(() => expect(getByTestId('loading').textContent).toBe('false'));

    const dataText = getByTestId('data').textContent || '';
    expect(dataText).toContain('Empresa X');
    expect(dataText).toContain('Modalidad X');
    expect(dataText).toContain('2025-11-01');
  });

  it('keeps modality string when provided as string', async () => {
    (getUserById as jest.Mock).mockResolvedValue({ apprentice: { id: 14 } });

    const raw = {
      id: 40,
      modality: 'Etapa práctica',
    };

    (getApprenticeDashboard as jest.Mock).mockResolvedValue({ data: raw });
    localStorage.setItem('user_dashboard', JSON.stringify({ id: 5 }));

    const { getByTestId } = render(<HookConsumer />);
    await waitFor(() => expect(getByTestId('loading').textContent).toBe('false'));

    const dataText = getByTestId('data').textContent || '';
    expect(dataText).toContain('Etapa práctica');
  });
});
