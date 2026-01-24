import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersAPI } from "@/lib/api/orders";
import { toast } from "sonner";

export const useOrders = () => {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: ordersAPI.getAll,
  });

  const createOrderMutation = useMutation({
    mutationFn: ordersAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order placed successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to place order");
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: ordersAPI.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order cancelled successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cancel order");
    },
  });

  return {
    orders,
    isLoading,
    error,
    createOrder: createOrderMutation.mutate,
    cancelOrder: cancelOrderMutation.mutate,
    isCreating: createOrderMutation.isPending,
    isCancelling: cancelOrderMutation.isPending,
  };
};

export const useOrder = (id: number) => {
  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersAPI.getById(id),
    enabled: !!id,
  });

  return { order, isLoading, error };
};
