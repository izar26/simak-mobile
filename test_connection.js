async function testConnection() {
  const url = 'https://www.simak.smakniscjr.sch.id/api/sekolah';
  console.log(`Testing connection to: ${url}`);
  
  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status}`);
    const text = await response.text();
    console.log('Response body preview:', text.substring(0, 100));
    
    if (response.ok) {
        console.log("SUCCESS: Node.js can reach the server.");
    } else {
        console.log("FAILURE: Server returned error status.");
    }
  } catch (error) {
    console.error("NETWORK ERROR in Node.js:", error.message);
    if (error.cause) console.error("Cause:", error.cause);
  }
}

testConnection();