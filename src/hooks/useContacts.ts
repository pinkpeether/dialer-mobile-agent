import { useQuery } from "@tanstack/react-query";
import { contactsApi } from "../api/contacts.api";

export const useContacts = (search?: string) =>
  useQuery({
    queryKey: ["contacts", search ?? ""],
    queryFn: () => contactsApi.list({ search, pageSize: 50 }),
    staleTime: 30_000,
  });

export const useContact = (id?: string) =>
  useQuery({
    queryKey: ["contact", id],
    queryFn: () => contactsApi.get(id!),
    enabled: !!id,
  });
