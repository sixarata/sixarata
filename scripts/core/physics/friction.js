import Damping from './damping.js';

/**
 * Backward-compatible name for the former friction subsystem.
 *
 * @deprecated Use Damping; this system applies velocity decay rather than a
 * physical friction force.
 */
export default class Friction extends Damping {}
