import { useFormik } from 'formik';
import { useEffect } from 'react';
import { object, string, number, array } from 'yup';
import { Button, ButtonType } from '@/app/components/button';
import { TextArea } from '@/app/components/textArea';
import { TextInput } from '@/app/components/textInput';
import { useRunBenchmarkMutation } from '@/app/services/benchmark-api-service';
import { BenchmarkCollectionType } from '@/app/types/enums';
import { colors } from '@/app/views/shared-components/customColors';
import { useAppDispatch, useAppSelector } from '@/lib/redux';

const initialFormValues: BenchmarkRunFormValues = {
  run_name: '',
  description: '',
  inputs: [],
  endpoints: [],
  num_of_prompts: '0',
  system_prompt: '',
  runner_processing_module: 'benchmarking',
  random_seed: '0',
};

const validationSchema = object().shape({
  run_name: string().required('Name is required'),
  description: string(),
  num_of_prompts: number()
    .required('Number of Prompts is required')
    .typeError('Number of Prompts must be a number')
    .min(0, 'Number of Prompts cannot be a negative number'),
  cookbooks: array().min(1, 'At least one cookbook is required'),
  endpoints: array().min(1, 'At least one endpoint is required'),
});

function BenchmarkRunForm() {
  const selectedCookbooks = useAppSelector(
    (state) => state.benchmarkCookbooks.entities
  );
  const selectedEndpoints = useAppSelector(
    (state) => state.benchmarkModels.entities
  );
  const formik = useFormik({
    initialValues: initialFormValues,
    validationSchema: validationSchema,
    onSubmit: (values) => {
      createBenchmarkRun(values);
    },
  });
  const [runBenchmark, { data, error, isLoading }] = useRunBenchmarkMutation();

  async function createBenchmarkRun(data: BenchmarkRunFormValues) {
    console.log(data);
    const response = await runBenchmark({
      benchmarkRunInputData: data,
      collectionType: BenchmarkCollectionType.COOKBOOK,
    });
    if ('error' in response) {
      console.error(response.error);
      return;
    }
  }

  useEffect(() => {
    formik.setFieldValue(
      'cookbooks',
      selectedCookbooks.map((cb) => cb.id)
    );
  }, [selectedCookbooks]);

  useEffect(() => {
    formik.setFieldValue(
      'endpoints',
      selectedEndpoints.map((ep) => ep.id)
    );
  }, [selectedEndpoints]);

  return (
    <section className="flex flex-col items-center justify-center min-h-[300px] gap-5">
      <div className="flex flex-col w-[50%] gap-2">
        <TextInput
          name="run_name"
          label="Name"
          onChange={formik.handleChange}
          value={formik.values.run_name}
          onBlur={formik.handleBlur}
          error={
            formik.touched.run_name && formik.errors.run_name
              ? formik.errors.run_name
              : undefined
          }
          labelStyles={{
            fontSize: '1rem',
            color: colors.moonpurplelight,
          }}
          inputStyles={{ height: 38 }}
          placeholder="Give this sessio a unique name"
        />

        <TextArea
          name="description"
          label="Description (optional)"
          labelStyles={{
            fontSize: '1rem',
            color: colors.moonpurplelight,
          }}
          onChange={formik.handleChange}
          value={formik.values.description}
          error={
            formik.touched.description && formik.errors.description
              ? formik.errors.description
              : undefined
          }
          placeholder="Description of this benchmark run"
        />

        <p className="text-white text-[0.9rem]">
          Before running the full recommended set, you may want to run a smaller
          number of prompts from each recipe to do a sanity check.
        </p>

        <TextInput
          name="num_of_prompts"
          label="Run a smaller set"
          labelStyles={{
            fontSize: '1rem',
            color: colors.moonpurplelight,
          }}
          inputStyles={{ height: 38 }}
          onChange={formik.handleChange}
          value={formik.values.num_of_prompts}
          onBlur={formik.handleBlur}
          error={
            formik.touched.num_of_prompts && formik.errors.num_of_prompts
              ? formik.errors.num_of_prompts
              : undefined
          }
          placeholder="Number of prompts perrecipe. E.g., 5"
        />

        <div className="flex grow gap-2 justify-center items-end mt-3">
          <Button
            disabled={isLoading || !formik.isValid}
            mode={ButtonType.PRIMARY}
            size="lg"
            type="button"
            text="Run"
            onClick={() => formik.handleSubmit()}
          />
        </div>
      </div>
    </section>
  );
}

export default BenchmarkRunForm;
