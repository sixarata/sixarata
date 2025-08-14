// Imports.
import Sixarata from '../core/game.js';
import * as Rooms from '../custom/rooms/exports.js';

import './sunset.js';

// Sunrise.
Sixarata.Hooks.add( 'Run.init', Sixarata.Inputs.hooks, 4  );
Sixarata.Hooks.add( 'Run.init', Sixarata.Clock.hooks,  6  );
Sixarata.Hooks.add( 'Run.init', Sixarata.Camera.hooks, 8  );
Sixarata.Hooks.add( 'Run.init', Sixarata.Frame.hooks,  10 );
Sixarata.Hooks.add( 'Run.init', Sixarata.Room.hooks,   12 );
Sixarata.Hooks.add( 'Run.init', Sixarata.View.hooks,   14 );
Sixarata.Hooks.add( 'Run.init', Sixarata.Hud.hooks,    16 );

// Set rooms.
Sixarata.Room.rooms = Object.values( Rooms );

// Initialize.
Sixarata.Hooks.do( 'Run.init' );

// Start.
Sixarata.Hooks.do( 'Run.start' );

// Custom.
Sixarata.Hooks.do( 'Run.custom' );

// End.
Sixarata.Hooks.do( 'Run.end' );
