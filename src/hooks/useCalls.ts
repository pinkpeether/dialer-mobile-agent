import { useQuery } from "@tanstack/react-query";
import { callsApi } from "../api/calls.api";

export const useCalls = () =>
  useQuery({
    queryKey: ["calls"],
    queryFn: () => callsApi.history({ pageSize: 100 }),
    staleTime: 15_000,
  });

export const useDispositions = () =>
  useQuery({
    queryKey: ["dispositions"],
    queryFn: () => callsApi.dispositions(),
    staleTime: 5 * 60_000,
  });
