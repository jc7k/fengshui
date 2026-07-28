/**
 * The room, drawn to scale: walls, doors (with swing), windows — and the drag
 * interaction that moves them.
 *
 * Loaded lazily on web (see `room-canvas.web.tsx`), and the gesture layer lives
 * in here rather than in the wrapper for the same reason the renderer does:
 * `react-native-gesture-handler` and `reanimated` are ~1.1MB, and hoisting them
 * into the wrapper puts them in the entry bundle, which the landing page
 * downloads before it can show a headline. Nothing may import this module
 * statically on web (docs/decisions/0001-skia-on-web.md).
 */
import { Canvas, Circle, Group, Line, Path, Rect, Skia } from '@shopify/react-native-skia';
import { View } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import { canvasFit } from './canvas-fit';
import { HANDLE_KNOB_PX, useCanvasDrag } from './use-canvas-drag';
import type { RoomCanvasProps } from './room-canvas-props';

import {
  cmToPx,
  gridSizeCm,
  itemHandles,
  openingEndpoints,
  pxToCm,
  roomPointToPx,
  wallInwardNormal,
  type Door,
  type FurnitureItem,
  type FurnitureType,
  type Layout,
  type RoomFit,
  type Window,
} from '../core';

export interface RoomCanvasSkiaProps extends RoomCanvasProps {
  widthPx: number;
  heightPx: number;
}

const WALL_PX = 3;

const COLORS = {
  floor: '#f8fafc',
  wall: '#334155',
  door: '#2563eb',
  doorMain: '#1d4ed8',
  swing: '#93c5fd',
  window: '#0ea5e9',
  selected: '#f97316',
  grid: '#e2e8f0',
  outline: '#64748b',
};

/**
 * A fill per type, so a glance at the plan reads as furniture rather than as a
 * field of identical boxes. Deliberately flat colour and nothing else: the REQ
 * scopes the MVP to simple shapes, and icons would need assets the rules do not
 * care about. Names are the item's job — see `furniture-labels.tsx`.
 */
const FURNITURE_COLORS: Record<FurnitureType, string> = {
  bed: '#c7d2fe',
  nightstand: '#ddd6fe',
  dresser: '#e9d5ff',
  mirror: '#bae6fd',
  desk: '#fed7aa',
  sofa: '#bbf7d0',
  armchair: '#a7f3d0',
  coffee_table: '#fde68a',
  tv_stand: '#e5e7eb',
  bookshelf: '#fecaca',
  chair: '#fbcfe8',
  filing_cabinet: '#cbd5e1',
  plant: '#86efac',
  rug: '#fef3c7',
  lamp: '#fef08a',
  artwork: '#f5d0fe',
};

function OpeningLine({
  opening,
  fit,
  layout,
  color,
  strokePx,
}: {
  opening: Door | Window;
  fit: RoomFit;
  layout: Layout;
  color: string;
  strokePx: number;
}) {
  const [a, b] = openingEndpoints(
    { wall: opening.wall, offsetCm: opening.offsetCm },
    opening.widthCm,
    layout.room,
  );
  const pa = roomPointToPx(a.x, a.y, fit);
  const pb = roomPointToPx(b.x, b.y, fit);
  return <Line p1={pa} p2={pb} color={color} strokeWidth={strokePx} style="stroke" strokeCap="butt" />;
}

/**
 * The snap grid, drawn only while snapping is on.
 *
 * It exists to explain the snapping, so showing it when nothing snaps would be
 * a lie. Only the interior lines are emitted, which clips it to the room
 * without a clip path.
 */
function Grid({ fit, layout }: { fit: RoomFit; layout: Layout }) {
  const stepCm = gridSizeCm(layout.displayUnit);
  const lines = [];

  for (let x = stepCm; x < layout.room.widthCm; x += stepCm) {
    const a = roomPointToPx(x, 0, fit);
    const b = roomPointToPx(x, layout.room.lengthCm, fit);
    lines.push(<Line key={`gx-${x}`} p1={a} p2={b} color={COLORS.grid} strokeWidth={1} style="stroke" />);
  }
  for (let y = stepCm; y < layout.room.lengthCm; y += stepCm) {
    const a = roomPointToPx(0, y, fit);
    const b = roomPointToPx(layout.room.widthCm, y, fit);
    lines.push(<Line key={`gy-${y}`} p1={a} p2={b} color={COLORS.grid} strokeWidth={1} style="stroke" />);
  }

  return <Group>{lines}</Group>;
}

