/**
 * The design screen: room setup, openings, and the to-scale canvas
 * (PRD §4.1, §5).
 *
 * The whole screen's state is one `Layout` from `core/` — there is deliberately
 * no parallel UI-side notion of a room. Every edit goes through a pure function
 * in `core/layout-ops`, so REQ-009 can put an undo stack underneath without
 * touching this file, and REQ-010 can persist the object as-is.
 */
import { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import OpeningsToolbar from '../components/openings-toolbar';
import RoomCanvas from '../components/room-canvas';
import RoomSetupForm from '../components/room-setup-form';
import {
  addDoor,
  addWindow,
  createLayout,
  DEFAULT_DOOR_WIDTH_CM,
  DEFAULT_WINDOW_WIDTH_CM,
  formatLength,
  moveOpening,
  removeOpening,
  setMainDoor,
  snapToWall,
  toCm,
  toggleDoorSwing,
  WALLS,
  type Layout,
  type RoomType,
  type Unit,
  type WallPlacement,
} from '../core';

/** A plausible starting room so the canvas is never empty on arrival. */
const INITIAL: Layout = createLayout(
  'bedroom',
  { widthCm: toCm(12, 'ft'), lengthCm: toCm(10, 'ft') },
  'ft',
);

export default function DesignScreen() {
  const [layout, setLayout] = useState<Layout>(INITIAL);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const nextId = useRef(1);

  const makeId = (prefix: string) => `${prefix}-${nextId.current++}`;

  const setRoomType = (roomType: RoomType) => setLayout((l) => ({ ...l, roomType }));

  const setDimensions = (widthCm: number, lengthCm: number) =>
    setLayout((l) => ({ ...l, room: { widthCm, lengthCm } }));

  // Display unit only. The room's centimetres are untouched, so switching units
  // relabels the numbers and leaves the canvas exactly where it was.
  const setUnit = (displayUnit: Unit) => setLayout((l) => ({ ...l, displayUnit }));

  /**
   * Where a new opening lands before the user drags it.
   *
   * Cycles through the walls so successive additions do not stack invisibly on
   * top of each other — two doors at the identical spot look like one.
   */
  const nextPlacement = (l: Layout, widthCm: number): WallPlacement => {
    const wall = WALLS[(l.doors.length + l.windows.length) % WALLS.length];
    const centre = {
      north: { x: l.room.widthCm / 2, y: 0 },
      east: { x: l.room.widthCm, y: l.room.lengthCm / 2 },
      south: { x: l.room.widthCm / 2, y: l.room.lengthCm },
      west: { x: 0, y: l.room.lengthCm / 2 },
    }[wall];
    return snapToWall(centre, l.room, widthCm);
  };

  const handleAddDoor = () => {
    const id = makeId('door');
    setLayout((l) => addDoor(l, id, nextPlacement(l, DEFAULT_DOOR_WIDTH_CM)));
    setSelectedId(id);
  };

  const handleAddWindow = () => {
    const id = makeId('window');
    setLayout((l) => addWindow(l, id, nextPlacement(l, DEFAULT_WINDOW_WIDTH_CM)));
    setSelectedId(id);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    setLayout((l) => removeOpening(l, selectedId));
    setSelectedId(null);
  };

  const handleMove = (id: string, placement: WallPlacement) =>
    setLayout((l) => moveOpening(l, id, placement));

  const handleToggleSwing = () => {
    if (!selectedId) return;
    setLayout((l) => toggleDoorSwing(l, selectedId));
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }}>
      <RoomSetupForm
        roomType={layout.roomType}
        widthCm={layout.room.widthCm}
        lengthCm={layout.room.lengthCm}
        unit={layout.displayUnit}
        onChangeRoomType={setRoomType}
        onChangeDimensions={setDimensions}
        onChangeUnit={setUnit}
      />

      <OpeningsToolbar
        layout={layout}
        selectedId={selectedId}
        onAddDoor={handleAddDoor}
        onAddWindow={handleAddWindow}
        onDelete={handleDelete}
        onSetMainDoor={(id) => setLayout((l) => setMainDoor(l, id))}
        onToggleSwing={handleToggleSwing}
      />

      <View className="px-4 py-2">
        <Text testID="room-summary" className="text-sm text-neutral-500">
          {formatLength(layout.room.widthCm, layout.displayUnit)} ×{' '}
          {formatLength(layout.room.lengthCm, layout.displayUnit)}
        </Text>
      </View>

      <View className="flex-1 px-4 pb-6" style={{ minHeight: 400 }}>
        <RoomCanvas
          layout={layout}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onMoveOpening={handleMove}
        />
      </View>
    </ScrollView>
  );
}
