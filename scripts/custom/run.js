// Imports.
import Sixarata from '../core/game.js';
import * as Rooms from '../custom/rooms/exports.js';

// Sunrise.
Sixarata.Hooks.add( 'Run.init', Sixarata.Input.hooks,  4  );
Sixarata.Hooks.add( 'Run.init', Sixarata.Clock.hooks,  6  );
Sixarata.Hooks.add( 'Run.init', Sixarata.Camera.hooks, 8  );
Sixarata.Hooks.add( 'Run.init', Sixarata.Room.hooks,   10 );
Sixarata.Hooks.add( 'Run.init', Sixarata.View.hooks,   10 );
Sixarata.Hooks.add( 'Run.init', Sixarata.Hud.hooks,    10 );

// Set rooms.
Sixarata.Room.rooms = Object.values( Rooms );

// Initialize.
Sixarata.Hooks.do( 'Run.init' );

// Start.
Sixarata.Hooks.do( 'Run.start' );

// Custom.
Sixarata.Hooks.do( 'Run.custom' );
