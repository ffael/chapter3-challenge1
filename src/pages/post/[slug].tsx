/* eslint-disable func-names */
/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts')
  );

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID(
    'posts',
    String(context.params.slug),
    {}
  );

  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: [
        {
          heading: response.data.content[0].heading,
          body: response.data.content[0].body,
        },
      ],
    },
  };
  return {
    props: {
      post,
    },
  };
};

export default function Post({ post }: PostProps): JSX.Element {
  const { isFallback } = useRouter();

  function getReadingTime(): number {
    const WORDS_PER_MINUTE = 200;
    const readingContent = RichText.asText(post.data.content[0].body);

    const words = new Array(readingContent).reduce(function (acc, item) {
      return [...acc, item.split(' ')];
    }, []);
    return Math.ceil(words.flat().length / WORDS_PER_MINUTE);
  }

  return (
    <>
      <Head>
        <title>Spacetraveling. |</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Header />

      {isFallback ? (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          Carregando...
        </div>
      ) : (
        <>
          <section
            style={{
              height: '400px',
              background: `url(${post.data.banner.url})`,
              backgroundSize: 'cover',
              marginBottom: 80,
            }}
          />
          <main className={styles.main}>
            <header className={`${commonStyles.container} ${styles.header}`}>
              <h1 className={styles.title}>{post.data.title}</h1>
              <div className={commonStyles.info}>
                <span>
                  <FiCalendar size={20} />{' '}
                  {format(
                    Date.parse(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </span>
                <span>
                  <FiUser size={20} /> {post.data.author}
                </span>
                <span>
                  <FiClock size={20} /> {getReadingTime()} min
                </span>
              </div>
            </header>
            <article className={`${commonStyles.container} ${styles.content}`}>
              <div
                dangerouslySetInnerHTML={{
                  __html: post.data.content[0].heading,
                }}
              />
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(post.data.content[0].body),
                }}
              />
            </article>
          </main>
        </>
      )}
    </>
  );
}
