// Cinematic mode picture kit, one entry per trade (shared contract in org/plan.md).
// story: 3-5 frames for the scroll hero. Frame 1 is the base picture; every
// later frame is that same picture edited one step further (same camera,
// lens, light and framing), so the frames line up when they crossfade.
// `accent` is the one word of the headline shown in italic.
// styles: 2-4 tabs for "Pick your style". beforeAfter: one drag pair; the
// before picture shows normal age and wear, never a claim about our own job.
// estimator: labels only, unit is the default price unit (same words as
// cinematic.js CINE_UNITS). Prices come only from what the owner types.
// tool: the one interactive moment this trade leads with (ideas from the
// lynam_up reels): wash = drag to clean the before/after pair, blueprint =
// a drawn plan laid over the finished picture, dial = a warmth dial over the
// first and last story frames, tabs = style tabs, drag = before/after slider.
// Copy rules: plain words, no prices, no rating numbers, no made-up claims.
// Trades are listed in the CEO's picture order (roofing and fencing first).

const SUFFIX =
  " Wide 16:9 photo, natural light, realistic, calm and premium, with quiet open space for a headline." +
  " No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks, no vehicles with writing.";

// A base picture (story frame 1, or any stand-alone picture).
const P = (scene) => scene + SUFFIX;
// A later story frame: the previous frame edited, nothing else moved.
const E = (change) =>
  "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: " +
  change + SUFFIX;
// The after picture of a before/after pair.
const A = (change) =>
  "Edit the before picture. Keep the exact same camera position, lens, framing and light; change only this: " +
  change + SUFFIX;

export const CINE_ORDER = [
  "roofing", "fencing", "pressure", "hvac", "restoration", "builder", "framing",
  "remodeling", "painting", "concrete", "landscaping", "tree", "garage",
  "plumbing", "electrical", "pest", "junk", "cleaning", "towing",
];

