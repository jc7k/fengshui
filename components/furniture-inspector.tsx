/**
 * The selected item's label, size, rotation and delete.
 *
 * Typing a number is the second half of "resizable and rotatable" (PRD §4.2).
 * Corner handles are the fast path, but they are also the pixel-perfect one:
 * nobody drags a bed to exactly 152 cm. These inputs are how a real dimension
 * gets in, and they work with a keyboard.
 *
 * Text is the local state and centimetres are canonical, as in
 * `room-setup-form.tsx`. The difference is that the canvas can change this item
 * underneath the form — a corner drag, a rotate knob — so the inputs re-label
 * themselves whenever the item differs from what they last committed.
 */
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import {
  fromCm,
  FURNITURE_SPECS,
  ROTATION_SNAP_DEG,
  toCm,
  type FurnitureItem,
  type FurnitureTransform,
  type Unit,
} from '../core';

/**
 * Trim to something a person would type, without trailing zero noise.
 *
 * Two decimals in both units, unlike the room form's one: a nightstand is
 * 1.5 ft and rounding it further would make every small item the same size.
 */
function display(cm: number, unit: Unit): string {
  return String(Number(fromCm(cm, unit).toFixed(2)));
}

/**
 * What the inputs are currently showing, so an outside edit can be spotted.
 *
 * The label is in here as well as the sizes, because an undo is an outside edit
 * too: it can put back a label these inputs typed, and a field that does not
 * resync would keep showing the text the user has just undone (REQ-009).
 */
const signature = (item: FurnitureItem, unit: Unit) =>
  `${item.id}|${item.widthCm}|${item.depthCm}|${item.rotationDeg}|${item.label ?? ''}|${unit}`;

export interface FurnitureInspectorProps {
  item: FurnitureItem;
  unit: Unit;
  onLabel: (label: string) => void;
  onTransform: (transform: FurnitureTransform) => void;
  onRotate: (rotationDeg: number) => void;
  onDelete: () => void;
  /**
   * One undo entry per field the user works in, rather than one per keystroke —
   * typing "150" commits at 1, 15 and 150 and those are not three edits.
   */
  onBeginEntry: () => void;
  onEndEntry: () => void;
}

