import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { proxyPathDatasets } from './constants';

const host = process.env.MOONSHOT_API_URL || 'http://localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const datasetApi = createApi({
  reducerPath: 'datasetApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${host}:${port}` }),
  endpoints: (builder) => ({
    getAllDataset: builder.query<Dataset[], void>({
      query: () => proxyPathDatasets,
      keepUnusedDataFor: 0
    }),
  }),
});

const { useGetAllDatasetQuery } = datasetApi;

export { datasetApi, useGetAllDatasetQuery };