export const CINE_KIT = {
  roofing: {
    story: [
      { id: "old", headline: "Every roof shows its age.", accent: "age",
        prompt: P("A two-story suburban house with a tired asphalt shingle roof: faded color, curled shingle edges, dark streaks and a few missing tabs. Seen from the front lawn at a slight low angle, soft late afternoon light from the left, clear pale sky.") },
      { id: "deck", headline: "Down to the bare deck.", accent: "deck",
        prompt: E("all old shingles are gone and the clean light wood roof deck is showing, with a tidy stack of shingle bundles on the ridge.") },
      { id: "wrap", headline: "Sealed before the shingles.", accent: "Sealed",
        prompt: E("the wood deck is fully covered with smooth gray roof underlayment and new metal drip edge runs along every roof edge.") },
      { id: "new", headline: "Finished, edge to edge.", accent: "Finished",
        prompt: E("a brand new charcoal architectural shingle roof covers the whole house, crisp straight rows, clean ridge cap, new gutters.") },
    ],
    styles: [
      { id: "shingle", name: "Architectural shingle", note: "Layered look, many colors, the most common choice.",
        prompt: P("A two-story suburban house with a new charcoal architectural shingle roof, front lawn view, golden hour light.") },
      { id: "metal", name: "Standing seam metal", note: "Long straight panels with raised seams.",
        prompt: P("The same style of two-story suburban house with a new dark bronze standing seam metal roof, front lawn view, golden hour light.") },
      { id: "slate", name: "Slate look", note: "The look of stone slate in a lighter material.",
        prompt: P("The same style of two-story suburban house with a new gray slate-look roof, front lawn view, golden hour light.") },
    ],
    beforeAfter: {
      title: "Storm damage, then repair.",
      before: { prompt: P("Close view of one section of an asphalt shingle roof after a wind storm: several shingles torn off, bare spots, bent flashing, overcast light.") },
      after: { prompt: A("the same roof section repaired with matching new shingles laid flat in straight rows, new flashing, soft sun.") },
    },
    tool: { kind: "drag", title: "Drag to see the repair." },
    estimator: {
      unit: "per sq ft",
      sizes: ["Small home", "Medium home", "Large home"],
      options: ["Architectural shingle", "Standing seam metal", "Slate look", "Repair only"],
    },
  },

  fencing: {
    story: [
      { id: "stakes", headline: "It starts with a string line.", accent: "string",
        prompt: P("A wide green suburban backyard with no fence, seen from the back patio at eye height, a straight line of small wooden survey stakes and a taut orange string marking where a fence will go, golden hour side light, long soft shadows.") },
      { id: "posts", headline: "Posts set, plumb and even.", accent: "plumb",
        prompt: E("evenly spaced new wood fence posts now stand along the string line, set in fresh concrete footings.") },
      { id: "rails", headline: "Rails tie it together.", accent: "together",
        prompt: E("two horizontal wood rails now connect every post along the whole line.") },
      { id: "done", headline: "Your yard, finished.", accent: "finished",
        prompt: E("a finished cedar privacy fence with tight vertical boards and a flat top runs along the whole line, warm wood tone.") },
    ],
    styles: [
      { id: "cedar", name: "Cedar privacy", note: "Warm wood, tall boards, full privacy.",
        prompt: P("A green suburban backyard with a new cedar privacy fence along the back, seen from the patio, golden hour light.") },
      { id: "vinyl", name: "White vinyl", note: "Clean white panels that need little upkeep.",
        prompt: P("The same green suburban backyard with a new white vinyl privacy fence along the back, seen from the patio, golden hour light.") },
      { id: "rail", name: "Black aluminum", note: "Open, modern, keeps the view.",
        prompt: P("The same green suburban backyard with a new black aluminum rail fence along the back, seen from the patio, golden hour light.") },
    ],
    beforeAfter: {
      title: "Old gate, new gate.",
      before: { prompt: P("An old wooden fence gate in a backyard, gray weathered boards, leaning and sagging, one board cracked, rusty hinge, soft overcast light.") },
      after: { prompt: A("a new cedar gate hangs straight and level in the same spot with new black hinges and latch, fresh boards on both sides.") },
    },
    tool: { kind: "tabs", title: "Choose your fence." },
    estimator: {
      unit: "per linear foot",
      sizes: ["Short run (one side)", "Medium yard", "Full backyard"],
      options: ["Cedar privacy", "White vinyl", "Black aluminum", "Gate only"],
    },
  },

  pressure: {
    story: [
      { id: "dirty", headline: "Years of grime, one wash.", accent: "grime",
        prompt: P("A long concrete driveway in front of a light-colored suburban house, the concrete dark and stained with green mildew edges, tire marks and an oil spot, seen from the street at a slight high angle, bright soft daylight.") },
      { id: "half", headline: "Watch the line move.", accent: "line",
        prompt: E("the left half of the driveway is now clean bright concrete and the right half is still stained, with a sharp clean edge between them and a wet sheen on the clean side.") },
      { id: "clean", headline: "Clean, all the way.", accent: "Clean",
        prompt: E("the whole driveway is now clean, bright, even gray concrete, the walkway too, still slightly damp.") },
    ],
    styles: [
      { id: "drive", name: "Driveways", note: "Concrete and pavers brought back to an even color.",
        prompt: P("A freshly cleaned concrete driveway and walkway at a suburban house, even bright gray, soft daylight.") },
      { id: "siding", name: "House washing", note: "Soft wash for siding, trim and gutters.",
        prompt: P("The front of a suburban house with freshly cleaned white vinyl siding and bright trim, soft daylight.") },
      { id: "deck", name: "Decks and patios", note: "Wood and stone cleaned without harsh scrubbing.",
        prompt: P("A freshly cleaned backyard wood deck with even warm boards and clean railings, soft daylight.") },
    ],
    beforeAfter: {
      title: "Grime, then clean.",
      before: { prompt: P("Straight top-down drone view of a concrete driveway, dark gray with grime, green mildew along the edges and joints, tire tracks and an oil spot, a strip of green lawn on both sides, even soft daylight.") },
      after: { prompt: A("the whole driveway is clean, bright even light gray concrete, crisp joints, the lawn unchanged.") },
    },
    tool: { kind: "wash", title: "Drag to wash it clean." },
    estimator: {
      unit: "per sq ft",
      sizes: ["Small (walkway or patio)", "Medium (driveway)", "Large (driveway and house)"],
      options: ["Driveway", "House washing", "Deck or patio", "Roof soft wash"],
    },
  },

  hvac: {
    story: [
      { id: "cold", headline: "Cold creeps in at the glass.", accent: "creeps",
        prompt: P("A quiet living room in winter at dusk: wide wood floor, a soft sofa with a folded knit blanket, tall windows with frost creeping across the inside of the panes, snow outside, cold blue light, the room dim and chilly. Eye-level wide view from the corner of the room.") },
      { id: "warming", headline: "Warm air, moving again.", accent: "Warm",
        prompt: E("warm amber light from table lamps now fills half the room, the frost on the windows is melting at the edges, the blue tone is fading.") },
      { id: "warm", headline: "Comfort, all evening long.", accent: "Comfort",
        prompt: E("the whole room glows warm and golden, the window glass is clear, the blanket lies loose on the sofa, cozy evening light.") },
    ],
    styles: [
      { id: "central", name: "Central air", note: "One outdoor unit cools the whole house.",
        prompt: P("A new modern outdoor central air conditioner unit beside a clean house wall on a neat gravel pad, soft morning light.") },
      { id: "heatpump", name: "Heat pump", note: "Heats and cools with one system.",
        prompt: P("A new modern outdoor heat pump unit beside a clean house wall on a neat gravel pad, soft morning light.") },
      { id: "minisplit", name: "Ductless mini-split", note: "Room-by-room comfort, no ducts needed.",
        prompt: P("A sleek white ductless mini-split wall unit high on the wall of a calm, bright modern living room, soft window light.") },
    ],
    beforeAfter: {
      title: "Old unit, new unit.",
      before: { prompt: P("An old outdoor air conditioner unit beside a light-colored house wall: faded and rust-stained metal case, bent fins, weeds around a cracked pad, soft morning side light, eye-level view from the side yard.") },
      after: { prompt: A("a new modern light gray outdoor unit sits on a new level pad with neat insulated lines, weeds cleared.") },
    },
    tool: { kind: "dial", title: "Set it to warm." },
    estimator: {
      unit: "per job",
      sizes: ["Small home", "Medium home", "Large home"],
      options: ["Central air", "Heat pump", "Ductless mini-split", "Tune-up"],
    },
  },

  restoration: {
    story: [
      { id: "wet", headline: "Water damage moves fast.", accent: "fast",
        prompt: P("An empty finished basement room after a leak: a dark water stain line along the lower drywall, a damp darker carpet, soft window light from the left, eye-level wide view across the room, no furniture.") },
      { id: "dry", headline: "Dried out, wall by wall.", accent: "Dried",
        prompt: E("the wet carpet and the bottom two feet of drywall are removed showing clean wall studs and bare concrete floor, with several plain unbranded air movers and a dehumidifier on the floor.") },
      { id: "rebuild", headline: "Put back like before.", accent: "before",
        prompt: E("the equipment is gone, new smooth drywall and baseboard are installed and painted, and new carpet covers the floor.") },
    ],
    styles: [
      { id: "water", name: "Water damage", note: "Drying, clean-up and repair after leaks and floods.",
        prompt: P("A bright, freshly restored finished basement with new drywall, baseboard and carpet, soft window light, empty and calm.") },
      { id: "fire", name: "Fire and smoke", note: "Soot clean-up, odor control and rebuild.",
        prompt: P("A freshly restored kitchen with new white cabinets and clean painted walls, soft daylight, empty and calm.") },
      { id: "mold", name: "Mold clean-up", note: "Find the source, remove it, and fix the area.",
        prompt: P("A clean, freshly repaired bathroom wall and ceiling with new drywall and fresh paint, soft daylight, empty and calm.") },
    ],
    beforeAfter: {
      title: "Stained ceiling, fixed ceiling.",
      before: { prompt: P("A living room ceiling corner with a large brown water stain ring and bubbling paint, soft light.") },
      after: { prompt: A("the same ceiling corner smooth, repaired and freshly painted white.") },
    },
    tool: { kind: "drag", title: "Drag from damage to done." },
    estimator: {
      unit: "per job",
      sizes: ["One room", "A few rooms", "Whole floor"],
      options: ["Water damage", "Fire and smoke", "Mold clean-up"],
    },
  },

  builder: {
    story: [
      { id: "lot", headline: "A lot and a plan.", accent: "plan",
        prompt: P("An empty, graded suburban building lot with string lines and small stakes marking a house footprint, green trees behind, wide eye-level view from the street, golden hour light, clear sky.") },
      { id: "frame", headline: "The frame goes up.", accent: "frame",
        prompt: E("the wood frame of a two-story house now stands on a concrete foundation on the lot: wall studs, floor joists and roof trusses, no sheathing yet.") },
      { id: "dried", headline: "Closed in for the weather.", accent: "weather",
        prompt: E("the frame is now covered with sheathing and white house wrap, windows are set in, and the roof is covered.") },
      { id: "home", headline: "Built for how you live.", accent: "live",
        prompt: E("the house is finished: light siding, dark windows, a covered front porch, a new driveway and fresh lawn, warm lights on inside.") },
    ],
    styles: [
      { id: "farmhouse", name: "Modern farmhouse", note: "White siding, black windows, a big porch.",
        prompt: P("A newly built modern farmhouse with white board-and-batten siding, black windows and a wide front porch, fresh lawn, golden hour.") },
      { id: "craftsman", name: "Craftsman", note: "Tapered columns, warm wood and deep eaves.",
        prompt: P("A newly built craftsman-style home with tapered porch columns, warm wood accents and deep eaves, fresh lawn, golden hour.") },
      { id: "modern", name: "Modern", note: "Clean lines, big glass, flat or low roofs.",
        prompt: P("A newly built modern home with clean lines, large windows and a low flat roof, fresh lawn, golden hour.") },
    ],
    beforeAfter: {
      title: "Plan to porch.",
      before: { prompt: P("An empty, graded building lot with string lines marking a house footprint, golden hour.") },
      after: { prompt: A("a finished two-story home with a covered porch and fresh lawn stands on the lot.") },
    },
    tool: { kind: "blueprint", title: "The plan, then the home." },
    estimator: {
      unit: "per sq ft",
      sizes: ["Up to 2,000 sq ft", "2,000 to 3,000 sq ft", "Over 3,000 sq ft"],
      options: ["Modern farmhouse", "Craftsman", "Modern"],
    },
  },

  framing: {
    story: [
      { id: "slab", headline: "Square from the slab.", accent: "Square",
        prompt: P("A fresh, clean concrete foundation slab for a house with anchor bolts along the edges and a neat stack of lumber beside it, wide eye-level view, morning light, trees behind.") },
      { id: "walls", headline: "Walls stand straight.", accent: "straight",
        prompt: E("first-floor wood wall frames now stand on the slab with even studs, window and door openings and a double top plate.") },
      { id: "trusses", headline: "Trusses set on center.", accent: "center",
        prompt: E("roof trusses are now set evenly across the top of the walls with bracing.") },
      { id: "sheathed", headline: "Ready for the next trade.", accent: "Ready",
        prompt: E("walls and roof are now covered with tan wood sheathing panels, openings cut clean.") },
    ],
    styles: [
      { id: "house", name: "New homes", note: "Full house frames from slab to roof.",
        prompt: P("A two-story house wood frame on a foundation with even studs and roof trusses, morning light, clean site.") },
      { id: "addition", name: "Additions", note: "Framing that ties into the house you have.",
        prompt: P("A new wood-framed room addition attached to the side of an existing finished house, morning light, clean site.") },
      { id: "garage", name: "Garages and shops", note: "Wide openings and tall walls.",
        prompt: P("A wood-framed detached garage with a wide door opening and roof trusses, morning light, clean site.") },
    ],
    beforeAfter: {
      title: "Framed, then finished.",
      before: { prompt: P("Inside a new house during framing: a large open living room with bare wood studs, ceiling joists, window openings with daylight pouring in, a clean plywood subfloor, a work light on a stand, wide eye-level view.") },
      after: { prompt: A("the same room is finished: smooth painted walls and ceiling, trimmed windows, a light wood floor, soft recessed lights, empty and calm.") },
    },
    tool: { kind: "blueprint", title: "Every stud on the plan." },
    estimator: {
      unit: "per sq ft",
      sizes: ["Garage or small addition", "Single-story home", "Two-story home"],
      options: ["New home", "Addition", "Garage or shop"],
    },
  },

  remodeling: {
    story: [
      { id: "old", headline: "The kitchen you have now.", accent: "now",
        prompt: P("A dated, empty kitchen with old oak cabinets, worn laminate counters, a yellowed vinyl floor and a dim ceiling light, wide eye-level view from the doorway, soft window light from the right.") },
      { id: "demo", headline: "Opened up to the studs.", accent: "studs",
        prompt: E("the cabinets, counters and floor are removed, showing clean wall studs, new wiring and a bare subfloor.") },
      { id: "cabinets", headline: "New bones in place.", accent: "bones",
        prompt: E("new light painted cabinets and an island base are installed, no counters yet, new wood floor.") },
      { id: "done", headline: "A room you want to be in.", accent: "want",
        prompt: E("the kitchen is finished with stone counters, a tile backsplash and warm pendant lights over the island.") },
    ],
    styles: [
      { id: "kitchen", name: "Kitchens", note: "Cabinets, counters, floors and lights.",
        prompt: P("A finished modern kitchen with light cabinets, stone counters and warm pendant lights, empty and calm.") },
      { id: "bath", name: "Bathrooms", note: "Tile, showers, vanities and fixtures.",
        prompt: P("A finished modern bathroom with a glass walk-in shower, large tile and a wood vanity, soft daylight, empty and calm.") },
      { id: "basement", name: "Basements", note: "Unused space turned into living space.",
        prompt: P("A finished basement family room with warm wood floors, soft recessed lights and a built-in shelf wall, empty and calm.") },
    ],
    beforeAfter: {
      title: "Old bath, new bath.",
      before: { prompt: P("A dated small bathroom with a pink tile wall, an old tub with a stained curtain rod and a worn vanity, soft light.") },
      after: { prompt: A("the same bathroom with a glass walk-in shower, large light tile and a new wood vanity.") },
    },
    tool: { kind: "blueprint", title: "Drawn first, then built." },
    estimator: {
      unit: "per job",
      sizes: ["Refresh", "Mid-size remodel", "Full remodel"],
      options: ["Kitchen", "Bathroom", "Basement"],
    },
  },

  painting: {
    story: [
      { id: "faded", headline: "Faded and peeling.", accent: "peeling",
        prompt: P("The front of a two-story wood-sided house with faded, chalky gray-blue paint, peeling trim and a weathered front door, seen from the front walk, soft late afternoon light.") },
      { id: "prep", headline: "Scraped, sanded, taped.", accent: "taped",
        prompt: E("the loose paint is scraped off, the siding is patched and primed in white patches, windows are masked with paper and tape.") },
      { id: "fresh", headline: "One clean color.", accent: "clean",
        prompt: E("the house is freshly painted a deep sage green with crisp white trim and a black front door, masking removed.") },
    ],
    styles: [
      { id: "sage", name: "Sage and white", note: "Soft green body, crisp white trim.",
        prompt: P("A freshly painted two-story wood-sided house in deep sage green with crisp white trim, soft afternoon light.") },
      { id: "navy", name: "Navy and white", note: "Classic deep blue with bright trim.",
        prompt: P("The same style of freshly painted two-story house in deep navy blue with crisp white trim, soft afternoon light.") },
      { id: "white", name: "All white", note: "Bright white body with black accents.",
        prompt: P("The same style of freshly painted two-story house in warm white with black window frames and door, soft afternoon light.") },
    ],
    beforeAfter: {
      title: "Old trim, fresh trim.",
      before: { prompt: P("Close view of a window frame with cracked, peeling white paint and gray bare wood showing, soft light.") },
      after: { prompt: A("the same window frame smooth and freshly painted bright white.") },
    },
    tool: { kind: "tabs", title: "Try a color." },
    estimator: {
      unit: "per job",
      sizes: ["A few rooms", "Whole inside", "Whole outside"],
      options: ["Interior", "Exterior", "Cabinets", "Deck or fence stain"],
    },
  },

  concrete: {
    story: [
      { id: "cracked", headline: "Cracked and sinking.", accent: "sinking",
        prompt: P("An old cracked concrete driveway in front of a suburban house, uneven broken slabs, weeds in the cracks, seen from the street at a slight high angle, soft daylight.") },
      { id: "forms", headline: "Formed and graded.", accent: "graded",
        prompt: E("the old concrete is gone, the ground is graded with compacted gravel, wood forms line the edges and steel rebar grid is laid in.") },
      { id: "poured", headline: "Smooth, square, and new.", accent: "new",
        prompt: E("a smooth new broom-finished concrete driveway fills the forms with clean straight control joints, forms removed.") },
    ],
    styles: [
      { id: "broom", name: "Broom finish", note: "Simple, clean and grippy.",
        prompt: P("A smooth new broom-finished concrete driveway with clean control joints leading to a home, late afternoon light.") },
      { id: "stamped", name: "Stamped", note: "The look of stone, in one pour.",
        prompt: P("A new stamped concrete patio with a gray stone pattern behind a home, late afternoon light.") },
      { id: "exposed", name: "Exposed aggregate", note: "Small stones show on top for texture.",
        prompt: P("A new exposed aggregate concrete walkway with a warm pebble texture leading to a front door, late afternoon light.") },
    ],
    beforeAfter: {
      title: "Broken walk, new walk.",
      before: { prompt: P("A front walkway of broken, tilted concrete slabs with a trip edge and weeds, soft light.") },
      after: { prompt: A("the same walkway poured new, smooth and level with straight joints.") },
    },
    tool: { kind: "tabs", title: "Pick a finish." },
    estimator: {
      unit: "per sq ft",
      sizes: ["Walkway", "Patio", "Driveway"],
      options: ["Broom finish", "Stamped", "Exposed aggregate"],
    },
  },

  landscaping: {
    story: [
      { id: "bare", headline: "A yard with room to grow.", accent: "grow",
        prompt: P("The front yard of a suburban house with patchy brown grass, bare dirt and overgrown shrubs along the house, seen from the street corner, golden hour light, long soft shadows.") },
      { id: "beds", headline: "Clean lines first.", accent: "lines",
        prompt: E("the overgrown shrubs are removed, new curved planting beds are cut with crisp edges and fresh dark mulch.") },
      { id: "planted", headline: "Planted to fill in.", accent: "fill",
        prompt: E("young shrubs, ornamental grasses and flowers are now planted in the beds with even spacing.") },
      { id: "lawn", headline: "Green, edged, done.", accent: "done",
        prompt: E("the lawn is now thick even green grass, freshly mowed in straight stripes, edges crisp.") },
    ],
    styles: [
      { id: "green", name: "Lawn and beds", note: "Green grass, crisp edges, fresh mulch.",
        prompt: P("A suburban front yard with thick green striped lawn and crisp mulched planting beds, golden hour.") },
      { id: "xeric", name: "Low water", note: "Stone, grasses and plants that need little water.",
        prompt: P("A suburban front yard landscaped with river rock, ornamental grasses and drought-tolerant plants, golden hour.") },
      { id: "patio", name: "Patios and paths", note: "Stone paths and outdoor rooms.",
        prompt: P("A backyard with a new flagstone patio, a curved stone path and planted borders, golden hour.") },
    ],
    beforeAfter: {
      title: "Overgrown, then cared for.",
      before: { prompt: P("An overgrown planting bed along a house with weeds, tangled shrubs and no edge, soft light.") },
      after: { prompt: A("the same bed trimmed, weeded, edged crisply and topped with fresh dark mulch.") },
    },
    tool: { kind: "drag", title: "Drag to see it cared for." },
    estimator: {
      unit: "per job",
      sizes: ["Small yard", "Medium yard", "Large yard"],
      options: ["Lawn and beds", "Low water", "Patio or path", "Monthly care"],
    },
  },

  tree: {
    story: [
      { id: "over", headline: "Too close to the roof.", accent: "close",
        prompt: P("A large mature oak tree in a front yard with heavy branches hanging over a house roof, one dead limb, seen from the street, soft late afternoon light, clear sky.") },
      { id: "trim", headline: "Thinned with care.", accent: "care",
        prompt: E("the branches over the roof and the dead limb are cut back cleanly, the canopy is thinned and shaped, clear space above the roof.") },
      { id: "clean", headline: "Light gets back in.", accent: "Light",
        prompt: E("the yard is clean with no debris and warm sunlight now reaches the lawn and the front of the house.") },
    ],
    styles: [
      { id: "trimming", name: "Trimming", note: "Shape, thin and lift the canopy.",
        prompt: P("A healthy, neatly trimmed mature oak tree in a front yard with a clear space above the house roof, soft sun.") },
      { id: "removal", name: "Tree removal", note: "Safe removal, piece by piece.",
        prompt: P("A front yard with a fresh flat tree stump and clean lawn where a large tree used to be, soft sun.") },
      { id: "stump", name: "Stump grinding", note: "Stump ground down, ready for grass.",
        prompt: P("A smooth patch of fresh soil and seed in a green lawn where a stump was ground out, soft sun.") },
    ],
    beforeAfter: {
      title: "Storm limb, clean cut.",
      before: { prompt: P("A big broken oak limb hanging from a tree over a backyard fence after a storm, overcast light.") },
      after: { prompt: A("the broken limb removed with a clean cut on the trunk and the yard clear.") },
    },
    tool: { kind: "drag", title: "Drag to clear the limb." },
    estimator: {
      unit: "per job",
      sizes: ["Small tree", "Medium tree", "Large tree"],
      options: ["Trimming", "Removal", "Stump grinding"],
    },
  },

  garage: {
    story: [
      { id: "old", headline: "The door you use most.", accent: "most",
        prompt: P("A suburban house with a dented, faded white steel two-car garage door with a crooked panel, empty driveway, seen straight on from the driveway end, soft dusk light, porch lights off.") },
      { id: "new", headline: "A new door, a new face.", accent: "face",
        prompt: E("a new dark carriage-style garage door with small top windows replaces the old one.") },
      { id: "dusk", headline: "It even looks good at night.", accent: "night",
        prompt: E("warm porch and garage lights are on and the sky is a deeper blue.") },
    ],
    styles: [
      { id: "carriage", name: "Carriage style", note: "Wood look with top windows.",
        prompt: P("A suburban house with a new dark carriage-style two-car garage door with top windows, empty driveway, dusk, warm lights.") },
      { id: "modern", name: "Modern glass", note: "Black frame with frosted glass panels.",
        prompt: P("A modern house with a new black aluminum and frosted glass garage door, empty driveway, dusk, warm lights.") },
      { id: "classic", name: "Classic raised panel", note: "Simple, clean and strong.",
        prompt: P("A suburban house with a new white raised-panel two-car garage door, empty driveway, dusk, warm lights.") },
    ],
    beforeAfter: {
      title: "Dented door, new door.",
      before: { prompt: P("Close view of a dented, faded steel garage door with a cracked bottom seal, soft light.") },
      after: { prompt: A("a new smooth dark garage door panel and new bottom seal in the same spot.") },
    },
    tool: { kind: "tabs", title: "Pick a door." },
    estimator: {
      unit: "per job",
      sizes: ["Single door", "Double door"],
      options: ["Carriage style", "Modern glass", "Classic raised panel", "Repair or spring"],
    },
  },

  plumbing: {
    story: [
      { id: "old", headline: "Small leaks add up.", accent: "leaks",
        prompt: P("The open cabinet under a kitchen sink with old corroded galvanized pipes, a green-crusted valve, a water stain on the cabinet floor and an old bucket, eye-level close view, soft side light.") },
      { id: "new", headline: "New lines, tight joints.", accent: "tight",
        prompt: E("the old pipes, bucket and stain are gone; clean new copper and white PEX lines with new chrome shut-off valves are neatly installed.") },
      { id: "done", headline: "Dry and quiet again.", accent: "Dry",
        prompt: E("the cabinet floor has a clean liner and the light is a little warmer, everything dry and tidy.") },
    ],
    styles: [
      { id: "repair", name: "Leaks and repairs", note: "Pipes, valves and fixtures fixed.",
        prompt: P("Clean new copper pipes and chrome valves under a bright kitchen sink cabinet, soft side light.") },
      { id: "heater", name: "Water heaters", note: "Tank and tankless installs.",
        prompt: P("A new tankless water heater mounted on a clean garage wall with neat pipes, soft light.") },
      { id: "fixtures", name: "Fixtures", note: "Faucets, sinks and toilets put in right.",
        prompt: P("A new matte black faucet over a white farmhouse sink in a bright kitchen, soft window light.") },
    ],
    beforeAfter: {
      title: "Old heater, new heater.",
      before: { prompt: P("An old rusty tank water heater in a dim utility corner with a rust stain on the floor, soft light.") },
      after: { prompt: A("a new white tank water heater with new copper lines and a clean drain pan in the same corner.") },
    },
    tool: { kind: "drag", title: "Drag for the new install." },
    estimator: {
      unit: "per job",
      sizes: ["Small repair", "Medium job", "Large job"],
      options: ["Leak or clog", "Water heater", "Fixture install", "Repipe"],
    },
  },

  electrical: {
    story: [
      { id: "old", headline: "An old panel, a full house.", accent: "full",
        prompt: P("An old open electrical panel on a garage wall with a tangle of old wiring and worn labels removed, dim cool light, straight-on close view.") },
      { id: "new", headline: "A new panel, neatly wired.", accent: "neatly",
        prompt: E("a new modern breaker panel replaces the old one with neat straight wires bundled and routed cleanly.") },
      { id: "closed", headline: "Closed up and ready.", accent: "ready",
        prompt: E("the panel door is closed, the wall around it is patched and painted, and the light is a little brighter.") },
    ],
    styles: [
      { id: "panel", name: "Panel upgrades", note: "More room for the things you run.",
        prompt: P("A new modern breaker panel with neat straight wiring on a clean garage wall, soft cool light.") },
      { id: "lighting", name: "Lighting", note: "Recessed, pendant and outdoor lights.",
        prompt: P("A calm modern living room with warm recessed ceiling lights and a pendant light on, evening, empty.") },
      { id: "ev", name: "EV chargers", note: "A charger in your garage, wired right.",
        prompt: P("A clean wall-mounted home EV charger with a coiled cable on a bright garage wall, no car, soft light.") },
    ],
    beforeAfter: {
      title: "Old fuses, new breakers.",
      before: { prompt: P("Close view of an old fuse box with screw-in fuses and cloth-covered wires, dim light.") },
      after: { prompt: A("a new modern breaker panel with neat wiring in the same spot.") },
    },
    tool: { kind: "drag", title: "Drag for the new panel." },
    estimator: {
      unit: "per job",
      sizes: ["Small job", "Medium job", "Large job"],
      options: ["Panel upgrade", "Lighting", "EV charger", "Outlets and switches"],
    },
  },

  pest: {
    story: [
      { id: "gaps", headline: "Pests find the gaps.", accent: "gaps",
        prompt: P("The base of a house wall where siding meets the foundation, with small gaps, a pipe hole without a seal and leaf litter piled against it, close low view, soft daylight.") },
      { id: "sealed", headline: "Sealed, one by one.", accent: "Sealed",
        prompt: E("the gaps and the pipe hole are neatly sealed and a clean band of gravel now runs along the foundation, leaves cleared.") },
      { id: "home", headline: "Your home, kept that way.", accent: "kept",
        prompt: E("the camera has the same view in warm late afternoon light, everything clean and tidy.") },
    ],
    styles: [
      { id: "protect", name: "Home protection", note: "Inside and outside, all year.",
        prompt: P("The clean base of a house with a neat gravel band along the foundation and trimmed shrubs, soft daylight.") },
      { id: "termite", name: "Termites", note: "Inspection and treatment for wood.",
        prompt: P("Clean, solid wood framing in a bright crawl space with a clear vapor barrier on the ground, soft light.") },
      { id: "rodent", name: "Rodents", note: "Find the way in and close it.",
        prompt: P("A tidy attic with fresh insulation and a sealed vent screen, soft light through a small window.") },
    ],
    beforeAfter: {
      title: "Open gap, sealed gap.",
      before: { prompt: P("Close view of a gap where a pipe enters a house wall, rough edges, dirt and cobwebs, soft light.") },
      after: { prompt: A("the same pipe entry neatly sealed with a clean collar and fresh caulk.") },
    },
    tool: { kind: "drag", title: "Drag to seal it." },
    estimator: {
      unit: "per job",
      sizes: ["Apartment or small home", "Medium home", "Large home"],
      options: ["One-time service", "Quarterly plan", "Termites", "Rodents"],
    },
  },

  junk: {
    story: [
      { id: "full", headline: "The garage you lost.", accent: "lost",
        prompt: P("A two-car garage packed with old boxes, a broken chair, a mattress, bags and an old bike, door open, bright daylight, wide view from the driveway.") },
      { id: "half", headline: "Half gone already.", accent: "gone",
        prompt: E("the left half of the garage is empty and swept while the right half still has the clutter.") },
      { id: "empty", headline: "Room to park again.", accent: "park",
        prompt: E("the whole garage is empty, the bare concrete floor swept clean.") },
    ],
    styles: [
      { id: "garage", name: "Garages", note: "All of it, out in one trip.",
        prompt: P("An empty, clean, swept two-car garage with the door open, bright daylight.") },
      { id: "yard", name: "Yard debris", note: "Branches, old fences and piles.",
        prompt: P("A clean backyard corner with fresh lawn where a debris pile used to be, bright daylight.") },
      { id: "move", name: "Move-outs", note: "Empty rooms, ready for the next owner.",
        prompt: P("An empty bright living room with clean wood floors and bare walls, sunlight through windows.") },
    ],
    beforeAfter: {
      title: "Full shed, empty shed.",
      before: { prompt: P("The inside of a backyard shed crammed with old paint cans, broken tools and boxes, soft light from the door.") },
      after: { prompt: A("the same shed empty and swept clean.") },
    },
    tool: { kind: "wash", title: "Drag to clear it out." },
    estimator: {
      unit: "per job",
      sizes: ["A few items", "Half a truck", "Full truck"],
      options: ["Garage", "Yard debris", "Move-out", "Single item"],
    },
  },

  cleaning: {
    story: [
      { id: "lived", headline: "A busy week shows.", accent: "week",
        prompt: P("A lived-in living room with a dusty coffee table, scattered pillows, a folded blanket left on the floor and dull streaky windows, wide eye-level view, soft morning light.") },
      { id: "tidy", headline: "Picked up and dusted.", accent: "dusted",
        prompt: E("the pillows are straightened, the blanket is folded on the sofa and the table is clear and dust-free.") },
      { id: "clean", headline: "Calm, clean, yours.", accent: "Calm",
        prompt: E("the floor is clean and shining, the windows are clear and sunlight falls across the room.") },
    ],
    styles: [
      { id: "home", name: "House cleaning", note: "Weekly, every two weeks or monthly.",
        prompt: P("A spotless bright living room with sunlight across a clean floor and a tidy sofa, calm and airy.") },
      { id: "deep", name: "Deep cleaning", note: "Top to bottom, inside the details.",
        prompt: P("A spotless modern kitchen with shining counters, a clean stovetop and clear glass, soft daylight.") },
      { id: "move", name: "Move-in and move-out", note: "Empty rooms cleaned for the next start.",
        prompt: P("An empty, freshly cleaned bedroom with shining floors and bare walls, sunlight through the window.") },
    ],
    beforeAfter: {
      title: "Hazy glass, clear glass.",
      before: { prompt: P("A glass shower door with hard water spots and soap haze, soft bathroom light.") },
      after: { prompt: A("the same glass shower door perfectly clear and shining.") },
    },
    tool: { kind: "wash", title: "Drag to clean it." },
    estimator: {
      unit: "per job",
      sizes: ["1 to 2 bedrooms", "3 bedrooms", "4 or more bedrooms"],
      options: ["Standard clean", "Deep clean", "Move-in or move-out"],
    },
  },

  towing: {
    story: [
      { id: "stuck", headline: "Stuck on the side of the road.", accent: "Stuck",
        prompt: P("A plain dark sedan with no badges stopped on the shoulder of an empty two-lane highway at dusk, hazard lights on, wide view from behind at a low angle, soft blue light.") },
      { id: "arrive", headline: "Help pulls up behind.", accent: "Help",
        prompt: E("a plain white flatbed tow truck with no writing is now parked on the shoulder in front of the sedan, amber lights on.") },
      { id: "loaded", headline: "On the bed, on the way.", accent: "way",
        prompt: E("the sedan is now loaded and strapped on the flatbed and the shoulder ahead is clear.") },
    ],
    styles: [
      { id: "tow", name: "Towing", note: "Local and long distance.",
        prompt: P("A plain white flatbed tow truck with no writing on an empty highway shoulder at dusk, amber lights on.") },
      { id: "roadside", name: "Roadside help", note: "Jump starts, tire changes, lockouts, fuel.",
        prompt: P("A plain dark sedan on a quiet road shoulder at dusk with its hood up and a spare tire beside it, soft light.") },
      { id: "flatbed", name: "Flatbed", note: "For low cars and cars that cannot roll.",
        prompt: P("A plain white flatbed tow truck with no writing carrying a plain sedan on an empty road at dusk.") },
    ],
    beforeAfter: {
      title: "Stuck, then on the way.",
      before: { prompt: P("A plain dark sedan with a flat front tire on a quiet road shoulder at dusk, hazard lights on.") },
      after: { prompt: A("the same sedan on a new spare tire and the shoulder clear, hazard lights off.") },
    },
    tool: { kind: "drag", title: "Drag to get moving." },
    estimator: {
      unit: "per job",
      sizes: ["In town", "Up to 25 miles", "Long distance"],
      options: ["Tow", "Jump start", "Tire change", "Lockout"],
    },
  },
};

