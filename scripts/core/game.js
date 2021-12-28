import * as Core from './exports.js';

/**
 * Set the Game.
 */
const Game = {

	// Engine.
	Camera:   new Core.Engine.Camera(),
	Clock:    new Core.Engine.Clock(),
	Frames:   new Core.Engine.Frames(),
	Hooks:    new Core.Engine.Hooks(),
	Hud:      new Core.Engine.Hud(),
	Input:    new Core.Engine.Input(),
	Room:     new Core.Engine.Room(),
	View:     new Core.Engine.View(),

	// Physics.
	Friction: new Core.Physics.Friction(),
	Gravity:  new Core.Physics.Gravity(),

	// Utilities.
	Colors:   new Core.Utilities.Colors(),
};

// Export the Game.
export default Game;
