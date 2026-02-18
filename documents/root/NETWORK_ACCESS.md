# Network Access Setup

This guide explains how to access the application from other devices on your local network.

## Configuration

Both frontend and backend are configured to listen on all network interfaces (`0.0.0.0`), making them accessible from other devices on your local network.

## Your Local IP Address

Based on your network configuration, your local IP address is: **192.168.1.39**

## Access URLs

### Frontend (Vite Dev Server)
- **Local access**: `http://localhost:5173`
- **Network access**: `http://192.168.1.39:5173`

### Backend API
- **Local access**: `http://localhost:3001`
- **Network access**: `http://192.168.1.39:3001`

## How to Access from Other Devices

1. **Make sure all devices are on the same Wi-Fi network**

2. **Start the development servers**:
   ```bash
   npm run dev
   ```

3. **On your other device** (phone, tablet, another computer):
   - Open a web browser
   - Navigate to: `http://192.168.1.39:5173`
   - The app should load and be accessible

## Troubleshooting

### Can't access from other device?

1. **Check firewall settings**:
   - macOS: System Settings → Network → Firewall
   - Make sure the firewall allows connections on ports 5173 and 3001

2. **Verify IP address**:
   - Run: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Use the IP address shown (usually starts with 192.168.x.x or 10.x.x.x)

3. **Check network connection**:
   - Ensure both devices are on the same Wi-Fi network
   - Try pinging the IP: `ping 192.168.1.39` (from another device)

4. **Backend CORS**:
   - The backend is configured to allow requests from local network IPs
   - If you get CORS errors, check the backend logs

### Port already in use?

If port 5173 is already in use, Vite will automatically try the next available port. Check the terminal output for the actual port number.

## Security Note

⚠️ **Development Only**: This configuration allows access from any device on your local network. This is fine for development, but should NOT be used in production without proper security measures.

## Mobile Testing

You can test the PWA features on mobile devices:
1. Access the app from your mobile browser
2. The app will work as a web app
3. You can add it to your home screen for a native-like experience
