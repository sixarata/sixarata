import * as Core from './exports.js';

/**
 * Set the Game.
 */
const Game = {

	// Interfaces.
	Audio:      new Core.Interfaces.Audio(),
	Inputs:     new Core.Interfaces.Inputs(),

	// Components.
	Camera:     new Core.Components.Camera(),
	Clock:      new Core.Components.Clock(),
	Frames:     new Core.Components.Frames(),
	Hud:        new Core.Components.Hud(),
	Room:       new Core.Components.Room(),
	View:       new Core.Components.View(),

	// Physics.
	Friction:   new Core.Physics.Friction(),
	Gravity:    new Core.Physics.Gravity(),

	// Utilities.
	Colors:     new Core.Utilities.Colors(),
	Hooks:      new Core.Utilities.Hooks(),
	Jobs:       new Core.Utilities.Jobs(),
};

// Export the Game.
export default Game;
