import type { NextPage } from 'next';
import Head from 'next/head';

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Eco Routes SDK Demo</title>
        <link href="/favicon.ico" rel="icon" />
      </Head>
      <main>
        Eco Routes SDK Demo
      // TODO: add in the SDK demo here
      // connect wallet, then select route (origin chain and token, destination chain and token), amount and recipient. Then select quote, then confirm and send before it expires
      </main>
    </div>
  );
};

export default Home;
