/**
 * Rule badges, drawn over the canvas as React Native views.
 *
 * A sibling of `furniture-labels.tsx` and for the same reason: **not Skia
 * text.** CanvasKit's font manager is typically empty on web, so a Skia glyph
 * draws nothing and reports no error (docs/decisions/0001-skia-on-web.md). This
 * file also imports neither Skia nor gesture-handler — both wrappers sit in the
 * entry bundle, and a stray import doubles what the landing page downloads.
 *
 * **Position comes from the live layout, presence from the throttled findings.**
 * Iterating `layout.furniture` and looking each item up in `badges` keeps a
 * badge pinned to its item mid-drag, and quietly handles the other direction
 * too: a badge map a beat behind a delete cannot name an item that is gone.
 *
 * Severity is never colour alone — each badge carries a glyph and a spoken
 * label as well.
 */
import { StyleSheet, Text, View } from 'react-native';

import { canvasFit } from './canvas-fit';
import { furnitureRect, rectAabb, roomPointToPx, type Layout } from '../core';
import type { ItemBadge } from './findings-view';

const BADGE_PX = 18;
/** Clearance above the item's top edge, so a badge and a label do not collide. */
const LIFT_PX = 4;

export interface FindingBadgesProps {
  layout: Layout;
  badges: Record<string, ItemBadge>;
  widthPx: number;
  heightPx: number;
}

export default function FindingBadges({ layout, badges, widthPx, heightPx }: FindingBadgesProps) {
  const fit = canvasFit(layout.room, widthPx, heightPx);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="finding-badges">
      {layout.furniture.map((item) => {
        const badge = badges[item.id];
        if (!badge) return null;

        // Top centre of the item's bounding box, not its centre: the label
        // overlay already owns the middle.
        const box = rectAabb(furnitureRect(item));
        const p = roomPointToPx((box.minX + box.maxX) / 2, box.minY, fit);
        const warning = badge.severity === 'warning';

        return (
          <View
            key={item.id}
            pointerEvents="none"
            testID={`finding-badge-${item.id}`}
            accessibilityLabel={badge.label}
            className={warning ? 'bg-severity-warning' : 'bg-severity-info'}
            style={{
              position: 'absolute',
              left: p.x - BADGE_PX / 2,
              top: p.y - BADGE_PX - LIFT_PX,
              width: BADGE_PX,
              height: BADGE_PX,
              borderRadius: BADGE_PX / 2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text className="text-fine-print font-bold text-on-primary">
              {warning ? '!' : 'i'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
