import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type CelestiaSignalLoaderProps = {
  size?: 'sm' | 'md';
  className?: string;
};

export const CelestiaSignalLoader = ({ size = 'md', className }: CelestiaSignalLoaderProps) => (
  <div className={cn('celestia-signal-loader', `celestia-signal-loader-${size}`, className)} aria-hidden>
    <span className='celestia-signal-loader-pulse celestia-signal-loader-pulse-one' />
    <span className='celestia-signal-loader-pulse celestia-signal-loader-pulse-two' />
    <span className='celestia-signal-loader-orbit celestia-signal-loader-orbit-outer' />
    <span className='celestia-signal-loader-orbit celestia-signal-loader-orbit-inner' />
    <span className='celestia-signal-loader-star celestia-signal-loader-star-one' />
    <span className='celestia-signal-loader-star celestia-signal-loader-star-two' />
    <span className='celestia-signal-loader-star celestia-signal-loader-star-three' />
    <span className='celestia-brand-mark celestia-signal-loader-mark'>
      <Zap className='celestia-signal-loader-bolt fill-current' />
    </span>
  </div>
);
