import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BenchmarkNewSessionFlow } from '@/app/benchmarking/components/benchmarkNewSessionFlow';
import { useModelsList } from '@/app/hooks/useLLMEndpointList';
import { useRunBenchmarkMutation } from '@/app/services/benchmark-api-service';
import { useGetCookbooksQuery } from '@/app/services/cookbook-api-service';
import { useAppDispatch, useAppSelector } from '@/lib/redux';

const mockCookbooks: Cookbook[] = [
  {
    id: 'cb-id-1',
    name: 'Mock Cookbook One',
    description: 'Mock description',
    recipes: ['rc-id-1'],
    total_prompt_in_cookbook: 10,
    endpoint_required: null,
  },
  {
    id: 'cb-id-2',
    name: 'Mock Cookbook Two',
    description: 'Mock description',
    recipes: ['rc-id-2'],
    total_prompt_in_cookbook: 20,
    endpoint_required: ['endpoint-id-1'],
  },
];

const mockEndpoints: LLMEndpoint[] = [
  {
    id: '1',
    connector_type: 'type1',
    name: 'Endpoint 1',
    uri: 'http://endpoint1.com',
    token: 'token1',
    max_calls_per_second: 10,
    max_concurrency: 5,
    created_date: '2023-01-01',
    params: { param1: 'value1' },
  },
  {
    id: '2',
    connector_type: 'type2',
    name: 'Endpoint 2',
    uri: 'http://endpoint2.com',
    token: 'token2',
    max_calls_per_second: 20,
    max_concurrency: 10,
    created_date: '2023-02-01',
    params: { param2: 'value2' },
  },
];

