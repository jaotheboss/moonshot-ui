import { BenchmarkNewSessionViews } from './enums';

type Action = {
  type:
    | 'NEXT_BTN_CLICK'
    | 'PREV_BTN_CLICK'
    | 'CREATE_MODEL_CLICK'
    | 'EDIT_MODEL_CLICK'
    | 'CLOSE_MODEL_FORM'
    | 'COOKBOOK_SELECTION_CLICK'
    | 'MORE_COOKBOOKS_LINK_CLICK';
  cookbooksLength?: number;
  modelsLength?: number;
  modelToEdit?: LLMEndpoint;
};

type FlowState = {
  steps: string[];
  stepIndex: number;
  view: BenchmarkNewSessionViews;
  hideNextBtn: boolean;
  hidePrevBtn: boolean;
  enableNextBtn: boolean;
  disableNextBtn: boolean;
  modelToEdit: LLMEndpoint | undefined;
};

const flowSteps = ['Your LLM', 'Recommended Tests', 'Connect Endpoint', 'Run'];

export const initialState: FlowState = {
  steps: flowSteps,
  stepIndex: 0,
  view: BenchmarkNewSessionViews.TOPICS_SELECTION,
  hideNextBtn: false,
  hidePrevBtn: true,
  enableNextBtn: false,
  disableNextBtn: false,
  modelToEdit: undefined,
};

export function benchmarkNewSessionFlowReducer(
  state: FlowState,
  action: Action
) {
  switch (action.type) {
    case 'NEXT_BTN_CLICK':
      if (state.view === BenchmarkNewSessionViews.TOPICS_SELECTION) {
        return {
          ...state,
          stepIndex: state.stepIndex + 1,
          view: BenchmarkNewSessionViews.RECOMMENDED_TESTS,
          hidePrevBtn: false,
          disableNextBtn: action.cookbooksLength === 0,
        };
      }
      if (state.view === BenchmarkNewSessionViews.RECOMMENDED_TESTS) {
        return {
          ...state,
          stepIndex: state.stepIndex + 1,
          view: BenchmarkNewSessionViews.ENDPOINTS_SELECTION,
          hidePrevBtn: false,
          hideNextBtn: false,
          disablePrevBtn: false,
          disableNextBtn: action.modelsLength === 0,
        };
      }
      if (state.view === BenchmarkNewSessionViews.ENDPOINTS_SELECTION) {
        return {
          ...state,
          stepIndex: state.stepIndex + 1,
          view: BenchmarkNewSessionViews.BENCHMARK_RUN_FORM,
          hideNextBtn: true,
          disableNextBtn: true,
        };
      }
    case 'PREV_BTN_CLICK':
      if (state.view === BenchmarkNewSessionViews.BENCHMARK_RUN_FORM) {
        return {
          ...state,
          stepIndex: state.stepIndex - 1,
          view: BenchmarkNewSessionViews.ENDPOINTS_SELECTION,
          hidePrevBtn: false,
          disableNextBtn: action.cookbooksLength === 0,
        };
      }
      if (state.view === BenchmarkNewSessionViews.ENDPOINTS_SELECTION) {
        return {
          ...state,
          stepIndex: state.stepIndex - 1,
          view: BenchmarkNewSessionViews.RECOMMENDED_TESTS,
          disableNextBtn: false,
        };
      }
      if (state.view === BenchmarkNewSessionViews.RECOMMENDED_TESTS) {
        return {
          ...state,
          stepIndex: state.stepIndex - 1,
          view: BenchmarkNewSessionViews.TOPICS_SELECTION,
          hidePrevBtn: true,
          disableNextBtn: action.cookbooksLength === 0,
        };
      }
    case 'COOKBOOK_SELECTION_CLICK':
      return {
        ...state,
        disableNextBtn: action.cookbooksLength === 0,
      };
    case 'MORE_COOKBOOKS_LINK_CLICK':
      return {
        ...state,
        view: BenchmarkNewSessionViews.COOKBOOKS_SELECTION,
        hideNextBtn: true,
        hidePrevBtn: true,
        disableNextBtn: true,
        disablePrevBtn: true,
      };
    case 'CREATE_MODEL_CLICK':
      return {
        ...state,
        view: BenchmarkNewSessionViews.NEW_ENDPOINT_FORM,
      };
    case 'EDIT_MODEL_CLICK':
      return {
        ...state,
        view: BenchmarkNewSessionViews.EDIT_ENDPOINT_FORM,
        modelToEdit: action.modelToEdit,
      };
    case 'CLOSE_MODEL_FORM':
      return {
        ...state,
        view: BenchmarkNewSessionViews.ENDPOINTS_SELECTION,
        modelToEdit: undefined,
      };
    default:
      return state;
  }
}
