/**
 * Add / delete openings, and pick the main door.
 *
 * The main-door control only appears with two or more doors: one door is
 * unambiguously the main one, so asking would be a required field on the common
 * case for no benefit (REQ-007 open question).
 */
import { Pressable, Text, View } from 'react-native';

import type { Layout } from '../core';

export interface OpeningsToolbarProps {
  layout: Layout;
  selectedId: string | null;
  onAddDoor: () => void;
  onAddWindow: () => void;
  onDelete: () => void;
  onSetMainDoor: (id: string) => void;
  onToggleSwing: () => void;
}

function Button({
  testID,
  label,
  onPress,
  disabled,
  tone = 'default',
}: {
  testID: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger' | 'primary';
}) {
  const base =
    tone === 'primary'
      ? 'border-blue-600 bg-blue-600'
      : tone === 'danger'
        ? 'border-red-300 bg-white'
        : 'border-neutral-300 bg-white';
  const text =
    tone === 'primary' ? 'text-white' : tone === 'danger' ? 'text-red-600' : 'text-neutral-800';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={`rounded border px-3 py-2 ${base} ${disabled ? 'opacity-40' : ''}`}
    >
      <Text className={text}>{label}</Text>
    </Pressable>
  );
}

export default function OpeningsToolbar({
  layout,
  selectedId,
  onAddDoor,
  onAddWindow,
  onDelete,
  onSetMainDoor,
  onToggleSwing,
}: OpeningsToolbarProps) {
  const selectedDoor = layout.doors.find((d) => d.id === selectedId) ?? null;

  return (
    <View className="gap-3 px-4">
      <View className="flex-row flex-wrap items-center gap-2">
        <Button testID="add-door" label="+ Door" onPress={onAddDoor} tone="primary" />
        <Button testID="add-window" label="+ Window" onPress={onAddWindow} />
        <Button
          testID="delete-opening"
          label="Delete"
          onPress={onDelete}
          disabled={!selectedId}
          tone="danger"
        />
        <Button
          testID="toggle-swing"
          label={selectedDoor ? `Swing: ${selectedDoor.swing}` : 'Swing'}
          onPress={onToggleSwing}
          disabled={!selectedDoor}
        />
        <Text testID="opening-counts" className="ml-1 text-sm text-neutral-500">
          {layout.doors.length} door{layout.doors.length === 1 ? '' : 's'},{' '}
          {layout.windows.length} window{layout.windows.length === 1 ? '' : 's'}
        </Text>
      </View>

      {layout.doors.length > 1 ? (
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="text-sm text-neutral-700">Main door:</Text>
          {layout.doors.map((d, i) => (
            <Pressable
              key={d.id}
              testID={`main-door-${d.id}`}
              accessibilityRole="button"
              onPress={() => onSetMainDoor(d.id)}
              className={`rounded-full border px-3 py-1 ${
                d.isMain ? 'border-blue-700 bg-blue-700' : 'border-neutral-300 bg-white'
              }`}
            >
              <Text className={d.isMain ? 'text-white' : 'text-neutral-700'}>
                Door {i + 1} ({d.wall})
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text className="text-xs text-neutral-400">
        Drag a door or window along the walls. It snaps to the nearest wall.
      </Text>
    </View>
  );
}
