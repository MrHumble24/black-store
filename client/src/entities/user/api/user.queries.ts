import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "./user.api";
import { toast } from "sonner";

export const userQueries = {
  useAll: () =>
    useQuery({
      queryKey: ["users"],
      queryFn: () => usersApi.getAll().then((res) => res.data),
    }),

  useOne: (id: number) =>
    useQuery({
      queryKey: ["user", id],
      queryFn: () => usersApi.getOne(id).then((res) => res.data),
      enabled: !!id,
    }),

  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: any) => usersApi.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        toast.success("User created successfully");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to create user");
      },
    });
  },

  useUpdate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: any }) =>
        usersApi.update(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        toast.success("User updated successfully");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to update user");
      },
    });
  },

  useDelete: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: number) => usersApi.remove(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        toast.success("User deleted successfully");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to delete user");
      },
    });
  },
};
