# 🚁 Drone Delivery Management & Simulation Platform

A comprehensive web-based platform for managing and simulating a drone-based food delivery network with real-time monitoring, 3D visualization, and professional admin dashboard.

## 🎯 Project Overview

This is a **final-year B.Tech IT project** that demonstrates:
- Real-time drone fleet management
- Sophisticated simulation engine with realistic physics
- Professional enterprise-grade UI/UX
- WebSocket-based live updates
- 3D map visualization with MapLibre GL
- Role-based access control
- Advanced analytics and reporting

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** - REST API server
- **TypeScript** - Type-safe development
- **Socket.IO** - Real-time WebSocket communication
- **In-memory data store** - Fast simulation (DB-ready structure)

### Frontend
- **React 18** + **Vite** - Modern React development
- **TypeScript** - Type safety across the stack
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **React Router v6** - Client-side routing
- **MapLibre GL JS** - Free 3D map visualization
- **Recharts** - Data visualization
- **Lucide React** - Modern icon library
- **Socket.IO Client** - Real-time data sync

## ✨ Features

### Core Features
- ✅ **Real-time Drone Tracking** - Live position updates on 3D map
- ✅ **Order Management** - Create, assign, and track deliveries
- ✅ **Fleet Management** - Monitor battery, status, and performance
- ✅ **Kiosk Management** - Charging stations and drone capacity
- ✅ **Alert System** - Low battery, delays, no-fly zone violations
- ✅ **Professional Dashboard** - KPI cards with live metrics
- ✅ **Dark/Light Theme** - User preference support

### Unique Features (Final Year Project Highlights)
- 🎮 **Scenario Playbooks** - Normal Day, Peak Hour, Bad Weather
- 🌦️ **Weather Impact Slider** - Adjust speed and battery drain
- 📊 **Route Comparison** - Optimized vs direct path analysis
- ⏮️ **Replay Mode** - Review completed deliveries
- 📝 **Event Timeline** - Professional log view
- 👥 **Role-Based UI** - Admin, Restaurant, Kiosk operator views

### Simulation Engine
- Realistic drone movement with physics
- Battery drain model (payload, altitude, weather)
- A* pathfinding with no-fly zone avoidance
- Priority-based order assignment
- Kiosk charging queue management
- Emergency landing and return-to-base logic

## 📁 Project Structure

```
drone-delivery-platform/
├── backend/
│   ├── src/
│   │   ├── types/           # TypeScript definitions
│   │   ├── simulation/      # Core simulation logic
│   │   ├── services/        # Business logic
│   │   ├── api/             # REST + WebSocket
│   │   ├── data/            # In-memory store
│   │   └── server.ts        # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Route pages
│   │   ├── stores/          # Zustand stores
│   │   ├── services/        # API clients
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
```bash
cd drone-delivery-platform
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

### Running the Application

1. **Start Backend Server** (Terminal 1)
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:3001`

2. **Start Frontend Dev Server** (Terminal 2)
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

3. **Open Browser**
Navigate to `http://localhost:5173`

### Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin` |
| Restaurant Operator | `restaurant1` | `rest123` |
| Kiosk Operator | `kiosk1` | `kiosk123` |

## 🎮 How to Use

### 1. Login
- Choose a role (Admin recommended for full access)
- Use demo credentials above

### 2. Dashboard
- View real-time KPI metrics
- Monitor active drones and orders
- Check alerts and system status
- **Start Simulation** - Click "Start" button
- **Adjust Speed** - Use 0.5x, 1x, 2x, 5x buttons

### 3. Live Map
- View all drones on 3D tilted map
- Click drone markers for details
- Send commands (Force Return, Emergency Land)
- Toggle layers (drones, kiosks, restaurants)

### 4. Orders
- View all orders in table format
- Filter by status
- Create test orders
- Track delivery progress

### 5. Drones
- Monitor entire fleet
- View battery levels and status
- Check flight statistics
- Identify maintenance needs

## 🏗️ Architecture

### Backend Architecture
```
Client Request → Express Router → Service Layer → Simulation Engine
                                                       ↓
                                                  Data Store
                                                       ↓
                                            Socket.IO Broadcast
                                                       ↓
                                                  All Clients
```

