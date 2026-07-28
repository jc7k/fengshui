/**
 * Room type + dimensions (PRD §4.1).
 *
 * The form's own state is the *text* the user is typing; the canonical value is
 * always centimetres on the layout. Switching units therefore re-renders the
 * numbers without touching the room — 12 ft becomes 3.7 m and the canvas does
 * not move.
 */
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { fromCm, toCm, type RoomType, type Unit } from '../core';
import { ROOM_TYPES } from '../core';

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  bedroom: 'Bedroom',
  living_room: 'Living room',
  home_office: 'Home office',
  kitchen: 'Kitchen',
  dining_room: 'Dining room',
  bathroom: 'Bathroom',
  other: 'Other',
};

const UNIT_LABELS: Record<Unit, string> = { ft: 'Feet', m: 'Meters' };

/** Trim to something a person would type, without trailing zero noise. */
function display(cm: number, unit: Unit): string {
  const value = fromCm(cm, unit);
  return String(Number(value.toFixed(unit === 'ft' ? 1 : 2)));
}

export interface RoomSetupFormProps {
  roomType: RoomType;
  widthCm: number;
  lengthCm: number;
  unit: Unit;
  onChangeRoomType: (type: RoomType) => void;
  onChangeDimensions: (widthCm: number, lengthCm: number) => void;
  onChangeUnit: (unit: Unit) => void;
  /**
   * One undo entry per dimension the user edits, rather than one per keystroke —
   * typing "12" commits at 1 and then 12 (REQ-009).
   */
  onBeginEntry: () => void;
  onEndEntry: () => void;
}

export default function RoomSetupForm({
  roomType,
  widthCm,
  lengthCm,
  unit,
  onChangeRoomType,
  onChangeDimensions,
  onChangeUnit,
  onBeginEntry,
  onEndEntry,
}: RoomSetupFormProps) {
  const [widthText, setWidthText] = useState(() => display(widthCm, unit));
  const [lengthText, setLengthText] = useState(() => display(lengthCm, unit));

  const commit = (nextWidthText: string, nextLengthText: string) => {
    const w = Number.parseFloat(nextWidthText);
    const l = Number.parseFloat(nextLengthText);
    // Ignore half-typed input ("", "3.") rather than collapsing the room to zero.
    if (Number.isFinite(w) && Number.isFinite(l) && w > 0 && l > 0) {
      onChangeDimensions(toCm(w, unit), toCm(l, unit));
    }
  };

  const switchUnit = (next: Unit) => {
    if (next === unit) return;
    // Re-label the same room; the centimetres underneath do not change.
    setWidthText(display(widthCm, next));
    setLengthText(display(lengthCm, next));
    onChangeUnit(next);
  };

  return (
    <View className="gap-4 p-4">
      <View>
        <Text className="mb-2 text-sm font-medium text-neutral-700">Room type</Text>
        <View className="flex-row flex-wrap gap-2">
          {ROOM_TYPES.map((type) => {
            const selected = type === roomType;
            return (
              <Pressable
                key={type}
                testID={`room-type-${type}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onChangeRoomType(type)}
                className={`rounded-full border px-3 py-1.5 ${
                  selected ? 'border-blue-600 bg-blue-600' : 'border-neutral-300 bg-white'
                }`}
              >
                <Text className={selected ? 'text-white' : 'text-neutral-800'}>
                  {ROOM_TYPE_LABELS[type]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <Text className="mb-2 text-sm font-medium text-neutral-700">Dimensions</Text>
        <View className="flex-row items-center gap-3">
          <TextInput
            testID="room-width"
            accessibilityLabel="Room width"
            value={widthText}
            inputMode="decimal"
            onFocus={onBeginEntry}
            onBlur={onEndEntry}
            onChangeText={(t) => {
              setWidthText(t);
              commit(t, lengthText);
            }}
            className="w-24 rounded border border-neutral-300 px-3 py-2 text-neutral-900"
          />
          <Text className="text-neutral-500">×</Text>
          <TextInput
            testID="room-length"
            accessibilityLabel="Room length"
            value={lengthText}
            inputMode="decimal"
            onFocus={onBeginEntry}
            onBlur={onEndEntry}
            onChangeText={(t) => {
              setLengthText(t);
              commit(widthText, t);
            }}
            className="w-24 rounded border border-neutral-300 px-3 py-2 text-neutral-900"
          />
          <View className="flex-row overflow-hidden rounded border border-neutral-300">
            {(['ft', 'm'] as Unit[]).map((u) => (
              <Pressable
                key={u}
                testID={`unit-${u}`}
                accessibilityRole="button"
                accessibilityState={{ selected: u === unit }}
                onPress={() => switchUnit(u)}
                className={`px-3 py-2 ${u === unit ? 'bg-neutral-800' : 'bg-white'}`}
              >
                <Text className={u === unit ? 'text-white' : 'text-neutral-700'}>
                  {UNIT_LABELS[u]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
