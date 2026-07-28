/**
 * The design screen: room setup, openings, and the to-scale canvas
 * (PRD §4.1, §5).
 *
 * The whole screen's state is one `Layout` from `core/`, held by
 * `useLayoutEditor` — there is deliberately no parallel UI-side notion of a
 * room. Every edit goes through a named command backed by a pure function in
 * `core/layout-ops`, so REQ-009 can put an undo stack underneath without
 * touching this file, and REQ-010 can persist the object as-is.
 */
import { ScrollView, Text, View } from 'react-native';

import FurnitureInspector from '../components/furniture-inspector';
import FurniturePalette from '../components/furniture-palette';
import OpeningsToolbar, { Button } from '../components/openings-toolbar';
import RoomCanvas from '../components/room-canvas';
import RoomSetupForm from '../components/room-setup-form';
import { useLayoutEditor } from '../components/use-layout-editor';
import { usePaletteDrag } from '../components/use-palette-drag';
import { createLayout, formatLength, toCm, type FurnitureType, type Layout } from '../core';

/** A plausible starting room so the canvas is never empty on arrival. */
const INITIAL: Layout = createLayout(
  'bedroom',
  { widthCm: toCm(12, 'ft'), lengthCm: toCm(10, 'ft') },
  'ft',
);

export default function DesignScreen() {
  const editor = useLayoutEditor(INITIAL);
  const drag = usePaletteDrag();
  const { layout, selectedId } = editor;

  /** Where a pressed — as opposed to dragged — chip puts its item. */
  const placeAtCentre = (type: FurnitureType) =>
    editor.placeFurniture(type, layout.room.widthCm / 2, layout.room.lengthCm / 2);

  // The inspector is for furniture only; an opening is served by the toolbar.
  const selectedItem = layout.furniture.find((f) => f.id === selectedId) ?? null;

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }}>
      <RoomSetupForm
        roomType={layout.roomType}
        widthCm={layout.room.widthCm}
        lengthCm={layout.room.lengthCm}
        unit={layout.displayUnit}
        onChangeRoomType={editor.setRoomType}
        onChangeDimensions={editor.setDimensions}
        onChangeUnit={editor.setUnit}
        onBeginEntry={editor.beginEntry}
        onEndEntry={editor.endEntry}
      />

      {/* Undo/redo (PRD §4.2), borrowing the openings toolbar's button so the
          controls above and below the canvas look like one set. */}
      <View className="flex-row items-center gap-2 px-4">
        <Button testID="undo" label="Undo" onPress={editor.undo} disabled={!editor.canUndo} />
        <Button testID="redo" label="Redo" onPress={editor.redo} disabled={!editor.canRedo} />
      </View>

      <OpeningsToolbar
        layout={layout}
        selectedId={selectedId}
        onAddDoor={editor.addDoor}
        onAddWindow={editor.addWindow}
        onDelete={editor.deleteSelected}
        onSetMainDoor={editor.setMainDoor}
        onToggleSwing={editor.toggleDoorSwing}
      />

      <FurniturePalette
        roomType={layout.roomType}
        unit={layout.displayUnit}
        snapEnabled={editor.snapEnabled}
        pendingType={drag.pendingType}
        onToggleSnap={editor.toggleSnap}
        onDragStart={drag.begin}
        onPlace={placeAtCentre}
      />

      {selectedItem ? (
        <FurnitureInspector
          item={selectedItem}
          unit={layout.displayUnit}
          onLabel={(label) => editor.labelFurniture(selectedItem.id, label)}
          onTransform={(transform) => editor.transformFurniture(selectedItem.id, transform)}
          onRotate={(deg) => editor.rotateFurniture(selectedItem.id, deg)}
          onDelete={editor.deleteSelected}
          onBeginEntry={editor.beginEntry}
          onEndEntry={editor.endEntry}
        />
      ) : null}

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
          snapEnabled={editor.snapEnabled}
          pendingDropType={drag.pendingType}
          onSelect={editor.select}
          onMoveOpening={editor.moveOpening}
          onDropFurniture={editor.placeFurniture}
          onMoveFurniture={editor.moveFurniture}
          onTransformFurniture={editor.transformFurniture}
          onRotateFurniture={editor.rotateFurniture}
          onBeginEntry={editor.beginEntry}
          onEndEntry={editor.endEntry}
        />
      </View>
    </ScrollView>
  );
}
