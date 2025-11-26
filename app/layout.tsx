import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
  <title>Query-Mate AI</title>
  <link rel="icon" href="https://img.icons8.com/?size=100&id=unXm4ixWAr6H&format=png&color=000000" sizes="any" />
</head>

      <body className="bg-purple-50 text-gray-900 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
