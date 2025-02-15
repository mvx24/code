import clsx from 'clsx';

interface ProgressBarProps {
  progress: number;
  className?: string;
}

/** Style using bg-[color] and text-[color] for background and foreground colors */
export default function ProgressBar(props: ProgressBarProps) {
  return (
    <div className={clsx('relative h-3 w-full rounded-xl', props.className)}>
      <div
        className="absolute h-full rounded-xl bg-current"
        style={{ width: `${props.progress}%` }}
      />
    </div>
  );
}