jest.mock('@/lib/redux', () => ({
  addBenchmarkModels: jest.fn(),
  addBenchmarkCookbooks: jest.fn(),
  removeBenchmarkModels: jest.fn(),
  resetBenchmarkCookbooks: jest.fn(),
  resetBenchmarkModels: jest.fn(),
  updateBenchmarkCookbooks: jest.fn(),
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('@/app/services/cookbook-api-service', () => ({
  useGetCookbooksQuery: jest.fn(),
}));
jest.mock('@/app/hooks/useLLMEndpointList', () => ({
  useModelsList: jest.fn(),
}));
jest.mock('@/app/services/connector-api-service', () => ({
  useGetAllConnectorsQuery: jest.fn(),
}));
jest.mock('@/app/services/llm-endpoint-api-service', () => ({
  useCreateLLMEndpointMutation: jest.fn(),
  useUpdateLLMEndpointMutation: jest.fn(),
}));
jest.mock('@/app/services/benchmark-api-service', () => ({
  useRunBenchmarkMutation: jest.fn(),
}));

it('should show correct views when next or back icons are clicked (No cookbooks with required endpoints selected)', async () => {
  let callCount = 1;
  (useAppSelector as jest.Mock).mockImplementation(() => {
    if (callCount === 1) {
      callCount++;
      return [mockCookbooks[0]];
    }
    callCount--;
    return [];
  });
  (useGetCookbooksQuery as jest.Mock).mockReturnValue({
    data: mockCookbooks,
    isFetching: false,
  });
  (useModelsList as jest.Mock).mockImplementation(() => ({
    models: mockEndpoints,
    isLoading: false,
    error: null,
  }));
  (useAppDispatch as jest.Mock).mockImplementation(() => jest.fn());
  (useRunBenchmarkMutation as jest.Mock).mockReturnValue([
    jest.fn(),
    { isLoading: false },
  ]);

  render(<BenchmarkNewSessionFlow />);
  const nextButton = screen.getByRole('button', { name: /Next View/i });

  // topics selection screen
  expect(screen.getByText(mockCookbooks[0].name)).toBeInTheDocument();
  expect(screen.getByText(mockCookbooks[1].name)).toBeInTheDocument();
  await userEvent.click(nextButton);

  // recommended tests screen
  expect(
    screen.getByText(mockCookbooks[0].total_prompt_in_cookbook)
  ).toBeInTheDocument();
  await userEvent.click(nextButton);

  // endpoints selection screen
  expect(screen.getByText(mockEndpoints[0].name)).toBeInTheDocument();
  expect(screen.getByText(mockEndpoints[1].name)).toBeInTheDocument();
  expect(
    screen.getByRole('checkbox', { name: /Select Endpoint 1/i })
  ).not.toBeChecked();
  await userEvent.click(
    screen.getByRole('checkbox', { name: /Select Endpoint 1/i })
  );
  expect(
    screen.getByRole('checkbox', { name: /Select Endpoint 1/i })
  ).toBeChecked();
  await userEvent.click(nextButton);

  // benchmark run form screen
  expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();

  // prepare to go back
  const prevButton = screen.getByRole('button', { name: /Previous View/i });

  // simulate 1 endpoint selected
  callCount = 1;
  (useAppSelector as jest.Mock).mockReset();
  (useAppSelector as jest.Mock).mockImplementation(() => {
    if (callCount === 1) {
      callCount++;
      return [mockCookbooks[0]];
    }
    callCount--;
    return [mockEndpoints[0]];
  });
  await userEvent.click(prevButton);

  // back at endpoints selection screen
  expect(
    screen.getByRole('checkbox', { name: /Select Endpoint 1/i })
  ).toBeChecked();
  await userEvent.click(prevButton);

  // recommended tests screen
  expect(
    screen.getByText(mockCookbooks[0].total_prompt_in_cookbook)
  ).toBeInTheDocument();

  await userEvent.click(prevButton);

  // back at topics selection screen
  expect(screen.getByText(mockCookbooks[0].name)).toBeInTheDocument();
  expect(screen.getByText(mockCookbooks[1].name)).toBeInTheDocument();
});

it('should show required endpoints reminder modal when next is clicked (cookbooks with required endpoints selected)', async () => {
  let callCount = 1;
  (useAppSelector as jest.Mock).mockImplementation(() => {
    if (callCount === 1) {
      callCount++;
      return [mockCookbooks[1]]; // cookbook with required endpoints
    }
    callCount--;
    return [];
  });
  (useGetCookbooksQuery as jest.Mock).mockReturnValue({
    data: mockCookbooks,
    isFetching: false,
  });
  (useModelsList as jest.Mock).mockImplementation(() => ({
    models: mockEndpoints,
    isLoading: false,
    error: null,
  }));
  (useAppDispatch as jest.Mock).mockImplementation(() => jest.fn());
  (useRunBenchmarkMutation as jest.Mock).mockReturnValue([
    jest.fn(),
    { isLoading: false },
  ]);

  render(<BenchmarkNewSessionFlow />);
  const nextButton = screen.getByRole('button', { name: /Next View/i });

  // topics selection screen
  await userEvent.click(nextButton);

  // recommended tests screen
  expect(
    screen.getByText(mockCookbooks[1].total_prompt_in_cookbook)
  ).toBeInTheDocument();
  await userEvent.click(nextButton);

  // endpoints selection screen
  await userEvent.click(
    screen.getByRole('checkbox', { name: /Select Endpoint 1/i })
  );
  await userEvent.click(nextButton);

  // required endpoints reminder modal
  mockCookbooks[1].endpoint_required?.forEach((endpoint) => {
    expect(screen.getByText(endpoint)).toBeInTheDocument();
  });
  await userEvent.click(screen.getByRole('button', { name: /No/i }));

  // remain on endpoints selection screen
  expect(
    screen.getByRole('checkbox', { name: /Select Endpoint 1/i })
  ).toBeChecked();
  await userEvent.click(nextButton);

  // click yes on required endpoints reminder modal
  await userEvent.click(screen.getByRole('button', { name: /Yes/i }));

  // benchmark run form screen
  expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();

  // prepare to go back
  const prevButton = screen.getByRole('button', { name: /Previous View/i });

  // simulate 1 endpoint selected
  callCount = 1;
  (useAppSelector as jest.Mock).mockReset();
  (useAppSelector as jest.Mock).mockImplementation(() => {
    if (callCount === 1) {
      callCount++;
      return [mockCookbooks[0]];
    }
    callCount--;
    return [mockEndpoints[0]];
  });
  await userEvent.click(prevButton);

  // back at endpoints selection screen
  expect(
    screen.getByRole('checkbox', { name: /Select Endpoint 1/i })
  ).toBeChecked();
  await userEvent.click(prevButton);
});

it('should show more cookbooks screen', async () => {
  let callCount = 1;
  (useAppSelector as jest.Mock).mockImplementation(() => {
    if (callCount === 1) {
      callCount++;
      return [mockCookbooks[0]];
    }
    callCount--;
    return [];
  });
  (useGetCookbooksQuery as jest.Mock).mockReturnValue({
    data: mockCookbooks,
    isFetching: false,
  });
  (useModelsList as jest.Mock).mockImplementation(() => ({
    models: mockEndpoints,
    isLoading: false,
    error: null,
  }));
  (useAppDispatch as jest.Mock).mockImplementation(() => jest.fn());
  (useRunBenchmarkMutation as jest.Mock).mockReturnValue([
    jest.fn(),
    { isLoading: false },
  ]);

  render(<BenchmarkNewSessionFlow />);
  const nextButton = screen.getByRole('button', { name: /Next View/i });

  // topics selection screen
  expect(screen.getByText(mockCookbooks[0].name)).toBeInTheDocument();
  expect(screen.getByText(mockCookbooks[1].name)).toBeInTheDocument();
  await userEvent.click(nextButton);

  // recommended tests screen
  expect(
    screen.getByText(mockCookbooks[0].total_prompt_in_cookbook)
  ).toBeInTheDocument();

  await userEvent.click(screen.getByText(/these cookbooks/i));

  // more cookbooks screen
  expect(
    screen.getByRole('button', { name: /capability/i })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /trust & safety/i })
  ).toBeInTheDocument();
  expect(screen.getByText(mockCookbooks[1].name)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /ok/i }));

  // back at recommended tests screen
  expect(screen.getByText(/these cookbooks/i)).toBeInTheDocument();
});

