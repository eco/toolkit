import type { NextPage } from 'next';
import Head from 'next/head';
import DemoView from '../views/demo/demo-view';

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Eco Routes SDK Demo</title>
        <link href="/favicon.ico" rel="icon" />
      </Head>
      <main>
        <div>
          <span className='text-3xl mx-2'>Eco Routes SDK Demo</span>
        </div>
        <DemoView />
      </main>
    </div>
  );
};

export default Home;
