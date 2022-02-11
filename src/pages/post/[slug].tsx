import { GetStaticPaths, GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import { Header } from '../../components/Header';

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
    first_publication_date: format(
      Date.parse(response.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: RichText.asText(response.data.title),
      banner: {
        url: response.data.banner.url,
      },
      author: RichText.asText(response.data.author),
      content: {
        heading: RichText.asHtml(response.data.content[0].heading),
        body: {
          text: RichText.asHtml(response.data.content[0].body),
        },
      },
    },
  };

  return {
    props: {
      post,
    },
  };
};

export default function Post({ post }: PostProps): JSX.Element {
  const { first_publication_date, data } = post;
  const { title, banner, author, content } = data;

  function getReadingTime(): number {
    const WORDS_PER_MINUTE = 200;

    const words = new Array(content).reduce(function (acc, item) {
      return [...acc, item?.heading.split(' '), item?.body.text.split(' ')];
    }, []);
    return Math.ceil(words.flat().length / WORDS_PER_MINUTE);
  }

  const readingTime = getReadingTime();

  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>Spacetraveling. | {title}</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Header />
      <section
        style={{
          height: '400px',
          background: `url(${banner.url})`,
          backgroundSize: 'cover',
          marginBottom: 80,
        }}
      />
      <main className={styles.main}>
        <header className={`${commonStyles.container} ${styles.header}`}>
          <h1 className={styles.title}>{title}</h1>
          <div className={commonStyles.info}>
            <span>
              <FiCalendar size={20} /> {first_publication_date}
            </span>
            <span>
              <FiUser size={20} /> {author}
            </span>
            <span>
              <FiClock size={20} /> {readingTime} min
            </span>
          </div>
        </header>
        <article className={`${commonStyles.container} ${styles.content}`}>
          <div dangerouslySetInnerHTML={{ __html: content.heading.text }} />
          <div dangerouslySetInnerHTML={{ __html: content.body.text }} />
        </article>
      </main>
    </>
  );
}
