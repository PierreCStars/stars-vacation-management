export default function TestSimplePage() {
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: 'red',
      backgroundColor: 'yellow',
      border: '5px solid black',
      margin: '20px',
      borderRadius: '15px'
    }}>
      <h1>🚨 TEST PAGE - IF YOU SEE THIS, NEXT.JS IS WORKING! 🚨</h1>
      <p>This is a simple test page to verify basic functionality.</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  );
}