export default function FurnitureInspector({
  item,
  unit,
  onLabel,
  onTransform,
  onRotate,
  onDelete,
  onBeginEntry,
  onEndEntry,
}: FurnitureInspectorProps) {
  const [labelText, setLabelText] = useState(item.label ?? '');
  const [widthText, setWidthText] = useState(() => display(item.widthCm, unit));
  const [depthText, setDepthText] = useState(() => display(item.depthCm, unit));
  const [rotationText, setRotationText] = useState(() => String(Math.round(item.rotationDeg)));
  const [echo, setEcho] = useState(() => signature(item, unit));

  // The item changed from somewhere other than these inputs — a drag, an undo, a
  // unit switch, a different selection — so re-label them. Deriving during
  // render is the supported way to do this; an effect would show the stale
  // values first.
  const current = signature(item, unit);
  if (echo !== current) {
    setEcho(current);
    setLabelText(item.label ?? '');
    setWidthText(display(item.widthCm, unit));
    setDepthText(display(item.depthCm, unit));
    setRotationText(String(Math.round(item.rotationDeg)));
  }

  const commitLabel = (text: string) => {
    // Claim the change, as `commitSize` does — and claim what `labelFurniture`
    // will store, which for an all-blank label is no label at all.
    setEcho(signature({ ...item, label: text.trim() === '' ? undefined : text }, unit));
    onLabel(text);
  };

  const commitSize = (nextWidthText: string, nextDepthText: string) => {
    const w = Number.parseFloat(nextWidthText);
    const d = Number.parseFloat(nextDepthText);
    // Ignore half-typed input ("", "3.") rather than collapsing the item.
    if (!Number.isFinite(w) || !Number.isFinite(d) || w <= 0 || d <= 0) return;
    const widthCm = toCm(w, unit);
    const depthCm = toCm(d, unit);
    // Claim the change so the resync above does not undo what is being typed.
    setEcho(signature({ ...item, widthCm, depthCm }, unit));
    onTransform({ xCm: item.xCm, yCm: item.yCm, widthCm, depthCm });
  };

  const commitRotation = (text: string) => {
    const deg = Number.parseFloat(text);
    if (!Number.isFinite(deg)) return;
    setEcho(signature({ ...item, rotationDeg: deg }, unit));
    onRotate(deg);
  };

  return (
    <View testID="furniture-inspector" className="gap-3 border-t border-neutral-200 px-4 py-3">
      <Text className="text-sm font-medium text-neutral-700">
        {FURNITURE_SPECS[item.type].name}
      </Text>

      <View className="flex-row flex-wrap items-center gap-3">
        <TextInput
          testID="furniture-label-input"
          accessibilityLabel="Item label"
          placeholder="Label"
          value={labelText}
          onFocus={onBeginEntry}
          onBlur={onEndEntry}
          onChangeText={(t) => {
            setLabelText(t);
            commitLabel(t);
          }}
          className="w-40 rounded border border-neutral-300 px-3 py-2 text-neutral-900"
        />

        <View className="flex-row items-center gap-2">
          <TextInput
            testID="furniture-width"
            accessibilityLabel="Item width"
            value={widthText}
            inputMode="decimal"
            onFocus={onBeginEntry}
            onBlur={onEndEntry}
            onChangeText={(t) => {
              setWidthText(t);
              commitSize(t, depthText);
            }}
            className="w-20 rounded border border-neutral-300 px-3 py-2 text-neutral-900"
          />
          <Text className="text-neutral-500">×</Text>
          <TextInput
            testID="furniture-depth"
            accessibilityLabel="Item depth"
            value={depthText}
            inputMode="decimal"
            onFocus={onBeginEntry}
            onBlur={onEndEntry}
            onChangeText={(t) => {
              setDepthText(t);
              commitSize(widthText, t);
            }}
            className="w-20 rounded border border-neutral-300 px-3 py-2 text-neutral-900"
          />
          <Text className="text-neutral-500">{unit}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap items-center gap-2">
        <Text className="text-sm text-neutral-700">Rotation</Text>
        <Pressable
          testID="rotate-left"
          accessibilityRole="button"
          accessibilityLabel={`Rotate ${ROTATION_SNAP_DEG} degrees anticlockwise`}
          onPress={() => onRotate(item.rotationDeg - ROTATION_SNAP_DEG)}
          className="rounded border border-neutral-300 bg-white px-3 py-2"
        >
          <Text className="text-neutral-800">−{ROTATION_SNAP_DEG}°</Text>
        </Pressable>
        <TextInput
          testID="furniture-rotation"
          accessibilityLabel="Item rotation in degrees"
          value={rotationText}
          inputMode="numeric"
          onFocus={onBeginEntry}
          onBlur={onEndEntry}
          onChangeText={(t) => {
            setRotationText(t);
            commitRotation(t);
          }}
          className="w-20 rounded border border-neutral-300 px-3 py-2 text-neutral-900"
        />
        <Pressable
          testID="rotate-right"
          accessibilityRole="button"
          accessibilityLabel={`Rotate ${ROTATION_SNAP_DEG} degrees clockwise`}
          onPress={() => onRotate(item.rotationDeg + ROTATION_SNAP_DEG)}
          className="rounded border border-neutral-300 bg-white px-3 py-2"
        >
          <Text className="text-neutral-800">+{ROTATION_SNAP_DEG}°</Text>
        </Pressable>

        <Pressable
          testID="delete-furniture"
          accessibilityRole="button"
          onPress={onDelete}
          className="rounded border border-red-300 bg-white px-3 py-2"
        >
          <Text className="text-red-600">Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}