// Every picture slot for a trade, in kit order: the ids the maker uses for
// form.cine.images[slotId] (the bare story/style id, or before/after; unique
// within a trade), with a short label and the Higgsfield prompt.
export function kitSlots(trade) {
  const k = CINE_KIT[trade];
  if (!k) return [];
  const n = k.story.length;
  return [
    ...k.story.map((s, i) => ({ slotId: s.id, kind: "story", index: i,
      label: `Story ${i + 1} of ${n}: ${s.headline}`, prompt: s.prompt })),
    ...k.styles.map((s, i) => ({ slotId: s.id, kind: "style", index: i,
      label: `Style: ${s.name}`, prompt: s.prompt })),
    { slotId: "before", kind: "before", index: 0, label: `Before: ${k.beforeAfter.title}`, prompt: k.beforeAfter.before.prompt },
    { slotId: "after", kind: "after", index: 0, label: `After: ${k.beforeAfter.title}`, prompt: k.beforeAfter.after.prompt },
  ];
}

// Editorial look: one short hero line per trade with its italic accent word,
// said plainly (no promises the owner did not make). kit.editorial also takes
// optional slot picks (hero, beat, work, services) read by editorial.js.
const ED_LINES = {
  roofing: ["A new roof, edge to edge.", "edge"], fencing: ["Fences that frame the yard.", "frame"],
  pressure: ["Grime off. Color back.", "Color"], hvac: ["Warm winters, cool summers.", "cool"],
  restoration: ["From damage back to home.", "home"], builder: ["Homes built from the plan up.", "plan"],
  framing: ["Straight walls, square corners.", "square"], remodeling: ["The rooms you wanted, built.", "wanted"],
  painting: ["One clean color, start to finish.", "clean"], concrete: ["Driveways and patios, poured smooth.", "smooth"],
  landscaping: ["A yard worth coming home to.", "home"], tree: ["Trees trimmed with care.", "care"],
  garage: ["A new face for the house.", "face"], plumbing: ["Pipes, drains and water heaters.", "water"],
  electrical: ["Power, wired neatly.", "neatly"], pest: ["Pests out, gaps sealed.", "sealed"],
  junk: ["Room to breathe again.", "breathe"], cleaning: ["Come home to clean.", "clean"],
  towing: ["Stuck? Help on the road.", "road"],
};
for (const [t, [headline, accent]] of Object.entries(ED_LINES)) {
  if (CINE_KIT[t]) CINE_KIT[t].editorial = { ...(CINE_KIT[t].editorial || {}), headline, accent };
}

