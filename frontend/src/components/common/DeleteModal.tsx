interface DeleteModalProps {
  isOpen: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteModal = ({ isOpen, itemName, onConfirm, onCancel }: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-bg-card border border-border rounded-xl p-6 max-w-md w-[90%] mx-4 shadow-xl">
        <h3 className="text-xl font-bold mb-4">Remove from Wishlist</h3>
        <p className="text-secondary mb-6">
          Are you sure you want to remove &quot;{itemName}&quot; from your wishlist?
        </p>
        <div className="flex gap-4 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full border border-border hover:border-accent text-secondary hover:text-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-full bg-error hover:bg-error/90 text-white transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
