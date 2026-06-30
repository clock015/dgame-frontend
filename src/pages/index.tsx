import type { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';

import { DgameDashboard } from '../components/dgame/DgameDashboard';
import type { DgameDeployment } from '../contracts/addresses';
import { deploymentFromEnv } from '../contracts/addresses';

type HomeProps = {
  deployment: DgameDeployment;
};

const Home: NextPage<HomeProps> = ({ deployment }) => {
  return (
    <>
      <Head>
        <title>Dgame Contract Console</title>
        <meta content="Dgame onMarket contract console" name="description" />
        <link href="/favicon.ico" rel="icon" />
      </Head>
      <DgameDashboard initialDeployment={deployment} />
    </>
  );
};

export const getStaticProps: GetStaticProps<HomeProps> = async () => ({
  props: {
    deployment: deploymentFromEnv(process.env),
  },
});

export default Home;
