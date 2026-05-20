import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import "../styles/globals.css";  

TimeAgo.addDefaultLocale(en);

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Toaster position="top-right" />
      <Component {...pageProps} />
    </SessionProvider>
  );
}