// Editorial service rows and sample-project pictures for the three QA trades.
// rows: service name -> the picture that shows it (an existing slot, or an
// optional extra service picture below). extra: optional pictures for services no
// story or style picture shows; each has its own prompt and drawn placeholder.
const EX = (id, label, mod, scene) => ({ id, label, mod, prompt: P(scene) });
Object.assign(CINE_KIT.roofing.editorial, {
  process: "old",
  rows: { "Roof repair": "after", "Roof replacement": "deck", "Storm damage": "before", "Roof inspections": "wrap",
    Gutters: "svc-gutters", "Flat roofs": "svc-flat", Skylights: "svc-skylight", "Insurance claims help": "before" },
  extra: [
    EX("svc-gutters", "Service: Gutters", "gutters", "The eave of a suburban house with new seamless dark bronze gutters and a downspout, clean roof edge above, soft afternoon light."),
    EX("svc-flat", "Service: Flat roofs", "flat", "A small modern commercial building with a new flat roof, clean parapet edge and light membrane, seen from across a quiet lot, soft daylight."),
    EX("svc-skylight", "Service: Skylights", "skylight", "A dark shingle roof with two new flush skylights catching the sky, close view from a slight high angle, soft daylight."),
  ],
});
Object.assign(CINE_KIT.fencing.editorial, {
  process: "stakes",
  rows: { "Wood fences": "cedar", "Vinyl fences": "vinyl", "Chain link": "svc-chain", "Aluminum and iron": "rail",
    Gates: "svc-gate", "Fence repair": "svc-repair", "Pool fences": "rail", "Farm and ranch": "svc-farm" },
  extra: [
    EX("svc-chain", "Service: Chain link", "chain", "A new galvanized chain link fence along a green side yard with a top rail and line posts, golden hour light."),
    EX("svc-gate", "Service: Gates", "gate", "A new cedar walk gate set in a cedar privacy fence with black hinges and latch, front-on view, golden hour light."),
    EX("svc-repair", "Service: Fence repair", "repair", "A weathered cedar privacy fence with a few fresh new boards replaced in one section, front-on view, soft light."),
    EX("svc-farm", "Service: Farm and ranch", "farm", "A long three-rail wooden ranch fence crossing a wide green pasture, low sun, long shadows."),
  ],
});
Object.assign(CINE_KIT.pressure.editorial, {
  hero: "half",
  process: "dirty",
  rows: { "House washing": "siding", "Driveways and sidewalks": "drive", "Decks and fences": "deck", "Roof cleaning": "svc-roof",
    "Gutter brightening": "svc-gutter", "Commercial washing": "svc-store", "Patios and pool decks": "before", "Window washing": "svc-window" },
  extra: [
    EX("svc-roof", "Service: Roof cleaning", "roof", "A suburban house roof where the left half still has dark algae streaks and the right half is soft-washed clean, front view, soft daylight."),
    EX("svc-gutter", "Service: Gutter brightening", "gutter", "Close view of a white gutter along a roof edge, left half grey with black tiger stripes, right half bright clean white, soft daylight."),
    EX("svc-store", "Service: Commercial washing", "store", "A small storefront with clean glass, a freshly washed light facade and a clean sidewalk, no signs, no lettering, early morning light."),
    EX("svc-window", "Service: Window washing", "window", "A large house window with spotless clear glass and clean white trim, sky reflected, soft daylight."),
  ],
});

