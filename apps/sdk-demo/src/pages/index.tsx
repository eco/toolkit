import type { NextPage } from 'next';
import Head from 'next/head';
import DemoView from '../views/demo/demo-view';
import Header from '../components/header';
import { useAccount } from 'wagmi';

const Home: NextPage = () => {
  const { isConnected } = useAccount();

  return (
    <div>
      <Head>
        <title>Eco Routes SDK Demo</title>
        <link href="/favicon.ico" rel="icon" />
      </Head>
      <main>
        <Header />
        {!isConnected ? (
          <div className='mt-[80px] text-2xl text-center'>Connect wallet to continue</div>
        ) : (
          <DemoView />
        )}
      </main>
    </div>
  );
};

export default Home;
