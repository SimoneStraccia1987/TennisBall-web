# TennisBall browser game

Play: https://SimoneStraccia1987.github.io/TennisBall-web/

Sign in, click Start, then choose Training for the wave campaign, Match for tennis versus AI, or Padel for local doubles with one human and three AI players.
Training: complete or skip the tutorial and click a target to serve. Q toggles lob, D sprints, and F charges a power shot.
Both modes show up to three incoming launch zones: before the bounce, rising after it, and falling after it. Low returns retain a lower before-bounce contact. Colors run from green to amber to red as reaching a zone gets harder from your current position. Human and AI base movement is 3.5 m/s; player upgrades and Sprint remain available. Flight prediction continues beyond contact through the second ground bounce, regardless of faults, court boundaries or time settings. Rebound, friction and spin response have been corrected and calibrated against the standard tennis-ball drop test.
Match: choose a landing point with mouse/touch or arrows/right stick; hit with Enter/RT or click/tap. Settings pauses the match and offers Restart/Menu at the top. Shared settings support automatic/manual movement, swipe aim, auto launch and aim assistance. Sprint uses D/Shift or A; PowerShot uses F/Space or X according to movement mode. Q/B arms a lob. The AI moves with animated side steps and alternates centre shots with open-side placements. Win one game with deuce and advantage. Both modes share the same HUD, settings and cameras; target framing includes both players in RTS and behind-player Match views.

Padel: play on the enclosed 10 x 20 metre court using the same movement, aiming and timed swing controls. The scoreboard tracks doubles service order, points, games, sets and tiebreaks; win two sets. A serve drops and bounces before the racket strikes it. Return the serve after its diagonal bounce; later volleys and legal glass rebounds remain playable. The group camera includes the four players and court. Settings offers pause, restart and return to menu.

The 3D game canvas fills the browser viewport. All game controls use Godot UI; the web host has no toolbar or overlays.
On iPhone, use Share > Add to Home Screen > Add and launch TennisBall from its icon.
On Android, use the browser menu > Install app or Add to Home screen.
Home Screen app mode hides browser toolbars; system status/navigation UI may remain.

This repository contains the exported browser game. The Godot C# source project is maintained separately.
The browser runtime uses Godot 4.7.2 and 2dog on .NET WebAssembly / WebGL 2.
GitHub Pages publishes the main branch root. Keep .nojekyll and the _framework directory.
