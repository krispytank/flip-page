import "@/styles/globals.css";
import Layout from "@/components/Layout";
import { useRouter } from "next/router";

const noLayoutRoutes = ['/viewer'];

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isViewer = noLayoutRoutes.includes(router.pathname);

  if (isViewer) {
    return <Component {...pageProps} />;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
