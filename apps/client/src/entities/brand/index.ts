import api from "@/shared/api/api";
import { useQuery } from "@tanstack/react-query";

export type Brand = {
  id: number;
  name: string;
  isActive: boolean;
};

export const brandsApi = {
  getAll: () => api.get<Brand[]>("/brands"),
  create: (data: any) => api.post<Brand>("/brands", data),
};

export const brandQueries = {
  useAll: () =>
    useQuery({
      queryKey: ["brands"],
      queryFn: () => brandsApi.getAll().then((res) => res.data),
    }),
};
