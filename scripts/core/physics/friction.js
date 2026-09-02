import Damping from './damping.js';

/**
 * Backward-compatible name for the former friction subsystem.
 *
 * @deprecated Use Damping; this system applies velocity decay rather than a
 * physical friction force. A future surface-friction model may use Tile-side
 * material properties instead of this compatibility name.
 */
export default class Friction extends Damping {}
