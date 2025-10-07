export default function RootTest() {
  return (
    <html>
      <body style={{ backgroundColor: 'red', color: 'white', padding: '50px', fontSize: '24px' }}>
        <h1>🚨 ROOT LEVEL TEST 🚨</h1>
        <p>This is the most basic possible page</p>
        <p>Time: {new Date().toISOString()}</p>
      </body>
    </html>
  );
}
