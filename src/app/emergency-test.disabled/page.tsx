export default function EmergencyTest() {
  return (
    <div style={{ padding: '20px', backgroundColor: 'red', color: 'white', fontSize: '24px' }}>
      <h1>🚨 ROOT LEVEL EMERGENCY TEST 🚨</h1>
      <p>This is at the root level to test if routing works</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  );
}
