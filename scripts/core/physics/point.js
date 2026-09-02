import Vector from './vector.js';

/**
 * A point in three-dimensional space.
 *
 * Point retains the vector arithmetic API for compatibility, while giving
 * spatial locations a distinct semantic type from physical vectors.
 *
 * Point is not deprecated. It intentionally inherits Vector's arithmetic so a
 * location can be translated or compared, while instanceof checks can still
 * distinguish locations from Velocity, Acceleration, and Orientation values.
 */
export default class Point extends Vector {}
