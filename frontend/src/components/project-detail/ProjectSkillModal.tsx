import { Modal } from 'antd';
import type { ReactNode } from 'react';

export interface ProjectSkillModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function ProjectSkillModal({ open, onClose, children }: ProjectSkillModalProps) {
  return (
    <Modal open={open} onCancel={onClose} footer={null} title="Project Skill" centered destroyOnClose>
      {children}
    </Modal>
  );
}

export default ProjectSkillModal;
