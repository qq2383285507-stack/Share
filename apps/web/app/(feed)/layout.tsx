import "../../styles/globals.css";
import { ReactNode } from "react";
import { Providers } from "./providers";

export const metadata = {
  title: "Share Feed",
  description: "Home feed sorting experience",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hans">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
