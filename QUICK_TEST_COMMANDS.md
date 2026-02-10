# Quick Backend Test Commands

## Simple curl commands to test backend API

### 1. Check if server is running
```bash
curl http://localhost:3001/api/drones
```

### 2. Get all drones (formatted)
```bash
curl -s http://localhost:3001/api/drones | jq '.[0:3]'
```

### 3. Get specific drone
```bash
curl -s http://localhost:3001/api/drones/drone-1 | jq '.'
```

### 4. Get all orders
```bash
curl -s http://localhost:3001/api/orders | jq '.'
```

### 5. Get all kiosks
```bash
curl -s http://localhost:3001/api/kiosks | jq '.'
```

### 6. Get all restaurants
```bash
curl -s http://localhost:3001/api/restaurants | jq '.'
```

### 7. Count active drones
```bash
curl -s http://localhost:3001/api/drones | jq '[.[] | select(.status == "IDLE")] | length'
```

### 8. Check drone battery levels
```bash
curl -s http://localhost:3001/api/drones | jq '.[] | {name: .name, battery: .battery, status: .status}'
```

### 9. Get drones with low battery (< 50%)
```bash
curl -s http://localhost:3001/api/drones | jq '[.[] | select(.battery < 50)]'
```

### 10. Check WebSocket connection (in browser console)
```javascript
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('✓ Connected to WebSocket'));
socket.on('simulation:update', (data) => console.log('Update:', data));
```

## One-liner to check everything is working
```bash
echo "Drones: $(curl -s http://localhost:3001/api/drones | jq 'length')" && \
echo "Orders: $(curl -s http://localhost:3001/api/orders | jq 'length')" && \
echo "Kiosks: $(curl -s http://localhost:3001/api/kiosks | jq 'length')" && \
echo "Restaurants: $(curl -s http://localhost:3001/api/restaurants | jq 'length')"
```
