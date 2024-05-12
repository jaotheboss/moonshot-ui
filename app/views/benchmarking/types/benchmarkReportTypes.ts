type CookbooksBenchmarkResult = {
  metadata: {
    id: string;
    start_time: string;
    end_time: string;
    duration: number;
    status: string;
    recipes: null;
    cookbooks: string[];
    endpoints: string[];
    num_of_prompts: number;
    random_seed: number;
    system_prompt: string;
  };
  results: {
    cookbooks: CookbookResult[];
  };
};

type CookbookResult = {
  id: string;
  recipes: RecipeResult[];
  overall_evaluation_summary: EvaluationSummary[];
  total_num_of_prompts: number;
};

type RecipeResult = {
  id: string;
  details: RecipeDetail[];
  evaluation_summary: EvaluationSummary[];
  grading_scale: GradingScale;
  total_num_of_prompts: number;
};

type RecipeDetail = {
  model_id: string;
  dataset_id: string;
  prompt_template_id: string;
  data: RecipePromptData[];
  metrics: Metric[];
};

type RecipePromptData = {
  prompt: string;
  predicted_result: string;
  target: string;
  duration: number;
};

type Metric = {
  accuracy?: number;
  grading_criteria: {
    accuracy?: number;
    attack_success_rate?: number;
    toxicity_rate?: number;
  };
};

type EvaluationSummary = {
  model_id: string;
  num_of_prompts: number;
  avg_grade_value: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
};

type GradingScale = {
  A: number[];
  B: number[];
  C: number[];
  D: number[];
  E: number[];
};

export type {
  CookbooksBenchmarkResult,
  CookbookResult,
  RecipeResult,
  RecipeDetail,
  RecipePromptData,
  Metric,
  EvaluationSummary,
  GradingScale,
};