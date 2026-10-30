// 評分視覺化：●●●●○
export default function RatingDots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex gap-1" role="img" aria-label={`${value} / ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`size-2.5 rounded-full ${i < value ? "bg-teal-600" : "bg-stone-200"}`}
        />
      ))}
    </span>
  );
}
