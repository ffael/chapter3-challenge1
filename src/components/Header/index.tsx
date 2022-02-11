import Link from 'next/link';
import styles from './header.module.scss';

export function Header(): JSX.Element {
  return (
    <header className={styles.header}>
      <Link href="/">
        <a>
          <img src="/images/logo.svg" width="239px" height="27px" alt="logo" />
        </a>
      </Link>
    </header>
  );
}
