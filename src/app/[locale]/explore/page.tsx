import { useTranslations } from 'next-intl';
import DailyExploration from '@/components/organisms/DailyExploration';

export default function ExplorePage() {
  const t = useTranslations('explore');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 text-center">
        {t('title')}
      </h1>
      <DailyExploration />
    </div>
  );
}
