import api from "@/shared/api/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type Category = {
  id: number;
  name: string;
  isActive: boolean;
};

export const categoriesApi = {
  getAll: () => api.get<Category[]>("/categories"),
  create: (data: { name: string }) => api.post<Category>("/categories", data),
};

export const categoryQueries = {
  useAll: () =>
    useQuery({
      queryKey: ["categories"],
      queryFn: () => categoriesApi.getAll().then((res) => res.data),
    }),

  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (name: string) => categoriesApi.create({ name }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        toast.success("Category created successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to create category"
        );
      },
    });
  },
};