// Editorial second beat: one short line per trade, its own words (not the hero's).
const ED_BEAT = {
  roofing: "Shingles, flashing and gutters, checked one by one before anyone climbs down.",
  fencing: "Posts set first, then rails, then every board, straight along the line.",
  pressure: "The right pressure for each surface, from concrete to siding to wood.",
  hvac: "A system sized for your rooms, and a tune-up that keeps it that way.",
  restoration: "Dry it out, clean it up, then build it back the way it was.",
  builder: "From the first stake on the lot to the last coat of paint.",
  framing: "Studs, plates and trusses, measured twice and set on center.",
  remodeling: "Walls opened, rooms rebuilt, and the dust cleaned up after.",
  painting: "Scraped, primed and painted, with the edges kept crisp.",
  concrete: "Graded, formed and poured, with joints cut where cracks want to go.",
  landscaping: "Beds edged, plants set, and a lawn that fills in.",
  tree: "Limbs off the roof and the yard left clean.",
  garage: "Doors, springs and openers, fitted and tested before we leave.",
  plumbing: "Leaks found, lines replaced, and the cabinet left dry.",
  electrical: "Panels, circuits and lights, wired neatly and labeled.",
  pest: "Entry points found and sealed, inside and out.",
  junk: "Loaded, hauled away and swept, in one visit.",
  cleaning: "Every room, top to bottom, done the same way each time.",
  towing: "Hooked up with care and taken where you need it.",
};
for (const [t, note] of Object.entries(ED_BEAT)) if (CINE_KIT[t]) CINE_KIT[t].editorial = { ...(CINE_KIT[t].editorial || {}), beatNote: note };

