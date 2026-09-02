'use client';
import Link from 'next/link';
import { KidBoard } from '@/components/kids/KidBoard';
import { appRoutes } from '@/config/appRoutes';
import { useBoard } from '@/hooks/chores.hooks';

export default function KidsPage() {
  const { data } = useBoard();
  if (!data) return null;
  if (!data.perChild.length) return <p className="py-10 text-center text-muted">No kids set up yet.</p>;
  return (
    <div className="pt-4">
      {data.perChild.map((k, i) => <KidBoard key={k.childId} view={data} kid={k} index={i} />)}
      <p className="text-center text-sm text-muted">Put this on the wall: <Link className="underline" href={appRoutes.wall}>the always-on display</Link> has a tap-to-tick chores board.</p>
    </div>
  );
}
