import "./globals.css";

export const metadata = {
  title: "PromptMagic CinemaPro Sequencer",
  description: "Generate motion-rich cinematic prompts for AI video tools."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