it('should show the shorter three stepsflow', async () => {
  (useAppSelector as jest.Mock).mockImplementation(() => []); // simulate no cookbooks selected
  (useGetCookbooksQuery as jest.Mock).mockReturnValue({
    data: mockCookbooks,
    isFetching: false,
  });
  (useModelsList as jest.Mock).mockImplementation(() => ({
    models: mockEndpoints,
    isLoading: false,
    error: null,
  }));
  (useAppDispatch as jest.Mock).mockImplementation(() => jest.fn());
  (useRunBenchmarkMutation as jest.Mock).mockReturnValue([
    jest.fn(),
    { isLoading: false },
  ]);

  const { rerender } = render(<BenchmarkNewSessionFlow threeStepsFlow />);
  // more cookbooks screen
  expect(
    screen.getByRole('button', { name: /capability/i })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /trust & safety/i })
  ).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /ok/i })).toBeFalsy();

  await userEvent.click(
    screen.getByRole('checkbox', { name: `Select ${mockCookbooks[0].id}` })
  );
  expect(
    screen.getByRole('checkbox', { name: `Select ${mockCookbooks[0].id}` })
  ).toBeChecked();

  // simulate select cookbook
  await act(async () => {
    (useAppSelector as jest.Mock).mockReset();
    (useAppSelector as jest.Mock).mockImplementation(() => [mockCookbooks[0]]);
    rerender(<BenchmarkNewSessionFlow threeStepsFlow />);
  });
  await userEvent.click(screen.getByRole('button', { name: /ok/i }));

  // back to recommended tests screen
  expect(
    screen.getByText(mockCookbooks[0].total_prompt_in_cookbook)
  ).toBeInTheDocument();

  // reset useAppSelector mock to return empty array for selected endpoints
  (useAppSelector as jest.Mock).mockReset();
  (useAppSelector as jest.Mock).mockImplementation(() => []);
  const nextButton = screen.getByRole('button', { name: /Next View/i });
  await userEvent.click(nextButton);

  // endpoints selection screen
  expect(screen.getByText(mockEndpoints[0].name)).toBeInTheDocument();
  expect(screen.getByText(mockEndpoints[1].name)).toBeInTheDocument();
  expect(
    screen.getByRole('checkbox', { name: /Select Endpoint 1/i })
  ).not.toBeChecked();
  await userEvent.click(
    screen.getByRole('checkbox', { name: /Select Endpoint 1/i })
  );
  expect(
    screen.getByRole('checkbox', { name: /Select Endpoint 1/i })
  ).toBeChecked();
  await userEvent.click(nextButton);

  // benchmark run form screen
  expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();

  const prevButton = screen.getByRole('button', { name: /Previous View/i });
  await userEvent.click(prevButton);

  // back at endpoints selection screen
  expect(screen.getByText(mockEndpoints[0].name)).toBeInTheDocument();
  expect(screen.getByText(mockEndpoints[1].name)).toBeInTheDocument();

  // mock selected cookbook and model and go back
  let callCount = 1;
  (useAppSelector as jest.Mock).mockReset();
  (useAppSelector as jest.Mock).mockImplementation(() => {
    if (callCount === 1) {
      callCount++;
      return [mockCookbooks[0]];
    }
    callCount--;
    return [mockEndpoints[0]];
  });
  await userEvent.click(prevButton);

  // back at recommended tests screen
  expect(
    screen.getByText(mockCookbooks[0].total_prompt_in_cookbook)
  ).toBeInTheDocument();
});
