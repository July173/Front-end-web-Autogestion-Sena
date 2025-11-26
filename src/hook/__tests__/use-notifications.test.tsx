import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import useNotifications from '@/hook/use-notifications';

// Mock API services
jest.mock('@/Api/Services/Notification', () => ({
  getNotifications: jest.fn(),
  getNotificationById: jest.fn(),
  deleteNotificationById: jest.fn(),
  deleteNotificationsByUser: jest.fn(),
}));

import {
  getNotifications as apiGetNotifications,
  getNotificationById as apiGetNotificationById,
  deleteNotificationById as apiDeleteNotificationById,
  deleteNotificationsByUser as apiDeleteNotificationsByUser,
} from '@/Api/Services/Notification';

// Simple consumer to expose hook values and actions
const HookConsumer: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteById, deleteByUser } = useNotifications(1, 'apprentice');

  return (
    <div>
      <div data-testid="count">{unreadCount}</div>
      <div data-testid="items">{JSON.stringify(notifications)}</div>
      <button data-testid="markAll" onClick={() => markAllAsRead()}>
        markAll
      </button>
      <button data-testid="deleteById" onClick={() => deleteById(1)}>
        deleteById
      </button>
      <button data-testid="deleteByUser" onClick={() => deleteByUser()}>
        deleteByUser
      </button>
      <button data-testid="markOne" onClick={() => markAsRead(1)}>
        markOne
      </button>
    </div>
  );
};

describe('useNotifications', () => {
  let originalWebSocket: any;
  let wsInstances: any[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    // fake WebSocket
    originalWebSocket = (global as any).WebSocket;
    class FakeWS {
      url: string;
      onopen: (() => void) | null = null;
      onmessage: ((ev: { data: string }) => void) | null = null;
      onclose: (() => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      constructor(url: string) {
        this.url = url;
        wsInstances.push(this);
        setTimeout(() => this.onopen && this.onopen(), 0);
      }
      send() {}
      close() { this.onclose && this.onclose(); }
      // helper for tests
      triggerMessage(data: any) {
        this.onmessage?.({ data: JSON.stringify(data) });
      }
    }
    wsInstances = [];
    (global as any).WebSocket = FakeWS as any;
  });

  afterEach(() => {
    (global as any).WebSocket = originalWebSocket;
  });

  it('fetches and maps notifications and supports mark/delete operations and websocket', async () => {
    const apiList = [
      { id: 1, title: 'One', message: 'm1', is_read: false, active: true, created_at: new Date().toISOString() },
      { id: 2, title: 'Two', message: 'm2', is_read: true, active: true, created_at: new Date().toISOString() },
    ];

    (apiGetNotifications as jest.Mock).mockResolvedValue(apiList);
    (apiGetNotificationById as jest.Mock).mockResolvedValue({ id: 1, is_read: true });
    (apiDeleteNotificationById as jest.Mock).mockResolvedValue(true);
    (apiDeleteNotificationsByUser as jest.Mock).mockResolvedValue(2);

    render(<HookConsumer />);

    await waitFor(() => expect(screen.getByTestId('items').textContent).toContain('One'));

    // unreadCount should be 1
    expect(screen.getByTestId('count').textContent).toBe('1');

    // mark one as read
    fireEvent.click(screen.getByTestId('markOne'));
    await waitFor(() => expect(apiGetNotificationById).toHaveBeenCalledWith(1));

    // mark all as read
    fireEvent.click(screen.getByTestId('markAll'));
    await waitFor(() => expect(apiGetNotificationById).toHaveBeenCalled());

    // delete by id
    fireEvent.click(screen.getByTestId('deleteById'));
    await waitFor(() => expect(apiDeleteNotificationById).toHaveBeenCalledWith(1));

    // delete by user
    fireEvent.click(screen.getByTestId('deleteByUser'));
    await waitFor(() => expect(apiDeleteNotificationsByUser).toHaveBeenCalled());

    // Test websocket onmessage adds a notification
    const last = wsInstances[wsInstances.length - 1];
    if (last && last.triggerMessage) {
      act(() => {
        last.triggerMessage({ id: 99, title: 'WS', message: 'from ws', is_read: false, active: true });
      });
      await waitFor(() => expect(screen.getByTestId('items').textContent).toContain('WS'));
    }
  });
});
