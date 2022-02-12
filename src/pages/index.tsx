import { GetStaticProps } from 'next';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import Link from 'next/link';
import Head from 'next/head';

import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    { pageSize: 3 }
  );

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(
        Date.parse(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
      data: {
        title: RichText.asText(post.data.title),
        subtitle: RichText.asText(post.data.subtitle),
        author: RichText.asText(post.data.author),
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page:
          postsResponse.next_page === null ? '' : postsResponse.next_page,
        results,
      },
    },
  };
};

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [allPosts, setAllPosts] = useState<PostPagination>(postsPagination);

  async function getMorePosts(page: string): Promise<void> {
    await fetch(page)
      .then(res => res.json())
      .then(data => {
        const results = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: format(
              Date.parse(post.first_publication_date),
              'dd MMM yyyy',
              {
                locale: ptBR,
              }
            ),
            data: {
              title: RichText.asText(post.data.title),
              subtitle: RichText.asText(post.data.subtitle),
              author: RichText.asText(post.data.author),
            },
          };
        });
        setAllPosts({
          next_page: data.next_page === null && '',
          results: [...results, ...allPosts.results],
        });
      });
  }

  return (
    <>
      <Head>
        <title>Spacetraveling. | Home</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Header />
      <main className={commonStyles.container}>
        <section>
          <ul className={styles.posts}>
            {allPosts.results.map(post => (
              <li key={post.uid}>
                <Link href={`/post/${post.uid}`}>
                  <a>
                    <h3 className={styles.title}>{post.data.title}</h3>
                    <p className={styles.subtitle}>{post.data.subtitle}</p>
                  </a>
                </Link>
                <div className={commonStyles.info}>
                  <span>
                    <FiCalendar size={20} />
                    {post.first_publication_date}
                  </span>
                  <span>
                    <FiUser size={20} />
                    {post.data.author}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {allPosts.next_page !== '' && (
            <button
              className={styles.button}
              type="button"
              onClick={() => getMorePosts(allPosts.next_page)}
            >
              Carregar mais posts
            </button>
          )}
        </section>
      </main>
    </>
  );
}
