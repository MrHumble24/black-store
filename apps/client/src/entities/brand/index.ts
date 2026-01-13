import api from "@/shared/api/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type Brand = {
  id: number;
  name: string;
  isActive: boolean;
};

export const brandsApi = {
  getAll: () => api.get<Brand[]>("/brands"),
  create: (data: { name: string }) => api.post<Brand>("/brands", data),
};

export const brandQueries = {
  useAll: () =>
    useQuery({
      queryKey: ["brands"],
      queryFn: () => brandsApi.getAll().then((res) => res.data),
    }),

  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (name: string) => brandsApi.create({ name }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["brands"] });
        toast.success("Brand created successfully");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to create brand");
      },
    });
  },
};
