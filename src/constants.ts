export const GameConfig = {

    //screen constants
    WIDTH: 1024,
    HEIGHT: 576,

    //terrain constants
    TERRAIN_COLOR: 0x1a471a, // Darker forest green
    SKY_TOP: 0x000000,       // Black
    SKY_BOTTOM: 0x6c0a7d,    // Deep Dark Purple
    BASE_HEIGHT: 400, // Average height of hills

    //physics Constants
    GRAVITY: 600,
    WIND: 0, // this can be randomized per turn
    EXPLOSION_RADIUS: 40,
};

export const TankConfig = {
    // Movement
    MOVE_DISTANCE: 150,        // Pixels per move volley
    MAX_CLIMB_HEIGHT: 2,      // Maximum height difference allowed when moving
    INITIAL_MOVE_CHARGES: 4,  // Starting number of move charges

    // Dimensions
    TANK_WIDTH: 24,           // Chassis width
    TANK_HEIGHT: 12,          // Chassis height
    TURRET_LENGTH: 16,        // Barrel length
    GROUND_OFFSET: 6,         // Distance from ground to tank center
    TILT_SAMPLE_DISTANCE: 8,  // Distance from center to sample tilt (rear/front)

    // Scoring
    MAX_EXPLOSION_POINTS: 100, // Maximum points from direct hit
};
