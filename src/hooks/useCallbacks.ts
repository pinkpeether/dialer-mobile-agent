import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { callbacksApi } from "../api/callbacks.api";

export const useCallbacks = (status?: string) =>
  useQuery({
    queryKey: ["callbacks", status ?? "all"],
    queryFn: () => callbacksApi.list({ status }),
    staleTime: 15_000,
  });

export const useMarkCallbackDone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callbacksApi.markDone(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["callbacks"] }),
  });
};

export const useSnoozeCallback = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; minutes: number }) => callbacksApi.snooze(v.id, v.minutes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["callbacks"] }),
  });
};