### Frontend Architecture
```
React Components → Zustand Stores → Socket.IO Client → Backend
                        ↓
                  Real-time Updates
                        ↓
                   UI Re-render
```

### WebSocket Events

**Server → Client:**
- `drone:update` - Batch drone positions (100ms)
- `order:update` - Order status changes
- `kpi:update` - Dashboard metrics (2s)
- `alert:new` - New alerts
- `simulation:state` - Simulation status

**Client → Server:**
- `simulation:start/pause/resume`
- `simulation:speed` - Change simulation speed
- `simulation:scenario` - Load scenario
- `drone:command` - Control drones
- `order:create` - Create new order
- `weather:update` - Adjust weather impact

## 📊 Simulation Details

### Drone States
1. **IDLE** - At kiosk, available for assignment
2. **CHARGING** - Battery recharging
3. **FLYING_TO_RESTAURANT** - En route to pickup
4. **WAITING_FOR_PICKUP** - Hovering at restaurant
5. **FLYING_TO_CUSTOMER** - Delivering order
6. **DELIVERING** - Landing and handoff
7. **RETURNING_TO_KIOSK** - Return flight
8. **EMERGENCY_LANDING** - Critical battery
9. **MAINTENANCE** - Out of service

### Battery Model
- Base consumption: 2% per km
- Payload factor: +0.5% per kg
- Altitude factor: +0.3% per 100m
- Weather multiplier: 1.0x - 2.0x
- Charging rate: 30% per hour

### Scenarios

**Normal Day**
- Order frequency: 0.5/min
- 15 active drones
- Clear weather
- 5% failure rate

**Peak Hour**
- Order frequency: 2/min
- 20 active drones
- 1.2x battery drain
- 15% failure rate

**Bad Weather**
- Order frequency: 0.3/min
- 12 active drones
- 50% speed reduction
- 2x battery drain
- 30% failure rate

## 🎓 Academic Value

This project demonstrates:

1. **Full-Stack Development** - Complete MERN-like stack
2. **Real-Time Systems** - WebSocket architecture
3. **Complex Algorithms** - Pathfinding, scheduling, physics
4. **State Management** - Zustand patterns
5. **UI/UX Design** - Professional dashboard design
6. **TypeScript** - Type-safe development
7. **Simulation** - Realistic modeling
8. **Scalability** - Modular architecture

## 🔮 Future Enhancements

- [ ] PostgreSQL/MongoDB integration
- [ ] User authentication with JWT
- [ ] Advanced analytics (ML predictions)
- [ ] Mobile app (React Native)
- [ ] Multi-region support
- [ ] Weather API integration
- [ ] Drone camera feeds
- [ ] Customer mobile tracking
- [ ] Payment integration
- [ ] Automated testing suite

## 📝 API Documentation

### REST Endpoints

```
GET  /api/drones          - Get all drones
GET  /api/drones/:id      - Get single drone
GET  /api/orders          - Get all orders
GET  /api/orders/:id      - Get single order
GET  /api/kiosks          - Get all kiosks
GET  /api/restaurants     - Get all restaurants
GET  /api/alerts          - Get all alerts
GET  /api/kpi             - Get KPI metrics
GET  /api/simulation/state - Get simulation state
POST /api/orders          - Create new order
```

## 🐛 Troubleshooting

**Backend won't start:**
- Check if port 3001 is available
- Run `npm install` in backend folder
- Check Node.js version (18+)

**Frontend won't start:**
- Check if port 5173 is available
- Run `npm install` in frontend folder
- Clear browser cache

**Map not loading:**
- Check internet connection (OSM tiles)
- Verify MapLibre GL CSS is loaded
- Check browser console for errors

**Real-time updates not working:**
- Ensure backend is running
- Check WebSocket connection in browser DevTools
- Verify firewall settings

## 👨‍💻 Development

### Build for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve dist/ folder with any static server
```

### Code Style
- ESLint + Prettier configured
- TypeScript strict mode
- Functional React components
- Zustand for state management

## 📄 License

MIT License - Free for academic and personal use

## 🙏 Acknowledgments

- MapLibre GL JS for free mapping
- OpenStreetMap for tile data
- Lucide for beautiful icons
- Tailwind CSS for rapid styling

---

**Built with ❤️ for B.Tech Final Year Project**

For questions or support, please open an issue on GitHub.
