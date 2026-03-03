import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: webStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const webStyles = `
* {
  box-sizing: border-box;
}
body {
  background-color: #F5DDD0;
  display: flex;
  justify-content: center;
  margin: 0;
  padding: 0;
  min-height: 100vh;
}
#root {
  width: 100%;
  max-width: 390px;
  min-height: 100vh;
  background-color: #FEF3EE;
  position: relative;
  box-shadow: 0 0 40px rgba(0,0,0,0.10);
}
`;
