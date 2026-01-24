import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Garden Planning",
    description: "Plan and maintain your garden",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