/**
 * One piece of furniture: a filled rect with an outline, rotated about its
 * centre.
 *
 * The rect is drawn around the origin and the `Group` transform places it, so
 * the rotation is the item's own and needs no trigonometry here. Skia takes
 * radians, and a positive angle turns clockwise in this y-down frame — the same
 * convention `geometry.ts` uses, so `rotationDeg` converts and nothing else.
 *
 * The heavier line on the front edge is not decoration: 0° and 180° are
 * otherwise indistinguishable on a square item, and which way a bed faces is
 * the whole of REQ-011 rule 2.
 */
function FurnitureShape({
  item,
  fit,
  selected,
}: {
  item: FurnitureItem;
  fit: RoomFit;
  selected: boolean;
}) {
  const centre = roomPointToPx(item.xCm, item.yCm, fit);
  const w = cmToPx(item.widthCm, fit);
  const h = cmToPx(item.depthCm, fit);

  return (
    <Group
      transform={[
        { translateX: centre.x },
        { translateY: centre.y },
        { rotate: (item.rotationDeg * Math.PI) / 180 },
      ]}
    >
      <Rect x={-w / 2} y={-h / 2} width={w} height={h} color={FURNITURE_COLORS[item.type]} />
      <Rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        color={selected ? COLORS.selected : COLORS.outline}
        style="stroke"
        strokeWidth={selected ? 2.5 : 1}
      />
      <Line
        p1={{ x: -w / 2, y: -h / 2 }}
        p2={{ x: w / 2, y: -h / 2 }}
        color={COLORS.outline}
        strokeWidth={2.5}
        style="stroke"
      />
    </Group>
  );
}

/** Side of a corner handle, screen pixels. */
const HANDLE_PX = 10;

/**
 * The grab points on the selected item: a square at each corner, a round knob
 * out along its facing.
 *
 * `itemHandles` has already applied the item's rotation, so these are drawn
 * unrotated in screen space — a corner marker stays square at any angle, which
 * is what makes it read as a control rather than as part of the plan. The knob
 * distance comes from the drag hook so the handle is where it is hit-tested.
 */
function Handles({ item, fit }: { item: FurnitureItem; fit: RoomFit }) {
  return (
    <Group>
      {itemHandles(item, pxToCm(HANDLE_KNOB_PX, fit)).map((handle) => {
        const p = roomPointToPx(handle.x, handle.y, fit);
        if (handle.kind === 'rotate') {
          return (
            <Circle key={handle.kind} cx={p.x} cy={p.y} r={HANDLE_PX / 2} color={COLORS.selected} />
          );
        }
        return (
          <Rect
            key={handle.kind}
            x={p.x - HANDLE_PX / 2}
            y={p.y - HANDLE_PX / 2}
            width={HANDLE_PX}
            height={HANDLE_PX}
            color={COLORS.selected}
          />
        );
      })}
    </Group>
  );
}

/** The door's swing arc — the zone REQ-011 rule 5 warns about blocking. */
function DoorSwing({ door, fit, layout }: { door: Door; fit: RoomFit; layout: Layout }) {
  const [a, b] = openingEndpoints(
    { wall: door.wall, offsetCm: door.offsetCm },
    door.widthCm,
    layout.room,
  );
  // Hinge on the near end for 'left', the far end for 'right'.
  const hinge = door.hinge === 'left' ? a : b;
  const leaf = door.hinge === 'left' ? b : a;
  const inward = wallInwardNormal(door.wall);
  const sign = door.swing === 'inward' ? 1 : -1;

  const pHinge = roomPointToPx(hinge.x, hinge.y, fit);
  const pLeaf = roomPointToPx(leaf.x, leaf.y, fit);
  const radiusPx = Math.hypot(pLeaf.x - pHinge.x, pLeaf.y - pHinge.y);
  if (radiusPx <= 0) return null;

  // Build the quarter disc as an explicit pie slice from the closed-leaf angle
  // to the fully-open angle. Doing this by endpoint (arcToRotated) picks the
  // wrong one of the two possible arcs on half the walls, which is how the
  // swing ended up sweeping *outside* the room on the first attempt.
  const deg = (v: { x: number; y: number }) => (Math.atan2(v.y, v.x) * 180) / Math.PI;
  const startAngle = deg({ x: pLeaf.x - pHinge.x, y: pLeaf.y - pHinge.y });
  const openAngle = deg({ x: inward.x * sign, y: inward.y * sign });

  // Shortest signed turn from closed to open: always a quarter, never three.
  const sweep = ((openAngle - startAngle + 540) % 360) - 180;

  const oval = {
    x: pHinge.x - radiusPx,
    y: pHinge.y - radiusPx,
    width: radiusPx * 2,
    height: radiusPx * 2,
  };

  const path = Skia.Path.Make();
  path.moveTo(pHinge.x, pHinge.y);
  path.arcToOval(oval, startAngle, sweep, false);
  path.close();

  return <Path path={path} color={COLORS.swing} opacity={0.35} />;
}

