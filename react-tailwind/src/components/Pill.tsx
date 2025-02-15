import { ReactNode } from 'react';

export default function Pill(props: { children: ReactNode }) {
  return (
    <span className="mb-1 mr-1 inline-block text-nowrap rounded-md bg-gray-300 px-2 py-1">
      {props.children}
    </span>
  );
}
