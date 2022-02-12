import { GetStaticProps } from 'next';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Prismic from '@prismicio/client';

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
    { pageSize: 2 }
  );

  const results: Post[] = postsResponse.results.map<Post>(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination: PostPagination = {
    next_page: postsResponse.next_page === null ? '' : postsResponse.next_page,
    results,
  };

  return {
    props: {
      postsPagination,
    },
  };
};

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(
    postsPagination.results.map(post => {
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
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    })
  );
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);

  async function getMorePosts(page: string): Promise<void> {
    await fetch(page)
      .then(res => res.json())
      .then(data => {
        const results: Post[] = data.results.map(post => {
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
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });
        setNextPage(data.next_page);
        setPosts([...results, ...posts]);
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
            {posts.map(post => (
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
          {nextPage && (
            <button
              className={styles.button}
              type="button"
              onClick={() => getMorePosts(nextPage)}
            >
              Carregar mais posts
            </button>
          )}
        </section>
      </main>
    </>
  );
}
