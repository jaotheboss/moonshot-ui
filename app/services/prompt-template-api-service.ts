import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getHostAndPort } from './host';

const [host, port] = getHostAndPort();
const promptTemplateApi = createApi({
  reducerPath: 'promptTemplateApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${host}:${port}` }),
  endpoints: (builder) => ({
    getPromptTemplates: builder.query<PromptTemplate[], void>({
      query: () => 'api/v1/prompt_templates',
      keepUnusedDataFor: 0,
    }),
  }),
});

const { useLazyGetPromptTemplatesQuery, useGetPromptTemplatesQuery } =
  promptTemplateApi;

export {
  promptTemplateApi,
  useLazyGetPromptTemplatesQuery,
  useGetPromptTemplatesQuery,
};
