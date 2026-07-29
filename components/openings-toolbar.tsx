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

/** Exported for the undo/redo pair on the design screen, so the two rows match. */
export function Button({
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
  /**
   * There is no `danger` tone. The design system allows exactly one interactive
   * colour, and a destructive red would be a second one. Delete reads as a
   * plain utility button instead, which is affordable here because every
   * deletion is undoable (REQ-009) and the control stays disabled until
   * something is selected.
   */
  tone?: 'default' | 'primary';
}) {
  const base =
    tone === 'primary'
      ? 'rounded-pill border-primary bg-primary'
      : 'rounded-sm border-hairline bg-canvas';
  const text = tone === 'primary' ? 'text-on-primary' : 'text-ink';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={`border px-md py-sm ${base} ${disabled ? 'opacity-40' : ''}`}
    >
      <Text className={`text-button-utility ${text}`}>{label}</Text>
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
    <View className="gap-sm px-lg">
      <View className="flex-row flex-wrap items-center gap-xs">
        <Button testID="add-door" label="+ Door" onPress={onAddDoor} tone="primary" />
        <Button testID="add-window" label="+ Window" onPress={onAddWindow} />
        <Button
          testID="delete-opening"
          label="Delete"
          onPress={onDelete}
          disabled={!selectedId}
        />
        <Button
          testID="toggle-swing"
          label={selectedDoor ? `Swing: ${selectedDoor.swing}` : 'Swing'}
          onPress={onToggleSwing}
          disabled={!selectedDoor}
        />
        <Text testID="opening-counts" className="ml-xxs text-caption text-ink-muted-48">
          {layout.doors.length} door{layout.doors.length === 1 ? '' : 's'},{' '}
          {layout.windows.length} window{layout.windows.length === 1 ? '' : 's'}
        </Text>
      </View>

      {layout.doors.length > 1 ? (
        <View className="flex-row flex-wrap items-center gap-xs">
          <Text className="text-caption text-ink-muted-80">Main door:</Text>
          {layout.doors.map((d, i) => (
            <Pressable
              key={d.id}
              testID={`main-door-${d.id}`}
              accessibilityRole="button"
              onPress={() => onSetMainDoor(d.id)}
              className={`rounded-pill border px-md py-xs ${
                d.isMain ? 'border-primary bg-primary' : 'border-hairline bg-canvas'
              }`}
            >
              <Text className={`text-caption ${d.isMain ? 'text-on-primary' : 'text-ink-muted-80'}`}>
                Door {i + 1} ({d.wall})
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text className="text-fine-print text-ink-muted-48">
        Drag a door or window along the walls. It snaps to the nearest wall.
      </Text>
    </View>
  );
}