export default function RoomCanvasSkia({
  layout,
  widthPx,
  heightPx,
  selectedId,
  snapEnabled,
  onSelect,
  onMoveOpening,
  onMoveFurniture,
  onTransformFurniture,
  onRotateFurniture,
  onBeginEntry,
  onEndEntry,
}: RoomCanvasSkiaProps) {
  // Same function the wrapper's drop handler uses, on the same measured size —
  // see `canvas-fit.ts`. Recomputing it inline here would be one padding
  // constant away from dropping items in the wrong place.
  const fit = canvasFit(layout.room, widthPx, heightPx);

  const pan = useCanvasDrag({
    layout,
    fit,
    selectedId,
    snapEnabled,
    onSelect,
    onMoveOpening,
    onMoveFurniture,
    onTransformFurniture,
    onRotateFurniture,
    onBeginEntry,
    onEndEntry,
  });
  const openingStroke = Math.max(4, WALL_PX * 2.5);
  const selectedItem = layout.furniture.find((item) => item.id === selectedId) ?? null;

  return (
    <GestureHandlerRootView style={{ width: widthPx, height: heightPx }}>
      <GestureDetector gesture={pan}>
        <View style={{ width: widthPx, height: heightPx }}>
          <Canvas style={{ width: widthPx, height: heightPx }} testID="room-canvas">
            <Rect
              x={fit.offsetXPx}
              y={fit.offsetYPx}
              width={fit.widthPx}
              height={fit.heightPx}
              color={COLORS.floor}
            />

            {snapEnabled ? <Grid fit={fit} layout={layout} /> : null}

            {layout.doors.map((door) => (
              <Group key={`swing-${door.id}`}>
                <DoorSwing door={door} fit={fit} layout={layout} />
              </Group>
            ))}

            <Rect
              x={fit.offsetXPx}
              y={fit.offsetYPx}
              width={fit.widthPx}
              height={fit.heightPx}
              color={COLORS.wall}
              style="stroke"
              strokeWidth={WALL_PX}
            />

            {layout.windows.map((w) => (
              <OpeningLine
                key={w.id}
                opening={w}
                fit={fit}
                layout={layout}
                color={w.id === selectedId ? COLORS.selected : COLORS.window}
                strokePx={openingStroke}
              />
            ))}

            {layout.doors.map((d) => (
              <OpeningLine
                key={d.id}
                opening={d}
                fit={fit}
                layout={layout}
                color={
                  d.id === selectedId ? COLORS.selected : d.isMain ? COLORS.doorMain : COLORS.door
                }
                strokePx={openingStroke}
              />
            ))}

            {/* A dot marks the main door — the anchor REQ-016's bagua grid orients to. */}
            {layout.doors
              .filter((d) => d.isMain)
              .map((d) => {
                const [a, b] = openingEndpoints(
                  { wall: d.wall, offsetCm: d.offsetCm },
                  d.widthCm,
                  layout.room,
                );
                const mid = roomPointToPx((a.x + b.x) / 2, (a.y + b.y) / 2, fit);
                return <Circle key={`main-${d.id}`} cx={mid.x} cy={mid.y} r={4} color="#ffffff" />;
              })}

            {/* Last, so furniture sits on top of the room it is placed in. */}
            {layout.furniture.map((item) => (
              <FurnitureShape
                key={item.id}
                item={item}
                fit={fit}
                selected={item.id === selectedId}
              />
            ))}

            {selectedItem ? <Handles item={selectedItem} fit={fit} /> : null}
          </Canvas>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
