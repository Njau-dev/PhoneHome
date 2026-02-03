interface StatusBadgeProps {
  status: string;
  type?: "order" | "payment";
}

const StatusBadge = ({ status, type = "order" }: StatusBadgeProps) => {
  const getStatusColor = () => {
    const normalizedStatus = status.toLowerCase();
    
    if (type === "payment") {
      switch (normalizedStatus) {
        case "paid":
          return "bg-success/20 text-success";
        case "pending":
          return "bg-warning/20 text-warning";
        case "failed":
          return "bg-error/20 text-error";
        default:
          return "bg-secondary/20 text-secondary";
      }
    }
    
    // Order statuses
    switch (normalizedStatus) {
      case "delivered":
        return "bg-success/20 text-success";
      case "shipped":
        return "bg-info/20 text-info";
      case "processing":
        return "bg-warning/20 text-warning";
      case "cancelled":
        return "bg-error/20 text-error";
      default:
        return "bg-secondary/20 text-secondary";
    }
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
