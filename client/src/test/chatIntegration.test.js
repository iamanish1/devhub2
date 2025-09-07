import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ChatProvider } from '../context/ChatContext';
import { PaymentProvider } from '../context/PaymentContext';
import ProjectChat from '../components/ProjectChat';
import AdminContributionBoard from '../components/AdminContributionBoard';
import ContributionPage from '../pages/ContributionPage';

// Mock the chat service
jest.mock('../services/chatService', () => ({
  connect: jest.fn(() => Promise.resolve()),
  joinProject: jest.fn(),
  leaveProject: jest.fn(),
  onMessage: jest.fn(() => () => {}),
  onTyping: jest.fn(() => () => {}),
  onUserEvent: jest.fn(() => () => {}),
  onError: jest.fn(),
  getProjectMessages: jest.fn(() => Promise.resolve({ messages: [] })),
  getCachedOnlineUsers: jest.fn(() => []),
  sendUserActivity: jest.fn(),
  isConnected: true
}));

// Mock notification service
jest.mock('../services/notificationService', () => ({
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <PaymentProvider>
        <ChatProvider>
          {children}
        </ChatProvider>
      </PaymentProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Chat Integration Tests', () => {
  const mockUser = {
    _id: 'user123',
    username: 'testuser',
    name: 'Test User'
  };

  const mockProject = {
    _id: 'project123',
    title: 'Test Project'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ProjectChat component renders without errors', async () => {
    render(
      <TestWrapper>
        <ProjectChat 
          projectId={mockProject._id}
          projectTitle={mockProject.title}
          onClose={() => {}}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(mockProject.title)).toBeInTheDocument();
    });
  });

  test('ProjectChat handles online users display', async () => {
    const mockOnlineUsers = [
      { userId: 'user1', username: 'user1' },
      { userId: 'user2', username: 'user2' }
    ];

    const { getCachedOnlineUsers } = require('../services/chatService');
    getCachedOnlineUsers.mockReturnValue(mockOnlineUsers);

    render(
      <TestWrapper>
        <ProjectChat 
          projectId={mockProject._id}
          projectTitle={mockProject.title}
          onClose={() => {}}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('2 online')).toBeInTheDocument();
    });
  });

  test('AdminContributionBoard integrates with chat context', async () => {
    render(
      <TestWrapper>
        <AdminContributionBoard />
      </TestWrapper>
    );

    // Should render without crashing
    await waitFor(() => {
      expect(screen.getByText(/DevHubs Management/i)).toBeInTheDocument();
    });
  });

  test('ContributionPage integrates with chat context', async () => {
    // Mock useParams
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useParams: () => ({ _id: mockProject._id })
    }));

    render(
      <TestWrapper>
        <ContributionPage />
      </TestWrapper>
    );

    // Should render without crashing
    await waitFor(() => {
      expect(screen.getByText(/Project Workspace/i)).toBeInTheDocument();
    });
  });

  test('Chat context provides online users count', async () => {
    const TestComponent = () => {
      const { getOnlineUsersCount } = useChat();
      return <div data-testid="online-count">{getOnlineUsersCount('project123')}</div>;
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('online-count')).toHaveTextContent('0');
    });
  });

  test('Chat error boundary handles errors gracefully', async () => {
    const ErrorComponent = () => {
      throw new Error('Test error');
    };

    render(
      <TestWrapper>
        <ErrorComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Chat Connection Error/i)).toBeInTheDocument();
    });
  });
});
