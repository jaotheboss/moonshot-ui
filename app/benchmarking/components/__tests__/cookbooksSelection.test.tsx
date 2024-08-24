import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CookbooksSelection } from '@/app/benchmarking/components/cookbooksSelection';
import { CookbooksProvider } from '@/app/benchmarking/contexts/cookbooksContext';
import { useGetCookbooksQuery } from '@/app/services/cookbook-api-service';
import {
  addBenchmarkCookbooks,
  removeBenchmarkCookbooks,
  updateBenchmarkCookbooks,
  useAppDispatch,
  useAppSelector,
} from '@/lib/redux';

jest.mock('@/lib/redux', () => ({
  addBenchmarkCookbooks: jest.fn(),
  removeBenchmarkCookbooks: jest.fn(),
  updateBenchmarkCookbooks: jest.fn(),
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));
jest.mock('@/app/services/cookbook-api-service', mockCookbookApiService);

function mockCookbookApiService() {
  return {
    useGetCookbooksQuery: jest.fn(),
  };
}

const mockCookbooks = [
  {
    id: 'cb-id-1',
    name: 'Mock Cookbook One',
    description: 'Mock description',
    recipes: ['rc-id-1'],
    total_prompt_in_cookbook: 10,
  },
  {
    id: 'cb-id-2',
    name: 'Mock Cookbook Two',
    description: 'Mock description',
    recipes: ['rc-id-2'],
    total_prompt_in_cookbook: 20,
  },
  {
    id: 'cb-id-3',
    name: 'Mock Cookbook Three',
    description: 'Mock description',
    recipes: ['rc-id-3'],
    total_prompt_in_cookbook: 30,
  },
];

function renderWithProviders(
  ui: React.ReactNode,
  { initialCookbooks = [], ...options }: { initialCookbooks?: Cookbook[] } = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <CookbooksProvider initialCookbooks={initialCookbooks}>
      {children}
    </CookbooksProvider>
  );
  return render(ui, { wrapper: Wrapper, ...options });
}

describe('CookbooksSelection', () => {
  const mockDispatch = jest.fn();
  const mockOnClose = jest.fn();
  const mockAddBenchmarkCookbooks = jest.fn();
  const mockUpdateBenchmarkCookbooks = jest.fn();

  beforeAll(() => {
    function useMockGetCookbooksQuery() {
      return {
        data: mockCookbooks,
        isFetching: false,
      };
    }

    (useAppDispatch as jest.Mock).mockImplementation(() => mockDispatch);
    (addBenchmarkCookbooks as unknown as jest.Mock).mockImplementation(
      mockAddBenchmarkCookbooks
    );
    (useGetCookbooksQuery as jest.Mock).mockImplementation(
      useMockGetCookbooksQuery
    );
    (updateBenchmarkCookbooks as unknown as jest.Mock).mockImplementation(
      mockUpdateBenchmarkCookbooks
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders cookbooks selection correctly', () => {
    const mockAlreadySelectedCookbooks = [mockCookbooks[0], mockCookbooks[2]];
    (useAppSelector as jest.Mock).mockImplementation(
      () => mockAlreadySelectedCookbooks
    );
    renderWithProviders(<CookbooksSelection onClose={mockOnClose} />);
    expect(screen.getByText(/Mock Cookbook One/i)).toBeInTheDocument();
    expect(screen.getByText(/Mock Cookbook Two/i)).toBeInTheDocument();
    expect(screen.getByText(/Mock Cookbook Three/i)).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', {
        name: `Select ${mockCookbooks[0].id}`,
      })
    ).toBeChecked();
    expect(
      screen.getByRole('checkbox', {
        name: `Select ${mockCookbooks[2].id}`,
      })
    ).toBeChecked();
    expect(
      screen.getByRole('checkbox', {
        name: `Select ${mockCookbooks[1].id}`,
      })
    ).not.toBeChecked();
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(
      updateBenchmarkCookbooks([mockCookbooks[0], mockCookbooks[2]])
    );
  });

  test('selects and deselects a cookbook', async () => {
    const mockNoSelectedCookbooks: Cookbook[] = [];
    (useAppSelector as jest.Mock).mockImplementation(
      () => mockNoSelectedCookbooks
    );
    renderWithProviders(<CookbooksSelection onClose={mockOnClose} />, {
      initialCookbooks: mockCookbooks,
    });

    const cookbookOneCheckbox = screen.getByRole('checkbox', {
      name: `Select ${mockCookbooks[0].id}`,
    });

    await userEvent.click(cookbookOneCheckbox);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(
      addBenchmarkCookbooks([mockCookbooks[0]])
    );
    expect(cookbookOneCheckbox).toBeChecked();

    await userEvent.click(cookbookOneCheckbox);
    expect(mockDispatch).toHaveBeenCalledWith(
      removeBenchmarkCookbooks([mockCookbooks[0]])
    );
    expect(cookbookOneCheckbox).not.toBeChecked();
  });

  test('closes the selection view', async () => {
    const mockAlreadySelectedCookbooks = [mockCookbooks[0], mockCookbooks[2]];
    (useAppSelector as jest.Mock).mockImplementation(
      () => mockAlreadySelectedCookbooks
    );
    renderWithProviders(<CookbooksSelection onClose={mockOnClose} />, {
      initialCookbooks: mockCookbooks,
    });

    const closeButton = screen.getByRole('button', { name: /ok/i });
    await userEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});