import { Modal } from 'antd';
import type { ModalProps } from 'antd';

export interface ConfirmDialogProps extends Omit<ModalProps, 'onOk'> {
  onConfirm?: () => void | Promise<void>;
}

export function ConfirmDialog({ onConfirm, ...rest }: ConfirmDialogProps) {
  return <Modal centered destroyOnClose okType="primary" onOk={onConfirm} {...rest} />;
}

export default ConfirmDialog;
