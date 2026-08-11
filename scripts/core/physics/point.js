import Vector from './vector.js';

/**
 * A point in three-dimensional space.
 *
 * Point retains the vector arithmetic API for compatibility, while giving
 * spatial locations a distinct semantic type from physical vectors.
 */
export default class Point extends Vector {}
