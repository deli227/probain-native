
import { useState } from "react";
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

export const useJobPostings = () => {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);

  const fetchJobPostings = async (establishmentId: string) => {
    const { data, error } = await supabase
      .from("job_postings")
      .select("*")
      .eq("establishment_id", establishmentId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Erreur lors de la récupération des annonces:", error);
      throw error;
    }

    if (data) {
      const typedData = data as JobPosting[];
      setJobPostings(typedData);
    }
  };

  const addJobPosting = async (establishmentId: string, values: z.infer<typeof jobPostingsFormSchema>) => {
    const newPosting = {
      establishment_id: establishmentId,
      title: values.title,
      description: values.description,
      location: values.location,
      contract_type: values.contractType as ContractType,
    };

    const { data, error } = await supabase
      .from("job_postings")
      .insert([newPosting])
      .select()
      .single();

    if (error) {
      logger.error("Erreur lors de l'ajout de l'annonce:", error);
      throw error;
    }

    if (data) {
      const typedData = data as JobPosting;
      setJobPostings((prev) => [typedData, ...prev]);
    }
  };

  const updateJobPosting = async (id: string, values: z.infer<typeof jobPostingsFormSchema>) => {
    const updatedPosting = {
      title: values.title,
      description: values.description,
      location: values.location,
      contract_type: values.contractType as ContractType,
    };

    const { data, error } = await supabase
      .from("job_postings")
      .update(updatedPosting)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("Erreur lors de la mise à jour de l'annonce:", error);
      throw error;
    }

    if (data) {
      const typedData = data as JobPosting;
      setJobPostings((prev) =>
        prev.map((posting) => (posting.id === id ? typedData : posting))
      );
    }
  };

  const deleteJobPosting = async (id: string) => {
    const { error } = await supabase
      .from("job_postings")
      .delete()
      .eq("id", id);

    if (error) {
      logger.error("Erreur lors de la suppression de l'annonce:", error);
      throw error;
    }

    setJobPostings((prev) => prev.filter((posting) => posting.id !== id));
  };

  return {
    jobPostings,
    fetchJobPostings,
    addJobPosting,
    updateJobPosting,
    deleteJobPosting,
  };
};
