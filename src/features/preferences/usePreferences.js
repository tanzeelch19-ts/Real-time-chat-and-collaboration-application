import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { preferencesApi } from '@/features/preferences/preferencesApi';

export const preferenceKeys = {
  all: ['preferences'],
};

export function usePreferences() {
  return useQuery({
    queryKey: preferenceKeys.all,
    queryFn: () => preferencesApi.get(),
  });
}

export function useSavePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values) => preferencesApi.save(values),
    onSuccess: (preferences) => queryClient.setQueryData(preferenceKeys.all, preferences),
  });
}
