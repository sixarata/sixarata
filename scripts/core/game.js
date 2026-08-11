import * as Core from './exports.js';

/**
 * Set the Game.
 */
const Game = {

	// Interfaces.
	Audio:      new Core.Interfaces.Audio(),
	Inputs:     new Core.Interfaces.Inputs(),
	Screen:     new Core.Interfaces.Screen(),

	// Components.
	Camera:     new Core.Components.Camera(),
	Clock:      new Core.Components.Clock(),
	Frame:      new Core.Components.Frame(),
	Hud:        new Core.Components.Hud(),
	Room:       new Core.Components.Room(),
	View:       new Core.Components.View(),

	// Controls.
	Combos:     new Core.Controls.Combo(),
	History:    new Core.Controls.History(),

	// Physics.
	Damping:    new Core.Physics.Damping(),
	Gravity:    new Core.Physics.Gravity(),
	Kinematics: new Core.Physics.Kinematics(),

	// Utilities.
	Colors:     new Core.Utilities.Colors(),
	Hooks:      new Core.Utilities.Hooks(),
	Jobs:       new Core.Utilities.Jobs(),
};

// Export the Game.
export default Game;
