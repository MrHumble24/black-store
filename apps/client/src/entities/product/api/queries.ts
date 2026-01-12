import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "./product.api";
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
