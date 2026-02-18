import { Spin } from 'antd';

export function LoadingState({ tip = 'Loading...' }: { tip?: string }) {
  return (
    <div className="u-flex-center" style={{ minHeight: '240px' }}>
      <Spin size="large" tip={tip} />
    </div>
  );
}

export default LoadingState;
