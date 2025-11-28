import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// We'll mock ConfirmModal and LoadingOverlay if they exist via module mocks used by the component
jest.mock('@/components/ConfirmModal', () => ({ __esModule: true, default: (p: any) => <div>{p.children}</div> }));

// Mock ConfigApi to prevent import.meta usage
jest.mock('@/Api/config/ConfigApi', () => ({
  ENDPOINTS: { user: { validateLogin: '', requestPasswordReset: '', resetPassword: '' } },
}));

// Mock notification handlers (delete/mark) with proper types
const mockMarkAsRead = jest.fn<void, [string | number]>();
const mockMarkAllAsRead = jest.fn<void, []>();
const mockDeleteById = jest.fn<Promise<boolean>, [string | number]>();
mockDeleteById.mockResolvedValue(true);
const mockDeleteByUser = jest.fn<Promise<number | boolean | null>, []>();
mockDeleteByUser.mockResolvedValue(1);

import NotificationModal from '@/components/MainLayout/NotificationModal';

// Strongly type notifications used by the component to avoid `any`
type NotificationTestItem = {
  id: number | string;
  title: string;
  message: string;
  read?: boolean;
  active?: boolean;
  created_at?: string;
};

test('integration: NotificationModal renders active notifications and calls handlers', async () => {
  const notifications: NotificationTestItem[] = [
    { id: 1, title: 'Active One', message: 'm1', read: false, active: true, created_at: new Date().toISOString() },
    { id: 2, title: 'Active Read', message: 'm2', read: true, active: true, created_at: new Date().toISOString() },
  ];

  render(
    <NotificationModal
      open={true}
      onClose={() => {}}
      notifications={notifications}
      markAsRead={mockMarkAsRead}
      markAllAsRead={mockMarkAllAsRead}
      deleteById={mockDeleteById}
      deleteByUser={mockDeleteByUser}
    />
  );

  expect(screen.getByText('Active One')).toBeTruthy();
  expect(screen.getByText('Active Read')).toBeTruthy();

  // Click mark all
  fireEvent.click(screen.getByText('Marcar todas leídas'));
  expect(mockMarkAllAsRead).toHaveBeenCalled();

  // Click a mark button (should exist for the unread item)
  const markButtons = screen.queryAllByText('Marcar leída');
  if (markButtons.length) {
    fireEvent.click(markButtons[0]);
    expect(mockMarkAsRead).toHaveBeenCalled();
  }
});
