import api from "@/shared/api/api";
import type { User } from "@/entities/user/model/auth.store";

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string; user: User }>("/auth/login", {
      email,
      password,
    }),
  getProfile: () => api.get<User>("/auth/profile"),
};
