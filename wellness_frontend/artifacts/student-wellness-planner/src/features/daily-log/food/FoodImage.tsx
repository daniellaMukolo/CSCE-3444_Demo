// AI ASSISTANCE: Drafted with Claude (Anthropic) from Malika Ray's Replit AI prototype, and reviewed by Malika Ray.
// =============================================================================
// Food picture - Malika
// =============================================================================
// WHAT IT DOES
//   Shows a cuisine's, dish's or ingredient's image file if the catalog has one,
//   otherwise its emoji.
//
// HOW IT CONNECTS
//   - To use real pictures, give catalog entries an "image" path (data/food_catalog.json)
//     and put the files in public/images/.
// =============================================================================

export function FoodImage({ icon, image, size = 30 }: { icon: string; image?: string; size?: number }) {
  if (image) {
    return <img className="food-image" src={image} alt="" width={size} height={size} />;
  }
  return (
    <span className="food-emoji" style={{ fontSize: size }} aria-hidden="true">
      {icon}
    </span>
  );
}
