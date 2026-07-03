import api from "@/shared/api/api";
import type { User } from "@/entities/user/model/auth.store";

export const usersApi = {
  getAll: () => api.get<User[]>("/users"),
  getOne: (id: number) => api.get<User>(`/users/${id}`),
  create: (data: any) => api.post<User>("/users", data),
  update: (id: number, data: any) => api.patch<User>(`/users/${id}`, data),
  remove: (id: number) => api.delete(`/users/${id}`),
};
