import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type {
  HelmRepo,
  ChartList,
  ChartDetail,
  ChartValues,
  ReleaseInfo,
} from '../../types/monitoring';

export const useGetHelmRepos = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['helm-repos'],
    queryFn: () => api.get<HelmRepo[]>('helm-repos').json(),
  });
  return { repos: data ?? [], isPending, isError };
};

export const useGetCharts = (repoName: string) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['charts', repoName],
    queryFn: async () => {
      const res = await api.get(`charts/${repoName}`).json<{ data: ChartList } | ChartList>();
      return 'data' in res && 'charts' in (res as { data: ChartList }).data
        ? (res as { data: ChartList }).data
        : (res as ChartList);
    },
    enabled: !!repoName,
  });
  return { chartList: data, isPending, isError };
};

export const useGetChartDetail = (repoName: string, chartName: string, version?: string) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['charts', repoName, chartName, 'detail', version],
    queryFn: async () => {
      const searchParams: Record<string, string> = {};
      if (version) searchParams.version = version;
      const res = await api
        .get(`charts/${repoName}/${chartName}/detail`, { searchParams })
        .json<{ data: ChartDetail } | ChartDetail>();
      return 'data' in res && 'repositoryName' in (res as { data: ChartDetail }).data
        ? (res as { data: ChartDetail }).data
        : (res as ChartDetail);
    },
    enabled: !!repoName && !!chartName,
  });
  return { chartDetail: data, isPending, isError };
};

export const useGetChartValues = (repoName: string, chartName: string, version?: string) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['charts', repoName, chartName, 'values', version],
    queryFn: async () => {
      const searchParams: Record<string, string> = {};
      if (version) searchParams.version = version;
      const res = await api
        .get(`charts/${repoName}/${chartName}/values`, { searchParams })
        .json<{ data: ChartValues } | ChartValues>();
      return 'data' in res && 'valuesContent' in (res as { data: ChartValues }).data
        ? (res as { data: ChartValues }).data
        : (res as ChartValues);
    },
    enabled: !!repoName && !!chartName,
  });
  return { chartValues: data, isPending, isError };
};

export const useDeployChart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      repoName: string;
      chartName: string;
      releaseName: string;
      clusterId: string;
      namespace: string;
      version: string;
      valuesContent: string;
    }) => {
      const formData = new FormData();
      formData.append('releaseName', params.releaseName);
      formData.append('clusterId', params.clusterId);
      formData.append('namespace', params.namespace);
      formData.append('version', params.version);
      const blob = new Blob([params.valuesContent], { type: 'application/x-yaml' });
      formData.append('valuesFile', blob, 'values.yaml');
      return api
        .post(`charts/${params.repoName}/${params.chartName}/deploy`, { body: formData })
        .json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charts'] });
      queryClient.invalidateQueries({ queryKey: ['monitoring'] });
      queryClient.invalidateQueries({ queryKey: ['cost'] });
    },
  });
};

export const useUninstallRelease = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { releaseName: string; clusterId: string; namespace: string }) => {
      const searchParams: Record<string, string> = {
        clusterId: params.clusterId,
        namespace: params.namespace,
      };
      return api
        .delete(`charts/releases/${params.releaseName}`, { searchParams })
        .json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charts'] });
      queryClient.invalidateQueries({ queryKey: ['monitoring'] });
    },
  });
};

export const useGetReleases = (clusterId: string, namespace?: string) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['charts', 'releases', clusterId, namespace],
    queryFn: async () => {
      const searchParams: Record<string, string> = { clusterId };
      if (namespace) searchParams.namespace = namespace;
      const res = await api.get('charts/releases', { searchParams }).json<any>();
      // ResultResponse 래퍼: { status, data: { success, releases } }
      const releases = res?.data?.releases ?? res?.releases ?? res ?? [];
      return releases as ReleaseInfo[];
    },
    refetchInterval: 10000,
    enabled: !!clusterId,
  });
  return { releases: data ?? [], isPending, isError };
};
