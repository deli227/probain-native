import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as z from "zod";
import { jobPostingsFormSchema } from "@/components/profile/forms/JobPostingsForm";
import { logger } from "@/utils/logger";

type ContractType = "CDI" | "CDD" | "Stage" | "Alternance" | "Saisonnier";

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  location: string;
  contract_type: ContractType;
  establishment_id: string;
  created_at: string;
}

// ------------------------------------------------------------------
// Query keys
// ------------------------------------------------------------------
const jobPostingsKeys = {
  all: ["job-postings"] as const,
  byEstablishment: (id: string) => ["job-postings", id] as const,
};

// ------------------------------------------------------------------
// Fetcher
// ------------------------------------------------------------------
async function fetchJobPostingsData(establishmentId: string): Promise<JobPosting[]> {
  const { data, error } = await supabase
    .from("job_postings")
    .select("*")
    .eq("establishment_id", establishmentId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Erreur lors de la récupération des annonces:", error);
    throw error;
  }

  return (data ?? []) as JobPosting[];
}

// ------------------------------------------------------------------
// Hook
// ------------------------------------------------------------------
export const useJobPostings = (establishmentId?: string | null) => {
  const queryClient = useQueryClient();

  const queryKey = jobPostingsKeys.byEstablishment(establishmentId ?? "");

  // ---- Query ----
  const {
    data: jobPostings = [],
    isLoading: loading,
    refetch,
  } = useQuery<JobPosting[]>({
    queryKey,
    queryFn: () => fetchJobPostingsData(establishmentId!),
    enabled: !!establishmentId,
  });

  // ---- Add mutation ----
  const addMutation = useMutation({
    mutationFn: async (values: z.infer<typeof jobPostingsFormSchema>) => {
      if (!establishmentId) throw new Error("No establishment ID");

      const { data, error } = await supabase
        .from("job_postings")
        .insert([{
          establishment_id: establishmentId,
          title: values.title,
          description: values.description,
          location: values.location,
          contract_type: values.contractType as ContractType,
        }])
        .select()
        .single();

      if (error) {
        logger.error("Erreur lors de l'ajout de l'annonce:", error);
        throw error;
      }
      return data as JobPosting;
    },
    onSuccess: (newPosting) => {
      queryClient.setQueryData<JobPosting[]>(queryKey, (old) =>
        [newPosting, ...(old ?? [])],
      );
      queryClient.invalidateQueries({ queryKey: ['establishment-stats'] });
    },
  });

  // ---- Update mutation ----
  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: z.infer<typeof jobPostingsFormSchema> }) => {
      const { data, error } = await supabase
        .from("job_postings")
        .update({
          title: values.title,
          description: values.description,
          location: values.location,
          contract_type: values.contractType as ContractType,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        logger.error("Erreur lors de la mise à jour de l'annonce:", error);
        throw error;
      }
      return data as JobPosting;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<JobPosting[]>(queryKey, (old) =>
        (old ?? []).map((p) => (p.id === updated.id ? updated : p)),
      );
      queryClient.invalidateQueries({ queryKey: ['establishment-stats'] });
    },
  });

  // ---- Delete mutation ----
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("job_postings")
        .delete()
        .eq("id", id);

      if (error) {
        logger.error("Erreur lors de la suppression de l'annonce:", error);
        throw error;
      }
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<JobPosting[]>(queryKey, (old) =>
        (old ?? []).filter((p) => p.id !== deletedId),
      );
      queryClient.invalidateQueries({ queryKey: ['establishment-stats'] });
    },
  });

  // ---- Wrappers matching old API ----
  const fetchJobPostings = useCallback(async (_establishmentId?: string) => {
    await refetch();
  }, [refetch]);

  const addJobPosting = useCallback(
    async (_establishmentId: string, values: z.infer<typeof jobPostingsFormSchema>) => {
      await addMutation.mutateAsync(values);
    },
    [addMutation],
  );

  const updateJobPosting = useCallback(
    async (id: string, values: z.infer<typeof jobPostingsFormSchema>) => {
      await updateMutation.mutateAsync({ id, values });
    },
    [updateMutation],
  );

  const deleteJobPosting = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  return {
    jobPostings,
    loading,
    fetchJobPostings,
    addJobPosting,
    updateJobPosting,
    deleteJobPosting,
  };
};
