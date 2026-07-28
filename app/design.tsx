/**
 * The design screen: room setup above, to-scale canvas below (PRD §4.1, §5).
 *
 * The whole screen's state is one `Layout` from `core/` — there is deliberately
 * no parallel UI-side notion of a room. REQ-008 adds furniture to the same
 * object; REQ-009 puts a store underneath it; REQ-010 persists it as-is.
 */
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import RoomCanvas from '../components/room-canvas';
import RoomSetupForm from '../components/room-setup-form';
import {
  createLayout,
  formatLength,
  toCm,
  type Layout,
  type RoomType,
  type Unit,
} from '../core';

/** A plausible starting room so the canvas is never empty on arrival. */
const INITIAL: Layout = createLayout(
  'bedroom',
  { widthCm: toCm(12, 'ft'), lengthCm: toCm(10, 'ft') },
  'ft',
);

export default function DesignScreen() {
  const [layout, setLayout] = useState<Layout>(INITIAL);

  const setRoomType = (roomType: RoomType) => setLayout((l) => ({ ...l, roomType }));

  const setDimensions = (widthCm: number, lengthCm: number) =>
    setLayout((l) => ({ ...l, room: { widthCm, lengthCm } }));

  // Display unit only. The room's centimetres are untouched, so switching units
  // relabels the numbers and leaves the canvas exactly where it was.
  const setUnit = (displayUnit: Unit) => setLayout((l) => ({ ...l, displayUnit }));

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

      <View className="px-4 pb-2">
        <Text testID="room-summary" className="text-sm text-neutral-500">
          {formatLength(layout.room.widthCm, layout.displayUnit)} ×{' '}
          {formatLength(layout.room.lengthCm, layout.displayUnit)}
        </Text>
      </View>

      <View className="flex-1 px-4 pb-6" style={{ minHeight: 400 }}>
        <RoomCanvas room={layout.room} />
      </View>
    </ScrollView>
  );
}
