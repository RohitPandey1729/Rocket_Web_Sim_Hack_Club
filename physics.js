class RocketPhysics {
    constructor(config = {}) {
        // Rocket properties
        this.mass = config.mass || 1000; // kg
        this.thrust = config.thrust || 1.0;
        this.fuelMass = config.fuel || 100; // kg
        this.maxFuel = config.fuel || 100;
        this.fuelConsumptionRate = 5;
        this.rocketRadius = 1.1;
        this.rocketHeight = 18;
        this.dragCoefficient = 0.3;

        // Position and velocity
        this.x = 0; // horizontal position
        this.y = 0; // vertical position
        this.vx = 0; // horizontal velocity
        this.vy = 0; // vertical velocity
        this.angle = Math.PI / 2; // Rocket pointing straight up

        // Physics constants
        this.g = 9.81;
        this.airDensity = 1.225; // kg/m^3 at sea level
        this.crossSectionalArea = Math.PI * this.rocketRadius ** 2; // m^2

        // Environment
        this.windSpeed = 0; // m/s
        this.windGust = 0;
        this.time = 0;
        this.isLaunched = false;
        this.maxAltitude = 0;
    }

    // Update physics each frame
    update(dt, thrustMultiplier = 1.0) {
        if (!this.isLaunched) return;
        if (dt > 0.05) dt = 0.05; // Cap delta time to prevent large jumps
        this.time += dt;

        // Consume fuel
        const fuelBurn = this.fuelConsumptionRate * thrustMultiplier * dt;
        if (fuelBurn > 0) {
            this.fuelMass = Math.max(0, this.fuelMass - fuelBurn);
        }

        // Calculate total mass
        const totalMass = this.mass + this.fuelMass;

        // Thrust force
        let thrustForce = 0;
        if (this.fuelMass > 0 && thrustMultiplier > 0) {
            thrustForce = 50000 * thrustMultiplier;
        }
        
        // Thrust components
        const thrustX = thrustForce * Math.sin(this.angle) / totalMass;
        const thrustY = thrustForce * Math.cos(this.angle) / totalMass;

        // Wind effect
        const windForce = this.airDensity * (this.windSpeed + this.windGust - this.vx) * 500;
        const windAcceleration = windForce / totalMass;

        // Gravitational acceleration
        const gravityAcceleration = this.g;

        // Drag force
        const relativeVx = this.vx - (this.windSpeed + this.windGust);
        const relativeVy = this.vy;
        const speed = Math.sqrt(relativeVx ** 2 + relativeVy ** 2);
        const dragMagnitude = 0.5 * this.airDensity * speed ** 2 * this.dragCoefficient * this.crossSectionalArea;

        // Drag components
        let dragX = 0, dragY = 0;
        if (speed > 0.1) {
            dragX = -(dragMagnitude * relativeVx / speed) / totalMass;
            dragY = -(dragMagnitude * relativeVy / speed) / totalMass;
        }

        // Net accelerations
        const ax = thrustX + windAcceleration + dragX;
        const ay = thrustY - gravityAcceleration + dragY;

        // Update velocities
        this.vx += ax * dt;
        this.vy += ay * dt;

        // Update positions
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Update max altitude
        if (this.y > this.maxAltitude) {
            this.maxAltitude = this.y;
        }

        // Stop if rocket hits the ground
        if (this.y <= 0) {
            this.y = 0;
            this.vy = Math.max(0, this.vy);
            if (this.vy < 0.1 && this.y === 0) {
                this.vx *= 0.95;
            }
        }

        // Update angle based on velocity
        if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
            this.angle = Math.atan2(this.vx, this.vy);
        }
    }

    launch() {
        this.isLaunched = true;
        this.time = 0;
        this.maxAltitude = 0;
    }

    reset(config = {}) {
        this.mass = config.mass || 1000;
        this.thrust = config.thrust || 1.0;
        this.fuelMass = config.fuel || 100;
        this.maxFuel = config.fuel || 100;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.angle = Math.PI / 2;
        this.time = 0;
        this.isLaunched = false;
        this.maxAltitude = 0;
    }

    setWind(speed) {
        this.windSpeed = speed;
    }

    addWindGust(magnitude) {
        this.windGust += magnitude;
        this.windGust *= 0.98;
    }

    // Get telemetry data for display
    getTelemetry() {
        const speed = Math.sqrt(this.vx ** 2 + this.vy ** 2);
        return {
            altitude: this.y,
            velocity: speed,
            vx: this.vx,
            vy: this.vy,
            fuel: Math.max(0, this.fuelMass),
            mass: this.mass + Math.max(0, this.fuelMass),
            time: this.time.toFixed(2),
            windSpeed: this.windSpeed,
            angle: (this.angle * 180 / Math.PI - 90).toFixed(1) // Convert to degrees and adjust for display
        };
    }
}

// Create global physics instance
let rocketPhysics = null;

// Initialize physics with default config
function initPhysics(config) {
    rocketPhysics = new RocketPhysics(config);
}