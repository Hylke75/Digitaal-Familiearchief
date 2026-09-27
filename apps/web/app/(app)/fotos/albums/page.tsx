import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { SubNav, PHOTO_SUBNAV } from '@/components/demo/SubNav';
import { CoverCard } from '@/components/demo/CoverCard';
import { isDemo } from '@/lib/demo/mode';
import { getPhoto } from '@/lib/demo/data';
import { resolveDemoMediaUrl } from '@/lib/demo/media';
import { userAlbumCards, smartAlbumCards, type AlbumCard } from '@/lib/demo/queries';

function AlbumTile({ album }: { album: AlbumCard }) {
  const c = album.coverId ? getPhoto(album.coverId) : null;
  const coverUrl = c ? resolveDemoMediaUrl(c.filename) : null;
  return (
    <CoverCard
      href={`/fotos/albums/${album.id}`}
      coverUrl={coverUrl}
      title={album.title}
      subtitle={`${album.count} foto's`}
      sources={album.sources}
    />
  );
}

export default function AlbumsPage() {
  if (!isDemo()) notFound();

  const userAlbums = userAlbumCards();
  const smartAlbums = smartAlbumCards();

  return (
    <div>
      <PageHeader title="Albums" subtitle="Zelfgemaakte en slimme albums" />
      <SubNav items={PHOTO_SUBNAV} />

      <section className="mb-10">
        <h2 className="text-h3 text-ink mb-4">Mijn albums</h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {userAlbums.map((a) => (
            <li key={a.id}>
              <AlbumTile album={a} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-h3 text-ink mb-4">Slimme albums</h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {smartAlbums.map((a) => (
            <li key={a.id}>
              <AlbumTile album={a} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
