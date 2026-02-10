# MODULE DOCUMENTATION
## Drone Delivery Management & Simulation Platform

---

## TABLE OF CONTENTS

1. [Backend Modules](#backend-modules)
   - Simulation Engine
   - Drone Controller
   - Pathfinding System
   - Battery Model
   - WebSocket Server
   - REST API
   - Data Store

2. [Frontend Modules](#frontend-modules)
   - Dashboard
   - Live Map
   - Order Management
   - Fleet Management
   - Authentication

---

## BACKEND MODULES

### 1. SIMULATION ENGINE MODULE

**Description:**  
The Simulation Engine is the core orchestrator that manages the entire drone delivery simulation. It runs a continuous update loop at 100ms intervals, coordinating all drone controllers, checking for safety violations, assigning orders to available drones, and broadcasting real-time updates to connected clients via WebSocket.

**Key Responsibilities:**
- Execute simulation loop at configurable speed (0.5x to 5x)
- Update all drone controllers every tick
- Detect and handle collision risks between drones
- Check for no-fly zone violations
- Monitor low battery alerts
- Assign pending orders to available drones
- Generate new orders based on scenario parameters
- Broadcast state updates to all connected clients

**Input:**
- Simulation control commands (start, pause, resume, speed change)
- Scenario selection (Normal, Peak Hour, Bad Weather)
- Weather impact slider value (0-100)
- Drone commands from operators

**Process:**
- Initialize drone controllers for all drones
- Run update loop at 100ms intervals
- Calculate elapsed time based on speed multiplier
- Update each drone's position and status
- Perform safety checks (collisions, no-fly zones, battery)
- Execute order assignment algorithm
- Generate new orders based on scenario frequency

**Output:**
- Real-time drone positions and status
- KPI metrics (active drones, orders, success rate)
- Alerts (collision risks, low battery, violations)
- Event logs (all significant actions)

```mermaid
graph TB
    A[Start Simulation] --> B[Initialize Controllers]
    B --> C[Update Loop 100ms]
    C --> D[Update All Drones]
    D --> E[Check Collisions]
    E --> F[Check No-Fly Zones]
    F --> G[Check Low Battery]
    G --> H[Assign Orders]
    H --> I[Generate New Orders]
    I --> J[Calculate KPIs]
    J --> K[Broadcast Updates]
    K --> C
    
    style A fill:#4CAF50
    style K fill:#2196F3
```

**Context Diagram:**

```mermaid
graph LR
    WS[WebSocket Clients] -->|Commands| SE[Simulation Engine]
    SE -->|Updates| WS
    SE -->|Control| DC[Drone Controllers]
    DC -->|Status| SE
    SE -->|Read/Write| DS[Data Store]
    SE -->|Check| NFZ[No-Fly Zones]
    SE -->|Create| AL[Alerts]
    SE -->|Log| EL[Event Logs]
    
    style SE fill:#FF9800
```

---

### 2. DRONE CONTROLLER MODULE

**Description:**  
Each drone has its own controller that manages its individual behavior, state transitions, and decision-making. The controller handles autonomous flight, battery management, order execution, and responds to emergency situations. It implements a state machine with 9 distinct states.

**Key Responsibilities:**
- Manage drone state transitions (IDLE → FLYING → DELIVERING → RETURNING)
- Execute waypoint-based navigation along routes
- Monitor battery levels and initiate emergency returns
- Handle order pickup and delivery sequences
- Manage charging queue at kiosks
- Respond to operator commands (force return, emergency land)
- Calculate battery consumption based on flight conditions

**Input:**
- Time delta for physics calculations
- Simulation speed multiplier
- Current weather conditions
- Operator commands (return, emergency land)
- Order assignments

**Process:**
- Update drone position using interpolation between waypoints
- Calculate battery drain based on distance, payload, altitude, weather
- Check if battery is sufficient for current mission
- Transition between states based on conditions
- Handle charging queue management at kiosks
- Execute delivery sequences with timing

**Output:**
- Updated drone position (lat, lng, altitude)
- Current battery level (0-100%)
- Status updates (IDLE, FLYING, CHARGING, etc.)
- Route completion notifications
- Emergency alerts when battery critical

```mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> CHARGING: Battery < 40%
    IDLE --> FLYING_TO_RESTAURANT: Order Assigned
    CHARGING --> IDLE: Battery = 100%
    FLYING_TO_RESTAURANT --> WAITING_FOR_PICKUP: Arrived
    WAITING_FOR_PICKUP --> FLYING_TO_CUSTOMER: Pickup Complete
    FLYING_TO_CUSTOMER --> DELIVERING: Arrived
    DELIVERING --> RETURNING_TO_KIOSK: Delivery Complete
    RETURNING_TO_KIOSK --> IDLE: Arrived at Kiosk
    FLYING_TO_RESTAURANT --> EMERGENCY_LANDING: Battery Critical
    FLYING_TO_CUSTOMER --> EMERGENCY_LANDING: Battery Critical
    EMERGENCY_LANDING --> MAINTENANCE: Landed
```

**Flowchart: Order Execution**

```mermaid
flowchart TD
    A[Order Assigned] --> B[Calculate Flight Altitude]
    B --> C[Set Route to Restaurant]
    C --> D[Status: FLYING_TO_RESTAURANT]
    D --> E{Arrived?}
    E -->|No| F[Update Position]
    F --> G[Drain Battery]
    G --> H{Battery OK?}
    H -->|Yes| E
    H -->|No| I[Emergency Return]
    E -->|Yes| J[Status: WAITING_FOR_PICKUP]
    J --> K[Wait 30 seconds]
    K --> L[Pickup Order]
    L --> M[Set Route to Customer]
    M --> N[Status: FLYING_TO_CUSTOMER]
    N --> O{Arrived?}
    O -->|No| P[Update Position]
    P --> Q[Drain Battery]
    Q --> R{Battery OK?}
    R -->|Yes| O
    R -->|No| I
    O -->|Yes| S[Status: DELIVERING]
    S --> T[Deliver Order]
    T --> U[Return to Kiosk]
    
    style A fill:#4CAF50
    style T fill:#2196F3
    style I fill:#F44336
```

---

### 3. PATHFINDING SYSTEM MODULE

**Description:**  
The Pathfinding System provides navigation utilities for calculating routes, distances, and bearings between geographic coordinates. It uses the Haversine formula for accurate distance calculations on Earth's curved surface and implements no-fly zone avoidance and altitude layering for collision prevention.

**Key Responsibilities:**
- Calculate accurate distances using Haversine formula
- Compute bearing angles between coordinates (0-360°)
- Interpolate positions for smooth drone movement
- Detect no-fly zone violations using point-in-polygon algorithm
- Generate optimized routes avoiding restricted areas
- Assign flight altitudes based on direction (altitude layering)

**Input:**
- Start position (latitude, longitude, altitude)
- End position (latitude, longitude, altitude)
- No-fly zone polygons
- Interpolation progress (0.0 to 1.0)

**Process:**
- Convert latitude/longitude to radians
- Apply Haversine formula for great-circle distance
- Calculate bearing using arctangent of coordinate differences
- Check if waypoints intersect no-fly zones
- Add avoidance waypoints if necessary
- Determine altitude based on flight bearing

**Output:**
- Distance in kilometers
- Bearing in degrees (0-360)
- Interpolated position along route
- Optimized route with waypoints
- Flight altitude (80m or 100m)

```mermaid
graph TB
    A[Start & End Positions] --> B[Calculate Distance]
    B --> C[Calculate Bearing]
    C --> D{Check No-Fly Zones}
    D -->|Violation| E[Add Avoidance Waypoint]
    D -->|Clear| F[Direct Route]
    E --> G[Calculate Flight Altitude]
    F --> G
    G --> H{Bearing Analysis}
    H -->|N/S 315-45° or 135-225°| I[Altitude = 80m]
    H -->|E/W 45-135° or 225-315°| J[Altitude = 100m]
    I --> K[Return Optimized Route]
    J --> K
    
    style A fill:#4CAF50
    style K fill:#2196F3
```

**Haversine Formula Diagram:**

```mermaid
graph LR
    A[Point A<br/>lat1, lng1] --> C[Haversine<br/>Formula]
    B[Point B<br/>lat2, lng2] --> C
    C --> D[Δlat = lat2 - lat1]
    C --> E[Δlng = lng2 - lng1]
    D --> F[a = sin²Δlat/2 +<br/>cos lat1 × cos lat2 × sin²Δlng/2]
    E --> F
    F --> G[c = 2 × atan2√a, √1-a]
    G --> H[distance = R × c<br/>R = 6371 km]
    
    style H fill:#FF9800
```

---

### 4. BATTERY MODEL MODULE

**Description:**  
The Battery Model simulates realistic battery consumption and charging for drones based on multiple factors including distance traveled, payload weight, altitude, weather conditions, and flight speed. It also provides range estimation and charging management.

**Key Responsibilities:**
- Calculate battery drain per flight segment
- Factor in payload weight, altitude, and weather
- Estimate remaining flight range
- Calculate charging rates and times
- Determine when drone should return to kiosk
- Manage idle battery drain

**Input:**
- Drone specifications (max battery capacity, current battery %)
- Distance traveled (kilometers)
- Current payload weight (kg)
- Altitude (meters)
- Weather condition and impact percentage
- Time elapsed (for charging/idle)

**Process:**
- Calculate base consumption (1% per km)
- Add payload factor (0.3% per kg per km)
- Add altitude factor (0.2% per 100m per km)
- Apply weather multiplier (1.0x to 2.0x)
- Sum all factors for total drain
- For charging: apply 50% per hour rate

**Output:**
- Battery percentage consumed
- Estimated remaining range (km)
- Charging percentage gained
- Boolean: should return to kiosk

```mermaid
graph TD
    A[Flight Segment] --> B[Base Consumption<br/>1% per km]
    A --> C[Payload Factor<br/>0.3% × weight × distance]
    A --> D[Altitude Factor<br/>0.2% × altitude/100 × distance]
    A --> E[Weather Multiplier<br/>1.0x to 2.0x]
    B --> F[Sum Factors]
    C --> F
    D --> F
    F --> G[Apply Weather Multiplier]
    E --> G
    G --> H[Total Battery Drain]
    
    style A fill:#4CAF50
    style H fill:#F44336
```

**Input-Process-Output Diagram:**

```mermaid
graph LR
    subgraph Input
        I1[Distance: 5 km]
        I2[Payload: 2 kg]
        I3[Altitude: 100 m]
        I4[Weather: 50% impact]
    end
    
    subgraph Process
        P1[Base: 5%]
        P2[Payload: 3%]
        P3[Altitude: 1%]
        P4[Weather: ×1.5]
        P5[Total: 13.5%]
    end
    
    subgraph Output
        O1[Battery Drain: 13.5%]
        O2[Remaining: 86.5%]
        O3[Range: ~32 km]
    end
    
    I1 --> P1
    I2 --> P2
    I3 --> P3
    I4 --> P4
    P1 --> P5
    P2 --> P5
    P3 --> P5
    P4 --> P5
    P5 --> O1
    O1 --> O2
    O2 --> O3
    
    style P5 fill:#FF9800
```

---

### 5. WEBSOCKET SERVER MODULE

**Description:**  
The WebSocket Server manages real-time bidirectional communication between the backend and all connected clients using Socket.IO. It handles client connections, broadcasts simulation updates, and processes commands from operators.

**Key Responsibilities:**
- Manage client connections and disconnections
- Broadcast drone position updates (100ms intervals)
- Send KPI metrics updates (2-second intervals)
- Emit alerts and event logs in real-time
- Handle simulation control commands
- Process drone commands from operators
- Manage order creation requests

**Input:**
- Client connection requests
- Simulation control commands (start, pause, speed)
- Drone commands (return, emergency land)
- Order creation requests
- Weather adjustment commands

**Process:**
- Establish WebSocket connections
- Register event listeners for all command types
- Batch and broadcast updates to all clients
- Validate incoming commands
- Forward commands to simulation engine
- Emit responses and acknowledgments

**Output:**
- Real-time drone updates to all clients
- KPI metrics broadcasts
- Alert notifications
- Event log updates
- Simulation state changes
- Command acknowledgments

```mermaid
sequenceDiagram
    participant C as Client
    participant WS as WebSocket Server
    participant SE as Simulation Engine
    participant DS as Data Store
    
    C->>WS: Connect
    WS->>C: Connection Acknowledged
    C->>WS: simulation:start
    WS->>SE: Start Simulation
    
    loop Every 100ms
        SE->>DS: Get Drone Positions
        DS->>SE: Drone Data
        SE->>WS: Broadcast Updates
        WS->>C: drone:update
    end
    
    loop Every 2s
        SE->>WS: KPI Metrics
        WS->>C: kpi:update
    end
    
    SE->>WS: New Alert
    WS->>C: alert:new
```

**Event Flow Diagram:**

```mermaid
graph TB
    subgraph Client Events
        C1[simulation:start]
        C2[simulation:pause]
        C3[simulation:speed]
        C4[drone:command]
        C5[order:create]
    end
    
    subgraph Server Events
        S1[drone:update]
        S2[order:update]
        S3[kpi:update]
        S4[alert:new]
        S5[simulation:state]
    end
    
    C1 --> WS[WebSocket<br/>Server]
    C2 --> WS
    C3 --> WS
    C4 --> WS
    C5 --> WS
    
    WS --> S1
    WS --> S2
    WS --> S3
    WS --> S4
    WS --> S5
    
    style WS fill:#FF9800
```

---

### 6. REST API MODULE

**Description:**  
The REST API provides HTTP endpoints for retrieving system data and creating orders. It serves as the primary interface for initial data loading and non-real-time operations, complementing the WebSocket server for real-time updates.

**Key Responsibilities:**
- Serve drone fleet data
- Provide order information
- Return kiosk and restaurant details
- Deliver alert history
- Supply KPI metrics
- Handle order creation
- Provide simulation state

**Input:**
- HTTP GET requests for data retrieval
- HTTP POST requests for order creation
- Query parameters for filtering

**Process:**
- Parse incoming HTTP requests
- Validate request parameters
- Query data store for requested information
- Format response as JSON
- Apply CORS headers
- Handle errors gracefully

**Output:**
- JSON responses with requested data
- HTTP status codes (200, 201, 400, 404, 500)
- Error messages for invalid requests

```mermaid
graph LR
    C[Client] -->|GET /api/drones| API[REST API]
    C -->|GET /api/orders| API
    C -->|GET /api/kiosks| API
    C -->|POST /api/orders| API
    
    API -->|Query| DS[Data Store]
    DS -->|Data| API
    API -->|JSON Response| C
    
    style API fill:#4CAF50
```

**API Endpoint Structure:**

```mermaid
graph TD
    A[REST API] --> B[GET Endpoints]
    A --> C[POST Endpoints]
    
    B --> D[/api/drones<br/>Get all drones]
    B --> E[/api/orders<br/>Get all orders]
    B --> F[/api/kiosks<br/>Get all kiosks]
    B --> G[/api/restaurants<br/>Get all restaurants]
    B --> H[/api/alerts<br/>Get all alerts]
    B --> I[/api/kpi<br/>Get KPI metrics]
    
    C --> J[/api/orders<br/>Create new order]
    
    style A fill:#2196F3
```

---

### 7. DATA STORE MODULE

**Description:**  
The Data Store is an in-memory database that maintains the current state of all entities in the simulation. It uses JavaScript Maps for efficient lookups and provides methods for creating, reading, updating, and deleting entities.

**Key Responsibilities:**
- Store all drones, orders, kiosks, restaurants
- Maintain alerts and event logs
- Initialize entities with default data
- Provide CRUD operations for all entity types
- Ensure data consistency
- Support fast lookups by ID

**Input:**
- Entity creation requests
- Entity update requests
- Query requests by ID or filters

**Process:**
- Initialize Maps for each entity type
- Populate with initial data (30 kiosks, 52 restaurants, 40 drones)
- Handle add/update/delete operations
- Maintain relationships between entities
- Generate unique IDs for new entities

**Output:**
- Entity data by ID
- Lists of all entities
- Filtered entity collections
- Success/failure confirmations

```mermaid
graph TB
    A[Data Store] --> B[Drones Map<br/>40 entries]
    A --> C[Orders Map<br/>Dynamic]
    A --> D[Kiosks Map<br/>30 entries]
    A --> E[Restaurants Map<br/>52 entries]
    A --> F[Alerts Map<br/>Dynamic]
    A --> G[Event Logs Array<br/>Dynamic]
    A --> H[No-Fly Zones Map<br/>Static]
    
    style A fill:#9C27B0
```

---

## FRONTEND MODULES

### 8. DASHBOARD MODULE

**Description:**  
The Dashboard is the main landing page that provides an at-a-glance view of the entire system's health and performance. It displays real-time KPI metrics, simulation controls, recent alerts, and quick access to all major features.

**Key Responsibilities:**
- Display 8 KPI cards with live metrics
- Provide simulation controls (start, pause, speed, scenario)
- Show recent alerts with severity indicators
- Display active orders and drone status
- Render charts for performance trends
- Enable quick navigation to other pages

**Input:**
- Real-time KPI updates via WebSocket
- Alert notifications
- Simulation state changes
- User interactions (button clicks)

**Process:**
- Subscribe to WebSocket events
- Update state in Zustand store
- Re-render components on data changes
- Format numbers and percentages
- Apply color coding based on thresholds
- Handle user control actions

**Output:**
- Visual KPI cards (total drones, active, orders, revenue)
- Simulation control panel
- Alert list with timestamps
- Performance charts
- Navigation links

```mermaid
graph TB
    A[Dashboard Page] --> B[KPI Cards Section]
    A --> C[Simulation Controls]
    A --> D[Alerts Panel]
    A --> E[Quick Stats]
    
    B --> B1[Total Drones: 40]
    B --> B2[Active Drones: 15]
    B --> B3[Orders Today: 45]
    B --> B4[Success Rate: 100%]
    
    C --> C1[Start/Pause Button]
    C --> C2[Speed Selector]
    C --> C3[Scenario Dropdown]
    
    D --> D1[Critical Alerts]
    D --> D2[Warning Alerts]
    D --> D3[Info Alerts]
    
    style A fill:#2196F3
```

**Data Flow:**

```mermaid
sequenceDiagram
    participant D as Dashboard
    participant S as Zustand Store
    participant WS as WebSocket
    participant B as Backend
    
    D->>WS: Subscribe to kpi:update
    B->>WS: Emit kpi:update
    WS->>S: Update KPI State
    S->>D: Trigger Re-render
    D->>D: Display Updated Metrics
    
    D->>WS: Send simulation:start
    WS->>B: Forward Command
    B->>WS: Emit simulation:state
    WS->>S: Update Simulation State
    S->>D: Update UI (Running)
```

---

### 9. LIVE MAP MODULE

**Description:**  
The Live Map provides a real-time 3D visualization of all drones, kiosks, and restaurants on an interactive map. It uses MapLibre GL JS for hardware-accelerated rendering and displays drone positions, routes, and status information with 100ms update frequency.

**Key Responsibilities:**
- Render 3D tilted map of Delhi NCR
- Display 40 drone markers with real-time positions
- Show 30 kiosk markers and 52 restaurant markers
- Enable layer toggling (drones, kiosks, restaurants)
- Provide drone details panel on marker click
- Send drone commands (force return, emergency land)
- Display drone routes and flight paths

**Input:**
- Real-time drone position updates (100ms)
- User map interactions (pan, zoom, click)
- Layer toggle selections
- Drone command requests

**Process:**
- Initialize MapLibre GL map
- Create custom markers for each entity type
- Subscribe to drone:update WebSocket events
- Update marker positions smoothly
- Handle marker click events
- Render selected drone details
- Send commands via WebSocket

**Output:**
- Interactive 3D map visualization
- Real-time drone position updates
- Drone details sidebar
- Command confirmation messages
- Visual route lines

```mermaid
graph TB
    A[Live Map Component] --> B[Map Initialization]
    B --> C[MapLibre GL Instance]
    C --> D[Add Markers]
    
    D --> D1[40 Drone Markers]
    D --> D2[30 Kiosk Markers]
    D --> D3[52 Restaurant Markers]
    
    A --> E[WebSocket Listener]
    E --> F[drone:update Event]
    F --> G[Update Marker Positions]
    
    A --> H[User Interactions]
    H --> I[Click Drone Marker]
    I --> J[Show Details Panel]
    J --> K[Send Commands]
    
    style A fill:#4CAF50
```

**Component Architecture:**

```mermaid
graph LR
    LM[LiveMap.tsx] --> MC[Map Controls]
    LM --> MM[Marker Manager]
    LM --> DP[Details Panel]
    LM --> LT[Layer Toggles]
    
    MM --> DM[Drone Markers<br/>Custom SVG]
    MM --> KM[Kiosk Markers<br/>Icons]
    MM --> RM[Restaurant Markers<br/>Icons]
    
    DP --> DI[Drone Info]
    DP --> CB[Command Buttons]
    
    style LM fill:#FF9800
```

---

### 10. ORDER MANAGEMENT MODULE

**Description:**  
The Order Management module displays all delivery orders in a sortable, filterable table format. It shows order details, status, assigned drones, and delivery timelines. Users can create new test orders and track their progress through the delivery lifecycle.

**Key Responsibilities:**
- Display all orders in table format
- Filter orders by status (Pending, Assigned, In Transit, Delivered)
- Show order details (items, weight, price, timeline)
- Enable order creation with form validation
- Track order status changes in real-time
- Display estimated and actual delivery times

**Input:**
- Order list from REST API
- Real-time order updates via WebSocket
- User filter selections
- New order form data

**Process:**
- Fetch initial orders on page load
- Subscribe to order:update events
- Filter and sort orders based on user selection
- Validate new order form inputs
- Submit order creation requests
- Update table on order status changes

**Output:**
- Sortable order table
- Order status badges with colors
- Order creation form
- Success/error notifications
- Order timeline visualization

```mermaid
graph TB
    A[Orders Page] --> B[Order Table]
    A --> C[Filter Controls]
    A --> D[Create Order Form]
    
    B --> B1[Order ID]
    B --> B2[Customer]
    B --> B3[Restaurant]
    B --> B4[Status Badge]
    B --> B5[Assigned Drone]
    B --> B6[Timeline]
    
    C --> C1[All Orders]
    C --> C2[Pending]
    C --> C3[In Transit]
    C --> C4[Delivered]
    
    D --> D1[Select Restaurant]
    D --> D2[Select Items]
    D --> D3[Priority Level]
    D --> D4[Submit Button]
    
    style A fill:#9C27B0
```

**Order Lifecycle Flow:**

```mermaid
stateDiagram-v2
    [*] --> PENDING: Order Created
    PENDING --> ASSIGNED: Drone Assigned
    ASSIGNED --> PICKED_UP: At Restaurant
    PICKED_UP --> IN_TRANSIT: Flying to Customer
    IN_TRANSIT --> DELIVERED: Delivery Complete
    DELIVERED --> [*]
    
    PENDING --> CANCELLED: User Cancels
    ASSIGNED --> FAILED: Battery Critical
    PICKED_UP --> FAILED: Emergency
    IN_TRANSIT --> FAILED: Emergency
```

---

### 11. FLEET MANAGEMENT MODULE

**Description:**  
The Fleet Management module (Drones page) provides a comprehensive view of all drones in the fleet. It displays each drone's current status, battery level, location, assigned kiosk, flight statistics, and maintenance information in a card-based layout.

**Key Responsibilities:**
- Display all 40 drones in grid layout
- Show real-time battery levels with color coding
- Display current status and location
- Show flight statistics (total distance, flight time)
- Indicate assigned kiosk and current order
- Provide quick access to drone details
- Enable filtering by status

**Input:**
- Drone list from REST API
- Real-time drone updates via WebSocket
- User filter selections

**Process:**
- Fetch initial drone data
- Subscribe to drone:update events
- Update drone cards on status/battery changes
- Apply color coding based on battery level
- Filter drones by selected status
- Format statistics for display

**Output:**
- Grid of drone cards
- Battery level indicators (green/yellow/red)
- Status badges
- Flight statistics
- Kiosk assignments

```mermaid
graph TB
    A[Drones Page] --> B[Drone Grid]
    B --> C[Drone Card 1]
    B --> D[Drone Card 2]
    B --> E[Drone Card ...]
    B --> F[Drone Card 40]
    
    C --> C1[Drone Name]
    C --> C2[Battery: 85%<br/>Color: Green]
    C --> C3[Status: FLYING]
    C --> C4[Location: Lat, Lng]
    C --> C5[Kiosk: Connaught Place]
    C --> C6[Stats: 45km, 2.5h]
    
    style A fill:#FF5722
```

**Battery Level Color Coding:**

```mermaid
graph LR
    A[Battery Level] --> B{Check Level}
    B -->|> 60%| C[Green<br/>Healthy]
    B -->|40-60%| D[Yellow<br/>Warning]
    B -->|< 40%| E[Red<br/>Critical]
    B -->|< 15%| F[Red + Alert<br/>Emergency]
    
    style C fill:#4CAF50
    style D fill:#FFC107
    style E fill:#F44336
    style F fill:#D32F2F
```

---

### 12. AUTHENTICATION MODULE

**Description:**  
The Authentication module handles user login, session management, and role-based access control. It provides a login page, validates credentials, stores user sessions, and restricts access to features based on user roles (Admin, Restaurant Operator, Kiosk Operator).

**Key Responsibilities:**
- Display login form
- Validate user credentials
- Manage user sessions with Zustand
- Store authentication state
- Implement role-based access control
- Handle logout functionality
- Redirect based on authentication status

**Input:**
- Username and password from login form
- Session storage data
- Logout requests

**Process:**
- Validate form inputs
- Check credentials against stored users
- Create session on successful login
- Store user data in Zustand store
- Persist session to localStorage
- Check authentication on route changes
- Clear session on logout

**Output:**
- Authentication success/failure
- User role and permissions
- Session token
- Navigation to dashboard or login page

```mermaid
graph TB
    A[Login Page] --> B[Enter Credentials]
    B --> C{Validate}
    C -->|Valid| D[Create Session]
    C -->|Invalid| E[Show Error]
    D --> F[Store in Zustand]
    F --> G[Save to localStorage]
    G --> H[Redirect to Dashboard]
    E --> B
    
    I[Protected Route] --> J{Check Auth}
    J -->|Authenticated| K[Allow Access]
    J -->|Not Authenticated| L[Redirect to Login]
    
    style D fill:#4CAF50
    style E fill:#F44336
```

**Role-Based Access:**

```mermaid
graph TD
    A[User Login] --> B{Check Role}
    B -->|Admin| C[Full Access]
    B -->|Restaurant| D[Limited Access]
    B -->|Kiosk| E[Limited Access]
    
    C --> C1[Dashboard ✓]
    C --> C2[Live Map ✓]
    C --> C3[Orders ✓]
    C --> C4[Drones ✓]
    C --> C5[Analytics ✓]
    C --> C6[Settings ✓]
    
    D --> D1[Dashboard ✓]
    D --> D2[Orders ✓]
    D --> D3[Restaurant Stats ✓]
    
    E --> E1[Dashboard ✓]
    E --> E2[Kiosk Status ✓]
    E --> E3[Charging Queue ✓]
    
    style C fill:#4CAF50
    style D fill:#FFC107
    style E fill:#FFC107
```

---

## SYSTEM INTEGRATION DIAGRAM

```mermaid
graph TB
    subgraph Frontend
        F1[Dashboard]
        F2[Live Map]
        F3[Orders]
        F4[Drones]
        F5[Auth]
    end
    
    subgraph Communication
        WS[WebSocket<br/>Socket.IO]
        API[REST API<br/>Express]
    end
    
    subgraph Backend
        SE[Simulation<br/>Engine]
        DC[Drone<br/>Controllers]
        PF[Pathfinding]
        BM[Battery<br/>Model]
        DS[Data<br/>Store]
    end
    
    F1 --> WS
    F2 --> WS
    F3 --> WS
    F4 --> WS
    F1 --> API
    F3 --> API
    
    WS --> SE
    API --> DS
    SE --> DC
    DC --> PF
    DC --> BM
    DC --> DS
    SE --> DS
    
    style SE fill:#FF9800
    style WS fill:#2196F3
```

---

## MODULE INTERACTION SUMMARY

| Module | Interacts With | Purpose |
|--------|----------------|---------|
| Simulation Engine | All Drone Controllers, Data Store, WebSocket | Orchestrates simulation |
| Drone Controller | Pathfinding, Battery Model, Data Store | Manages individual drone |
| Pathfinding | Data Store (No-Fly Zones) | Route calculation |
| Battery Model | None (Pure calculation) | Battery physics |
| WebSocket Server | Simulation Engine, All Frontend | Real-time updates |
| REST API | Data Store | Data retrieval |
| Data Store | All Backend Modules | Central data repository |
| Dashboard | WebSocket, REST API | System overview |
| Live Map | WebSocket | Real-time visualization |
| Orders | WebSocket, REST API | Order management |
| Drones | WebSocket, REST API | Fleet monitoring |
| Auth | Data Store (Users) | Access control |

---

**END OF MODULE DOCUMENTATION**
