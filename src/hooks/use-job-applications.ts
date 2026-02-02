import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useCallback } from "react";
import { logger } from "@/utils/logger";

export interface JobApplication {
  id: string;
  user_id: string;
  job_posting_id: string;
  message_id: string | null;
  cv_url: string | null;
  status: string;
  created_at: string;
  // Joined data
  job_title?: string;
  job_location?: string;
  job_contract_type?: string;
  job_description?: string;
  job_created_at?: string;
  establishment_name?: string;
  establishment_avatar?: string;
  establishment_id?: string | null;
}

interface ApplyParams {
  jobPostingId: string;
  messageId: string;
  cvUrl?: string | null;
}

const JOB_APPLICATIONS_KEY = ["job-applications"];

async function fetchApplications(userId: string): Promise<JobApplication[]> {
  const { data: apps, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!apps?.length) return [];

  // Fetch corresponding job postings
  const jobIds = [...new Set(apps.map((a) => a.job_posting_id))];
  const { data: jobs } = await supabase
    .from("job_postings")
    .select("id, title, description, location, contract_type, establishment_id, created_at")
    .in("id", jobIds);

  // Fetch establishment names/avatars
  const estIds = [
    ...new Set(
      (jobs || [])
        .map((j) => j.establishment_id)
        .filter((id): id is string => !!id)
    ),
  ];

  let estMap: Record<string, { name: string; avatar: string | null }> = {};
  if (estIds.length > 0) {
    const { data: ests } = await supabase
      .from("establishment_profiles")
      .select("id, organization_name, avatar_url")
      .in("id", estIds);

    if (ests) {
      estMap = ests.reduce(
        (acc, e) => {
          acc[e.id] = { name: e.organization_name || "", avatar: e.avatar_url };
          return acc;
        },
        {} as Record<string, { name: string; avatar: string | null }>
      );
    }
  }

  // Merge data
  const jobMap = new Map(
    (jobs || []).map((j) => [j.id, j])
  );

  return apps.map((app) => {
    const job = jobMap.get(app.job_posting_id);
    const est = job?.establishment_id ? estMap[job.establishment_id] : undefined;

    return {
      ...app,
      job_title: job?.title,
      job_location: job?.location,
      job_contract_type: job?.contract_type,
      job_description: job?.description,
      job_created_at: job?.created_at,
      establishment_name: est?.name,
      establishment_avatar: est?.avatar || undefined,
      establishment_id: job?.establishment_id,
    };
  });
}

export const useJobApplications = (userId: string | null) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: [...JOB_APPLICATIONS_KEY, userId],
    queryFn: () => fetchApplications(userId!),
    enabled: !!userId,
  });

  // O(1) lookup set
  const appliedJobIds = useMemo(
    () => new Set(applications.map((a) => a.job_posting_id)),
    [applications]
  );

  const hasApplied = useCallback(
    (jobPostingId: string) => appliedJobIds.has(jobPostingId),
    [appliedJobIds]
  );

  // Apply mutation with optimistic update
  const applyMutation = useMutation({
    mutationFn: async (params: ApplyParams) => {
      const { data, error } = await supabase
        .from("job_applications")
        .insert({
          user_id: userId!,
          job_posting_id: params.jobPostingId,
          message_id: params.messageId,
          cv_url: params.cvUrl || null,
          status: "sent",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({
        queryKey: [...JOB_APPLICATIONS_KEY, userId],
      });

      const prev = queryClient.getQueryData<JobApplication[]>([
        ...JOB_APPLICATIONS_KEY,
        userId,
      ]);

      // Optimistic insert
      const optimistic: JobApplication = {
        id: `optimistic-${Date.now()}`,
        user_id: userId!,
        job_posting_id: params.jobPostingId,
        message_id: params.messageId,
        cv_url: params.cvUrl || null,
        status: "sent",
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<JobApplication[]>(
        [...JOB_APPLICATIONS_KEY, userId],
        (old) => [optimistic, ...(old ?? [])]
      );

      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(
          [...JOB_APPLICATIONS_KEY, userId],
          context.prev
        );
      }
      logger.error("Failed to track job application:", _err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [...JOB_APPLICATIONS_KEY, userId],
      });
    },
  });

  const applyToJob = useCallback(
    async (params: ApplyParams) => {
      try {
        const result = await applyMutation.mutateAsync(params);
        return result?.id || null;
      } catch {
        return null;
      }
    },
    [applyMutation]
  );

  return {
    applications,
    isLoading,
    applyToJob,
    hasApplied,
    appliedJobIds,
    applicationCount: applications.length,
  };
};
