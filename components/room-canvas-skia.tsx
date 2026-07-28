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

import { useOpeningDrag } from './use-opening-drag';
import type { RoomCanvasProps } from './room-canvas-props';

import {
  fitRoomToViewport,
  openingEndpoints,
  PADDING_PX,
  roomPointToPx,
  wallInwardNormal,
  type Door,
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
  onSelect,
  onMoveOpening,
}: RoomCanvasSkiaProps) {
  const fit = fitRoomToViewport(layout.room, {
    widthPx,
    heightPx,
    paddingPx: PADDING_PX,
  });

  const pan = useOpeningDrag({ layout, fit, onSelect, onMove: onMoveOpening });
  const openingStroke = Math.max(4, WALL_PX * 2.5);

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
          </Canvas>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
