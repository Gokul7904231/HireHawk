import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStats,
  getApplications,
  getApplicationDetail,
  getProfile,
  saveProfile,
  getMcpStatus,
  updateStatus
} from '../api/tracker';
import { Profile } from '../types';

const IS_TEST = import.meta.env.MODE === 'test';

export function useStatsQuery() {
  return useQuery({
    queryKey: ['tracker', 'stats'],
    queryFn: getStats,
    refetchInterval: IS_TEST ? false : 10000, // Poll every 10 seconds
  });
}

export function useApplicationsQuery(status?: string) {
  return useQuery({
    queryKey: ['tracker', 'applications', status],
    queryFn: () => getApplications(status),
    refetchInterval: IS_TEST ? false : 5000, // Poll every 5 seconds for status changes
  });
}

export function useApplicationDetailQuery(id: string) {
  return useQuery({
    queryKey: ['tracker', 'application', id],
    queryFn: () => getApplicationDetail(id),
    enabled: !!id,
  });
}

export function useProfileQuery() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });
}

export function useSaveProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: Profile) => saveProfile(profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });
}

export function useUpdateStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracker', 'applications'] });
      queryClient.invalidateQueries({ queryKey: ['tracker', 'stats'] });
    }
  });
}

export function useMcpStatusQuery() {
  return useQuery({
    queryKey: ['mcp', 'status'],
    queryFn: getMcpStatus,
    refetchInterval: IS_TEST ? false : 5000, // Poll every 5 seconds for live status dots
  });
}
