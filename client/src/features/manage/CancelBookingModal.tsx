import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Illustration } from '../../components/ui/Illustration';
import { Modal } from '../../components/ui/Modal';

interface CancelBookingModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pending: boolean;
  error: string | null;
  summary: string;
}

export function CancelBookingModal({
  open,
  onClose,
  onConfirm,
  pending,
  error,
  summary,
}: CancelBookingModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!pending}
      size="sm"
      title="Cancel this appointment?"
      description={`Your ${summary} will be released so someone else can book it.`}
      hero={
        <div className="flex justify-center">
          <Illustration name="cancel" className="h-32" />
        </div>
      }
    >
      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={pending}>
            Keep it
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm} loading={pending}>
            Yes, cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
