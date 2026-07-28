/**
 * The furniture library (PRD §4.2) — the types this room type offers, plus the
 * snap-to-grid toggle.
 *
 * Filtered by room type: a bedroom must not offer a filing cabinet, though the
 * generic items appear everywhere. `furnitureForRoomType` owns that rule and is
 * tested; this file only draws the result.
 *
 * Every chip does two things. `onPointerDown` starts a drag that the canvas
 * finishes, and `onPress` places the item at the room centre. The press is not
 * a fallback bolted on afterwards — it is how touch and the keyboard place
 * furniture at all. See `use-palette-drag.ts` for why neither file here may
 * import gesture-handler or Skia.
 */
import { Pressable, Text, View } from 'react-native';

import {
  formatLength,
  FURNITURE_SPECS,
  furnitureForRoomType,
  type FurnitureType,
  type RoomType,
  type Unit,
} from '../core';

export interface FurniturePaletteProps {
  roomType: RoomType;
  unit: Unit;
  snapEnabled: boolean;
  /** The type currently being dragged, so its chip can show as picked up. */
  pendingType: FurnitureType | null;
  onToggleSnap: () => void;
  onDragStart: (type: FurnitureType) => void;
  onPlace: (type: FurnitureType) => void;
}

export default function FurniturePalette({
  roomType,
  unit,
  snapEnabled,
  pendingType,
  onToggleSnap,
  onDragStart,
  onPlace,
}: FurniturePaletteProps) {
  return (
    <View className="gap-3 px-4 py-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-neutral-700">Furniture</Text>
        <View className="flex-row overflow-hidden rounded border border-neutral-300">
          <Pressable
            testID="snap-toggle"
            accessibilityRole="button"
            accessibilityState={{ selected: snapEnabled }}
            onPress={onToggleSnap}
            className={`px-3 py-2 ${snapEnabled ? 'bg-neutral-800' : 'bg-white'}`}
          >
            <Text className={snapEnabled ? 'text-white' : 'text-neutral-700'}>
              Snap {snapEnabled ? 'on' : 'off'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {furnitureForRoomType(roomType).map((type) => {
          const spec = FURNITURE_SPECS[type];
          const dragging = type === pendingType;
          return (
            <Pressable
              key={type}
              testID={`furniture-${type}`}
              accessibilityRole="button"
              accessibilityLabel={`Add ${spec.name}`}
              onPointerDown={() => onDragStart(type)}
              onPress={() => onPlace(type)}
              className={`rounded-full border px-3 py-1.5 ${
                dragging ? 'border-blue-600 bg-blue-50' : 'border-neutral-300 bg-white'
              }`}
            >
              <Text className="text-neutral-800">{spec.name}</Text>
              <Text className="text-xs text-neutral-400">
                {formatLength(spec.defaultWidthCm, unit)} ×{' '}
                {formatLength(spec.defaultDepthCm, unit)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="text-xs text-neutral-400">
        Drag a chip onto the room, or tap it to drop the item in the middle.
      </Text>
    </View>
  );
}