// Variants: one trade, many looks (Roofing, Fencing and Pressure washing first).
// The first variant is the default: the trade's own story, styles and
// beforeAfter, bare slot ids, pictures at library/<trade>/<slot>.webp. Every
// other variant has 4 story frames (1 new picture, then 3 edits of the one
// before) and a before/after pair: slots s1..s4, before, after. Their keys in
// form.cine.images are "<variant>/<slot>" (metal/s1, metal/before) and their
// pictures live at library/<trade>/<variant>/<slot>.webp. Each variant has its
// own kind of house, yard and region so the variants never look alike.
// Prompts and headlines come verbatim from org/art/variants-prompts.json
// (written by the chief of staff); node org/art/variants-wire.mjs rewrites
// the block between the VARIANTS markers below.
// VARIANTS:BEGIN (generated by org/art/variants-wire.mjs from variants-prompts.json; do not edit by hand)
CINE_KIT.roofing.variants = [
 {
  "key": "shingle",
  "label": "Asphalt shingle",
  "default": true
 },
 {
  "key": "metal",
  "label": "Standing-seam metal",
  "story": [
   {
    "id": "metal/s1",
    "headline": "This roof has had its day.",
    "accent": "day",
    "prompt": "A two-story modern farmhouse with white board-and-batten siding, black-framed windows, a covered porch and a wide green lawn, seen from the lawn. Its old asphalt shingle roof is tired and faded: dull gray, dark streaks, curled edges and a few missing tabs. Locked-off camera at eye level, the subject sits in the right two-thirds of the frame with quiet open lawn and sky in the left third and lower left for a headline. Wide 16:9 photo, golden hour natural light, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   {
    "id": "metal/s2",
    "headline": "Down to the bare deck.",
    "accent": "deck",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: all the old shingles are gone and the pale wood roof deck is bare, with a neat stack of long charcoal metal roof panels resting along the lower edge of the roof. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "metal/s3",
    "headline": "Panels go on, line by line.",
    "accent": "line",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the deck is covered in smooth gray underlayment, and the lower half of the roof is covered in long dark charcoal standing-seam metal panels, the upper half still gray underlayment. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "metal/s4",
    "headline": "Seams straight, edges clean.",
    "accent": "straight",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the whole roof is finished in dark charcoal standing-seam metal with straight vertical seams, a clean ridge cap and crisp edge trim, with a soft glint of golden light along the seams. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  ],
  "beforeAfter": {
   "title": "Before and after: standing-seam metal.",
   "before": {
    "id": "metal/before",
    "prompt": "An aging corrugated metal roof on a small one-story ranch house: faded red-brown panels, rust streaks at the fasteners, a few loose and wavy panels and dull patches. Straight-on view in even soft daylight, the subject centered and filling most of the frame. Wide 16:9 photo, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   "after": {
    "id": "metal/after",
    "prompt": "Edit the before picture. Keep the exact same camera position, lens, framing and light; change only this: the roof is new standing-seam metal in clean charcoal with straight vertical seams, a fresh ridge cap and trim; the house is unchanged. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  }
 },
 {
  "key": "tile",
  "label": "Clay or concrete tile",
  "story": [
   {
    "id": "tile/s1",
    "headline": "Old tile slips and cracks.",
    "accent": "cracks",
    "prompt": "A single-story Spanish-style home with white stucco walls, arched windows, a terracotta-tiled entry and dry-garden landscaping with agave and a palm, seen from the street edge. Its terracotta tile roof is old: faded chalky tiles, a few cracked and slipped tiles and dark moss streaks along the valleys. Locked-off camera at eye level, the subject sits in the right two-thirds of the frame with quiet open lawn and sky in the left third and lower left for a headline. Wide 16:9 photo, golden hour natural light, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   {
    "id": "tile/s2",
    "headline": "Everything comes off first.",
    "accent": "off",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the old tiles are lifted off and the roof is bare underlayment, with neat pallets of terracotta tiles resting along the lower edge. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "tile/s3",
    "headline": "New courses, set straight.",
    "accent": "straight",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: fresh waterproof underlayment covers the roof and the lower half is set with new terracotta barrel tiles in straight, even courses, the upper half still bare underlayment. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "tile/s4",
    "headline": "Warm tile, even lines.",
    "accent": "even",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the whole roof is covered in new warm terracotta barrel tiles in straight even courses with finished ridge tiles, glowing in the golden light. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  ],
  "beforeAfter": {
   "title": "Before and after: clay or concrete tile.",
   "before": {
    "id": "tile/before",
    "prompt": "An aging concrete tile roof on a stucco house: faded and chalky, a few cracked tiles, moss in the joints and small bright patches where tiles have slipped. Straight-on view in even soft daylight, the subject centered and filling most of the frame. Wide 16:9 photo, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   "after": {
    "id": "tile/after",
    "prompt": "Edit the before picture. Keep the exact same camera position, lens, framing and light; change only this: every tile is clean, even and fresh in the same warm color, in straight courses with new ridge tiles; the house is unchanged. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  }
 },
 {
  "key": "slate",
  "label": "Slate",
  "story": [
   {
    "id": "slate/s1",
    "headline": "Slate shows its age.",
    "accent": "age",
    "prompt": "A two-story stone and brick colonial home with dark green shutters, copper gutters, a tall oak tree and a clipped lawn, seen from the lawn. Its slate roof is aged: dull gray slates, a few slipped and cracked ones, rust stains below some nail lines and patches of moss. Locked-off camera at eye level, the subject sits in the right two-thirds of the frame with quiet open lawn and sky in the left third and lower left for a headline. Wide 16:9 photo, golden hour natural light, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   {
    "id": "slate/s2",
    "headline": "Slipped slates come off.",
    "accent": "off",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the slates on the lower third of the roof are removed, showing dark underlayment, with a neat stack of salvaged slates beside it. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "slate/s3",
    "headline": "Copper in, courses straight.",
    "accent": "Copper",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: new copper flashing is in place and fresh slates are laid in straight courses across the lower half, the upper half still old weathered slate. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "slate/s4",
    "headline": "Even slate, clean lines.",
    "accent": "Even",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the whole roof is even dark slate in straight courses with clean copper flashing and ridge, no missing or slipped slates. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  ],
  "beforeAfter": {
   "title": "Before and after: slate.",
   "before": {
    "id": "slate/before",
    "prompt": "An old slate roof with several slipped and cracked slates, moss patches and rust-stained copper flashing. Straight-on view in even soft daylight, the subject centered and filling most of the frame. Wide 16:9 photo, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   "after": {
    "id": "slate/after",
    "prompt": "Edit the before picture. Keep the exact same camera position, lens, framing and light; change only this: the slates are even and in place, the flashing is fresh copper and the moss is gone; the house is unchanged. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  }
 },
 {
  "key": "shake",
  "label": "Cedar shake",
  "story": [
   {
    "id": "shake/s1",
    "headline": "Weathered to silver.",
    "accent": "silver",
    "prompt": "A mountain lodge-style home with dark timber beams, a stone chimney, a gravel drive and tall pines behind it, seen from the drive. Its cedar shake roof is weathered: silver-gray, mossy, with curled and split shakes and a few bare spots. Locked-off camera at eye level, the subject sits in the right two-thirds of the frame with quiet open lawn and sky in the left third and lower left for a headline. Wide 16:9 photo, golden hour natural light, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   {
    "id": "shake/s2",
    "headline": "Back to the bare deck.",
    "accent": "bare",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: all the old shakes are gone and the pale roof deck is bare, with bundles of new cedar shakes stacked along the lower edge. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "shake/s3",
    "headline": "Shake by shake.",
    "accent": "shake",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the lower half of the roof is covered in new warm cedar shakes in staggered courses, the upper half still bare deck with underlayment. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "shake/s4",
    "headline": "Warm cedar, staggered courses.",
    "accent": "Warm",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the whole roof is covered in new cedar shakes in a warm honey-brown, in even staggered courses with a neat ridge. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  ],
  "beforeAfter": {
   "title": "Before and after: cedar shake.",
   "before": {
    "id": "shake/before",
    "prompt": "A cedar shake roof gone gray and mossy, with curled and split shakes and thin patches. Straight-on view in even soft daylight, the subject centered and filling most of the frame. Wide 16:9 photo, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   "after": {
    "id": "shake/after",
    "prompt": "Edit the before picture. Keep the exact same camera position, lens, framing and light; change only this: the roof is new cedar shakes in warm honey-brown, even and staggered; the house is unchanged. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  }
 },
 {
  "key": "flat",
  "label": "Flat or low-slope",
  "story": [
   {
    "id": "flat/s1",
    "headline": "Flat roofs hold water.",
    "accent": "water",
    "prompt": "A small modern one-story commercial building with light gray stucco walls, a parapet and a few unmarked rooftop air-conditioning units, seen from a raised vantage point. The flat roof is aging: dark patched membrane, ponding water stains, cracked seams and mismatched patches around the drains. Raised camera angle, as if from a neighboring rooftop, looking across the roof, the roof filling the right two-thirds of the frame with quiet space in the left third and lower left for a headline. Wide 16:9 photo, golden hour natural light, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   {
    "id": "flat/s2",
    "headline": "Old layers come off.",
    "accent": "off",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the old membrane is torn off and the roof shows clean gray insulation boards, with one large roll of new white membrane resting near the edge. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "flat/s3",
    "headline": "New membrane goes down.",
    "accent": "membrane",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the near half of the roof is covered in bright white membrane with welded seams, the far half still bare insulation boards. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "flat/s4",
    "headline": "Clean seams, clean drains.",
    "accent": "drains",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the whole roof is covered in clean bright white membrane with crisp seams and tidy flashing around every drain and unit. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  ],
  "beforeAfter": {
   "title": "Before and after: flat or low-slope.",
   "before": {
    "id": "flat/before",
    "prompt": "An aging low-slope roof with dark patched membrane, ponding water stains and cracked seams, seen from a raised angle. Straight-on view in even soft daylight, the subject centered and filling most of the frame. Wide 16:9 photo, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   "after": {
    "id": "flat/after",
    "prompt": "Edit the before picture. Keep the exact same camera position, lens, framing and light; change only this: the roof is clean bright white membrane with crisp seams and tidy flashing; the building is unchanged. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  }
 }
];
CINE_KIT.fencing.variants = [
 {
  "key": "cedar",
  "label": "Cedar privacy",
  "default": true
 },
 {
  "key": "vinyl",
  "label": "White vinyl privacy",
  "story": [
   {
    "id": "vinyl/s1",
    "headline": "It starts with a line.",
    "accent": "line",
    "prompt": "A suburban backyard with a freshly mowed lawn, a small wooden deck in the left foreground and a mature maple tree beyond, no fence yet. A straight line of small wooden survey stakes and a taut orange string marks where a fence will go. Locked-off camera at eye level, the subject sits in the right two-thirds of the frame with quiet open lawn and sky in the left third and lower left for a headline. Wide 16:9 photo, golden hour natural light, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   {
    "id": "vinyl/s2",
    "headline": "Posts go in first.",
    "accent": "first",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: evenly spaced white vinyl fence posts now stand along the string line, set in fresh concrete footings. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "vinyl/s3",
    "headline": "Panels slide into place.",
    "accent": "slide",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: white vinyl privacy panels are slid between the nearest six posts, the farther posts still open. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "vinyl/s4",
    "headline": "White vinyl, clean and tight.",
    "accent": "clean",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the whole line is finished: a clean white vinyl privacy fence with post caps runs along the full string line. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  ],
  "beforeAfter": {
   "title": "Before and after: white vinyl privacy.",
   "before": {
    "id": "vinyl/before",
    "prompt": "An old yellowed vinyl fence in a backyard, with a cracked section and one leaning post. Straight-on view in even soft daylight, the subject centered and filling most of the frame. Wide 16:9 photo, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   "after": {
    "id": "vinyl/after",
    "prompt": "Edit the before picture. Keep the exact same camera position, lens, framing and light; change only this: the fence is new white vinyl, straight and clean, with no cracks and all posts upright. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  }
 },
 {
  "key": "aluminum",
  "label": "Black aluminum picket",
  "story": [
   {
    "id": "aluminum/s1",
    "headline": "A fence starts at the curb.",
    "accent": "curb",
    "prompt": "The front lawn of a red-brick colonial house with a brick walkway and clipped hedges, no fence yet. A straight line of small wooden survey stakes with a taut orange string runs along the sidewalk edge. Locked-off camera at eye level, the subject sits in the right two-thirds of the frame with quiet open lawn and sky in the left third and lower left for a headline. Wide 16:9 photo, golden hour natural light, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   {
    "id": "aluminum/s2",
    "headline": "Posts, set and level.",
    "accent": "level",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: evenly spaced black aluminum posts now stand along the string line, set in fresh concrete. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "aluminum/s3",
    "headline": "Rails, then pickets.",
    "accent": "pickets",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: black horizontal rails connect the nearest posts and straight pickets are installed on the nearest sections only. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "aluminum/s4",
    "headline": "Black aluminum, clean lines.",
    "accent": "clean",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the whole line is finished: a black aluminum picket fence with pointed finials runs along the sidewalk, with a matching walk gate at the brick path. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  ],
  "beforeAfter": {
   "title": "Before and after: black aluminum picket.",
   "before": {
    "id": "aluminum/before",
    "prompt": "An old iron fence with peeling black paint, rust at the joints and a few bent pickets. Straight-on view in even soft daylight, the subject centered and filling most of the frame. Wide 16:9 photo, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   "after": {
    "id": "aluminum/after",
    "prompt": "Edit the before picture. Keep the exact same camera position, lens, framing and light; change only this: the fence is new black aluminum picket, straight, with fresh finials and no rust. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  }
 },
 {
  "key": "chainlink",
  "label": "Chain link",
  "story": [
   {
    "id": "chainlink/s1",
    "headline": "Marked out, string tight.",
    "accent": "tight",
    "prompt": "A residential corner lot side yard with short green grass and a gravel strip, the corner of a detached garage in the distance, no fence yet. A straight line of small wooden survey stakes with an orange string marks the fence line. Locked-off camera at eye level, the subject sits in the right two-thirds of the frame with quiet open lawn and sky in the left third and lower left for a headline. Wide 16:9 photo, golden hour natural light, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   {
    "id": "chainlink/s2",
    "headline": "Steel posts go in.",
    "accent": "Steel",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: galvanized steel terminal and line posts now stand evenly along the string line, set in concrete. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "chainlink/s3",
    "headline": "Mesh gets stretched.",
    "accent": "stretched",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: a galvanized top rail connects the posts and chain link mesh is stretched along the nearest sections only. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "chainlink/s4",
    "headline": "Chain link, run straight.",
    "accent": "straight",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the whole line is finished: a galvanized chain link fence with top rail and tension wire runs the full line, with a walk gate near the corner. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  ],
  "beforeAfter": {
   "title": "Before and after: chain link.",
   "before": {
    "id": "chainlink/before",
    "prompt": "A rusty, sagging chain link fence with a bent top rail and loose mesh. Straight-on view in even soft daylight, the subject centered and filling most of the frame. Wide 16:9 photo, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   "after": {
    "id": "chainlink/after",
    "prompt": "Edit the before picture. Keep the exact same camera position, lens, framing and light; change only this: the fence is new galvanized chain link, taut and straight with a clean top rail. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  }
 },
 {
  "key": "splitrail",
  "label": "Split-rail ranch",
  "story": [
   {
    "id": "splitrail/s1",
    "headline": "Start with open pasture.",
    "accent": "open",
    "prompt": "A rolling green horse pasture with tall grass, a far tree line and a gravel farm lane, no fence yet. A straight line of small wooden survey stakes with an orange string crosses the pasture. Locked-off camera at eye level, the subject sits in the right two-thirds of the frame with quiet open lawn and sky in the left third and lower left for a headline. Wide 16:9 photo, golden hour natural light, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   {
    "id": "splitrail/s2",
    "headline": "Posts mark the line.",
    "accent": "line",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: rough-sawn wooden fence posts with square rail holes now stand evenly along the line, set in the ground. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "splitrail/s3",
    "headline": "Rails slide through.",
    "accent": "slide",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: two rough wooden rails are slid through the nearest posts, the farther posts still open. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "splitrail/s4",
    "headline": "Three rails, open country.",
    "accent": "country",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the whole line is finished: a three-rail split-rail ranch fence in warm weathered wood runs across the pasture. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  ],
  "beforeAfter": {
   "title": "Before and after: split-rail ranch.",
   "before": {
    "id": "splitrail/before",
    "prompt": "A rotting split-rail fence with a fallen rail, leaning posts and tall weeds along it. Straight-on view in even soft daylight, the subject centered and filling most of the frame. Wide 16:9 photo, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   "after": {
    "id": "splitrail/after",
    "prompt": "Edit the before picture. Keep the exact same camera position, lens, framing and light; change only this: the fence is new split-rail in warm wood with straight posts and all three rails in place, and the weeds are trimmed. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  }
 },
 {
  "key": "slat",
  "label": "Modern horizontal slat",
  "story": [
   {
    "id": "slat/s1",
    "headline": "Plain lawn, clear line.",
    "accent": "line",
    "prompt": "A modern home's backyard with a smooth concrete patio, ornamental grasses and a gravel bed, no fence yet. A straight line of small wooden survey stakes with an orange string marks the fence line. Locked-off camera at eye level, the subject sits in the right two-thirds of the frame with quiet open lawn and sky in the left third and lower left for a headline. Wide 16:9 photo, golden hour natural light, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   {
    "id": "slat/s2",
    "headline": "Black steel posts first.",
    "accent": "first",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: slim black steel posts now stand evenly along the line, set in concrete. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "slat/s3",
    "headline": "Slats go on, one by one.",
    "accent": "one",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: horizontal cedar slats with thin even gaps are installed between the nearest posts only. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "slat/s4",
    "headline": "Warm cedar, modern lines.",
    "accent": "modern",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the whole line is finished: a modern horizontal cedar slat fence between black steel posts runs the full line. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  ],
  "beforeAfter": {
   "title": "Before and after: modern horizontal slat.",
   "before": {
    "id": "slat/before",
    "prompt": "An old gray horizontal board fence with warped boards, uneven gaps and a leaning section. Straight-on view in even soft daylight, the subject centered and filling most of the frame. Wide 16:9 photo, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   "after": {
    "id": "slat/after",
    "prompt": "Edit the before picture. Keep the exact same camera position, lens, framing and light; change only this: the fence is new horizontal cedar slats with thin even gaps between straight black posts. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  }
 }
];
CINE_KIT.pressure.variants = [
 {
  "key": "driveway",
  "label": "Driveway and walkway",
  "default": true
 },
 {
  "key": "siding",
  "label": "House siding",
  "story": [
   {
    "id": "siding/s1",
    "headline": "Green creeps up the siding.",
    "accent": "Green",
    "prompt": "A two-story suburban house with white vinyl siding stained green with algae near the base and under the windows, a tidy lawn and a hedge, seen from the lawn. Locked-off camera at eye level, the subject sits in the right two-thirds of the frame with quiet open lawn and sky in the left third and lower left for a headline. Wide 16:9 photo, golden hour natural light, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   {
    "id": "siding/s2",
    "headline": "Watch the line move.",
    "accent": "line",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the left half of the house siding is bright clean white and the right half is still green-stained, with one sharp vertical line between them and a wet sheen on the clean side. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "siding/s3",
    "headline": "Almost all the way.",
    "accent": "Almost",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: most of the siding is clean white and only a narrow green-stained strip remains at the far right edge. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "siding/s4",
    "headline": "Clean, soft-washed siding.",
    "accent": "Clean",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: all of the siding is clean bright white and slightly damp, with clean windows and trim; the lawn is unchanged. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  ],
  "beforeAfter": {
   "title": "Before and after: house siding.",
   "before": {
    "id": "siding/before",
    "prompt": "The front wall of a house with dull white siding streaked green and gray with algae. Straight-on view in even soft daylight, the subject centered and filling most of the frame. Wide 16:9 photo, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   "after": {
    "id": "siding/after",
    "prompt": "Edit the before picture. Keep the exact same camera position, lens, framing and light; change only this: the siding is bright clean white with no streaks; the house is unchanged. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  }
 },
 {
  "key": "deck",
  "label": "Deck and patio",
  "story": [
   {
    "id": "deck/s1",
    "headline": "Decks go gray.",
    "accent": "gray",
    "prompt": "A backyard wooden deck with weathered gray boards, black mildew patches and green algae along the edges, a stone patio beside it and potted plants, seen from the lawn. Locked-off camera at eye level, the subject sits in the right two-thirds of the frame with quiet open lawn and sky in the left third and lower left for a headline. Wide 16:9 photo, golden hour natural light, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   {
    "id": "deck/s2",
    "headline": "A line of clean wood.",
    "accent": "clean",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the left half of the deck is clean warm brown wood and the right half is still gray and stained, with one sharp straight line between them and a wet sheen on the clean wood. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "deck/s3",
    "headline": "Nearly there.",
    "accent": "there",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: nearly the whole deck is clean warm wood and only a narrow gray strip remains at the right edge. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "deck/s4",
    "headline": "Warm wood, clean patio.",
    "accent": "Warm",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the whole deck is clean warm wood, slightly damp, and the stone patio beside it is clean and even. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  ],
  "beforeAfter": {
   "title": "Before and after: deck and patio.",
   "before": {
    "id": "deck/before",
    "prompt": "A weathered gray wood deck with black mildew spots and green algae. Straight-on view in even soft daylight, the subject centered and filling most of the frame. Wide 16:9 photo, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   "after": {
    "id": "deck/after",
    "prompt": "Edit the before picture. Keep the exact same camera position, lens, framing and light; change only this: the deck boards are clean warm brown wood with the grain visible and no stains. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  }
 },
 {
  "key": "fence",
  "label": "Fence",
  "story": [
   {
    "id": "fence/s1",
    "headline": "Fences go green.",
    "accent": "green",
    "prompt": "A long wooden privacy fence along a green lawn, gray-green with algae and dark streaks, with a tree beside it, seen at a slight angle from the lawn. Locked-off camera at eye level, the subject sits in the right two-thirds of the frame with quiet open lawn and sky in the left third and lower left for a headline. Wide 16:9 photo, golden hour natural light, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   {
    "id": "fence/s2",
    "headline": "The line moves down the fence.",
    "accent": "line",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the left half of the fence is clean warm wood tone and the right half is still gray-green and streaked, with one sharp vertical line between them and a wet sheen on the clean boards. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "fence/s3",
    "headline": "Almost clean.",
    "accent": "clean",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: nearly the whole fence is clean warm wood, with a narrow gray-green strip at the far right. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "fence/s4",
    "headline": "Grain you can see again.",
    "accent": "Grain",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the whole fence is clean warm wood, slightly damp, with the grain visible. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  ],
  "beforeAfter": {
   "title": "Before and after: fence.",
   "before": {
    "id": "fence/before",
    "prompt": "A gray-green wooden fence with algae and dark streaks. Straight-on view in even soft daylight, the subject centered and filling most of the frame. Wide 16:9 photo, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   "after": {
    "id": "fence/after",
    "prompt": "Edit the before picture. Keep the exact same camera position, lens, framing and light; change only this: the fence boards are clean warm wood with visible grain and no streaks. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  }
 },
 {
  "key": "roof",
  "label": "Roof soft wash",
  "story": [
   {
    "id": "roof/s1",
    "headline": "Black streaks run down the roof.",
    "accent": "streaks",
    "prompt": "A two-story house with a gray asphalt shingle roof streaked with long black algae stains down the slopes, clear pale sky, seen from the lawn. Locked-off camera at eye level, the subject sits in the right two-thirds of the frame with quiet open lawn and sky in the left third and lower left for a headline. Wide 16:9 photo, golden hour natural light, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   {
    "id": "roof/s2",
    "headline": "A line of clean shingle.",
    "accent": "clean",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the left half of the roof is clean even medium-gray shingle and the right half is still dark streaked, with one sharp diagonal line between them. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "roof/s3",
    "headline": "Nearly all the way.",
    "accent": "way",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: nearly the whole roof is clean even gray, with only a few dark streaks left at the far right. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "roof/s4",
    "headline": "Even gray, no streaks.",
    "accent": "Even",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the whole roof is clean even medium-gray shingle with no streaks. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  ],
  "beforeAfter": {
   "title": "Before and after: roof soft wash.",
   "before": {
    "id": "roof/before",
    "prompt": "A shingle roof with long black algae streaks. Straight-on view in even soft daylight, the subject centered and filling most of the frame. Wide 16:9 photo, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   "after": {
    "id": "roof/after",
    "prompt": "Edit the before picture. Keep the exact same camera position, lens, framing and light; change only this: the shingle roof is clean and even gray with no streaks. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  }
 },
 {
  "key": "storefront",
  "label": "Storefront and lot",
  "story": [
   {
    "id": "storefront/s1",
    "headline": "Grime builds up at the door.",
    "accent": "door",
    "prompt": "A small brick row of storefronts with blank windows and plain awnings with no writing, a wide concrete sidewalk and parking lot dark with oil stains, tire marks and grime, seen from across the lot. Locked-off camera at eye level, the subject sits in the right two-thirds of the frame with quiet open lawn and sky in the left third and lower left for a headline. Wide 16:9 photo, golden hour natural light, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   {
    "id": "storefront/s2",
    "headline": "Watch the line move.",
    "accent": "line",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the left half of the sidewalk and parking lot is clean light-gray concrete and the right half is still dark and stained, with one sharp straight line between them and a wet sheen on the clean side. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "storefront/s3",
    "headline": "Almost clean.",
    "accent": "clean",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: nearly all of the sidewalk and lot is clean light gray, and only a narrow dark strip remains at the far right. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   },
   {
    "id": "storefront/s4",
    "headline": "Clean walk, clean lot.",
    "accent": "clean",
    "prompt": "Edit the previous picture. Keep the exact same camera position, lens, framing, light and sky; change only this: the whole sidewalk and parking lot are clean even light-gray concrete, slightly damp, with crisp painted lines and no text. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  ],
  "beforeAfter": {
   "title": "Before and after: storefront and lot.",
   "before": {
    "id": "storefront/before",
    "prompt": "A stained dark concrete sidewalk in front of a brick storefront. Straight-on view in even soft daylight, the subject centered and filling most of the frame. Wide 16:9 photo, realistic, calm and premium. No people, no faces, no hands, no text, no letters, no numbers, no logos, no signs, no watermarks, no vehicles with writing."
   },
   "after": {
    "id": "storefront/after",
    "prompt": "Edit the before picture. Keep the exact same camera position, lens, framing and light; change only this: the sidewalk is clean even light-gray concrete; the storefront is unchanged. Keep everything else identical. Wide 16:9 photo. No people, no faces, no hands, no text, no letters, no logos, no signs, no watermarks."
   }
  }
 }
];
// VARIANTS:END

// The variants of a trade (always at least the default one).
export function cineVariants(trade) {
  const k = CINE_KIT[trade];
  return (k && k.variants) || (k ? [{ key: "default", label: "Default", default: true }] : []);
}

// The kit for one variant: the trade's kit with its story/beforeAfter/styles
// swapped, plus slotPrefix ("" for the default) and variant (its key).
export function cineVariant(trade, key) {
  const k = CINE_KIT[trade];
  if (!k) return null;
  const all = cineVariants(trade);
  const v = all.find((x) => x.key === key) || all[0];
  if (v.default) return { ...k, variant: v.key, slotPrefix: "" };
  return { ...k, story: v.story, beforeAfter: v.beforeAfter, styles: v.styles || k.styles, variant: v.key, slotPrefix: `${v.key}/` };
}

// Picture slots for one variant, with the library path of each picture. The
// default variant is kitSlots(trade); other variants list their own 6 slots.
export function variantSlots(trade, key) {
  const all = cineVariants(trade);
  const v = all.find((x) => x.key === key) || all[0];
  if (!v || v.default) return kitSlots(trade).map((s) => ({ ...s, variant: v ? v.key : "", path: `library/${trade}/${s.slotId}.webp` }));
  const n = v.story.length, p = (id) => `library/${trade}/${id}.webp`; // id is "<variant>/<slot>"
  return [
    ...v.story.map((s, i) => ({ slotId: s.id, kind: "story", index: i, variant: v.key,
      label: `${v.label}, story ${i + 1} of ${n}: ${s.headline}`, prompt: s.prompt, path: p(s.id) })),
    { slotId: v.beforeAfter.before.id, kind: "before", index: 0, variant: v.key, label: `${v.label}: before picture`, prompt: v.beforeAfter.before.prompt, path: p(v.beforeAfter.before.id) },
    { slotId: v.beforeAfter.after.id, kind: "after", index: 0, variant: v.key, label: `${v.label}: after picture`, prompt: v.beforeAfter.after.prompt, path: p(v.beforeAfter.after.id) },
  ];
}
