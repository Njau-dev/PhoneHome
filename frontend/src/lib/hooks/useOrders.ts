import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersAPI } from "@/lib/api/orders";
import { toast } from "sonner";

export const useOrders = (enabled = true) => {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ["orders"],
    queryFn: ordersAPI.getAll,
    enabled,
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

  const paymentStatusMutation = useMutation({
    mutationFn: ordersAPI.getPaymentStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    }
  })

  return {
    orders,
    isLoading,
    error,
    refetch,
    createOrder: createOrderMutation.mutate,
    cancelOrder: cancelOrderMutation.mutate,
    isCreating: createOrderMutation.isPending,
    isCancelling: cancelOrderMutation.isPending,
  };
};

export const useOrder = (id?: number | string, enabled = true) => {
  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersAPI.getById(id as number | string),
    enabled: enabled && !!id,
  });

  return { order, isLoading, error, refetch };
};
