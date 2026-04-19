import CardGallery from '@/components/organisms/CardGallery';
import GenerationsInfoPanel from '@/components/organisms/GenerationsInfoPanel';

export default function GalleryPage() {
  return (
    <div className="space-y-6">
      <GenerationsInfoPanel />
      <CardGallery />
    </div>
  );
}
