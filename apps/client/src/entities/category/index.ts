import api from "@/shared/api/api";
import { useQuery } from "@tanstack/react-query";

export type Category = {
  id: number;
  name: string;
  isActive: boolean;
};

export const categoriesApi = {
  getAll: () => api.get<Category[]>("/categories"),
  create: (data: any) => api.post<Category>("/categories", data),
};

export const categoryQueries = {
  useAll: () =>
    useQuery({
      queryKey: ["categories"],
      queryFn: () => categoriesApi.getAll().then((res) => res.data),
    }),
};
