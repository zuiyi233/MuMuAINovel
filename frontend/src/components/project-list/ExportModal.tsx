import { Modal } from 'antd';
import type { ModalProps } from 'antd';
import type { ReactNode } from 'react';

export interface ExportModalProps extends Omit<ModalProps, 'open' | 'onCancel' | 'onOk' | 'children'> {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onOk: () => void;
  children: ReactNode;
}

export function ExportModal({ open, loading, onCancel, onOk, children, ...rest }: ExportModalProps) {
  return (
    <Modal open={open} confirmLoading={loading} onCancel={onCancel} onOk={onOk} title="Export Project" centered {...rest}>
      {children}
    </Modal>
  );
}

export default ExportModal;

