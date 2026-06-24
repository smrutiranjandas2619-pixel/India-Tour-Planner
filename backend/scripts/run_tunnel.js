const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logPath = path.join(logDir, 'localtunnel.log');

async function startTunnel() {
  console.log('Initializing localtunnel on port 8000...');
  try {
    const tunnel = await localtunnel({ port: 8000 });
    const message = `your url is: ${tunnel.url}\n`;
    console.log(message);
    
    fs.writeFileSync(logPath, message, 'utf8');
    console.log(`Successfully wrote tunnel URL to ${logPath}`);
    
    tunnel.on('close', () => {
      console.log('Tunnel closed. Reconnecting in 5 seconds...');
      setTimeout(startTunnel, 5000);
    });
    
    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
      setTimeout(startTunnel, 5000);
    });
  } catch (err) {
    console.error('Error starting localtunnel:', err);
    fs.writeFileSync(logPath, `Error: ${err.message}\n`, 'utf8');
    setTimeout(startTunnel, 5000);
  }
}

startTunnel();
// Keep the process alive indefinitely
setInterval(() => {}, 1000 * 60 * 60);
