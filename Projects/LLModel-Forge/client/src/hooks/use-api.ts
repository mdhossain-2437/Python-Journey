import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthFetch } from "./use-auth";
import { secureStorage } from "@/lib/secure-storage";

// Types
export interface Model {
  id: string;
  name: string;
  version: string;
  stage: "development" | "staging" | "production" | "archived";
  framework: string;
  description: string | null;
  accuracy: number | null;
  f1Score: number | null;
  latency: number | null;
  tags: string[];
  authorId: string | null;
  modelPath: string | null;
  configJson: any;
  createdAt: string;
  updatedAt: string;
}

export interface Experiment {
  id: string;
  name: string;
  description: string | null;
  status: "running" | "completed" | "failed" | "stopped";
  modelId: string | null;
  authorId: string | null;
  hyperparameters: any;
  metrics: any;
  accuracy: number | null;
  f1Score: number | null;
  duration: string | null;
  epochsCompleted: number | null;
  totalEpochs: number | null;
  logs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Feature {
  id: string;
  name: string;
  description: string | null;
  dataType: string;
  entity: string;
  status: "online" | "offline" | "staging" | "archived";
  version: string | null;
  sourceTable: string | null;
  transformationSql: string | null;
  statistics: any;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  status: "idle" | "running" | "completed" | "failed";
  schedule: string | null;
  triggerType: string | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
  authorId: string | null;
  config: any;
  steps: PipelineStep[];
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStep {
  id: string;
  pipelineId: string;
  name: string;
  stepType: string;
  status: "pending" | "running" | "completed" | "failed";
  order: number;
  duration: string | null;
  logs: string[];
  config: any;
  startedAt: string | null;
  completedAt: string | null;
}

export interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  modelId: string | null;
  pipelineId: string | null;
  isRead: boolean;
  userId: string | null;
  createdAt: string;
}

export interface DashboardStats {
  activeModels: number;
  totalModels: number;
  totalPredictions: number;
  runningExperiments: number;
  completedExperiments: number;
  runningPipelines: number;
  avgLatency: number;
  unreadAlerts: number;
  recentAlerts: Alert[];
  systemStatus: string;
}

// Hooks
export function useModels() {
  return useQuery<Model[]>({
    queryKey: ["models"],
    queryFn: async () => {
      const res = await fetch("/api/models");
      if (!res.ok) throw new Error("Failed to fetch models");
      return res.json();
    },
  });
}

export function useModel(id: string) {
  return useQuery<Model>({
    queryKey: ["models", id],
    queryFn: async () => {
      const res = await fetch(`/api/models/${id}`);
      if (!res.ok) throw new Error("Failed to fetch model");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateModel() {
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch();

  return useMutation({
    mutationFn: async (data: Partial<Model>) => {
      const res = await authFetch("/api/models", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create model");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
    },
  });
}

export function useUpdateModel() {
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Model> }) => {
      const res = await authFetch(`/api/models/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update model");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
    },
  });
}

export function usePromoteModel() {
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch();

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const res = await authFetch(`/api/models/${id}/promote`, {
        method: "POST",
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error("Failed to promote model");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useDeleteModel() {
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/models/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete model");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
    },
  });
}

// Experiments
export function useExperiments() {
  return useQuery<Experiment[]>({
    queryKey: ["experiments"],
    queryFn: async () => {
      const res = await fetch("/api/experiments");
      if (!res.ok) throw new Error("Failed to fetch experiments");
      return res.json();
    },
  });
}

export function useCreateExperiment() {
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch();

  return useMutation({
    mutationFn: async (data: Partial<Experiment>) => {
      const res = await authFetch("/api/experiments", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create experiment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiments"] });
    },
  });
}

export function useStopExperiment() {
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/experiments/${id}/stop`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to stop experiment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiments"] });
    },
  });
}

// Features
export function useFeatures() {
  return useQuery<Feature[]>({
    queryKey: ["features"],
    queryFn: async () => {
      const res = await fetch("/api/features");
      if (!res.ok) throw new Error("Failed to fetch features");
      return res.json();
    },
  });
}

export function useCreateFeature() {
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch();

  return useMutation({
    mutationFn: async (data: Partial<Feature>) => {
      const res = await authFetch("/api/features", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create feature");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
    },
  });
}

export function useDeleteFeature() {
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/features/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete feature");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
    },
  });
}

// Pipelines
export function usePipelines() {
  return useQuery<Pipeline[]>({
    queryKey: ["pipelines"],
    queryFn: async () => {
      const res = await fetch("/api/pipelines");
      if (!res.ok) throw new Error("Failed to fetch pipelines");
      return res.json();
    },
  });
}

export function useRunPipeline() {
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/pipelines/${id}/run`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to run pipeline");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useStopPipeline() {
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/pipelines/${id}/stop`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to stop pipeline");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    },
  });
}

// Dashboard
export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Alerts
export function useAlerts() {
  const authFetch = useAuthFetch();

  return useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: async () => {
      const token = secureStorage.getItem("llmf_token");
      if (!token) return [];
      const res = await authFetch("/api/alerts");
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/alerts/${id}/read`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark alert as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

// Predictions
export function usePredict() {
  const authFetch = useAuthFetch();

  return useMutation({
    mutationFn: async (inputs: {
      creditScore: number;
      annualIncome: number;
      debtToIncome: number;
      age: number;
      loanAmount: number;
    }) => {
      const res = await authFetch("/api/predict", {
        method: "POST",
        body: JSON.stringify(inputs),
      });
      if (!res.ok) throw new Error("Prediction failed");
      return res.json();
    },
  });
}

// Settings
export function useUserSettings() {
  const authFetch = useAuthFetch();

  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const res = await authFetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await authFetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch();

  return useMutation({
    mutationFn: async (data: { name?: string; email?: string; role?: string; team?: string }) => {
      const res = await authFetch("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

