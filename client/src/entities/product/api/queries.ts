import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  productsApi,
  type CreateProductPayload,
  type UpdateProductPayload,
} from "./product.api";
import { toast } from "sonner";

export const productQueries = {
  useAll: () =>
    useQuery({
      queryKey: ["products"],
      queryFn: () => productsApi.getAll().then((res) => res.data),
    }),

  useOne: (id: number) =>
    useQuery({
      queryKey: ["product", id],
      queryFn: () => productsApi.getOne(id).then((res) => res.data),
      enabled: !!id,
    }),

  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: CreateProductPayload) => productsApi.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        toast.success("Product created successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to create product"
        );
      },
    });
  },

  useUpdate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: UpdateProductPayload }) =>
        productsApi.update(id, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
        toast.success("Product updated successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to update product"
        );
      },
    });
  },

  useDelete: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: number) => productsApi.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        toast.success("Product deleted successfully");
      },
      onError: () => {
        toast.error("Failed to delete product");
      },
    });
  },
};
