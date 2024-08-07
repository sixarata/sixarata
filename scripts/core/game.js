import * as Core from './exports.js';

/**
 * Set the Game.
 */
const Game = {

	// Components.
	Audio:    new Core.Components.Audio(),
	Camera:   new Core.Components.Camera(),
	Clock:    new Core.Components.Clock(),
	Frames:   new Core.Components.Frames(),
	Hud:      new Core.Components.Hud(),
	Input:    new Core.Components.Input(),
	Room:     new Core.Components.Room(),
	View:     new Core.Components.View(),

	// Physics.
	Friction: new Core.Physics.Friction(),
	Gravity:  new Core.Physics.Gravity(),

	// Utilities.
	Colors:   new Core.Utilities.Colors(),
	Hooks:    new Core.Utilities.Hooks(),
};

// Export the Game.
export default Game;
