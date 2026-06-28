import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import classNames from 'classnames';
import { Telescope } from 'lucide-react';
import styles from './join-cta.module.scss';

const JoinCtaCard = () => {
  return (
    <section className={classNames('celestia-card', styles.card)}>
      <div className={styles.content}>
        <div className={classNames('celestia-brand-mark', styles.mark)}>
          <Telescope className={styles.icon} aria-hidden />
        </div>
        <div className={styles.title}>Join the community</div>
        <div className={styles.description}>
          Create posts, vote, and follow topics you care about.
        </div>
      </div>
      <div className={styles.actionWrap}>
        <Link
          href='/auth/sign-up'
          className={classNames(
            buttonVariants({ variant: 'default', size: 'lg' }),
            'celestia-primary-action',
            styles.action
          )}
        >
          Join Celestia
        </Link>
      </div>
    </section>
  );
};

export default JoinCtaCard;
