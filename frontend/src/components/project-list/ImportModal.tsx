import { Modal } from 'antd';
import type { ModalProps } from 'antd';
import type { ReactNode } from 'react';

export interface ImportModalProps extends Omit<ModalProps, 'open' | 'onCancel' | 'onOk' | 'children'> {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onOk: () => void;
  children: ReactNode;
}

export function ImportModal({ open, loading, onCancel, onOk, children, ...rest }: ImportModalProps) {
  return (
    <Modal open={open} confirmLoading={loading} onCancel={onCancel} onOk={onOk} title="Import Project" centered {...rest}>
      {children}
    </Modal>
  );
}

export default ImportModal;

