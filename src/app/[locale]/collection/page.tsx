import { useTranslations } from 'next-intl';
import CollectionMilestones from '@/components/organisms/CollectionMilestones';

export default function CollectionPage() {
  const t = useTranslations('collection');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        {t('title')}
      </h1>
      <CollectionMilestones />
    </div>
  );
}
